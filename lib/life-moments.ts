import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import {dayDate,dayKey} from "@/lib/progress-metrics";
export type LifeMoment={id:string;date:string;caption:string;photoUri:string;createdAt:string;shared:boolean};
const key=(owner:string)=>`treksor.life-moments.${owner}`;
export const newMomentId=()=>"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const n=Math.floor(Math.random()*16);return(c==="x"?n:(n&3)|8).toString(16)});
export async function getLifeMoments(owner:string):Promise<LifeMoment[]>{if(!owner)return[];const rows=JSON.parse(await AsyncStorage.getItem(key(owner))||"[]");if(!Array.isArray(rows))throw Error("Unable to read moments");return rows.filter(row=>row&&typeof row.id==="string"&&dayDate(row.date)&&typeof row.photoUri==="string"&&typeof row.caption==="string").sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt))}
export async function saveLifeMoment(owner:string,date:string,caption:string,jpegBase64:string){
 if(!owner||!dayDate(date)||date>dayKey()||caption.length>400||!jpegBase64)throw Error("Choose a photo, a date and a caption of up to 400 characters");
 if(jpegBase64.length*.75>8*1024*1024)throw Error("Choose a photo smaller than 8 MB");
 if(!FileSystem.documentDirectory)throw Error("Photo storage unavailable");const folder=`${FileSystem.documentDirectory}moments/${owner}/`;await FileSystem.makeDirectoryAsync(folder,{intermediates:true});const id=newMomentId();const photoUri=folder+id+".jpg";
 await FileSystem.writeAsStringAsync(photoUri,jpegBase64,{encoding:FileSystem.EncodingType.Base64});const item:LifeMoment={id,date,caption:caption.trim(),photoUri,createdAt:new Date().toISOString(),shared:false};
 try{const previous=await getLifeMoments(owner);await AsyncStorage.setItem(key(owner),JSON.stringify([item,...previous]));return item}catch(error){await FileSystem.deleteAsync(photoUri,{idempotent:true}).catch(()=>{});throw error}
}
export async function setMomentShared(owner:string,id:string,shared:boolean){const rows=await getLifeMoments(owner);await AsyncStorage.setItem(key(owner),JSON.stringify(rows.map(row=>row.id===id?{...row,shared}:row)))}
export async function deleteLocalMoment(owner:string,id:string){const rows=await getLifeMoments(owner),item=rows.find(row=>row.id===id);await AsyncStorage.setItem(key(owner),JSON.stringify(rows.filter(row=>row.id!==id)));if(item)await FileSystem.deleteAsync(item.photoUri,{idempotent:true}).catch(()=>{})}
