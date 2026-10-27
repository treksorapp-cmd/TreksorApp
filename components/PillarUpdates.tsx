import {usePillarUpdates} from "@/store/pillar-updates-store";
import {useContentRefresh} from "@/hooks/useContentRefresh";
import {router} from "expo-router";
import {Text,TouchableOpacity,View} from "react-native";
export default function PillarUpdates({pillar,compact=false}:{pillar:string;compact?:boolean}){
 const {items,seen,refresh,markSeen}=usePillarUpdates();useContentRefresh(refresh);
 const updates=items.filter(item=>item.pillar===pillar&&!seen.includes(item.id));
 if(!updates.length)return null;
 if(compact)return <View style={{alignSelf:"flex-start",backgroundColor:"#D7B877",borderRadius:12,paddingHorizontal:9,paddingVertical:4,marginTop:8}}><Text style={{color:"#14110B",fontSize:10,fontWeight:"800"}}>NEW · {updates.length}</Text></View>;
 return <View style={{borderWidth:1,borderColor:"rgba(215,184,119,.4)",borderRadius:16,padding:15,marginBottom:15,backgroundColor:"rgba(215,184,119,.08)"}}><Text style={{color:"#D7B877",fontWeight:"800",fontSize:12}}>NEW IN {pillar.toUpperCase()} · {updates.length}</Text>{updates.slice(0,4).map(item=><TouchableOpacity key={item.id} onPress={()=>{void markSeen([item.id]);router.push(item.href as any)}} style={{paddingVertical:10}}><Text style={{color:"#F5F4F1",fontSize:14}}>{item.title} →</Text></TouchableOpacity>)}<TouchableOpacity onPress={()=>void markSeen(updates.map(item=>item.id))}><Text style={{color:"#ADA596",fontSize:11,marginTop:7}}>Mark these updates as seen</Text></TouchableOpacity></View>
}
