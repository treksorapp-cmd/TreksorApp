import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Linking, SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

type Event = { id:string; title:string; category:string; city:string; starts_at:string; description:string; capacity:number; organizer_name:string };
const FEED = "https://treksor-admin-production.up.railway.app/api/public/discover?type=events";
const GOLD = "#E8B44D";
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
 const [loading,setLoading]=useState(true);
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{let mounted=true; axios.get<{data:Event[]}>(FEED,{timeout:12000}).then(r=>{if(mounted)setEvents(Array.isArray(r.data?.data)?r.data.data:[])}).catch(()=>{if(mounted)setEvents([])}).finally(()=>{if(mounted)setLoading(false)});return()=>{mounted=false}},[]);
 const place=city.trim()||"Brisbane";
 const visible=useMemo(()=>events.filter(e=>(e.city||"").toLowerCase().includes(city.trim().toLowerCase())&&(!e.starts_at||new Date(e.starts_at).getTime()>=now.getTime())).sort((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime()),[events,city,now]);
 const weekEnd=new Date(now);weekEnd.setHours(23,59,59,999);weekEnd.setDate(weekEnd.getDate()+((7-weekEnd.getDay())%7));
 const thisWeek=visible.filter(e=>e.starts_at&&new Date(e.starts_at).getTime()<=weekEnd.getTime());
 const search=(keyword:string)=>Linking.openURL("https://www.meetup.com/find/?keywords="+encodeURIComponent(keyword)+"&location="+encodeURIComponent(place+", Australia")).catch(()=>{});
 return <SafeAreaView style={{flex:1,backgroundColor:"#08090B"}}>
 <FlatList data={visible} keyExtractor={e=>String(e.id)} contentContainerStyle={{paddingHorizontal:20,paddingBottom:130}}
 ListHeaderComponent={<>
  <Text style={{color:"#F5F1E8",fontSize:30,fontWeight:"700",letterSpacing:1.1,marginTop:24}}>COMMUNITY</Text>
  <Text style={{color:"#EDE9E0",fontSize:13,fontWeight:"600",marginTop:25,marginBottom:8}}>YOUR LOCATION</Text>
  <TextInput accessibilityLabel="Search city or destination" placeholder="City or destination" placeholderTextColor="#B5B2AA" value={city} onChangeText={setCity} autoCapitalize="words" style={{color:"#FFFFFF",backgroundColor:GLASS,borderRadius:13,padding:15,fontSize:16}}/>
  <View style={{marginTop:22,padding:17,backgroundColor:GLASS,borderRadius:14}}>
   <Text style={{color:GOLD,fontSize:11,fontWeight:"800",letterSpacing:1.3}}>YOUR WEEKLY DISCOVERY</Text>
   <Text style={{color:"#F8F5ED",fontSize:18,fontWeight:"700",marginTop:9}}>{loading?"Finding what's happening...":thisWeek.length?thisWeek.length+" Treksor "+(thisWeek.length===1?"activity":"activities")+" this week":"Your next experience starts here."}</Text>
  </View>
  <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:12,marginTop:25}}>
  {activities.map((a,index)=><TouchableOpacity key={a.label} onPress={()=>search(a.keyword)} style={{width:"48%",minHeight:105,borderRadius:14,,backgroundColor:ACTIVITY_TINTS[index],padding:15,justifyContent:"space-between"}}>
    <View style={{width:38,height:38,borderRadius:11,backgroundColor:"rgba(190,225,244,0.09)",alignItems:"center",justifyContent:"center"}}><Ionicons name={a.icon as any} size={21} color={ACTIVITY_ICON_TINTS[index]}/></View><View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:5}}><Text style={{color:"#F5F1E9",fontSize:12,fontWeight:"700",letterSpacing:0.55,flex:1}}>{a.label.toUpperCase()}</Text><Ionicons name="arrow-up-outline" size={15} color={ACTIVITY_ICON_TINTS[index]} style={{transform:[{rotate:"45deg"}]}}/></View>
  </TouchableOpacity>)}
  </View>
  
  {loading&&<ActivityIndicator color={GOLD} style={{marginVertical:16}}/>}
 </>}
 ListEmptyComponent={null}
 renderItem={({item})=><View style={{padding:18,borderRadius:14,backgroundColor:GLASS,marginBottom:12}}>
  <Text style={{color:GOLD,fontSize:12,fontWeight:"700"}}>{(item.category||"ACTIVITY").toUpperCase()} · {item.city}</Text>
  <Text style={{color:"#FFFFFF",fontSize:19,fontWeight:"700",marginTop:9}}>{item.title.toUpperCase()}</Text>
  <Text style={{color:"#D3D0CA",marginTop:9}}>{item.starts_at?new Date(item.starts_at).toLocaleString():"Date to be announced"}</Text>
  <Text style={{color:"#BDBAB3",marginTop:8}}>Hosted by {item.organizer_name||"Community organiser"}</Text>
  <Text style={{color:"#E1DED7",marginTop:10,lineHeight:20}}>{item.description}</Text>
 </View>}
 />
 </SafeAreaView>;
}
