import { useAuthStore } from '@/store/auth-store';
import { generateRandomId } from '@/lib/utils';
import { Message } from '@/types/message';
import { mentorRequest } from '@/api/mentor';
import { briefText, MentorBrief, MentorMode } from '@/supabase/functions/_shared/mentor';
import { create } from 'zustand';
export type MentorOptions={mode?:MentorMode;brief?:MentorBrief;shareBrief?:boolean};
interface ChatState {
 chats:Record<string,Message[]>;conversationIds:Record<string,string>;currentUserId:string|null;loading:boolean;error:string|null;
 setUserId:(id:string)=>void;sendMessage:(text:string,options?:MentorOptions)=>Promise<boolean>;loadHistory:()=>Promise<void>;clearConversation:()=>Promise<boolean>;clearData:()=>void;getMessages:()=>Message[];
}
let generation=0;
export const useChatStore=create<ChatState>()((set,get)=>({
 chats:{},conversationIds:{},currentUserId:null,loading:false,error:null,
 setUserId:(id)=>{if(get().currentUserId!==id){generation++;set({currentUserId:id,error:null,loading:false})}},
 getMessages:()=>{const s=get();return s.currentUserId?s.chats[s.currentUserId]||[]:[]},
 loadHistory:async()=>{
  const owner=get().currentUserId,revision=generation;
  const current=()=>get().currentUserId===owner&&generation===revision&&useAuthStore.getState().user?.id===owner;
  if(!owner||!useAuthStore.getState().isAuthenticated||get().loading)return;
  try{
   const list=await mentorRequest(owner,{action:'history'});if(!current())return;
   const first=list.conversations?.[0];
   if(!first){set(s=>({chats:{...s.chats,[owner]:[]},conversationIds:{...s.conversationIds,[owner]:''}}));return}
   const result=await mentorRequest(owner,{action:'history',conversationId:first.id});if(!current())return;
   const messages:Message[]=(result.messages||[]).map((m:any)=>({id:m.id,role:m.role,content:m.content,timestamp:new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}));
   set(s=>({error:null,chats:{...s.chats,[owner]:messages},conversationIds:{...s.conversationIds,[owner]:first.id}}));
  }catch(e){if(current())set({error:e instanceof Error?e.message:'Unable to load Mentor.'})}
 },
 sendMessage:async(message,options={})=>{
  const owner=get().currentUserId;
  if(!owner||owner!==useAuthStore.getState().user?.id){set({error:'Sign in to use Mentor.'});return false}
  if(get().loading||!message.trim())return false;
  const content=message.trim();if(content.length>2000){set({error:'Please keep your message under 2,000 characters.'});return false}
  if(options.brief&&options.shareBrief!==true){set({error:'Review your summary before sharing it.'});return false}
  const revision=++generation,existing=get().chats[owner]||[];
  const current=()=>get().currentUserId===owner&&generation===revision&&useAuthStore.getState().user?.id===owner;
  const visible=content+(options.brief?'\n\nShared with Mentor for this conversation:\n'+briefText(options.brief):'');
  const chatMessage:Message={id:generateRandomId(),role:'user',content:visible,timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
  set(s=>({loading:true,error:null,chats:{...s.chats,[owner]:[...existing,chatMessage]}}));
  try{
   const conversationId=get().conversationIds[owner]||undefined;
   const response=await mentorRequest(owner,{action:'send',message:content,...options,...(conversationId?{conversationId}:{})});if(!current())return false;
   const answer:Message={id:generateRandomId(),role:'assistant',content:response.message.content,timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
   set(s=>({loading:false,chats:{...s.chats,[owner]:[...(s.chats[owner]||[]),answer]},conversationIds:{...s.conversationIds,[owner]:response.conversationId}}));return true;
  }catch(e){if(current())set(s=>({loading:false,error:e instanceof Error?e.message:'Unable to reach Mentor.',chats:{...s.chats,[owner]:existing}}));return false}
 },
 clearConversation:async()=>{
  const owner=get().currentUserId;if(!owner||get().loading)return false;
  const id=get().conversationIds[owner],revision=++generation;set({loading:true,error:null});
  try{if(id)await mentorRequest(owner,{action:'delete',conversationId:id});if(generation!==revision||get().currentUserId!==owner)return false;set(s=>({loading:false,chats:{...s.chats,[owner]:[]},conversationIds:{...s.conversationIds,[owner]:''}}));return true}catch(e){if(generation===revision)set({loading:false,error:e instanceof Error?e.message:'Could not delete conversation.'});return false}
 },
 clearData:()=>{generation++;set({chats:{},conversationIds:{},currentUserId:null,loading:false,error:null})},
}));
