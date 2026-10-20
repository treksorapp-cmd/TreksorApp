import React,{useEffect,useState} from "react";
import {Alert,ScrollView,Text,TouchableOpacity,View} from "react-native";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import axios from "axios";
import {useWorkoutStore} from "@/store/workout-store";
const GOLD="#E8B44D";
type Exercise={id:string;name:string;muscle_group:string;location:string;sets:number;reps:string;rest_seconds:number};
const splits=(n:number)=>n===2?["Full Body A","Full Body B"]:n===3?["Full Body A","Full Body B","Full Body C"]:n===4?["Upper A","Lower A","Upper B","Lower B"]:["Push","Pull","Legs","Upper","Lower","Full Body"].slice(0,n);
const groups:Record<string,string[]>={"Full Body":["Chest","Back","Legs","Shoulders","Arms","Glutes","Core"],Upper:["Chest","Back","Shoulders","Arms"],Lower:["Legs","Glutes","Core"],Push:["Chest","Shoulders","Arms"],Pull:["Back","Arms"],Legs:["Legs","Glutes","Core"]};
export default function MyPlan(){
 const plan=useWorkoutStore(s=>s.trainingPlan),checkIns=useWorkoutStore(s=>s.checkIns),checkIn=useWorkoutStore(s=>s.checkIn),undo=useWorkoutStore(s=>s.undoCheckIn);
 const [exercises,setExercises]=useState<Exercise[]>([]),[expanded,setExpanded]=useState(0);
 useEffect(()=>{axios.get("https://treksor-admin-production.up.railway.app/api/public/discover?type=exercises",{timeout:12000}).then(r=>setExercises(Array.isArray(r.data?.data)?r.data.data:[])).catch(()=>{})},[]);
 const d=new Date();d.setDate(d.getDate()-(d.getDay()+6)%7);d.setHours(0,0,0,0);const week=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
 const done=(checkIns[week]||[]).length;
 return <ScrollView style={{flex:1,backgroundColor:"#08090B"}} contentContainerStyle={{padding:22,paddingTop:54,paddingBottom:90}}>
 <TouchableOpacity onPress={()=>router.back()}><Ionicons name="arrow-back" color="white" size={24}/></TouchableOpacity>
 <Text style={{color:GOLD,letterSpacing:2,fontSize:11,fontWeight:"800",marginTop:25}}>BODY · YOUR TRAINING</Text>
 <Text style={{color:"white",fontSize:33,fontWeight:"800",marginTop:8}}>My Plan</Text>
 {!plan?<><Text style={{color:"#D5D1C9",marginTop:18,lineHeight:22}}>Create a plan to see your weekly sessions and exercises here.</Text><TouchableOpacity onPress={()=>router.push("/body/workout/guide")} style={{backgroundColor:GOLD,padding:17,borderRadius:12,marginTop:24}}><Text style={{color:"#15110A",textAlign:"center",fontWeight:"800"}}>BUILD MY PLAN</Text></TouchableOpacity></>:<>
 <Text style={{color:"#C9C5BC",marginTop:10}}>{plan.days} sessions per week · {plan.location}</Text>
 <View style={{backgroundColor:"#1B1B1A",padding:18,borderRadius:16,borderWidth:1,borderColor:"#6D5732",marginTop:24}}>
 <Text style={{color:GOLD,fontWeight:"800",letterSpacing:1}}>THIS WEEK</Text>
 <Text style={{color:"white",fontSize:28,fontWeight:"800",marginTop:9}}>{Math.min(done,plan.days)} / {plan.days} completed</Text>
 <View style={{flexDirection:"row",gap:9,marginTop:15}}>{Array.from({length:plan.days},(_,i)=><View key={i} style={{flex:1,height:9,borderRadius:6,backgroundColor:i<done?GOLD:"#44423D"}}/>)}</View>
 <TouchableOpacity disabled={done>=plan.days} onPress={()=>{checkIn(week);Alert.alert(done+1>=plan.days?"🏆 Goal achieved!":"✨ Session completed",done+1>=plan.days?"You completed your weekly goal.":"Another step towards your goal.")}} style={{backgroundColor:done>=plan.days?"#3B3B35":GOLD,padding:15,borderRadius:12,marginTop:20}}><Text style={{color:done>=plan.days?GOLD:"#17130B",textAlign:"center",fontWeight:"800"}}>{done>=plan.days?"✓ WEEK COMPLETE":"✓ MARK SESSION COMPLETE"}</Text></TouchableOpacity>
 {done>0&&<TouchableOpacity onPress={()=>Alert.alert("Correct last check-in?","Remove your most recent session from this week?",[{text:"Cancel",style:"cancel"},{text:"Remove",style:"destructive",onPress:()=>undo(week)}])} style={{alignSelf:"flex-end",marginTop:14,padding:6}}><Text style={{color:"#9F9B93",fontSize:12}}>Correct last check-in</Text></TouchableOpacity>}
 </View>
 <Text style={{color:"white",fontSize:22,fontWeight:"800",marginTop:32,marginBottom:14}}>Your training days</Text>
 {splits(plan.days).map((name,i)=>{const key=name.replace(/ [ABC]$/,"");const allowed=groups[key]||groups["Full Body"];const available=exercises.filter(e=>(e.location===plan.location||e.location==="Both")&&allowed.includes(e.muscle_group));const picks=available.slice(i%Math.max(1,available.length)).concat(available.slice(0,i%Math.max(1,available.length))).slice(0,5);return <View key={i} style={{backgroundColor:"#191A19",borderRadius:14,borderWidth:1,borderColor:expanded===i?"#8E713D":"#3A3833",marginBottom:11,overflow:"hidden"}}><TouchableOpacity onPress={()=>setExpanded(expanded===i?-1:i)} style={{padding:17,flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}><View><Text style={{color:GOLD,fontSize:11,fontWeight:"800"}}>DAY {i+1}</Text><Text style={{color:"white",fontSize:18,fontWeight:"700",marginTop:5}}>{name}</Text></View><Ionicons name={expanded===i?"chevron-up":"chevron-down"} size={20} color={GOLD}/></TouchableOpacity>{expanded===i&&<View style={{paddingHorizontal:17,paddingBottom:17}}>{picks.length?picks.map(e=><View key={e.id} style={{paddingVertical:12,borderTopWidth:1,borderColor:"#383631"}}><Text style={{color:"#F4F1EB",fontWeight:"600"}}>{e.name}</Text><Text style={{color:"#B9B5AB",marginTop:4,fontSize:12}}>{e.muscle_group} · {e.sets} sets · {e.reps} reps</Text></View>):<Text style={{color:"#C9C4BA"}}>Exercises will appear once published in the library.</Text>}</View>}</View>})}
 <TouchableOpacity onPress={()=>router.push("/body/workout/guide")} style={{padding:16,alignItems:"center"}}><Text style={{color:GOLD,fontWeight:"700"}}>EDIT MY PLAN →</Text></TouchableOpacity>
 </>}
 </ScrollView>
}