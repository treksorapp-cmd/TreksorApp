import { MySpace } from "@/types/myspace";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface addMySpaceRequest{
    text: string;
    mood: string
}

interface MySpaceState {
  myspaces: MySpace[]
  loading: boolean;
  error: string | null;
  addMySpace: (data: addMySpaceRequest) => Promise<void>;
  fetchMySpace: (id: string) => void;
  updateMySpace: (id: string, updates: any) => Promise<void>,
  deleteMySpace: (id: string) => void,
  clearData: () => void;
}

export const useMySpaceStore = create<MySpaceState>()(
  persist(
    (set,get) => ({
      myspaces:[],
      loading: false,
      error: null,

      fetchMySpace: async (id) => {
          const mySpace = get().myspaces.find(mySpace => mySpace.id === id);
          return mySpace
      },

      addMySpace: async (data) => {
        const payload = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
            mood: data.mood,
            date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            text: data.text,
        }          
        const myspaces=[payload,...get().myspaces];
        await AsyncStorage.setItem("myspace-storage",JSON.stringify({state:{myspaces},version:0}));
        set({myspaces});
      },

      updateMySpace: async (id, updates) => {
        const myspaces=get().myspaces.map(space=>space.id===id?{...space,...updates}:space);
        await AsyncStorage.setItem("myspace-storage",JSON.stringify({state:{myspaces},version:0}));
        set((state) => ({
          myspaces: state.myspaces.map((space) => (space.id === id ? { ...space, ...updates } : space)),
        }))
      },

      deleteMySpace: (id) => {
        set((state) => ({
          myspaces: state.myspaces.filter((space) => space.id !== id),
        }))
      },

      clearData: () => {
        set({
          myspaces:[],
          loading: false,
          error: null,
        })
      }

    }),
    {
      name: "myspace-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
