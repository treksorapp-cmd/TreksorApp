import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Linking, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import axios from "axios";

type Event = { id:string; title:string; category:string; city:string; starts_at:string; description:string; capacity:number; organizer_name:string };
const FEED = "https://treksor-admin-production.up.railway.app/api/public/discover?type=events";
const GOLD = "#E8B44D";
const activities = [
 { label:"Hiking & nature", icon:"🥾", keyword:"hiking" },
 { label:"Social sports", icon:"⚽", keyword:"social sports" },
 { label:"Free events", icon:"✦", keyword:"free community events" },
 { label:"Camping & outdoors", icon:"⛺", keyword:"camping" },
 { label:"Meet people", icon:"◉", keyword:"social meetup" },
 { label:"Volunteering", icon:"♡", keyword:"volunteering" },
];
export default function Community() {
 const [events,setEvents]=useState<Event[]>([]);
 const [city,setCity]=useState("Brisbane");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{let mounted=true; axios.get<{data:Event[]}>(FEED,{timeout:12000}).then(r=>{if(mounted)setEvents(Array.isArray(r.data?.data)?r.data.data:[])}).catch(()=>{if(mounted)setError("Treksor gatherings are unavailable right now.")}).finally(()=>{if(mounted)setLoading(false)});return()=>{mounted=false}},[]);
 const place=city.trim()||"Brisbane";
 const visible=useMemo(()=>events.filter(e=>(e.city||"").toLowerCase().includes(city.trim().toLowerCase())&&(!e.starts_at||new Date(e.starts_at).getTime()>=now.getTime())).sort((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime()),[events,city,now]);
 const weekEnd=new Date(now);weekEnd.setHours(23,59,59,999);weekEnd.setDate(weekEnd.getDate()+((7-weekEnd.getDay())%7));
 const thisWeek=visible.filter(e=>e.starts_at&&new Date(e.starts_at).getTime()<=weekEnd.getTime());
 const search=(keyword:string)=>Linking.openURL("https://www.meetup.com/find/?keywords="+encodeURIComponent(keyword)+"&location="+encodeURIComponent(place+", Australia")).catch(()=>{});
 return <SafeAreaView style={{flex:1,backgroundColor:"#08090B"}}>
 <FlatList data={visible} keyExtractor={e=>String(e.id)} contentContainerStyle={{paddingHorizontal:20,paddingBottom:130}}
 ListHeaderComponent={<>
  <Text style={{color:GOLD,fontSize:11,letterSpacing:2.2,fontWeight:"700",marginTop:24}}>EXPLORE · COMMUNITY</Text>
  <Text style={{color:"#FAF8F3",fontSize:30,fontWeight:"700",marginTop:9}}>This week, get out there.</Text>
  <Text style={{color:GOLD,fontSize:12,fontWeight:"700",marginTop:10}}>ACTIVITIES THIS WEEK · {place.toUpperCase()}</Text>
  <Text style={{color:"#C8C6C1",fontSize:14,lineHeight:21,marginTop:9}}>Discover people, experiences and new places. Search your city or somewhere you're planning to visit.</Text>
  <Text style={{color:"#EDE9E0",fontSize:13,fontWeight:"600",marginTop:25,marginBottom:8}}>Where are you exploring?</Text>
  <TextInput accessibilityLabel="Search city or destination" placeholder="City or destination" placeholderTextColor="#B5B2AA" value={city} onChangeText={setCity} autoCapitalize="words" style={{color:"#FFFFFF",backgroundColor:"#1B1B1B",borderWidth:1,borderColor:"#736044",borderRadius:13,padding:15,fontSize:16}}/>
  <Text style={{color:"#AAA8A2",fontSize:12,marginTop:8}}>Showing {place}. Change the city to plan a trip. Location is not accessed automatically.</Text>
  <View style={{marginTop:22,padding:17,backgroundColor:"#1C1B18",borderColor:"#665335",borderWidth:1,borderRadius:14}}>
   <Text style={{color:GOLD,fontSize:11,fontWeight:"800",letterSpacing:1.3}}>YOUR WEEKLY DISCOVERY</Text>
   <Text style={{color:"#F8F5ED",fontSize:18,fontWeight:"700",marginTop:9}}>{loading?"Finding what's happening...":thisWeek.length?thisWeek.length+" Treksor "+(thisWeek.length===1?"activity":"activities")+" this week":"Your next experience starts here."}</Text>
   <Text style={{color:"#CFC9BD",fontSize:13,lineHeight:19,marginTop:7}}>{thisWeek.length?"Explore upcoming gatherings below, or discover more activities around you.":"Discover hiking, sports, free events and new people in "+place+". Explore the categories below."}</Text>
  </View>
  <Text style={{color:"#F4F0E8",fontSize:19,fontWeight:"700",marginTop:30,marginBottom:15}}>Explore activities near {place}</Text>
  <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:12}}>
  {activities.map(a=><TouchableOpacity key={a.label} onPress={()=>search(a.keyword)} style={{width:"48%",minHeight:105,borderRadius:14,borderWidth:1,borderColor:"#4C453A",backgroundColor:"#191918",padding:15,justifyContent:"space-between"}}>
    <Text style={{color:GOLD,fontSize:22}}>{a.icon}</Text><Text style={{color:"#F5F1E9",fontSize:14,fontWeight:"600"}}>{a.label} ↗</Text>
  </TouchableOpacity>)}
  </View>
  <TouchableOpacity onPress={()=>Linking.openURL("https://www.eventbrite.com.au/d/online/free--events/").catch(()=>{})} style={{marginTop:13,padding:16,borderRadius:12,borderWidth:1,borderColor:"#5D4D31"}}><Text style={{color:GOLD,fontWeight:"700"}}>Explore free online events ↗</Text></TouchableOpacity>
  <Text style={{color:"#B4B0A8",fontSize:12,lineHeight:18,marginTop:12}}>Activity links open external discovery pages. Check dates, location and cost with the organiser.</Text>
  <Text style={{color:"#F4F0E8",fontSize:19,fontWeight:"700",marginTop:32,marginBottom:13}}>Upcoming Treksor gatherings</Text>
  {loading&&<ActivityIndicator color={GOLD} style={{marginVertical:16}}/>}
 </>}
 ListEmptyComponent={!loading?<Text style={{color:"#BBB7B0",lineHeight:21}}>{error||"No Treksor gatherings listed for this location yet. Explore community activities above."}</Text>:null}
 renderItem={({item})=><View style={{padding:18,borderRadius:14,backgroundColor:"#1B1C1B",marginBottom:12,borderWidth:1,borderColor:"#484238"}}>
  <Text style={{color:GOLD,fontSize:12,fontWeight:"700"}}>{(item.category||"ACTIVITY").toUpperCase()} · {item.city}</Text>
  <Text style={{color:"#FFFFFF",fontSize:19,fontWeight:"700",marginTop:9}}>{item.title}</Text>
  <Text style={{color:"#D3D0CA",marginTop:9}}>{item.starts_at?new Date(item.starts_at).toLocaleString():"Date to be announced"}</Text>
  <Text style={{color:"#BDBAB3",marginTop:8}}>Hosted by {item.organizer_name||"Community organiser"}</Text>
  <Text style={{color:"#E1DED7",marginTop:10,lineHeight:20}}>{item.description}</Text>
  <Text style={{color:GOLD,marginTop:14}}>Registration not yet available in Treksor</Text>
 </View>}
 />
 </SafeAreaView>;
}
