import {create} from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useAuthStore} from "@/store/auth-store";
export type PillarUpdate={id:string;title:string;pillar:string;href:string};
export const usePillarUpdates=create<{items:PillarUpdate[];seen:string[];refresh:()=>Promise<void>;markSeen:(ids:string[])=>Promise<void>}>((set,get)=>({
 items:[],seen:[],
 refresh:async()=>{const account=useAuthStore.getState().user?.id;if(!account)return;try{const r=await fetch("https://treksor-admin-production.up.railway.app/api/public/pillar-updates");if(!r.ok)return;const data=await r.json();const seen=JSON.parse(await AsyncStorage.getItem(`treksor.pillar-updates.${account}`)||"[]");if(useAuthStore.getState().user?.id===account)set({items:data.items||[],seen})}catch{}},
 markSeen:async(ids)=>{const account=useAuthStore.getState().user?.id;if(!account)return;const seen=Array.from(new Set([...get().seen,...ids]));await AsyncStorage.setItem(`treksor.pillar-updates.${account}`,JSON.stringify(seen));if(useAuthStore.getState().user?.id===account)set({seen})}
}));
