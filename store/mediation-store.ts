import { errorHandler } from "@/lib/utils";
import { mediations } from "@/mock/mediation";
import { Mediation } from "@/types/mediation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface fetchMediationRequest {
  id: string;
}

interface MediationState {
  mediation: Mediation[]
  locked: string[]
  loading: boolean;
  error: string | null;
  fetchMediations: (query: string) => Promise<void>;
  fetchMediationById: (data: fetchMediationRequest) => Promise<Mediation | undefined>;
  fetchMediationLockedStatus: (id: string) => boolean;
  updateLockedStatus: () => void;
  markMediationAsRead: (id: string) => void;
  clearData: () => void;
}

export const useMediationStore = create<MediationState>()(
  persist(
    (set, get) => ({
      mediation: mediations.map(item => ({ ...item, isRead: false })),
      locked: ["intermediate", "advanced"],
      loading: false,
      error: null,

      fetchMediations: async (query) => {
        try {
          // set({ loading: true, error: null });
          // const {data:response} = await api.get<ArticleResponse>(`article?${query}`);
          // set({ loading: false, articles: response.data });
        } catch (error: any) {
          console.error("fetchMediations error:", { error: error.response.data });
          set({ error: error.response.data.message, loading: false });
          errorHandler(error);
        }
      },

      fetchMediationById: async (data) => {
        try {
          set({ loading: true, error: null });
          const mediation = get().mediation.find((mediation) => mediation.id === data.id);
          set({ loading: false });
          return mediation;
        } catch (error: any) {
          console.error("fetchMediationById error:", { error: error.response.data });
          set({ error: error.response.data.message, loading: false });
          errorHandler(error);
        }finally {
          set({ loading: false });
        }
      },

      fetchMediationLockedStatus: (id: string) => {
        const locked = get().locked.includes(id);
        return locked;
      },

      updateLockedStatus: () => {
        const mediations = get().mediation;
        const locked: string[] = [];

        const beginnerMediation = mediations.find((mediation) => mediation.id === "beginner");
        const intermediateMediation = mediations.find((mediation) => mediation.id === "intermediate");

        if (!beginnerMediation?.isRead) {
          locked.push("intermediate");
        }

        if (!intermediateMediation?.isRead) {
          locked.push("advanced");
        }

        set({ locked });
      },

      markMediationAsRead: (id) => {
        const existingMediations = get().mediation.map(item => ({ ...item }));
        const mediationIndex = existingMediations.findIndex(thought => thought.id === id)
        if (mediationIndex < 0) return;
        existingMediations[mediationIndex].isRead = true;
        const locked: string[] = [];
        const beginnerMediation = existingMediations.find((mediation) => mediation.id === "beginner");
        const intermediateMediation = existingMediations.find((mediation) => mediation.id === "intermediate");
        if (!beginnerMediation?.isRead) {
          locked.push("intermediate");
        }
        if (!intermediateMediation?.isRead) {
          locked.push("advanced");
        }
        set({ mediation: existingMediations, locked});
      },

      clearData: () => {
        set({
          mediation: mediations.map(item => ({ ...item, isRead: false })),
          locked: ["intermediate", "advanced"],
          loading: false,
          error: null,
        })
      },
    }),
    {
      name: "mediation-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only completion flags, not audio URLs or content.
      partialize: (state) => ({
        mediation: state.mediation.map(item => ({ id: item.id, isRead: !!item.isRead })),
      }),
      merge: (persisted, current) => {
        const saved = persisted as { mediation?: { id: string; isRead?: boolean }[] } | undefined;
        const completed = new Set((saved?.mediation ?? []).filter(item => item.isRead).map(item => item.id));
        const meditation = mediations.map(item => ({ ...item, isRead: completed.has(item.id) }));
        return {
          ...current,
          mediation: meditation,
          locked: [
            ...(!completed.has("beginner") ? ["intermediate"] : []),
            ...(!completed.has("intermediate") ? ["advanced"] : []),
          ],
        };
      },
    }
  )
);
