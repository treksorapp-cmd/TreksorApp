import { publicationDay } from "@/lib/content-publication";
import axios from "axios";
const CONTENT_FEED = "https://treksor-admin-production.up.railway.app/api/public/content";
import { PowerThought } from "@/types/powerThought";
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

let readWrites: Promise<unknown> = Promise.resolve();
let epoch = 0;

interface PowerThoughtState {
  powerThoughts: PowerThought[]
  loading: boolean;
  error: string | null;
  fetchPowerThoughts: () => Promise<void>;
  markPowerThoughtAsRead: (id: string) => void;
  clearData: () => void;
  flushReadState: () => Promise<unknown>;
}

export const usePowerThoughtStore = create<PowerThoughtState>()(
  // persist(
    (set, get) => ({
      powerThoughts:[],
      loading: false,
      error: null,

      fetchPowerThoughts: async () => {
        if (get().loading) return;
        const version = epoch;
        set({ loading: true, error: null });
        try {
          const response = await axios.get(`${CONTENT_FEED}?type=thoughts`, { timeout: 12000 });
          const payload = response.data;
          if (!Array.isArray(payload?.data) && !Array.isArray(payload)) throw new Error("Invalid content feed");
          const records: any[] = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
          const today = new Date();
          const localDay = publicationDay(today);
          const current = records.filter(item => item && typeof item.thought === "string" && item.thought.trim()).map(item => {
            const id = String(item._id ?? item.id ?? item.date ?? item.thought);
            const raw = String(item.date ?? item.publish_date ?? item.scheduled_at ?? "");
            const dateKey = raw.slice(0,10);
            return { ...item, _id: id, date: raw, isToday: dateKey === (payload.publicationDate || localDay) };
          });
          await readWrites.catch(() => {});
          const readMap = await AsyncStorage.getItem("treksor.thoughts.read.v1").then(v=>v?JSON.parse(v):{}).catch(()=>({}));
          const unique = Array.from(new Map(current.map(item=>[item._id,item])).values());
          unique.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
          if(version !== epoch) return;
          const justRead = new Set(get().powerThoughts.filter(item=>item.isRead).map(item=>item._id));
          set({ loading:false, powerThoughts:unique.map(item=>({...item,isRead:!!readMap[item._id] || justRead.has(item._id)})) });
        } catch (error) {
          if(version !== epoch) return;
          console.error("Thought sync failed",error);
          set({ loading:false, error:"Unable to load today's thought" });
        }
      },
      markPowerThoughtAsRead: (id) => {
        const today = new Date();
        const localDay = publicationDay(today);
        set(state=>({powerThoughts:state.powerThoughts.map(item=>item._id===id?{...item,isRead:true}:item)}));
        const version = epoch;
        readWrites = readWrites.catch(()=>{}).then(async()=>{
          if(version !== epoch) return;
          const raw = await AsyncStorage.getItem("treksor.thoughts.read.v1");
          const map = raw ? JSON.parse(raw) : {};
          if(version !== epoch) return;
          await AsyncStorage.setItem("treksor.thoughts.read.v1",JSON.stringify({...map,[id]:localDay}));
        });
        void readWrites.catch(()=>set({error:"Could not save read status. Please try again."}));
      },

      flushReadState: () => readWrites,
      clearData: () => {
        epoch++;
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
