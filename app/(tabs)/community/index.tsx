import {colors} from "@/theme/architect";
import CommunityConnections from "@/components/CommunityConnections";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Keyboard, FlatList, Linking, Text, TextInput, TouchableOpacity, View } from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import BodyPageHeading from "@/components/BodyPageHeading";
import axios from "axios";
import {router} from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Event = { id:string; title:string; category:string; city:string; starts_at:string; description:string; capacity:number; organizer_name:string };
const FEED = "https://treksor-admin-production.up.railway.app/api/public/discover?type=events";
const GOLD = "#D7B877";
const GLASS = "rgba(183,221,240,0.055)";
const ACTIVITY_TINTS = ["rgba(94,164,143,0.17)","rgba(100,147,199,0.17)","rgba(201,163,97,0.15)","rgba(147,127,191,0.17)","rgba(191,132,154,0.16)","rgba(107,169,181,0.16)"];
const ACTIVITY_ICON_TINTS = ["#B8E2D1","#C1DCF6","#F2D8A4","#D6C5F2","#F2C8D8","#B8E5EB"];
const activities = [
 { label:"Hiking & nature", icon:"walk-outline", keyword:"hiking" },
 { label:"Social sports", icon:"football-outline", keyword:"social sports" },
 { label:"Free events", icon:"ticket-outline", keyword:"free community events" },
 { label:"Camping & outdoors", icon:"bonfire-outline", keyword:"camping" },
 { label:"Meet people", icon:"people-outline", keyword:"social meetup" },
 { label:"Volunteering", icon:"heart-outline", keyword:"volunteering" },
];
export default function Community() {
 const [events,setEvents]=useState<Event[]>([]);
 const [city,setCity]=useState("Brisbane");
 const [searchedCity,setSearchedCity]=useState("");
 const searchCity=()=>{if(!city.trim())return;Keyboard.dismiss();setSearchedCity(city.trim());setRetry(value=>value+1)};
 const [loading,setLoading]=useState(true);
 const [feedError,setFeedError]=useState(false);
 const [retry,setRetry]=useState(0);
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{let mounted=true;setLoading(true);setFeedError(false); axios.get<{data:Event[]}>(FEED,{timeout:12000}).then(r=>{if(mounted)setEvents(Array.isArray(r.data?.data)?r.data.data:[])}).catch(()=>{if(mounted){setEvents([]);setFeedError(true)}}).finally(()=>{if(mounted)setLoading(false)});return()=>{mounted=false}},[retry]);
 const place=searchedCity;
 const visible=useMemo(()=>events.filter(e=>(e.city||"").toLowerCase().includes(searchedCity.toLowerCase())&&(!e.starts_at||new Date(e.starts_at).getTime()>=now.getTime())).sort((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime()),[events,searchedCity,now]);
 const weekEnd=new Date(now);weekEnd.setHours(23,59,59,999);weekEnd.setDate(weekEnd.getDate()+((7-weekEnd.getDay())%7));
 const thisWeek=visible.filter(e=>e.starts_at&&new Date(e.starts_at).getTime()<=weekEnd.getTime());
 const search=(keyword:string)=>Linking.openURL("https://www.meetup.com/find/?keywords="+encodeURIComponent(keyword)+"&location="+encodeURIComponent(place+", Australia")).catch(()=>{});
 return <SafeAreaView edges={["top"]} style={{flex:1,backgroundColor: colors.background}}>
 <FlatList data={searchedCity?visible:[]} keyboardShouldPersistTaps="handled" keyExtractor={e=>String(e.id)} contentContainerStyle={{paddingHorizontal:20,paddingBottom:28}}
 ListHeaderComponent={<>
  <BodyPageHeading trail="CONNECT & EXPLORE" title="Community" style={{marginHorizontal:-20,paddingRight:22,marginTop:12}} />

  <Text style={{color:"#EDE9E0",fontSize:13,fontWeight:"600",marginTop:25,marginBottom:8}}>YOUR LOCATION</Text>
  <View style={{flexDirection:"row",gap:10}}><TextInput accessibilityLabel="Search city or destination" placeholder="City or destination" placeholderTextColor="#B5B2AA" value={city} onChangeText={setCity} returnKeyType="search" onSubmitEditing={searchCity} autoCapitalize="words" style={{flex:1,color:"#FFFFFF",backgroundColor:GLASS,borderWidth:1,borderColor:"rgba(215,184,119,.25)",borderRadius:13,padding:15,fontSize:16}}/><TouchableOpacity accessibilityRole="button" accessibilityLabel="Search this city" onPress={searchCity} style={{backgroundColor:GOLD,borderRadius:13,paddingHorizontal:17,justifyContent:"center",alignItems:"center",gap:4}}><Ionicons name="search" size={22} color="#17140E"/><Text style={{color:"#17140E",fontSize:10,fontWeight:"800"}}>SEARCH</Text></TouchableOpacity></View>
  {!searchedCity&&<Text style={{color:"#BDB6A9",marginTop:18,lineHeight:22}}>Choose your city and tap Search to discover activities, groups and connections nearby.</Text>}
  {!!searchedCity&&<><Text style={{color:GOLD,marginTop:17,fontSize:12,fontWeight:"700"}}>EXPLORING {searchedCity.toUpperCase()}</Text><CommunityConnections /><TouchableOpacity onPress={()=>router.push("/profile/moments")} style={{padding:17,borderRadius:16,backgroundColor:"rgba(215,184,119,.1)",flexDirection:"row",alignItems:"center",gap:12}}><Ionicons name="images-outline" color={GOLD} size={24}/><View style={{flex:1}}><Text style={{color:"white",fontWeight:"700",fontSize:16}}>Community moments</Text><Text style={{color:"#BAB2A5",fontSize:12,marginTop:5}}>Explore experiences shared by public profiles</Text></View><Ionicons name="arrow-forward" color={GOLD} size={19}/></TouchableOpacity>
  <View style={{marginTop:22,padding:17,backgroundColor:GLASS,borderRadius:14}}>
   <Text style={{color:GOLD,fontSize:11,fontWeight:"800",letterSpacing:1.3}}>YOUR WEEKLY DISCOVERY</Text>
   <Text style={{color:"#F8F5ED",fontSize:18,lineHeight:25,fontWeight:"600",marginTop:9}}>{loading?"Finding what's happening...":thisWeek.length?thisWeek.length+" Treksor "+(thisWeek.length===1?"activity":"activities")+" this week":"Your next experience starts here."}</Text>
  </View>
  <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:12,marginTop:25}}>
  {activities.map((a,index)=><TouchableOpacity key={a.label} onPress={()=>search(a.keyword)} style={{width:"47.5%",minHeight:135,borderWidth:1,borderColor:"rgba(215,184,119,.16)",borderRadius:19,backgroundColor:ACTIVITY_TINTS[index],padding:15,justifyContent:"space-between"}}>
    <View style={{width:46,height:46,borderRadius:15,backgroundColor:"rgba(190,225,244,0.09)",alignItems:"center",justifyContent:"center"}}><Ionicons name={a.icon as any} size={26} color={ACTIVITY_ICON_TINTS[index]}/></View><View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:5}}><Text style={{color:"#F5F1E9",fontSize:14,lineHeight:20,fontWeight:"600",flex:1}}>{a.label}</Text><Ionicons name="arrow-up-outline" size={15} color={ACTIVITY_ICON_TINTS[index]} style={{transform:[{rotate:"45deg"}]}}/></View>
  </TouchableOpacity>)}
  </View>
  
  <Text style={{color:"#A5AAAF",fontSize:12,lineHeight:18,marginTop:12}}>Local activity searches open Meetup.</Text>
  {loading&&<ActivityIndicator color={GOLD} style={{marginVertical:16}}/>}
 </>}</>}
 ListEmptyComponent={!searchedCity?null:loading?null:feedError?<View style={{paddingVertical:20,gap:8}}><Text style={{color:"#C8C3BA",lineHeight:22}}>Activities could not be loaded. Your community connections are still available above.</Text><TouchableOpacity accessibilityRole="button" onPress={()=>setRetry(value=>value+1)} style={{paddingVertical:14}}><Text style={{color:GOLD,fontWeight:"600"}}>Try again</Text></TouchableOpacity></View>:<Text style={{color:"#A5AAAF",fontSize:14,lineHeight:21,marginTop:20,marginBottom:24}}>No upcoming Treksor activities found for this location. Explore local activities above or find a group on Treksor web.</Text>}
 renderItem={({item})=><View style={{padding:18,borderRadius:14,backgroundColor:GLASS,marginBottom:12}}>
  <Text style={{color:GOLD,fontSize:12,fontWeight:"700"}}>{(item.category||"ACTIVITY").toUpperCase()} · {item.city}</Text>
  <Text style={{color:"#FFFFFF",fontSize:18,lineHeight:25,fontWeight:"600",marginTop:9}}>{item.title}</Text>
  <Text style={{color:"#D3D0CA",marginTop:9}}>{item.starts_at?new Date(item.starts_at).toLocaleString():"Date to be announced"}</Text>
  <Text style={{color:"#BDBAB3",marginTop:8}}>Hosted by {item.organizer_name||"Community organiser"}</Text>
  <Text style={{color:"#E1DED7",marginTop:10,lineHeight:20}}>{item.description}</Text>
 </View>}
 />
 </SafeAreaView>;
}
