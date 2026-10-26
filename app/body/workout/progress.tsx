import {colors} from "@/theme/architect";
import BodyPageHeading from "@/components/BodyPageHeading";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React,{useMemo} from "react";
import {ScrollView,Text,TouchableOpacity,View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useWorkoutStore} from "@/store/workout-store";
const GOLD="#D7B877";
const oneRM=(kg:number,reps:number)=>kg*(1+Math.min(reps,12)/30);
export default function GymProgress(){
 const insets=useSafeAreaInsets();
 const sets=useWorkoutStore(s=>s.gymSets)||[];
 const checkIns=useWorkoutStore(s=>s.checkIns)||{};
 const plan=useWorkoutStore(s=>s.trainingPlan);
 const stats=useMemo(()=>{
  const valid=sets.filter(s=>Number.isFinite(s.kg)&&s.kg>0&&Number.isFinite(s.reps)&&s.reps>=1).sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt));
  const map=new Map<string,typeof valid>();
  for(const s of valid){const key=s.exerciseId||s.exerciseName;map.set(key,[...(map.get(key)||[]),s])}
  const exercises=Array.from(map.values()).map(history=>{
   const first=oneRM(history[0].kg,history[0].reps);
   const best=Math.max(...history.map(s=>oneRM(s.kg,s.reps)));
   const recent=history[history.length-1];const latest=oneRM(recent.kg,recent.reps);
   return {name:recent.exerciseName,first,best,latest,change:first>0?(latest/first-1)*100:0,sets:history.length};
  });
  const volume=valid.reduce((n,s)=>n+s.kg*s.reps,0);
  const positive=exercises.filter(e=>e.sets>=2);
  const meanChange=positive.length?positive.reduce((n,e)=>n+e.change,0)/positive.length:null;
  return {exercises,volume,meanChange,sets:valid.length};
 },[sets]);
 const sessions=Object.values(checkIns).reduce((sum,arr)=>sum+arr.length,0);
 return <ScrollView style={{flex:1,backgroundColor: colors.background}} contentContainerStyle={{padding:22,paddingTop:insets.top+12,paddingBottom:100}}>
 
 <BodyPageHeading trail="BODY / WORKOUT / GYM" title="GYM PROGRESS" style={{paddingLeft:0,paddingRight:0}} />
 <Text style={{color:"#C7C1B5",marginTop:9,lineHeight:21}}>Your strength journey, built one set at a time.</Text>
 <View style={{backgroundColor:"rgba(67,72,72,0.30)",borderWidth:1,borderColor:"rgba(242,215,164,0.32)",borderRadius:17,padding:20,marginTop:25}}>
 <Text style={{color:GOLD,fontSize:11,fontWeight:"800",letterSpacing:1.5}}>TRAINING OVERVIEW</Text>
 <View style={{flexDirection:"row",gap:12,marginTop:17}}>
 {[[String(sessions),"Sessions"],[String(stats.sets),"Sets logged"],[Math.round(stats.volume).toLocaleString()+" kg","Total volume"]].map(([v,l])=><View key={l} style={{flex:1}}><Text style={{color:"white",fontSize:19,fontWeight:"800"}}>{v}</Text><Text style={{color:"#BAB4A9",fontSize:11,marginTop:6}}>{l}</Text></View>)}
 </View>
 {plan&&<Text style={{color:"#BEB8AD",marginTop:18,fontSize:12}}>Weekly goal: {plan.days} gym sessions</Text>}
 </View>
 <View style={{backgroundColor:"rgba(67,72,72,0.30)",borderWidth:1,borderColor:"rgba(242,215,164,0.25)",borderRadius:17,padding:20,marginTop:16}}>
 <Text style={{color:GOLD,fontSize:11,fontWeight:"800",letterSpacing:1.5}}>ESTIMATED STRENGTH TREND</Text>
 <Text style={{color:stats.meanChange===null?"#BEB8AD":GOLD,fontSize:32,fontWeight:"800",marginTop:12}}>{stats.meanChange===null?"—":(stats.meanChange>=0?"+":"")+stats.meanChange.toFixed(1)+"%"}</Text>
 <Text style={{color:"#BEB8AD",lineHeight:19,fontSize:12,marginTop:8}}>Average change in estimated 1-rep max across exercises with at least two recorded sets. Not a direct measure of maximum strength or power.</Text>
 </View>
 <Text style={{color:"white",fontSize:22,lineHeight:29,fontWeight:"600",marginTop:30,marginBottom:12}}>By exercise</Text>
 {!stats.exercises.length?<View style={{padding:19,backgroundColor:"rgba(67,72,72,0.30)",borderRadius:14}}><Text style={{color:"#D1CABE",lineHeight:21}}>No gym sets recorded yet. Open My Plan, select a training day and log your first completed set.</Text></View>:stats.exercises.map(e=><View key={e.name} style={{backgroundColor:"rgba(67,72,72,0.30)",padding:18,borderRadius:14,marginBottom:11,borderWidth:1,borderColor:"#3F3A30"}}>
 <Text style={{color:"white",fontWeight:"700",fontSize:16}}>{e.name}</Text>
 <Text style={{color:GOLD,fontWeight:"800",fontSize:23,marginTop:12}}>{e.sets<2?"Baseline":(e.change>=0?"+":"")+e.change.toFixed(1)+"%"}</Text>
 <Text style={{color:"#C7C1B5",fontSize:12,marginTop:6}}>First estimated 1RM: {e.first.toFixed(1)} kg · Latest: {e.latest.toFixed(1)} kg</Text>
 <Text style={{color:"#AFA99F",fontSize:11,marginTop:5}}>Best: {e.best.toFixed(1)} kg · {e.sets} recorded sets</Text>
 </View>)}
 <Text style={{color:"#8F8B82",fontSize:11,lineHeight:18,marginTop:13}}>Estimates use the Epley formula, capped at 12 reps. Compare consistent technique and similar effort. Training volume is the sum of kg × reps across logged sets.</Text>
 </ScrollView>;
}