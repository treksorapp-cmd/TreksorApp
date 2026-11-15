import {useAuthStore} from "@/store/auth-store";
import {supabaseAuth} from "@/api/supabase-auth";
const BASE="https://niakfwerfqmrmhuypkpd.supabase.co/rest/v1/nutrition_groceries";
const KEY="sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8";
export type Grocery={id:string;name:string;checked:boolean;created_at:string};

async function request(owner:string,method:"GET"|"POST"|"PATCH"|"DELETE",path:string,body?:unknown,refresh=true):Promise<Grocery[]>{
 const session=useAuthStore.getState();
 if(!owner||!session.isAuthenticated||session.user.id!==owner||!session.token)throw Error("Sign in to access your shopping list.");
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(BASE+path,{method,headers:{apikey:KEY,Authorization:"Bearer "+session.token,"Content-Type":"application/json",Prefer:"return=representation"},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});
  if(response.status===401&&refresh&&session.refreshToken){
   const renewed=await supabaseAuth.refresh(session.refreshToken);
   if(useAuthStore.getState().user?.id!==owner||!renewed.access_token)throw Error("Please sign in again.");
   useAuthStore.setState({token:renewed.access_token,refreshToken:renewed.refresh_token||session.refreshToken});
   return request(owner,method,path,body,false);
  }
  if(!response.ok)throw Error("Couldn't update the shopping list. Please try again.");
  if(useAuthStore.getState().user?.id!==owner)throw Error("Your account changed.");
  const result:unknown=await response.json();
  return Array.isArray(result)?result as Grocery[]:[];
 }finally{clearTimeout(timer)}
}
export function listGroceries(owner:string){return request(owner,"GET","?select=id,name,checked,created_at&user_id=eq."+encodeURIComponent(owner)+"&order=created_at.desc")}
export function addGrocery(owner:string,name:string){
 const clean=name.trim().slice(0,100);if(!clean)throw Error("Enter an item.");
 return request(owner,"POST","?select=id,name,checked,created_at",{user_id:owner,name:clean,checked:false});
}
export function checkGrocery(owner:string,id:string,checked:boolean){return request(owner,"PATCH","?id=eq."+encodeURIComponent(id)+"&user_id=eq."+encodeURIComponent(owner)+"&select=id,name,checked,created_at",{checked})}
export function removeGrocery(owner:string,id:string){return request(owner,"DELETE","?id=eq."+encodeURIComponent(id)+"&user_id=eq."+encodeURIComponent(owner)+"&select=id,name,checked,created_at")}
