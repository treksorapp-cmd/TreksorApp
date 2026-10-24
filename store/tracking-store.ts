import { calcPercentage, errorHandler, generateRandomId } from "@/lib/utils";
import { trackingData as initialTrackingData } from "@/mock/tracking";
import { TrackingCategory } from "@/types/tracking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useArticleStore } from "./article-store";
import { useMediationStore } from "./mediation-store";
import { useMySpaceStore } from "./myspace-store";
import { usePowerThoughtStore } from "./thought-store";
import { useWorkoutStore } from "./workout-store";

interface TrackingStore {
  trackingData: TrackingCategory[];
  loading: boolean;
  error: string | null;
  fetchTrackingData: () => Promise<void>;
  addTrackingCategory: (category: TrackingCategory) => void;
  updateTrackingCategory: (title: string, updated: Partial<TrackingCategory>) => void;
  deleteTrackingCategory: (title: string) => void;
  getTrackingCategoryByTitle: (title: string) => TrackingCategory | undefined;
  clearData: () => void;
}

export const useTrackingStore = create<TrackingStore>()(
  persist(
    (set, get) => ({
      trackingData: initialTrackingData,
      loading: false,
      error: null,

      fetchTrackingData: async () => {
        try {
          set({ loading: true, error: null });

          const countRead = (items: { isRead?: boolean }[]) => items.filter(i => i.isRead).length;

          // Articles - Get all articles from all categories
          const { articles } = useArticleStore.getState();
          const bodyArticles = articles["Body"] || [];
          const mentalArticles = articles["Mental"] || [];
          const spiritualArticles = articles["Spiritual"] || [];
          const allArticles = articles["All Articles"] || [];

          const bodyRead = countRead(bodyArticles);
          const mentalRead = countRead(mentalArticles);
          const spiritualRead = countRead(spiritualArticles);
          
          // Calculate total read articles across all categories
          const totalArticlesRead = countRead(allArticles);
          const totalArticles = allArticles.length;

          // Workouts
          const workouts = useWorkoutStore.getState().workouts || [];
          const totalWorkouts = workouts.reduce((total, w) => total + w.exercises.length, 0);
          const completedWorkouts = workouts.reduce((total, w) => total + w.exercises.filter(e => e.completed).length, 0);

          // Meditations
          const meditations = useMediationStore.getState().mediation || [];
          const totalMeditations = meditations.length;
          const readMeditations = countRead(meditations);

          // Power Thoughts
          const powerThoughts = usePowerThoughtStore.getState().powerThoughts || [];
          const totalThoughts = powerThoughts.length;
          const readThoughts = countRead(powerThoughts);

          // Journal Entries
          const journalEntries = useMySpaceStore.getState().myspaces || [];
          const totalJournals = journalEntries.length;

          // Get existing tracking data to preserve IDs and custom categories
          let oldTrackingData = [...get().trackingData];
          
          const bodyCategory = oldTrackingData.find(track => track.title === 'BODY' || track.title === 'Body') || { id: "1", title: "BODY" };
          const mindCategory = oldTrackingData.find(track => track.title === 'MIND' || track.title === 'Mind') || { id: "2", title: "MIND" };
          const spiritualCategory = oldTrackingData.find(track => track.title === 'SPIRITUAL' || track.title === 'Spiritual') || { id: "3", title: "SPIRITUAL" };
          const articlesCategory = oldTrackingData.find(track => track.title === 'ARTICLES' || track.title === 'Articles') || { id: "4", title: "ARTICLES" };

          const updatedTrackingData: TrackingCategory[] = [
            {
              id: bodyCategory.id,
              title: "BODY",
              percentage: calcPercentage(completedWorkouts + bodyRead, totalWorkouts + bodyArticles.length),
              items: [
                // { id: generateRandomId(), label: "Workouts", value: `${completedWorkouts}/${totalWorkouts}` },
                { id: bodyCategory.items?.[0]?.id || generateRandomId(), label: "Articles Completed", value: `${bodyRead}/${bodyArticles.length}` },
              ],
              custom: bodyCategory.custom || false,
            },
            {
              id: mindCategory.id,
              title: "MIND",
              percentage: calcPercentage(
                readThoughts + mentalRead + totalJournals,
                totalThoughts + mentalArticles.length + totalJournals
              ),
              items: [
                // { id: generateRandomId(), label: "Power Thought Read", value: `${readThoughts}/${totalThoughts}` },
                { id: mindCategory.items?.[0]?.id || generateRandomId(), label: "Articles Completed", value: `${mentalRead}/${mentalArticles.length}` },
                // { id: generateRandomId(), label: "General Entries", value: `${totalJournals}` },
              ],
              custom: mindCategory.custom || false,
            },
            {
              id: spiritualCategory.id,
              title: "SPIRITUAL",
              percentage: calcPercentage(
                readMeditations + spiritualRead,
                totalMeditations + spiritualArticles.length
              ),
              items: [
                // { id: generateRandomId(), label: "Meditations", value: `${readMeditations}/${totalMeditations}` },
                { id: spiritualCategory.items?.[0]?.id || generateRandomId(), label: "Articles Read", value: `${spiritualRead}/${spiritualArticles.length}` },
              ],
              custom: spiritualCategory.custom || false,
            },
            {
              id: articlesCategory.id,
              title: "ARTICLES",
              percentage: calcPercentage(totalArticlesRead, totalArticles),
              items: [
                { id: articlesCategory.items?.[0]?.id || generateRandomId(), label: "Total Articles Read", value: `${totalArticlesRead}/${totalArticles}` },
              ],
              custom: articlesCategory.custom || false,
            },
          ];

            // Update or add tracking categories
            const bodyIndex = oldTrackingData.findIndex(track => track.title === 'BODY' || track.title === 'Body')
            const mentalIndex = oldTrackingData.findIndex(track => track.title === 'MIND' || track.title === 'Mind')
            const spiritualIndex = oldTrackingData.findIndex(track => track.title === 'SPIRITUAL' || track.title === 'Spiritual')
            const articlesIndex = oldTrackingData.findIndex(track => track.title === 'ARTICLES' || track.title === 'Articles')

            // Update existing categories
            if (bodyIndex !== -1) {
              oldTrackingData[bodyIndex] = updatedTrackingData[0];
            } else {
              oldTrackingData.push(updatedTrackingData[0]);
            }
            
            if (mentalIndex !== -1) {
              oldTrackingData[mentalIndex] = updatedTrackingData[1];
            } else {
              oldTrackingData.push(updatedTrackingData[1]);
            }
            
            if (spiritualIndex !== -1) {
              oldTrackingData[spiritualIndex] = updatedTrackingData[2];
            } else {
              oldTrackingData.push(updatedTrackingData[2]);
            }

            // Add or update Articles tracking category
            if (articlesIndex !== -1) {
              oldTrackingData[articlesIndex] = updatedTrackingData[3];
            } else {
              // Add new Articles tracking category if it doesn't exist
              oldTrackingData.push(updatedTrackingData[3]);
            }

            set({ trackingData: oldTrackingData, loading: false });
        } catch (error: any) {
          console.error("fetchTrackingData error:", { error });
          set({ error: error?.response?.data?.message || "Something went wrong", loading: false });
          errorHandler(error);
        }
      },

      addTrackingCategory: (category) => {
        const current = get().trackingData;
      
        const updatedCategory = {
          ...category,
          items: category.items.map((item) => {
            const days = Math.min(365, Math.max(0, parseInt(item.value,10)||0));
            const record: Record<string, boolean> = {};
      
            for (let i = 0; i < days; i++) {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const isoDate = date.toISOString().split("T")[0]; // YYYY-MM-DD
              record[isoDate] = false;
            }
      
            return {
              ...item,
              record,
            };
          }),
        };
      
        set({ trackingData: [...current, updatedCategory] });
      },      

      updateTrackingCategory: (id, updated) => {
        const updatedList = get().trackingData.map((item) =>
          item.id === id ? { ...item, ...updated } : item
        );
        set({ trackingData: updatedList });
      },

      deleteTrackingCategory: (id) => {
        const filtered = get().trackingData.filter((item) => item.id !== id);
        set({ trackingData: filtered });
      },

      getTrackingCategoryByTitle: (id) => {
        return get().trackingData.find((item) => item.id === id);
      },

      clearData: () => {
        set({
          trackingData: initialTrackingData,
          loading: false,
          error: null,
        })
      }
    }),
    {
      name: "tracking-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        trackingData: state.trackingData,
      }),
    }
  )
);
