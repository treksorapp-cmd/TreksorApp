import {create} from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useAuthStore} from "@/store/auth-store";
export type PillarUpdate={id:string;title:string;pillar:string;href:string;kind?:string;summary?:string;image?:string;publishedAt?:string};
let request:Promise<void>|null=null,requestOwner:string|undefined,lastRefresh=0;
export const usePillarUpdates=create<{owner?:string;items:PillarUpdate[];seen:string[];refresh:()=>Promise<void>;markSeen:(ids:string[])=>Promise<void>}>((set,get)=>({
 items:[],seen:[],
 refresh:async()=>{
  const account=useAuthStore.getState().user?.id;
  if(!account){set({owner:undefined,items:[],seen:[]});return}
  if(request&&requestOwner===account)return request;
  if(get().owner===account&&Date.now()-lastRefresh<30000)return;
  if(get().owner!==account)set({owner:account,items:[],seen:[]});
  requestOwner=account;
  const task=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{
   const [r,raw]=await Promise.all([fetch("https://treksor-admin-production.up.railway.app/api/public/pillar-updates",{signal:controller.signal}),AsyncStorage.getItem(`treksor.pillar-updates.${account}`)]);
   if(!r.ok)return;
   const data=await r.json(),parsed=JSON.parse(raw||"[]"),seen=Array.isArray(parsed)?parsed.filter(id=>typeof id==="string"):[];
   const items:Array<PillarUpdate>=Array.isArray(data.items)?data.items.filter((item:any)=>typeof item.id==="string"&&typeof item.title==="string"&&typeof item.pillar==="string"&&typeof item.href==="string"&&/^\/(?:body|mental|spiritual|purpose|\(tabs\))\//.test(item.href)):[];
   if(useAuthStore.getState().user?.id===account){lastRefresh=Date.now();set({owner:account,items,seen:Array.from(new Set([...seen,...get().seen]))})}
  }catch{}finally{clearTimeout(timer);if(requestOwner===account)request=null}})();request=task;return task;
 },
 markSeen:async(ids)=>{const account=useAuthStore.getState().user?.id;if(!account||get().owner!==account)return;const seen=Array.from(new Set([...get().seen,...ids]));set({seen});await AsyncStorage.setItem(`treksor.pillar-updates.${account}`,JSON.stringify(seen))}
}));
