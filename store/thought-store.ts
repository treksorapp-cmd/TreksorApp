import { api } from "@/api/axios";
import axios from "axios";
const CONTENT_FEED = "https://treksor-admin-production.up.railway.app/api/public/content";
import { errorHandler } from "@/lib/utils";
import { PowerThought, PowerThoughtResponse } from "@/types/powerThought";
import { create } from "zustand";

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
          const results = await Promise.allSettled([
            api.get<PowerThoughtResponse>(`power-thought?date=${new Date().toISOString().split("T")[0]}`),
            axios.get<PowerThoughtResponse>(`${CONTENT_FEED}?type=thoughts`, { timeout: 12000 }),
          ]);
          if (results.every(result => result.status === "rejected")) throw new Error("Unable to load thoughts");
          const legacy = results[0].status === "fulfilled" ? results[0].value.data.data : [];
          const editorial = results[1].status === "fulfilled" ? results[1].value.data.data : [];
          const existing = get().powerThoughts;
          const unique = Array.from(new Map([...editorial, ...legacy].map(thought => [thought._id, thought])).values());
          const today = new Date().toISOString().slice(0,10);
          const updated = unique.map(thought => ({
            ...thought,
            isRead: existing.find(old => old._id === thought._id)?.isRead ?? false,
            isToday: thought.date.slice(0,10) === today,
            date: new Date(thought.date + (thought.date.length === 10 ? "T12:00:00Z" : "")).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" }),
          }));
          set({ loading:false, powerThoughts:updated });
        } catch (error) {
          console.error("Thought sync failed", error);
          set({ loading:false, error:"Unable to load thoughts" });
        }
      },

      markPowerThoughtAsRead: (id) => {
        const existingThoughts = get().powerThoughts;
        const thoughtIndex = existingThoughts.findIndex(thought => thought._id === id)
        existingThoughts[thoughtIndex].isRead = true;
        set({ powerThoughts: existingThoughts});
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
