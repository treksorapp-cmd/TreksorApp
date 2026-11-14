import {colors} from "@/theme/architect";
import BodyPageHeading from "@/components/BodyPageHeading";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import React,{useEffect,useState} from "react";
import {Alert,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,TouchableOpacity,View} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useAuthStore} from "@/store/auth-store";

const MOODS=["Low","Tired","Okay","Good","Great"];

export default function DailyCheckIn(){
 const insets=useSafeAreaInsets();
 const userId=useAuthStore(s=>s.user?.id)||"local";
 const date=new Date().toLocaleDateString("en-CA");
 const key="treksor.daily-checkin."+userId+"."+date;
 const [mood,setMood]=useState(0),[note,setNote]=useState(""),[saved,setSaved]=useState(false),[saving,setSaving]=useState(false);

 useEffect(()=>{AsyncStorage.getItem(key).then(v=>{if(v){const data=JSON.parse(v);setMood(Number(data.mood)||0);setNote(String(data.note||""));setSaved(true)}}).catch(()=>{})},[key]);

 const save=async()=>{
  if(!mood){Alert.alert("Choose your mood","How are you feeling today?");return}
  try{
   setSaving(true);
   await AsyncStorage.setItem(key,JSON.stringify({mood,note,updatedAt:new Date().toISOString()}));
   setSaved(true);
   router.back();
  }catch{
   Alert.alert("Unable to save","Please try again.");
  }finally{
   setSaving(false);
  }
 };

 return <KeyboardAvoidingView style={{flex:1,backgroundColor:colors.background}} behavior={Platform.OS==="ios"?"padding":undefined}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:22,paddingTop:insets.top+12,paddingBottom:insets.bottom+40}}>
   <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={()=>router.back()} style={{width:44,height:44,justifyContent:"center",marginBottom:12}}>
    <Ionicons name="arrow-back" size={24} color={colors.text}/>
   </TouchableOpacity>

   <BodyPageHeading trail="PROGRESS" title="Daily check-in" style={{marginHorizontal:-22,paddingRight:22}} />
   <Text style={{color:colors.secondary,fontSize:14,lineHeight:22,marginTop:10}}>A quiet moment to notice where you are. No judgment, just awareness.</Text>

   <View style={{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:18,padding:18,marginTop:27}}>
    <Text style={{color:colors.text,fontWeight:"700",fontSize:16}}>Your mood</Text>
    <Text style={{color:colors.muted,fontSize:12,lineHeight:18,marginTop:4}}>Choose the one that feels closest right now.</Text>

    <View style={{flexDirection:"row",gap:7,marginTop:17}}>
     {MOODS.map((label,i)=>{
      const selected=mood===i+1;
      return <Pressable
       key={label}
       accessibilityRole="button"
       accessibilityState={{selected}}
       onPress={()=>{setMood(i+1);setSaved(false)}}
       style={({pressed})=>({
        flex:1,minHeight:50,borderRadius:11,justifyContent:"center",alignItems:"center",
        backgroundColor:selected?colors.gold:pressed?colors.surfaceRaised:colors.background,
        borderWidth:selected?2:1,borderColor:selected?colors.gold:"rgba(215,184,119,0.30)",
        opacity:pressed&&!selected?0.82:1
       })}>
       <Text style={{color:selected?"#17130A":colors.text,fontSize:11,fontWeight:selected?"800":"600"}}>{label}</Text>
       {selected?<Ionicons name="checkmark-circle" size={15} color="#17130A" style={{marginTop:4}}/>:null}
      </Pressable>
     })}
    </View>

    <Text style={{color:colors.text,fontWeight:"700",fontSize:16,marginTop:27,marginBottom:5}}>A thought for today</Text>
    <Text style={{color:colors.muted,fontSize:12,lineHeight:18,marginBottom:12}}>Optional. One sentence is enough.</Text>
    <TextInput
     multiline value={note} onChangeText={v=>{setNote(v);setSaved(false)}}
     placeholder="What's on your mind?" placeholderTextColor={colors.muted}
     selectionColor={colors.gold}
     style={{minHeight:125,textAlignVertical:"top",color:colors.text,backgroundColor:colors.background,borderWidth:1,borderColor:"rgba(215,184,119,0.24)",borderRadius:12,padding:14,fontSize:15,lineHeight:22}}
    />
   </View>

   <Pressable
    accessibilityRole="button"
    accessibilityLabel={saved?"Update check-in":"Save check-in"}
    accessibilityState={{disabled:saving}}
    disabled={saving}
    onPress={save}
    style={({pressed})=>({marginTop:22,minHeight:56,borderRadius:16,backgroundColor:saving?"rgba(215,184,119,0.45)":pressed?"#C7A766":colors.gold,alignItems:"center",justifyContent:"center",flexDirection:"row",paddingHorizontal:20})}>
    <Ionicons name={saving?"hourglass-outline":"checkmark-outline"} size={21} color="#17130A" style={{marginRight:9}}/>
    <Text style={{color:"#17130A",fontSize:16,fontWeight:"800",letterSpacing:0.1}}>{saving?"Saving…":saved?"Update check-in":"Save check-in"}</Text>
   </Pressable>

   <View style={{flexDirection:"row",justifyContent:"center",alignItems:"center",marginTop:14}}>
    <Ionicons name="lock-closed-outline" size={13} color={colors.muted}/>
    <Text style={{color:colors.muted,fontSize:12,marginLeft:6}}>Private · saved on this device</Text>
   </View>
  </ScrollView>
 </KeyboardAvoidingView>;
}
