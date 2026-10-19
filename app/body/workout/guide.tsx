import React,{useEffect,useState} from "react"
import {ActivityIndicator,ScrollView,Text,TouchableOpacity,View} from "react-native"
import axios from "axios"
type Exercise={id:string;name:string;muscle_group:string;location:string;equipment:string;instructions:string;video_path:string|null}
const muscles=["Chest","Back","Shoulders","Arms","Legs","Glutes","Core"]
export default function WorkoutGuide(){
 const [days,setDays]=useState(3)
 const [location,setLocation]=useState<"Gym"|"Home">("Gym")
 const [muscle,setMuscle]=useState("Chest")
 const [exercises,setExercises]=useState<Exercise[]>([])
 const [loading,setLoading]=useState(true)
 useEffect(()=>{axios.get<{data:Exercise[]}>("https://treksor-admin-production.up.railway.app/api/public/discover?type=exercises",{timeout:12000}).then(r=>setExercises(r.data.data)).catch(()=>{}).finally(()=>setLoading(false))},[])
 const split=days<=3?["Full Body A","Full Body B","Full Body C"]:days===4?["Upper Body","Lower Body","Upper Body","Lower Body"]:["Push","Pull","Legs","Upper Body","Lower Body","Full Body"].slice(0,days)
 return <ScrollView style={{flex:1,backgroundColor:"#080b0f"}} contentContainerStyle={{padding:22,paddingBottom:60}}>
  <Text style={{color:"#D6AE67",fontSize:12,letterSpacing:3,marginTop:28}}>TREKSOR / WORKOUT</Text>
  <Text style={{color:"white",fontSize:32,fontWeight:"700",marginTop:8}}>Build Your Plan</Text>
  <Text style={{color:"#ADB0B4",marginTop:10}}>Choose your training days and location. Explore the muscles and available exercises.</Text>
  <Text style={{color:"white",fontSize:18,marginTop:28,marginBottom:12}}>Where do you train?</Text>
  <View style={{flexDirection:"row",gap:10}}>{(["Gym","Home"] as const).map(v=><TouchableOpacity key={v} onPress={()=>setLocation(v)} style={{padding:14,borderRadius:12,backgroundColor:location===v?"#D6AE67":"#25282D"}}><Text style={{color:location===v?"#111":"white",fontWeight:"700"}}>{v}</Text></TouchableOpacity>)}</View>
  <Text style={{color:"white",fontSize:18,marginTop:26,marginBottom:12}}>Days per week</Text>
  <View style={{flexDirection:"row",gap:8}}>{[2,3,4,5,6].map(v=><TouchableOpacity key={v} onPress={()=>setDays(v)} style={{padding:14,borderRadius:10,backgroundColor:days===v?"#D6AE67":"#25282D"}}><Text style={{color:days===v?"#111":"white",fontWeight:"700"}}>{v}</Text></TouchableOpacity>)}</View>
  <Text style={{color:"#D6AE67",fontSize:15,marginTop:28,marginBottom:10}}>SUGGESTED WEEKLY SPLIT</Text>
  {split.map((name,i)=><View key={i} style={{padding:14,backgroundColor:"#1A1D22",borderRadius:12,marginBottom:8}}><Text style={{color:"white",fontWeight:"700"}}>Day {i+1} · {name}</Text></View>)}
  <Text style={{color:"white",fontSize:22,fontWeight:"700",marginTop:28}}>Explore Muscle Groups</Text>
  <Text style={{color:"#ADB0B4",marginVertical:8}}>Select a muscle to see matching exercises.</Text>
  <View style={{flexDirection:"row",flexWrap:"wrap",gap:8,marginVertical:12}}>{muscles.map(m=><TouchableOpacity key={m} onPress={()=>setMuscle(m)} style={{padding:12,borderRadius:10,backgroundColor:muscle===m?"#D6AE67":"#25282D"}}><Text style={{color:muscle===m?"#111":"white"}}>{m}</Text></TouchableOpacity>)}</View>
  {loading?<ActivityIndicator color="#D6AE67"/>:exercises.filter(e=>e.muscle_group===muscle&&(e.location===location||e.location==="Both")).map(e=><View key={e.id} style={{padding:16,backgroundColor:"#1A1D22",borderRadius:12,marginBottom:10}}>
    <Text style={{color:"white",fontSize:17,fontWeight:"700"}}>{e.name}</Text><Text style={{color:"#D6AE67",marginTop:5}}>{e.equipment||"No equipment"}</Text><Text style={{color:"#BDC0C4",marginTop:8}}>{e.instructions}</Text>
    <Text style={{color:"#888",marginTop:8}}>{e.video_path?"Video available in media library":"Video coming soon"}</Text>
  </View>)}
  <Text style={{color:"#94999E",fontSize:12,marginTop:20}}>Suggested splits are examples, not personalized prescriptions. Adapt exercise intensity and recovery to your needs.</Text>
 </ScrollView>
}
