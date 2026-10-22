import React,{useEffect,useState} from "react";
import {Alert,KeyboardAvoidingView,Platform,ScrollView,Text,TextInput,TouchableOpacity,View} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useAuthStore} from "@/store/auth-store";
const GOLD="#F5BD4F";
export default function DailyCheckIn(){
 const userId=useAuthStore(s=>s.user?.id)||"local";
 const date=new Date().toLocaleDateString("en-CA");
 const key="treksor.daily-checkin."+userId+"."+date;
 const [mood,setMood]=useState(0),[note,setNote]=useState(""),[saved,setSaved]=useState(false);
 useEffect(()=>{AsyncStorage.getItem(key).then(v=>{if(v){const data=JSON.parse(v);setMood(Number(data.mood)||0);setNote(String(data.note||""));setSaved(true)}}).catch(()=>{})},[key]);
 const save=async()=>{if(!mood){Alert.alert("Choose your mood","How are you feeling today?");return}try{await AsyncStorage.setItem(key,JSON.stringify({mood,note,updatedAt:new Date().toISOString()}));setSaved(true);Alert.alert("Check-in saved","Your reflection is saved on this device.")}catch{Alert.alert("Unable to save","Please try again.")}};
 return <KeyboardAvoidingView style={{flex:1,backgroundColor:"#08090B"}} behavior={Platform.OS==="ios"?"padding":undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:22,paddingTop:55,paddingBottom:100}}>
 <TouchableOpacity onPress={()=>router.back()}><Ionicons name="arrow-back" size={24} color="white"/></TouchableOpacity>
 <Text style={{color:GOLD,fontSize:11,letterSpacing:2,fontWeight:"800",marginTop:29}}>PROGRESS · DAILY CHECK-IN</Text>
 <Text style={{color:"white",fontSize:30,fontWeight:"700",marginTop:10}}>How are you today?</Text>
 <Text style={{color:"#D1CBC0",fontSize:14,lineHeight:22,marginTop:10}}>A quiet moment to notice where you are. No judgment, just awareness.</Text>
 <View style={{backgroundColor:"#1B1B19",borderWidth:1,borderColor:"#544632",borderRadius:16,padding:18,marginTop:27}}>
 <Text style={{color:"#F5F1E8",fontWeight:"700",fontSize:16}}>Your mood</Text>
 <View style={{flexDirection:"row",gap:7,marginTop:17}}>{["Low","Tired","Okay","Good","Great"].map((label,i)=><TouchableOpacity key={label} onPress={()=>{setMood(i+1);setSaved(false)}} style={{flex:1,paddingVertical:13,borderRadius:9,backgroundColor:mood===i+1?GOLD:"#292822",borderWidth:1,borderColor:mood===i+1?GOLD:"#494238",alignItems:"center"}}><Text style={{color:mood===i+1?"#17130A":"#E8E3DA",fontSize:11,fontWeight:"700"}}>{label}</Text></TouchableOpacity>)}</View>
 <Text style={{color:"#F5F1E8",fontWeight:"700",fontSize:16,marginTop:27,marginBottom:12}}>A thought for today</Text>
 <TextInput multiline value={note} onChangeText={v=>{setNote(v);setSaved(false)}} placeholder="What's on your mind?" placeholderTextColor="#938D82" style={{minHeight:125,textAlignVertical:"top",color:"white",backgroundColor:"#292822",borderRadius:11,padding:14,fontSize:15}}/>
 </View>
 <TouchableOpacity onPress={save} style={{backgroundColor:GOLD,marginTop:22,padding:17,borderRadius:12,alignItems:"center"}}><Text style={{color:"#17130A",fontWeight:"800"}}>{saved?"SAVED ✓ · UPDATE CHECK-IN":"SAVE CHECK-IN"}</Text></TouchableOpacity>
 <Text style={{color:"#999388",fontSize:12,marginTop:14,textAlign:"center"}}>Private · saved on this device</Text>
 </ScrollView></KeyboardAvoidingView>;
}