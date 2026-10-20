import React,{useEffect,useState} from "react";
import {Alert,ScrollView,Text,TextInput,TouchableOpacity,View} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
const GOLD="#E8B44D";
const questions=[
"What does your ideal life look like three years from now?",
"Where do you want to live, and what does that place feel like?",
"What does a fulfilling day look like from morning to night?",
"What kind of person do you want to become?",
"How do you want your body and health to feel?",
"What relationships and community do you want around you?",
"What meaningful work or contribution do you want to make?",
"What experiences, adventures or places do you want to explore?",
"What habits or beliefs are holding you back?",
"What is one action you can take this week toward that vision?"
];
const KEY="treksor.vision-board.v1";
export default function VisionBoard(){
 const [answers,setAnswers]=useState<string[]>(Array(10).fill(""));
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{AsyncStorage.getItem(KEY).then(v=>{if(v){const data=JSON.parse(v);if(Array.isArray(data))setAnswers(questions.map((_,i)=>String(data[i]||"")))}}).catch(()=>{}).finally(()=>setLoaded(true))},[]);
 const save=async()=>{try{await AsyncStorage.setItem(KEY,JSON.stringify(answers));Alert.alert("Your vision is saved","Your answers are stored on this device. Keep revisiting them as your vision evolves.")}catch{Alert.alert("Unable to save","Please try again.")}};
 return <ScrollView style={{flex:1,backgroundColor:"#08090B"}} keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:22,paddingTop:50,paddingBottom:130}}>
 <TouchableOpacity onPress={()=>router.back()}><Ionicons name="arrow-back" size={24} color="white"/></TouchableOpacity>
 <Text style={{color:GOLD,letterSpacing:2.2,fontWeight:"800",fontSize:11,marginTop:28}}>PURPOSE · VISION & REFLECTION</Text>
 <Text style={{color:"white",fontSize:32,fontWeight:"800",marginTop:10}}>Design the life you want.</Text>
 <Text style={{color:"#D8D3CA",lineHeight:23,fontSize:15,marginTop:13,marginBottom:26}}>Clarity comes before direction. Put your future into words. Visualise it, make it tangible and begin creating it through small, deliberate actions.</Text>
 <View style={{backgroundColor:"#1B1B19",borderRadius:14,padding:17,borderWidth:1,borderColor:"#695432",marginBottom:25}}><Text style={{color:GOLD,fontWeight:"700"}}>YOUR VISION BOARD</Text><Text style={{color:"#E4DED4",marginTop:8,lineHeight:21}}>Describe what you want to see, feel and experience. You can add visual references to a future board; start here with your words.</Text></View>
 {questions.map((q,i)=><View key={i} style={{marginBottom:22}}><Text style={{color:GOLD,fontWeight:"800",fontSize:11,letterSpacing:1.3}}>QUESTION {i+1} / 10</Text><Text style={{color:"#F7F3EB",fontSize:16,fontWeight:"600",lineHeight:23,marginTop:7,marginBottom:11}}>{q}</Text><TextInput multiline placeholder="Write your vision..." placeholderTextColor="#8E8B85" value={answers[i]} onChangeText={v=>setAnswers(a=>a.map((x,j)=>i===j?v:x))} style={{minHeight:90,textAlignVertical:"top",backgroundColor:"#1D1D1B",borderColor:"#554A38",borderWidth:1,borderRadius:12,color:"white",padding:14,fontSize:15}}/></View>)}
 <TouchableOpacity disabled={!loaded} onPress={save} style={{backgroundColor:GOLD,borderRadius:13,padding:18,alignItems:"center"}}><Text style={{color:"#17130B",fontWeight:"800",fontSize:15}}>SAVE MY VISION ✓</Text></TouchableOpacity>
 </ScrollView>
}