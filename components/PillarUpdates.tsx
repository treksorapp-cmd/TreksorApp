import {usePillarUpdates,PillarUpdate} from "@/store/pillar-updates-store";
import {useAuthStore} from "@/store/auth-store";
import {useContentRefresh} from "@/hooks/useContentRefresh";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {Image} from "expo-image";
import {LinearGradient} from "expo-linear-gradient";
import {useEffect,useRef,useState} from "react";
import {AccessibilityInfo,Animated,StyleSheet,Text,TouchableOpacity,View} from "react-native";
import {colors} from "@/theme/architect";
const art:Record<string,number>={Body:require("@/assets/images/workout-home.jpeg"),Mind:require("@/assets/images/mental-home-bg.jpeg"),Balance:require("@/assets/images/meditation-intermediate.png"),Purpose:require("@/assets/images/mental-my-space.png")};
const kind=(item:PillarUpdate)=>item.kind||item.id.split(":")[0];
const label=(item:PillarUpdate)=>({article:"READ & REFLECT",thought:"POWER THOUGHT",exercise:"TRAINING LIBRARY",video:"MOVEMENT GUIDE"}[kind(item)]||"EXPLORE");
const icon=(item:PillarUpdate):React.ComponentProps<typeof Ionicons>["name"]=>kind(item)==="article"?"reader-outline":kind(item)==="thought"?"sparkles-outline":kind(item)==="video"?"play-outline":"barbell-outline";
export default function PillarUpdates({pillar,compact=false}:{pillar:string;compact?:boolean}){
 const {items,seen,refresh,markSeen,owner}=usePillarUpdates(),account=useAuthStore(s=>s.user?.id);useContentRefresh(refresh);
 const updates=owner===account?items.filter(item=>item.pillar===pillar&&!seen.includes(item.id)):[];
 const [expanded,setExpanded]=useState(false),appear=useRef(new Animated.Value(1)).current;
 const signature=updates[0]?.id;
 useEffect(()=>{let alive=true;AccessibilityInfo.isReduceMotionEnabled().then(reduce=>{if(alive&&!reduce&&signature){appear.setValue(.6);Animated.timing(appear,{toValue:1,duration:650,useNativeDriver:true}).start()}});return()=>{alive=false;appear.stopAnimation()}},[signature,appear]);
 if(!updates.length)return null;
 if(compact)return <View accessibilityLabel={`${updates.length} unseen updates in ${pillar}`} style={s.badge}><View style={s.dot}/><Text style={s.badgeText}>{updates.length} NEW {updates.length===1?"DISCOVERY":"DISCOVERIES"}</Text><Ionicons name="chevron-forward" size={11} color={colors.gold}/></View>;
 const featured=updates[0],remaining=updates.slice(1,expanded?undefined:3);
 const open=(item:PillarUpdate)=>{void markSeen([item.id]).catch(()=>{});router.push(item.href as any)};
 return <Animated.View style={[s.shell,{opacity:appear}]}>
  <View style={s.header}><View><Text style={s.eyebrow}>FRESH IN {pillar.toUpperCase()}</Text><Text style={s.heading}>Something for your next step.</Text></View><View style={s.count}><Text style={s.countText}>{updates.length}</Text></View></View>
  <TouchableOpacity onPress={()=>open(featured)} activeOpacity={.88} accessibilityRole="button" accessibilityLabel={`Open ${featured.title}`} style={s.feature}>
   <Image source={featured.image?{uri:featured.image}:art[pillar]||art.Mind} contentFit="cover" transition={180} style={StyleSheet.absoluteFill}/>
   <LinearGradient colors={["rgba(4,10,16,.15)","rgba(4,10,16,.88)","#07101A"]} locations={[0,.55,1]} style={StyleSheet.absoluteFill}/>
   <View style={s.featureTop}><View style={s.chip}><Ionicons name={icon(featured)} size={13} color={colors.gold}/><Text style={s.chipText}>{label(featured)}</Text></View><View style={s.newChip}><View style={s.dot}/><Text style={s.chipText}>NEW</Text></View></View>
   <View style={{marginTop:35}}><Text style={s.featureTitle} numberOfLines={3}>{featured.title}</Text>{!!featured.summary&&<Text style={s.summary} numberOfLines={2}>{featured.summary}</Text>}<View style={s.featureBottom}><Text style={s.invite}>{kind(featured)==="article"?"A new perspective awaits":kind(featured)==="thought"?"Take a thought with you":"Bring it into your next session"}</Text><View style={s.arrow}><Ionicons name="arrow-forward" size={19} color="#14120C"/></View></View></View>
  </TouchableOpacity>
  {remaining.map(item=><TouchableOpacity key={item.id} onPress={()=>open(item)} accessibilityRole="button" style={s.row}><View style={s.rowIcon}><Ionicons name={icon(item)} size={19} color={colors.gold}/></View><View style={{flex:1}}><Text style={s.rowKind}>{label(item)}</Text><Text style={s.rowTitle} numberOfLines={2}>{item.title}</Text></View><Ionicons name="chevron-forward" color="#9B998F" size={17}/></TouchableOpacity>)}
  {updates.length>3&&<TouchableOpacity onPress={()=>setExpanded(!expanded)} style={s.more}><Text style={s.moreText}>{expanded?"SHOW LESS":`EXPLORE ALL ${updates.length} UPDATES`}</Text><Ionicons name={expanded?"chevron-up":"arrow-forward"} color={colors.gold} size={14}/></TouchableOpacity>}
 </Animated.View>;
}
const s=StyleSheet.create({shell:{marginBottom:20,borderRadius:22,padding:15,borderWidth:1,borderColor:"rgba(215,184,119,.22)",backgroundColor:"#0E1823",shadowColor:"#000",shadowOpacity:.18,shadowRadius:16,shadowOffset:{width:0,height:7}},header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12,padding:3,paddingBottom:15},eyebrow:{color:colors.gold,fontSize:9,fontWeight:"800",letterSpacing:1.7},heading:{color:colors.secondary,fontSize:12,lineHeight:18,marginTop:6},count:{width:31,height:31,borderRadius:16,backgroundColor:colors.goldSoft,alignItems:"center",justifyContent:"center"},countText:{color:colors.gold,fontSize:12,fontWeight:"700"},feature:{borderRadius:16,overflow:"hidden",padding:17,minHeight:214,justifyContent:"space-between",backgroundColor:"#141C23"},featureTop:{flexDirection:"row",justifyContent:"space-between",gap:8,alignItems:"center",flexWrap:"wrap"},chip:{flexDirection:"row",gap:6,alignItems:"center",borderRadius:7,paddingHorizontal:8,paddingVertical:6,backgroundColor:"rgba(3,9,15,.7)"},chipText:{color:colors.gold,fontSize:8,fontWeight:"800",letterSpacing:1},newChip:{flexDirection:"row",gap:5,alignItems:"center",backgroundColor:"rgba(3,9,15,.7)",borderRadius:8,padding:6},dot:{width:5,height:5,borderRadius:3,backgroundColor:colors.gold},featureTitle:{color:colors.text,fontSize:21,lineHeight:28,fontWeight:"600",letterSpacing:-.3},summary:{color:"#C1C3C3",fontSize:12,lineHeight:19,marginTop:8},featureBottom:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:15,marginTop:16},invite:{color:"#D9D0BC",fontSize:10,lineHeight:16,flex:1},arrow:{width:34,height:34,borderRadius:17,backgroundColor:colors.gold,alignItems:"center",justifyContent:"center"},row:{flexDirection:"row",gap:12,alignItems:"center",paddingVertical:14,borderBottomWidth:1,borderBottomColor:"rgba(255,255,255,.06)"},rowIcon:{width:38,height:38,borderRadius:12,backgroundColor:colors.goldSoft,alignItems:"center",justifyContent:"center"},rowKind:{color:colors.muted,fontSize:8,letterSpacing:1,fontWeight:"600"},rowTitle:{color:colors.text,fontSize:13,lineHeight:19,marginTop:4},more:{flexDirection:"row",justifyContent:"center",alignItems:"center",gap:10,minHeight:44,marginTop:6},moreText:{color:colors.gold,fontSize:9,fontWeight:"700",letterSpacing:1},badge:{alignSelf:"flex-start",flexDirection:"row",gap:6,alignItems:"center",backgroundColor:"rgba(5,12,20,.72)",borderWidth:1,borderColor:"rgba(215,184,119,.42)",borderRadius:20,paddingHorizontal:9,paddingVertical:6,marginTop:9},badgeText:{color:colors.gold,fontSize:8,fontWeight:"800",letterSpacing:.6}});
