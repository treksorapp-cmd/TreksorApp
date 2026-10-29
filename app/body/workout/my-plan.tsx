import {cachedGymCatalogue,getGymCatalogue} from "@/lib/gym-catalogue";
import BodyPageHeading from "@/components/BodyPageHeading";
import Button from "@/components/ui/Button";
import { exercisesForMuscles, GymExercise, mergeGymExercises } from "@/lib/gym-library";
import { useWorkoutStore } from "@/store/workout-store";
import { colors } from "@/theme/architect";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

const GOLD = "#D7B877";
const GLASS = "rgba(183,221,240,0.075)";
const splits = (n:number) => n===2?["Full Body A","Full Body B"]:n===3?["Full Body A","Full Body B","Full Body C"]:n===4?["Upper A","Lower A","Upper B","Lower B"]:["Push","Pull","Legs","Upper","Lower","Full Body"].slice(0,n);
const groups:Record<string,string[]>={"Full Body":["Chest","Back","Legs","Shoulders","Arms","Glutes","Core"],Upper:["Chest","Back","Shoulders","Arms"],Lower:["Legs","Glutes","Core"],Push:["Chest","Shoulders","Arms"],Pull:["Back","Arms"],Legs:["Legs","Glutes","Core"]};
function weekKey(){const date=new Date();date.setDate(date.getDate()-(date.getDay()+6)%7);date.setHours(0,0,0,0);return [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-")}

export default function MyPlan(){
  const insets=useSafeAreaInsets();
  const plan=useWorkoutStore(s=>s.trainingPlan),checkIns=useWorkoutStore(s=>s.checkIns)||{},active=useWorkoutStore(s=>s.activeGymWorkout),start=useWorkoutStore(s=>s.startGymWorkout),discard=useWorkoutStore(s=>s.discardGymWorkout);
  const overrides=useWorkoutStore(s=>s.exerciseOverrides)||{},setDayExercises=useWorkoutStore(s=>s.setDayExercises);
  const [exerciseList,setExerciseList]=useState<GymExercise[]>(cachedGymCatalogue);
  const [openDay,setOpenDay]=useState(0),[editDay,setEditDay]=useState<number|null>(null),[libraryError,setLibraryError]=useState(false);
  useEffect(()=>{let mounted=true;getGymCatalogue().then(items=>{if(mounted)setExerciseList(items)}).catch(()=>{if(mounted)setLibraryError(true)});return()=>{mounted=false}},[]);
  const dayNames=useMemo(()=>plan?splits(plan.days):[],[plan]);
  const done=(checkIns[weekKey()]||[]).length;
  function startDay(day:number,name:string,items:GymExercise[]){
    if(!items.length){Alert.alert("Your routine is empty","Choose at least one exercise before starting this session.");return}
    if(active){
      if(active.day===day+1){router.push("/body/workout/session");return}
      Alert.alert("Workout in progress","You already have a session in progress.",[
        {text:"Resume session",onPress:()=>router.push("/body/workout/session")},
        {text:"Start this day",style:"destructive",onPress:()=>{discard();const id=start(day+1,name,items.map(x=>x.id));if(id)router.push("/body/workout/session")}},
        {text:"Cancel",style:"cancel"},
      ]);return;
    }
    start(day+1,name,items.map(x=>x.id));router.push("/body/workout/session");
  }
  return <ScrollView style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{padding:22,paddingTop:insets.top+12,paddingBottom:insets.bottom+100}}>
    <BodyPageHeading trail="BODY / GYM" title="My plan" style={{marginHorizontal:-22}} />
    {!plan?<View style={{paddingTop:24}}><Text style={{color:"#D5D1C9",lineHeight:23}}>Build a routine around your schedule, goal and experience.</Text><Button borderless iconName="options-outline" onPress={()=>router.push("/body/workout/guide")}>BUILD MY PLAN</Button></View>:<>
      <Text style={{color:"#C9C5BC",marginTop:10}}>{plan.days} training days per week · {plan.location}{plan.goal?` · ${plan.goal}`:""}</Text>
      <TouchableOpacity onPress={()=>router.push("/body/workout/progress")} style={{flexDirection:"row",alignItems:"center",gap:10,marginTop:18,padding:15,backgroundColor:GLASS,borderRadius:16}}><Ionicons name="stats-chart-outline" size={20} color={GOLD}/><Text style={{color:GOLD,fontWeight:"800",flex:1}}>Gym progress</Text><Text style={{color:"white",fontWeight:"700"}}>{done}/{plan.days} this week</Text><Ionicons name="chevron-forward" size={18} color={GOLD}/></TouchableOpacity>
      {active&&<TouchableOpacity onPress={()=>router.push("/body/workout/session")} style={{marginTop:12,padding:16,borderRadius:16,borderWidth:1,borderColor:"rgba(215,184,119,0.5)",backgroundColor:"rgba(215,184,119,0.09)",flexDirection:"row",alignItems:"center",gap:10}}><Ionicons name="play-circle" size={23} color={GOLD}/><Text style={{color:GOLD,fontWeight:"800",flex:1}}>RESUME {active.dayName.toUpperCase()}</Text><Ionicons name="arrow-forward" size={18} color={GOLD}/></TouchableOpacity>}
      <Text style={{color:"white",fontSize:22,lineHeight:29,fontWeight:"600",marginTop:29,marginBottom:5}}>Your routines</Text><Text style={{color:"#AFA99F",fontSize:12,marginBottom:15}}>Choose a day to review its exercises or start a live workout.</Text>
      {dayNames.map((name,i)=>{
        const key=name.replace(/ [ABC]$/,""),allowed=groups[key]||groups["Full Body"];
        const available=exercisesForMuscles(exerciseList,allowed,plan.location);
        const suggested=available.slice(i%Math.max(1,available.length)).concat(available.slice(0,i%Math.max(1,available.length))).slice(0,5);
        const chosen=overrides[String(i+1)];
        const picks=chosen?chosen.map(id=>available.find(e=>e.id===id)).filter((e):e is GymExercise=>Boolean(e)):suggested;
        const isOpen=openDay===i;
        return <View key={name} style={{backgroundColor:GLASS,borderRadius:18,marginBottom:12,overflow:"hidden",borderWidth:1,borderColor:isOpen?"rgba(215,184,119,0.23)":"rgba(255,255,255,0.04)"}}>
          <TouchableOpacity onPress={()=>setOpenDay(isOpen?-1:i)} style={{padding:17,flexDirection:"row",alignItems:"center",gap:12}}><View style={{width:38,height:38,borderRadius:12,backgroundColor:"rgba(215,184,119,0.12)",alignItems:"center",justifyContent:"center"}}><Text style={{color:GOLD,fontWeight:"800"}}>{String(i+1).padStart(2,"0")}</Text></View><View style={{flex:1}}><Text style={{color:"#AFA99F",fontSize:10,fontWeight:"800",letterSpacing:1}}>DAY {i+1}</Text><Text style={{color:"white",fontSize:17,fontWeight:"700",marginTop:4}}>{name}</Text><Text style={{color:"#AFA99F",fontSize:11,marginTop:4}}>{picks.length} exercises · {picks.reduce((sum,e)=>sum+e.sets,0)} working sets</Text></View><Ionicons name={isOpen?"chevron-up":"chevron-down"} size={20} color={GOLD}/></TouchableOpacity>
          {isOpen&&<View style={{paddingHorizontal:16,paddingBottom:16}}>
            {picks.length?picks.map((exercise,index)=><View key={exercise.id} style={{flexDirection:"row",alignItems:"center",gap:11,paddingVertical:12,borderTopWidth:1,borderTopColor:"rgba(255,255,255,0.07)"}}><View style={{width:27,height:27,borderRadius:9,borderWidth:1,borderColor:"rgba(215,184,119,0.32)",alignItems:"center",justifyContent:"center"}}><Text style={{color:GOLD,fontSize:11,fontWeight:"700"}}>{index+1}</Text></View><View style={{flex:1}}><Text style={{color:"#F4F1EB",fontSize:14,fontWeight:"700"}}>{exercise.name}</Text><Text style={{color:"#AAA59A",fontSize:11,marginTop:4}}>{exercise.muscle_group} · {exercise.sets} × {exercise.reps} {exercise.metric} · {exercise.rest_seconds}s rest</Text></View>{!!exercise.videoUrl&&<Ionicons name="videocam-outline" size={18} color={GOLD}/>}</View>):<Text style={{color:"#BBB3A5",paddingVertical:14}}>{libraryError?"Using your Treksor exercise library.":"No exercises match this day yet."}</Text>}
            <TouchableOpacity onPress={()=>setEditDay(editDay===i?null:i)} style={{flexDirection:"row",alignItems:"center",gap:7,paddingVertical:13}}><Ionicons name="options-outline" color={GOLD} size={17}/><Text style={{color:GOLD,fontSize:11,fontWeight:"800",letterSpacing:.7}}>{editDay===i?"DONE":"CUSTOMIZE ROUTINE"}</Text></TouchableOpacity>
            {editDay===i&&<View style={{padding:12,borderRadius:12,backgroundColor:"rgba(0,0,0,0.22)",marginBottom:11}}><Text style={{color:"white",fontWeight:"700",marginBottom:7}}>Exercises for {name}</Text><Text style={{color:"#AAA59A",fontSize:11,marginBottom:10}}>Tap to add or remove · up to 8 exercises</Text>{available.map(exercise=>{const selected=picks.some(e=>e.id===exercise.id);return <TouchableOpacity key={exercise.id} onPress={()=>{if(!selected&&picks.length>=8){Alert.alert("Routine is full","Choose up to 8 exercises.");return}setDayExercises(i+1,selected?picks.filter(e=>e.id!==exercise.id).map(e=>e.id):[...picks.map(e=>e.id),exercise.id])}} style={{paddingVertical:10,flexDirection:"row",alignItems:"center",gap:9,borderBottomWidth:1,borderBottomColor:"rgba(255,255,255,0.06)"}}><Ionicons name={selected?"checkbox":"square-outline"} color={selected?GOLD:"#8F8B82"} size={19}/><Text style={{color:"white",flex:1,fontSize:12}}>{exercise.name}</Text><Text style={{color:"#9D978D",fontSize:10}}>{exercise.muscle_group}</Text></TouchableOpacity>})}<TouchableOpacity onPress={()=>setDayExercises(i+1,suggested.map(e=>e.id))} style={{padding:12,alignItems:"center"}}><Text style={{color:GOLD,fontSize:11}}>RESTORE SUGGESTED EXERCISES</Text></TouchableOpacity></View>}
            <TouchableOpacity onPress={()=>startDay(i,name,picks)} style={{minHeight:50,borderRadius:13,backgroundColor:GOLD,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9}}><Ionicons name="play" size={18} color="#17140F"/><Text style={{color:"#17140F",fontWeight:"900",letterSpacing:.7}}>{active?.day===i+1?"RESUME WORKOUT":"START WORKOUT"}</Text></TouchableOpacity>
          </View>}
        </View>;
      })}
      <TouchableOpacity onPress={()=>router.push("/body/workout/guide")} style={{padding:15,alignItems:"center",marginTop:6}}><Text style={{color:GOLD,fontWeight:"700",fontSize:12,letterSpacing:.6}}>EDIT TRAINING GOAL & SCHEDULE →</Text></TouchableOpacity>
    </>}
  </ScrollView>;
}
