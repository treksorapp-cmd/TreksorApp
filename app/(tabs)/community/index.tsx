import React,{useEffect,useState} from "react"
import {ActivityIndicator,FlatList,SafeAreaView,Text,TextInput,TouchableOpacity,View,Linking} from "react-native"
import axios from "axios"
type Event={id:string;title:string;category:string;city:string;starts_at:string;description:string;capacity:number;organizer_name:string}
const FEED="https://treksor-admin-production.up.railway.app/api/public/discover?type=events"
export default function Community(){
 const [events,setEvents]=useState<Event[]>([])
 const [city,setCity]=useState("Brisbane")
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState("")
 async function load(){setLoading(true);try{const r=await axios.get<{data:Event[]}>(FEED,{timeout:12000});setEvents(r.data.data);setError("")}catch{setError("Experiences are temporarily unavailable.")}finally{setLoading(false)}}
 useEffect(()=>{void load()},[])
 const visible=events.filter(e=>(e.city||"").toLowerCase().includes(city.trim().toLowerCase()))
 return <SafeAreaView style={{flex:1,backgroundColor:"#080b0f",paddingHorizontal:20}}>
  <Text style={{color:"#D6AE67",fontSize:12,letterSpacing:3,marginTop:24}}>TREKSOR COMMUNITY</Text>
  <Text style={{color:"white",fontSize:32,fontWeight:"700",marginTop:8}}>Explore together.</Text>
  <Text style={{color:"#A7ABB1",marginTop:8,marginBottom:22}}>Real people. Shared experiences. Hiking, camping and movement around Brisbane.</Text>
  <TextInput placeholder="City (e.g. Brisbane)" placeholderTextColor="#81858A" value={city} onChangeText={setCity} style={{color:"white",borderWidth:1,borderColor:"#3C3F44",borderRadius:12,padding:14,marginBottom:20}}/>
  <Text style={{color:"#F1F0ED",fontSize:17,fontWeight:"600",marginBottom:10}}>Open activities near Brisbane</Text>
  <View style={{flexDirection:"row",gap:10,marginBottom:22}}>
    <TouchableOpacity onPress={()=>Linking.openURL("https://www.meetup.com/find/?location=au--Brisbane&keywords=hiking")} style={{flex:1,padding:14,borderRadius:12,backgroundColor:"#1C1D1D",borderWidth:1,borderColor:"#4A4439"}}><Text style={{color:"#E1C18A",fontWeight:"600"}}>Hiking groups ↗</Text><Text style={{color:"#A8A7A4",fontSize:11,marginTop:5}}>Meetup · Brisbane</Text></TouchableOpacity>
    <TouchableOpacity onPress={()=>Linking.openURL("https://www.eventbrite.com.au/d/australia--brisbane/outdoor-activities/")} style={{flex:1,padding:14,borderRadius:12,backgroundColor:"#1C1D1D",borderWidth:1,borderColor:"#4A4439"}}><Text style={{color:"#E1C18A",fontWeight:"600"}}>Local events ↗</Text><Text style={{color:"#A8A7A4",fontSize:11,marginTop:5}}>Eventbrite · Brisbane</Text></TouchableOpacity>
  </View>
  <Text style={{color:"#F1F0ED",fontSize:17,fontWeight:"600",marginBottom:12}}>Treksor gatherings</Text>
  {loading?<ActivityIndicator color="#D6AE67"/>:<FlatList data={visible} keyExtractor={e=>e.id} ListEmptyComponent={<Text style={{color:"#B9B9B9"}}>{error||"No upcoming experiences in this area yet."}</Text>} renderItem={({item})=><View style={{padding:18,borderRadius:16,backgroundColor:"#191D22",marginBottom:12,borderWidth:1,borderColor:"#343434"}}>
   <Text style={{color:"#D6AE67",fontSize:12}}>{item.category.toUpperCase()} · {item.city}</Text>
   <Text style={{color:"white",fontSize:20,fontWeight:"700",marginTop:8}}>{item.title}</Text>
   <Text style={{color:"#C1C3C5",marginTop:8}}>{new Date(item.starts_at).toLocaleString()}</Text>
   <Text style={{color:"#A7ABB1",marginTop:6}}>Hosted by {item.organizer_name} · Up to {item.capacity} participants</Text>
   <Text style={{color:"#C1C3C5",marginTop:10}}>{item.description}</Text>
   <Text style={{color:"#D6AE67",marginTop:14}}>Registration not yet available in Treksor</Text>
  </View>}/>}
 </SafeAreaView>
}
