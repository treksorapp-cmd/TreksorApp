import {useAuthStore} from '@/store/auth-store';
import type {MentorMemory} from '@/supabase/functions/_shared/mentor';
const endpoint='https://niakfwerfqmrmhuypkpd.supabase.co/functions/v1/treksor-ai';
const key='sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8';
export async function mentorRequest(owner:string,body:unknown):Promise<any>{
 const current=()=>{const s=useAuthStore.getState();if(!s.isAuthenticated||s.user?.id!==owner||!s.token)throw Error('Your account changed. Please sign in again.');return s.token};
 const run=async()=>{const token=current(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),35000);try{return await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:`Bearer ${token}`},body:JSON.stringify(body),signal:controller.signal})}finally{clearTimeout(timer)}};
 let response=await run();if(response.status===401){await useAuthStore.getState().getCurrentUser();current();response=await run()}current();
 const data=await response.json();current();if(!response.ok)throw Error(data?.error||'Mentor could not be reached. Your draft is still here.');return data;
}
export async function listMentorMemories(owner:string):Promise<MentorMemory[]>{return (await mentorRequest(owner,{action:'memories'})).memories}
export async function saveMentorMemory(owner:string,memory:Pick<MentorMemory,'category'|'content'|'user_approved'>&{id?:string}){return mentorRequest(owner,{action:'save_memory',memory})}
export async function deleteMentorMemory(owner:string,id:string){return mentorRequest(owner,{action:'delete_memory',memoryId:id})}
