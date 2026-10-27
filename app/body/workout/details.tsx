import BodyPageHeading from "@/components/BodyPageHeading";
import ExerciseVideo from "@/components/workout/ExerciseVideo";
import {mergeGymExercises,GymExercise} from "@/lib/gym-library";
import {useContentRefresh} from "@/hooks/useContentRefresh";
import {router,useLocalSearchParams} from "expo-router";
import {useCallback,useState} from "react";
import {ScrollView,Text,TouchableOpacity,View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
export default function ExerciseDetails(){
 const insets=useSafeAreaInsets(),params=useLocalSearchParams();const id=Array.isArray(params.id)?params.id[0]:params.id;const [items,setItems]=useState<GymExercise[]>(mergeGymExercises([]));
 const refresh=useCallback(async()=>{try{const r=await fetch("https://treksor-admin-production.up.railway.app/api/public/discover?type=exercises");if(r.ok)setItems(mergeGymExercises((await r.json()).data||[]))}catch{}},[]);useContentRefresh(refresh);
 const exercise=items.find(item=>item.id===id||item.serverId===id);
 return <ScrollView style={{flex:1,backgroundColor:"#02050C"}} contentContainerStyle={{padding:22,paddingTop:insets.top+12,paddingBottom:80}}><BodyPageHeading trail="BODY / GYM / EXERCISE" title={exercise?.name||"Exercise unavailable"} style={{paddingHorizontal:0}}/>{exercise?<><Text style={{color:"#D7B877",marginTop:18}}>{exercise.muscle_group}{exercise.equipment?` · ${exercise.equipment}`:""}</Text><ExerciseVideo key={exercise.id} exerciseId={exercise.id} videoUrl={exercise.videoUrl}/><View style={{padding:18,borderRadius:16,backgroundColor:"rgba(183,221,240,.07)",marginTop:22}}><Text style={{color:"white",fontSize:18,fontWeight:"600"}}>Training guide</Text><Text style={{color:"#D7B877",marginTop:12}}>{exercise.sets} sets · {exercise.reps} {exercise.metric} · {exercise.rest_seconds}s rest</Text><Text style={{color:"#D5CFC3",lineHeight:24,marginTop:15}}>{exercise.instructions}</Text></View><TouchableOpacity onPress={()=>router.push("/body/workout/my-plan")} style={{padding:17,backgroundColor:"#D7B877",borderRadius:13,alignItems:"center",marginTop:20}}><Text style={{color:"#17130A",fontWeight:"800"}}>OPEN MY ROUTINES</Text></TouchableOpacity></>:<Text style={{color:"#CCC",marginTop:20}}>Return to the library and select an exercise.</Text>}</ScrollView>;
}
