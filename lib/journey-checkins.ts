import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {dayKey,dayDate} from "@/lib/progress-metrics";
export type JourneyCheckIn={date:string;mood:number;focus:number;energy:number;updatedAt:string};
const index=(owner:string)=>`treksor.journey.dates.${owner}`;
const record=(owner:string,date:string)=>`treksor-journey-${owner}-${date}`;
export async function getJourneyCheckIns(owner:string):Promise<JourneyCheckIn[]>{
 if(!owner)return[];const dates=JSON.parse(await AsyncStorage.getItem(index(owner))||"[]");if(!Array.isArray(dates))throw Error("Unable to read check-ins");
 const rows=await Promise.all(dates.map(async(date:unknown)=>{if(typeof date!=="string"||!dayDate(date))return null;const raw=await SecureStore.getItemAsync(record(owner,date));if(!raw)return null;const value=JSON.parse(raw);return value.date===date&&[value.mood,value.focus,value.energy].every(n=>Number.isInteger(n)&&n>=1&&n<=5)?value as JourneyCheckIn:null}));
 return rows.filter((row):row is JourneyCheckIn=>!!row).sort((a,b)=>a.date.localeCompare(b.date));
}
export async function saveJourneyCheckIn(owner:string,values:Pick<JourneyCheckIn,"mood"|"focus"|"energy">,date=dayKey()){
 if(!owner||!dayDate(date)||date>dayKey()||![values.mood,values.focus,values.energy].every(n=>Number.isInteger(n)&&n>=1&&n<=5))throw Error("Choose a value from 1 to 5 for each check-in");
 const dates=JSON.parse(await AsyncStorage.getItem(index(owner))||"[]");
 await SecureStore.setItemAsync(record(owner,date),JSON.stringify({...values,date,updatedAt:new Date().toISOString()}));
 await AsyncStorage.setItem(index(owner),JSON.stringify(Array.from(new Set([...dates,date]))));
}
export async function getTravelMode(owner:string){return owner?await AsyncStorage.getItem(`treksor.journey.travel.${owner}`)==="true":false}
export async function saveTravelMode(owner:string,enabled:boolean){if(!owner)throw Error("Sign in first");await AsyncStorage.setItem(`treksor.journey.travel.${owner}`,String(enabled))}
