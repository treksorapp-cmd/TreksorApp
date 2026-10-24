import { api } from "@/api/axios";
import axios from "axios";
const CONTENT_FEED = "https://treksor-admin-production.up.railway.app/api/public/content";
import { errorHandler } from "@/lib/utils";
import { PowerThought, PowerThoughtResponse } from "@/types/powerThought";
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PowerThoughtState {
  powerThoughts: PowerThought[]
  loading: boolean;
  error: string | null;
  fetchPowerThoughts: () => Promise<void>;
  markPowerThoughtAsRead: (id: string) => void;
  clearData: () => void;
}

export const usePowerThoughtStore = create<PowerThoughtState>()(
  // persist(
    (set, get) => ({
      powerThoughts:[],
      loading: false,
      error: null,

      fetchPowerThoughts: async () => {
        set({ loading: true, error: null });
        try {
          const response = await axios.get(`${CONTENT_FEED}?type=thoughts`, { timeout: 12000 });
          const payload = response.data;
          const records: any[] = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
          const today = new Date();
          const localDay = [today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
          const current = records.filter(item => item && typeof item.thought === "string" && item.thought.trim()).map(item => {
            const id = String(item._id ?? item.id ?? item.date ?? item.thought);
            const raw = String(item.date ?? item.publish_date ?? item.scheduled_at ?? "");
            const dateKey = raw.slice(0,10);
            return { ...item, _id: id, date: raw, isToday: dateKey === localDay };
          }).filter(item => !item.date || item.date.slice(0,10) <= localDay);
          const readMap = await AsyncStorage.getItem("treksor.thoughts.read.v1").then(v=>v?JSON.parse(v):{}).catch(()=>({}));
          const unique = Array.from(new Map(current.map(item=>[item._id,item])).values());
          unique.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
          set({ loading:false, powerThoughts:unique.map(item=>({...item,isRead:readMap[item._id]===localDay})) });
        } catch (error) {
          console.error("Thought sync failed",error);
          set({ loading:false, error:"Unable to load today's thought" });
        }
      },
      markPowerThoughtAsRead: (id) => {
        const today = new Date();
        const localDay = [today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
        set(state=>({powerThoughts:state.powerThoughts.map(item=>item._id===id?{...item,isRead:true}:item)}));
        void AsyncStorage.getItem("treksor.thoughts.read.v1").then(raw=>raw?JSON.parse(raw):{}).catch(()=>({})).then(map=>AsyncStorage.setItem("treksor.thoughts.read.v1",JSON.stringify({...map,[id]:localDay}))).catch(console.warn);
      },

      clearData: () => {
        set({
          powerThoughts:[],
          loading: false,
          error: null,
        })
      }

    }),
  //   {
  //     name: "thought-storage2",
  //     storage: createJSONStorage(() => AsyncStorage),
  //   }
  // )
);
