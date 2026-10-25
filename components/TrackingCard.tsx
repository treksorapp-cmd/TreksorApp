import React from "react";
import {Text,View} from "react-native";
import {TrackingItem} from "@/types/tracking";
const GOLD="#D7B877";
interface Props{title:string;percentage:number;items:TrackingItem[];custom:boolean}
export default function TrackingCard({title,percentage,items,custom}:Props){
 const done=items.reduce((n,i)=>n+Object.values(i?.record||{}).filter(v=>v===true).length,0);
 const total=items.reduce((n,i)=>n+Object.keys(i?.record||{}).length,0);
 const pct=Math.max(0,Math.min(100,Number(percentage)||0));
 return <View style={{backgroundColor:"#191A19",borderWidth:1,borderColor:"#413C34",borderRadius:15,padding:19,marginBottom:13}}>
 <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}><Text style={{color:"#F6F3EC",fontSize:18,lineHeight:25,fontWeight:"600",flex:1,marginRight:12}}>{title}</Text><Text style={{color:GOLD,fontSize:16,fontWeight:"800"}}>{Math.round(pct)}%</Text></View>
 <View style={{height:10,backgroundColor:"#3A3935",borderRadius:7,overflow:"hidden",marginTop:16,marginBottom:15}}><View style={{height:"100%",width:`${pct}%`,backgroundColor:GOLD,borderRadius:7}}/></View>
 {items.map((item,i)=><View key={i} style={{flexDirection:"row",justifyContent:"space-between",marginTop:5,gap:10}}><Text style={{color:"#C9C5BC",fontSize:13,flex:1}}>{item.label}</Text><Text style={{color:"#EEE8DD",fontSize:13,fontWeight:"600"}}>{custom?`${done}/${total}`:String(item.value??"—")}</Text></View>)}
 </View>;
}