import React from "react";
import {ScrollView,Text,TouchableOpacity,View} from "react-native";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
const GOLD="#E8B44D";
export default function ExerciseLibrary(){return <ScrollView style={{flex:1,backgroundColor:"#08090B"}} contentContainerStyle={{padding:22,paddingTop:54,paddingBottom:90}}>
<TouchableOpacity onPress={()=>router.back()}><Ionicons name="arrow-back" size={24} color="white"/></TouchableOpacity>
<Text style={{color:GOLD,fontSize:11,letterSpacing:2.4,fontWeight:"800",marginTop:28}}>BODY · TRAINING LIBRARY</Text>
<Text style={{color:"white",fontSize:32,fontWeight:"800",marginTop:9}}>Exercise Library</Text>
<Text style={{color:"#C9C5BC",marginTop:9,lineHeight:21,marginBottom:24}}>Explore classic training splits independently from your personal plan.</Text>
{[{name:"Push",desc:"Chest · Shoulders · Triceps",icon:"arrow-up-circle-outline"},{name:"Pull",desc:"Back · Biceps",icon:"repeat-outline"},{name:"Legs",desc:"Quads · Hamstrings · Glutes",icon:"walk-outline"}].map(item=><TouchableOpacity key={item.name} onPress={()=>router.push({pathname:"/body/workout/exercises",params:{workoutId:item.name.toLowerCase()}})} style={{backgroundColor:"#1A1A19",borderRadius:14,borderWidth:1,borderColor:"#51432E",padding:20,marginBottom:13,flexDirection:"row",alignItems:"center",gap:14}}><Ionicons name={item.icon as any} size={25} color={GOLD}/><View style={{flex:1}}><Text style={{color:"white",fontSize:19,fontWeight:"800"}}>{item.name}</Text><Text style={{color:"#C7C2B7",marginTop:5}}>{item.desc}</Text></View><Ionicons name="chevron-forward" color={GOLD} size={20}/></TouchableOpacity>)}
</ScrollView>}