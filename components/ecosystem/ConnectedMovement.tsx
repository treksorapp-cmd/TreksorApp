import React,{useCallback,useState} from "react";
import {Text,TouchableOpacity,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import {useAuthStore} from "@/store/auth-store";
import {getHealthSnapshot} from "@/api/health-snapshot";
import {activityOverview,HealthWorkout,sourceLabel} from "@/lib/ecosystem/activity";
import {colors,surface,type} from "@/theme/architect";
export default function ConnectedMovement(){
 const owner=useAuthStore(s=>s.user?.id),[data,setData]=useState<{owner:string;rows:HealthWorkout[];at:string}|null>(null);
 useFocusEffect(useCallback(()=>{let active=true;if(!owner){setData(null);return}getHealthSnapshot(owner).then(value=>{if(active&&useAuthStore.getState().user?.id===owner)setData(value?{owner,rows:value.snapshot.workouts,at:value.updatedAt}:null)}).catch(()=>{if(active)setData(null)});return()=>{active=false}},[owner]));
 const own=data?.owner===owner?data:null;if(!own?.rows.length)return null;const first=own.rows[0],summary=activityOverview(own.rows,first.sourceId,7);
 return <TouchableOpacity accessibilityRole="button" onPress={()=>router.push("/progress/connections")} style={{...surface.card,marginTop:16,gap:10}}><Text style={type.eyebrow}>YOUR WATCH WORKOUTS · LAST 7 DAYS</Text><Text style={type.section}>{summary.minutes} minutes of movement.</Text><Text style={type.body}>{summary.sessions} imported workouts · {summary.activeDays} active days</Text><Text style={type.caption}>{sourceLabel(first)}. One recording source only. Not added to Treksor gym totals.</Text><Text style={type.caption}>Saved {new Date(own.at).toLocaleString()}</Text><View style={{minHeight:30,justifyContent:"center"}}><Text style={{color:colors.gold,fontSize:12,fontWeight:"600"}}>Explore sources & workout journal →</Text></View></TouchableOpacity>
}
