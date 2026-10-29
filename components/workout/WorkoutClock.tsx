import {Ionicons} from "@expo/vector-icons";
import {LinearGradient} from "expo-linear-gradient";
import {StyleSheet,Text,TouchableOpacity,View} from "react-native";
import {clockText,workoutClock} from "@/lib/workout-clock";
import {colors} from "@/theme/architect";
type Props={active:{startedAt:string;restEndsAt?:string|null;restDuration?:number};now:number;completed:number;planned:number;topInset:number;onSkip:()=>void;onExtend:()=>void};
export default function WorkoutClock({active,now,completed,planned,topInset,onSkip,onExtend}:Props){
 const {elapsed,remaining,resting,fraction}=workoutClock(active,now);
 return <View style={[s.shell,{paddingTop:topInset+8}]} accessibilityLabel="Workout and rest timers">
  <View style={s.row}><View style={s.total}><Text style={s.label}>WORKOUT TIME</Text><Text style={s.totalTime}>{clockText(elapsed)}</Text><Text style={s.small}>{completed} / {planned} sets saved</Text></View>
   <LinearGradient colors={resting?["#D7B877","#BA985C"]:["#18222D","#131C26"]} style={[s.rest,resting&&s.lit]}>
    <View style={s.phase}><Ionicons name={resting?"timer-outline":"barbell-outline"} color={resting?"#32240F":"#939C9E"} size={14}/><Text style={[s.restLabel,resting&&s.ink]}>{resting?"RECOVER · REST":"TRAINING · REST OFF"}</Text></View>
    <Text accessibilityLabel={resting?`${remaining} seconds of rest remaining`:"Rest timer stopped"} style={[s.restTime,resting&&s.ink]}>{clockText(remaining)}</Text>
    <View style={s.track}><View style={{height:3,width:`${fraction*100}%`,backgroundColor:"#49351C",borderRadius:3}}/></View>
   </LinearGradient>
  </View>
  <View style={s.footer}><View style={s.status}><View style={[s.dot,{backgroundColor:resting?colors.gold:"#87A897"}]}/><Text style={s.hint}>{resting?"Breathe. Your next set is ahead.":"Your rest clock starts after you log a set."}</Text></View>{resting&&<View style={s.actions}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Add 15 seconds to rest" onPress={onExtend} style={s.action}><Text style={s.actionText}>+15s</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel="End rest and start next set" onPress={onSkip} style={s.action}><Text style={s.actionText}>START SET</Text><Ionicons name="play" size={11} color={colors.gold}/></TouchableOpacity></View>}</View>
 </View>;
}
const s=StyleSheet.create({shell:{paddingHorizontal:20,paddingBottom:6,backgroundColor:"#0B131E",borderBottomWidth:1,borderBottomColor:"rgba(215,184,119,.2)"},row:{flexDirection:"row",gap:15,alignItems:"center"},total:{flex:1,paddingVertical:5},label:{color:colors.muted,fontSize:9,fontWeight:"700",letterSpacing:1.2},totalTime:{color:colors.text,fontSize:30,lineHeight:39,fontWeight:"600",fontVariant:["tabular-nums"],letterSpacing:1},small:{color:"#A5AAAF",fontSize:10,lineHeight:16},rest:{flex:1.15,paddingHorizontal:15,paddingVertical:10,borderRadius:16,borderWidth:1,borderColor:"rgba(255,255,255,.06)"},lit:{borderColor:"#EDD6A6",shadowColor:colors.gold,shadowOpacity:.17,shadowRadius:14,shadowOffset:{width:0,height:0}},phase:{flexDirection:"row",gap:5,alignItems:"center"},restLabel:{color:"#939C9E",fontSize:8,fontWeight:"800",letterSpacing:.65,flexShrink:1},ink:{color:"#261C0F"},restTime:{color:"#73808D",fontSize:32,lineHeight:40,fontWeight:"600",fontVariant:["tabular-nums"],letterSpacing:1},track:{height:3,backgroundColor:"rgba(10,16,21,.15)",borderRadius:3,marginTop:5},footer:{flexDirection:"row",gap:8,alignItems:"center",minHeight:46},status:{flexDirection:"row",gap:6,alignItems:"center",flex:1},dot:{width:4,height:4,borderRadius:3},hint:{color:"#A5AAAF",fontSize:9,lineHeight:14,flex:1},actions:{flexDirection:"row",gap:2},action:{flexDirection:"row",gap:5,alignItems:"center",justifyContent:"center",minHeight:44,minWidth:44,paddingHorizontal:7},actionText:{color:colors.gold,fontSize:9,fontWeight:"800",letterSpacing:.4}});
