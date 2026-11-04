import { api } from "@/api/axios";
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
        try {
          set({ loading: true, error: null });
          const {data:response} = await api.get<PowerThoughtResponse>(`power-thought?date=${new Date().toISOString().split('T')[0]}`);
          const existingThoughts = get().powerThoughts;
          const existingIds = new Set(existingThoughts.map(t => t._id));
          
          const newThoughts = response.data
            .filter(thought => !existingIds.has(thought._id))
            .map(thought => ({
              ...thought,
              isRead: false,
              date: new Date(thought.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              isToday: new Date(thought.date).toISOString().split('T')[0] == new Date().toISOString().split('T')[0],
            }));            
            const updatedThoughts = [...newThoughts, ...existingThoughts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          set({ loading: false, powerThoughts: updatedThoughts});
        } catch (error: any) {
          console.error("fetchPowerThoughts error:", {error:error.response.data });
          set({ error: error.response.data.message, loading: false });
          errorHandler(error);
        }
      },

      markPowerThoughtAsRead: (id) => {
        set((state) => ({
          powerThoughts: state.powerThoughts.map((thought) =>
            thought._id === id ? { ...thought, isRead: true } : thought
          ),
        }));
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
