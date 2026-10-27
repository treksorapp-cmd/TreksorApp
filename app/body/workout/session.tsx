import BodyPageHeading from "@/components/BodyPageHeading";
import Button from "@/components/ui/Button";
import ExerciseVideo from "@/components/workout/ExerciseVideo";
import { playCompletionFeedback } from "@/lib/completion-feedback";
import { exercisesForMuscles, GymExercise, mergeGymExercises } from "@/lib/gym-library";
import { useWorkoutStore } from "@/store/workout-store";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GOLD="#D7B877",GLASS="rgba(183,221,240,0.075)";
const weekKey=()=>{const d=new Date();d.setDate(d.getDate()-(d.getDay()+6)%7);d.setHours(0,0,0,0);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
const muscles:Record<string,string[]>={"Full Body":["Chest","Back","Legs","Shoulders","Arms","Glutes","Core"],Upper:["Chest","Back","Shoulders","Arms"],Lower:["Legs","Glutes","Core"],Push:["Chest","Shoulders","Arms"],Pull:["Back","Arms"],Legs:["Legs","Glutes","Core"]};
type SetKind="Working"|"Warm-up"|"Drop"|"Failure";
const nextKind=(kind:SetKind):SetKind=>kind==="Working"?"Warm-up":kind==="Warm-up"?"Drop":kind==="Drop"?"Failure":"Working";
const kindLabel=(kind:SetKind)=>kind==="Warm-up"?"WARM UP":kind==="Drop"?"DROP SET":kind==="Failure"?"FAILURE":"WORKING";
const timerText=(total:number)=>`${Math.floor(total/60).toString().padStart(2,"0")}:${(total%60).toString().padStart(2,"0")}`;

export default function WorkoutSession(){
  const insets=useSafeAreaInsets();
  const active=useWorkoutStore(s=>s.activeGymWorkout),sets=useWorkoutStore(s=>s.gymSets)||[],completeSet=useWorkoutStore(s=>s.completeGymSet),setRestEnd=useWorkoutStore(s=>s.setGymRestEnd),finish=useWorkoutStore(s=>s.finishGymWorkout),discard=useWorkoutStore(s=>s.discardGymWorkout);
  const [library,setLibrary]=useState<GymExercise[]>(mergeGymExercises([]));
  const [values,setValues]=useState<Record<string,{kg:string;reps:string}>>({});
  const [kinds,setKinds]=useState<Record<string,SetKind>>({});
  const [expandedVideo,setExpandedVideo]=useState<string|null>(null);
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{let mounted=true;axios.get("https://treksor-admin-production.up.railway.app/api/public/discover?type=exercises",{timeout:12000}).then(r=>{if(mounted&&Array.isArray(r.data?.data))setLibrary(mergeGymExercises(r.data.data))}).catch(()=>{});return()=>{mounted=false}},[]);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(timer)},[]);
  const exercises=useMemo(()=>{
    if(!active)return[];
    const selected=active.exerciseIds.map(id=>library.find(item=>item.id===id)).filter((item):item is GymExercise=>Boolean(item));
    if(selected.length)return selected;
    const all=exercisesForMuscles(library,[...new Set(Object.values(muscles).flat())],"Gym");
    return all.slice(0,5);
  },[active,library]);
  const logged=active?sets.filter(item=>item.sessionId===active.id):[];
  const completedKeys=new Set(active?.completedSetIds||[]);
  const rest=active?.restEndsAt?Math.max(0,Math.ceil((new Date(active.restEndsAt).getTime()-now)/1000)):0;
  if(!active)return <View style={{flex:1,backgroundColor:"#02050C",padding:22,paddingTop:insets.top+12}}><BodyPageHeading trail="BODY / GYM" title="No active session" subtitle="Choose a routine day to begin training."/><Button onPress={()=>router.replace("/body/workout/my-plan")}>OPEN MY PLAN</Button></View>;
  const activeId=active?.id??"", activeDay=active?.day??0;
  const completedCount=logged.length;
  const plannedCount=exercises.reduce((sum,exercise)=>sum+exercise.sets,0);
  function seedValue(exercise:GymExercise,setNumber:number){
    const key=`${exercise.id}:${setNumber}`;
    if(values[key])return values[key];
    const previous=sets.filter(item=>item.exerciseId===exercise.id&&!item.sessionId).slice(-1)[0]||sets.filter(item=>item.exerciseId===exercise.id).slice(-1)[0];
    const reps=exercise.reps.match(/\d+/)?.[0]||"8";
    return {kg:previous?String(previous.kg):exercise.equipment==="Bodyweight"?"0":"",reps:previous?String(previous.reps):reps};
  }
  function logSet(exercise:GymExercise,setNumber:number){
    const key=`${exercise.id}:${setNumber}`,entry=values[key]||seedValue(exercise,setNumber),kg=Number(entry.kg.replace(",",".")),reps=Number(entry.reps);
    if(!entry.kg.trim()||!entry.reps.trim()||!Number.isFinite(kg)||kg<0||(exercise.equipment!=="Bodyweight"&&kg<=0)||!Number.isInteger(reps)||reps<1||reps>300){Alert.alert("Check this set","Enter a valid weight in kg and a completed rep count.");return}
    const kind=kinds[key]||"Working";
    completeSet({id:`${activeId}:${key}`,sessionId:activeId,exerciseId:exercise.id,exerciseName:exercise.name,day:activeDay,setNumber,kg,reps,recordedAt:new Date().toISOString(),setType:kind});
    void playCompletionFeedback();
    if(kind!=="Drop"&&exercise.rest_seconds>0)setRestEnd(new Date(Date.now()+exercise.rest_seconds*1000).toISOString());
  }
  function finishSession(){
    if(!logged.length){Alert.alert("Log a set first","Your training session will count when you have recorded at least one set.");return}
    Alert.alert("Finish workout?",`${logged.length} sets saved. Your session will be added to this week's progress.`,[{text:"Keep training",style:"cancel"},{text:"Finish workout",onPress:()=>{finish(weekKey());void playCompletionFeedback();router.replace("/body/workout/progress")}}]);
  }
  return <View style={{flex:1,backgroundColor:"#02050C"}}>
    <ScrollView contentContainerStyle={{padding:20,paddingTop:insets.top+10,paddingBottom:insets.bottom+32}} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <BodyPageHeading trail="BODY / GYM / LIVE SESSION" title={active.dayName} subtitle="One set at a time. Your progress saves as you train." style={{paddingHorizontal:0}}/>
      <View style={{padding:17,borderRadius:16,backgroundColor:GLASS,marginTop:17}}><View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}><View><Text style={{color:"#AAA59A",fontSize:10,fontWeight:"800",letterSpacing:1}}>SESSION PROGRESS</Text><Text style={{color:"white",fontSize:22,fontWeight:"800",marginTop:5}}>{completedCount}<Text style={{color:"#AFA99F",fontSize:14,fontWeight:"500"}}> / {plannedCount} sets</Text></Text></View><View style={{alignItems:"flex-end"}}><Text style={{color:"#AAA59A",fontSize:10,fontWeight:"800",letterSpacing:1}}>STARTED</Text><Text style={{color:GOLD,fontWeight:"700",marginTop:5}}>{new Date(active.startedAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</Text></View></View><View style={{height:6,borderRadius:6,backgroundColor:"rgba(255,255,255,0.12)",overflow:"hidden",marginTop:14}}><View style={{height:"100%",width:`${Math.min(100,plannedCount?completedCount/plannedCount*100:0)}%`,backgroundColor:GOLD}}/></View></View>
      {rest>0&&<View accessibilityLiveRegion="polite" style={{marginTop:12,padding:16,borderRadius:15,borderWidth:1,borderColor:"rgba(215,184,119,0.42)",backgroundColor:"rgba(215,184,119,0.10)",flexDirection:"row",alignItems:"center",gap:12}}><Ionicons name="timer-outline" size={25} color={GOLD}/><View style={{flex:1}}><Text style={{color:GOLD,fontSize:10,fontWeight:"800",letterSpacing:1}}>REST · NEXT SET</Text><Text style={{color:"white",fontSize:25,fontWeight:"800",fontVariant:["tabular-nums"]}}>{timerText(rest)}</Text></View><TouchableOpacity onPress={()=>setRestEnd(null)} style={{padding:10}}><Text style={{color:"#DED6C7",fontWeight:"700"}}>SKIP</Text></TouchableOpacity></View>}
      {exercises.map((exercise,index)=><View key={exercise.id} style={{marginTop:14,padding:16,borderRadius:18,backgroundColor:GLASS,borderWidth:1,borderColor:"rgba(255,255,255,0.055)"}}>
        <View style={{flexDirection:"row",alignItems:"flex-start",gap:11}}><View style={{width:31,height:31,borderRadius:10,backgroundColor:"rgba(215,184,119,0.13)",alignItems:"center",justifyContent:"center"}}><Text style={{color:GOLD,fontWeight:"800",fontSize:12}}>{String(index+1).padStart(2,"0")}</Text></View><View style={{flex:1}}><Text style={{color:"#F6F3EC",fontSize:16,fontWeight:"800",lineHeight:22}}>{exercise.name}</Text><Text style={{color:"#AFA99F",fontSize:11,marginTop:5}}>{exercise.muscle_group}{exercise.equipment?` · ${exercise.equipment}`:""}</Text></View>{(!!exercise.videoUrl||!!exercise.video_path)&&<TouchableOpacity onPress={()=>setExpandedVideo(expandedVideo===exercise.id?null:exercise.id)} accessibilityRole="button" style={{padding:7}}><Ionicons name="videocam-outline" size={20} color={GOLD}/></TouchableOpacity>}</View>
        {!!exercise.instructions&&<Text style={{color:"#C8C2B7",fontSize:12,lineHeight:18,marginTop:11}}>{exercise.instructions}</Text>}
        {expandedVideo===exercise.id&&(!!exercise.videoUrl||!!exercise.video_path)&&<ExerciseVideo exerciseId={exercise.id} videoUrl={exercise.videoUrl}/>}
        <View style={{flexDirection:"row",justifyContent:"space-between",marginTop:18,marginBottom:8,paddingHorizontal:3}}><Text style={{color:"#8E8A80",fontSize:9,fontWeight:"800",letterSpacing:1}}>SET</Text><Text style={{color:"#8E8A80",fontSize:9,fontWeight:"800",letterSpacing:1}}>PREVIOUS</Text><Text style={{color:"#8E8A80",fontSize:9,fontWeight:"800",letterSpacing:1}}>LOAD × {exercise.metric.toUpperCase()}</Text><View style={{width:40}}/></View>
        {Array.from({length:exercise.sets},(_,indexSet)=>{
          const number=indexSet+1,key=`${exercise.id}:${number}`,isDone=completedKeys.has(key),loggedSet=logged.find(item=>item.exerciseId===exercise.id&&item.setNumber===number),input=loggedSet?{kg:String(loggedSet.kg),reps:String(loggedSet.reps)}:seedValue(exercise,number),previous=sets.filter(item=>item.exerciseId===exercise.id&&(!item.sessionId||item.sessionId!==active.id)).slice(-1)[0];
          const kind=(kinds[key]||"Working") as SetKind;
          return <View key={key} style={{paddingVertical:9,borderTopWidth:1,borderTopColor:"rgba(255,255,255,0.06)"}}><View style={{flexDirection:"row",alignItems:"center",gap:6}}><Text style={{color:isDone?GOLD:"#D8D3CA",fontSize:13,fontWeight:"800",width:28}}>{number}</Text><Text style={{color:"#8D887E",fontSize:10,flex:1}}>{previous?`${exercise.equipment==="Bodyweight"?"BW":`${previous.kg} kg`} × ${previous.reps} ${exercise.metric}`:"New set"}</Text>{exercise.equipment==="Bodyweight"?<View style={{width:53,alignItems:"center",backgroundColor:"rgba(0,0,0,0.24)",borderRadius:9,paddingVertical:10}}><Text style={{color:GOLD,fontSize:11,fontWeight:"800"}}>BW</Text></View>:<TextInput editable={!isDone} accessibilityLabel={`Set ${number} weight in kilograms for ${exercise.name}`} keyboardType="decimal-pad" value={input.kg} onChangeText={kg=>setValues(old=>({...old,[key]:{...input,kg}}))} placeholder="kg" placeholderTextColor="#827D74" style={{width:53,textAlign:"center",color:"white",backgroundColor:"rgba(0,0,0,0.24)",borderRadius:9,paddingVertical:9,fontSize:13}}/>}<Text style={{color:"#817C72"}}>×</Text><TextInput editable={!isDone} accessibilityLabel={`Set ${number} ${exercise.metric} for ${exercise.name}`} keyboardType="number-pad" value={input.reps} onChangeText={reps=>setValues(old=>({...old,[key]:{...input,reps}}))} placeholder={exercise.metric==="seconds"?"sec":"reps"} placeholderTextColor="#827D74" style={{width:54,textAlign:"center",color:"white",backgroundColor:"rgba(0,0,0,0.24)",borderRadius:9,paddingVertical:9,fontSize:13}}/><TouchableOpacity disabled={isDone} onPress={()=>setKinds(old=>({...old,[key]:nextKind(kind)}))} style={{width:46,alignItems:"center",padding:5}}><Text style={{color:kind==="Working"?"#A9A398":GOLD,fontSize:8,fontWeight:"900"}}>{isDone?"DONE":kindLabel(kind)}</Text></TouchableOpacity><TouchableOpacity onPress={()=>isDone&&loggedSet?Alert.alert("Undo this set?","This set will be removed from this session and progress.",[{text:"Keep",style:"cancel"},{text:"Undo",style:"destructive",onPress:()=>{useWorkoutStore.getState().removeGymSet(loggedSet.id)}}]):logSet(exercise,number)} style={{width:34,height:34,borderRadius:11,alignItems:"center",justifyContent:"center",backgroundColor:isDone?GOLD:"rgba(255,255,255,0.10)"}}><Ionicons name={isDone?"checkmark":"add"} size={19} color={isDone?"#15120C":GOLD}/></TouchableOpacity></View></View>;
        })}
        {!!exercise.rest_seconds&&<Text style={{color:"#89847B",fontSize:10,marginTop:8}}>Rest timer · {exercise.rest_seconds}s after each working set. Tap set type to mark warm-up, drop set or failure.</Text>}
      </View>)}
      <TouchableOpacity disabled={!logged.length} onPress={finishSession} style={{height:54,borderRadius:14,backgroundColor:logged.length?GOLD:"rgba(215,184,119,0.22)",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,marginTop:19}}><Ionicons name="checkmark-done-outline" size={20} color={logged.length?"#15120C":"#867A61"}/><Text style={{color:logged.length?"#15120C":"#867A61",fontWeight:"900",letterSpacing:.7}}>FINISH WORKOUT</Text></TouchableOpacity>
      <TouchableOpacity onPress={()=>Alert.alert("Discard this session?","Recorded sets stay in Gym Progress. The unfinished workout will be cleared.",[{text:"Keep training",style:"cancel"},{text:"Discard session",style:"destructive",onPress:()=>{discard();router.replace("/body/workout/my-plan")}}])} style={{padding:16,alignItems:"center",marginTop:4}}><Text style={{color:"#908A80",fontSize:11,fontWeight:"700"}}>DISCARD SESSION</Text></TouchableOpacity>
    </ScrollView>
  </View>;
}
