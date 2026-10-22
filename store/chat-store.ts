import { useAuthStore } from '@/store/auth-store';
import { generateRandomId } from '@/lib/utils';
import { Message } from '@/types/message';
import { create } from 'zustand';

const endpoint = 'https://niakfwerfqmrmhuypkpd.supabase.co/functions/v1/treksor-ai';
const publishableKey = 'sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8';
interface ChatState {
 chats: Record<string, Message[]>;
 conversationIds: Record<string,string>;
 currentUserId: string | null;
 loading: boolean;
 error: string | null;
 setUserId: (userId:string)=>void;
 sendMessage: (message:string)=>Promise<boolean>;
 loadHistory: ()=>Promise<void>;
 clearData: ()=>void;
 getMessages: ()=>Message[];
}
async function call(body:unknown){
 const token=useAuthStore.getState().token;
 if(!token)throw new Error('Sign in to use your coach.');
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),30000);
 try{
  const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','apikey':publishableKey,'Authorization':`Bearer ${token}`},body:JSON.stringify(body),signal:controller.signal});
  const data=await res.json();
  if(!res.ok)throw new Error(res.status===401?'Your session expired. Please sign in again.':data?.error||'Unable to reach your coach.');
  return data;
 }finally{clearTimeout(timer);}
}
export const useChatStore=create<ChatState>()((set,get)=>({
 chats:{},conversationIds:{},currentUserId:null,loading:false,error:null,
 setUserId:(userId)=>{
  if(get().currentUserId!==userId)set({currentUserId:userId,error:null});
 },
 getMessages:()=>{const {chats,currentUserId}=get();return currentUserId?chats[currentUserId]||[]:[];},
 loadHistory:async()=>{
  const userId=get().currentUserId;
  if(!userId||!useAuthStore.getState().isAuthenticated)return;
  try{
   const list=await call({action:'history'});
   if(get().currentUserId!==userId)return;
   const first=list.conversations?.[0];
   if(!first){set(s=>({chats:{...s.chats,[userId]:[]},conversationIds:{...s.conversationIds,[userId]:''}}));return;}
   const result=await call({action:'history',conversationId:first.id});
   if(get().currentUserId!==userId)return;
   const messages:Message[]=(result.messages||[]).map((m:any)=>({id:m.id,role:m.role,content:m.content,timestamp:new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}));
   set(s=>({chats:{...s.chats,[userId]:messages},conversationIds:{...s.conversationIds,[userId]:first.id}}));
  }catch(e){if(get().currentUserId===userId)set({error:e instanceof Error?e.message:'Unable to load history.'});}
 },
 sendMessage:async(message)=>{
  const userId=get().currentUserId;
  if(!userId||userId!==useAuthStore.getState().user.id){set({error:'Sign in to use your coach.'});return false;}
  if(get().loading)return false;
  const content=message.trim();
  if(!content)return false;
  const existing=get().chats[userId]||[];
  const chatMessage:Message={id:generateRandomId(),role:'user',content,timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
  set({loading:true,error:null,chats:{...get().chats,[userId]:[...existing,chatMessage]}});
  try{
   const conversationId=get().conversationIds[userId]||undefined;
   const response=await call({action:'send',message:content,...(conversationId?{conversationId}:{})});
   if(get().currentUserId!==userId)return false;
   const answer:Message={id:generateRandomId(),role:'assistant',content:response.message.content,timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
   set(s=>({loading:false,chats:{...s.chats,[userId]:[...(s.chats[userId]||[]),answer]},conversationIds:{...s.conversationIds,[userId]:response.conversationId}}));
   return true;
  }catch(e){
   if(get().currentUserId===userId)set(s=>({loading:false,error:e instanceof Error?e.message:'Unable to contact your coach.',chats:{...s.chats,[userId]:existing}}));
   return false;
  }
 },
 clearData:()=>set({chats:{},conversationIds:{},currentUserId:null,loading:false,error:null}),
}));
