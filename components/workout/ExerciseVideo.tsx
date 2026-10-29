import React, {useCallback,useEffect,useRef,useState} from "react";
import {ActivityIndicator,AppState,StyleSheet,Text,TouchableOpacity,View} from "react-native";
import {useIsFocused} from "@react-navigation/native";
import {Ionicons} from "@expo/vector-icons";
import {useVideoPlayer,VideoView} from "expo-video";
import {cachedExerciseVideo,resolveExerciseVideo} from "@/lib/exercise-video";

type Props={exerciseId:string;videoUrl?:string;videoPath?:string|null;active?:boolean;loadEnabled?:boolean};
export default function ExerciseVideo({exerciseId,videoUrl,videoPath,active=true,loadEnabled=true}:Props){
 const focused=useIsFocused(),[foreground,setForeground]=useState(AppState.currentState==="active"),[url,setUrl]=useState<string|null>(()=>cachedExerciseVideo(exerciseId,videoPath)),[loading,setLoading]=useState(true),[error,setError]=useState(""),[paused,setPaused]=useState(false),[muted,setMuted]=useState(true),[retry,setRetry]=useState(0);
 const shouldPlay=loadEnabled&&active&&focused&&foreground&&!paused,playRef=useRef(shouldPlay),refreshAttempt=useRef(false);
 playRef.current=shouldPlay;
 const player=useVideoPlayer(null,p=>{p.loop=true;p.muted=true;p.audioMixingMode="mixWithOthers";p.bufferOptions={preferredForwardBufferDuration:5,minBufferForPlayback:.5,waitsToMinimizeStalling:false}});
 const refresh=useCallback(()=>{refreshAttempt.current=false;setError("");setLoading(true);setPaused(false);setRetry(n=>n+1)},[]);
 useEffect(()=>{const subscription=AppState.addEventListener("change",state=>setForeground(state==="active"));return()=>subscription.remove()},[]);
 useEffect(()=>{if(!loadEnabled){setUrl(null);return}let alive=true;setLoading(true);setError("");setPaused(false);
   void resolveExerciseVideo(exerciseId,videoPath,videoUrl,retry>0).then(value=>{if(alive)setUrl(value)}).catch(()=>{if(alive){setError("This demonstration could not load. Check your connection and retry.");setLoading(false)}});
   return()=>{alive=false};
 },[exerciseId,videoPath,videoUrl,retry,loadEnabled]);
 useEffect(()=>{const listener=player.addListener("statusChange",({status})=>{
   setLoading(status==="loading"||status==="idle");
   if(status==="readyToPlay"){setError("");if(playRef.current)player.play()}
   if(status==="error"){
     if(!refreshAttempt.current){refreshAttempt.current=true;setRetry(n=>n+1)}
     else setError("Playback is unavailable. Tap retry to reconnect.");
   }
 });return()=>listener.remove()},[player]);
 useEffect(()=>{if(!url){void player.replaceAsync(null).catch(()=>{});return}let alive=true;setLoading(true);
   void player.replaceAsync({uri:url,useCaching:true,contentType:"progressive"}).then(()=>{if(alive&&playRef.current)player.play()}).catch(()=>{if(alive){setError("Unable to play this demonstration.");setLoading(false)}});
   return()=>{alive=false;try{player.pause()}catch{}};
 },[url,player,retry]);
 useEffect(()=>{try{if(shouldPlay&&url)player.play();else player.pause()}catch{}},[player,shouldPlay,url]);
 useEffect(()=>{player.muted=muted},[player,muted]);
 return <View style={s.wrap}>
   <View style={s.frame}><VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="contain" allowsFullscreen={false}/>
     {loading&&!error&&<View pointerEvents="none" style={s.overlay}><ActivityIndicator color="#D7B877"/><Text style={s.note}>Preparing your demonstration…</Text></View>}
     {!!error&&<View style={s.overlay}><Ionicons name="cloud-offline-outline" color="#D7B877" size={28}/><Text style={s.note}>{error}</Text><TouchableOpacity onPress={refresh} accessibilityRole="button" style={s.retry}><Text style={s.retryText}>RETRY VIDEO</Text></TouchableOpacity></View>}
   </View>
   <View style={s.controls}><View style={{flex:1}}><Text style={s.label}>MOVEMENT GUIDE</Text><Text style={s.caption}>Watch the form. Find your rhythm.</Text></View><TouchableOpacity accessibilityLabel={muted?"Unmute demonstration":"Mute demonstration"} onPress={()=>setMuted(!muted)} style={s.control}><Ionicons name={muted?"volume-mute-outline":"volume-high-outline"} size={19} color="#D7B877"/></TouchableOpacity><TouchableOpacity accessibilityLabel={paused?"Play demonstration":"Pause demonstration"} onPress={()=>setPaused(!paused)} style={s.control}><Ionicons name={paused?"play":"pause"} size={20} color="#D7B877"/></TouchableOpacity></View>
 </View>;
}
const s=StyleSheet.create({wrap:{marginTop:14,borderRadius:15,overflow:"hidden",borderWidth:1,borderColor:"rgba(215,184,119,.18)",backgroundColor:"#09111B"},frame:{width:"100%",aspectRatio:1.45,backgroundColor:"#05080D"},overlay:{...StyleSheet.absoluteFillObject,alignItems:"center",justifyContent:"center",padding:22,backgroundColor:"rgba(5,8,13,.75)"},note:{color:"#C9C2B7",textAlign:"center",fontSize:12,lineHeight:19,marginTop:12},controls:{padding:12,flexDirection:"row",alignItems:"center",gap:5},label:{color:"#D7B877",fontSize:9,fontWeight:"800",letterSpacing:1.1},caption:{color:"#A6A7AA",fontSize:10,marginTop:4},control:{width:42,height:42,alignItems:"center",justifyContent:"center"},retry:{padding:13,marginTop:13,borderRadius:10,backgroundColor:"#D7B877"},retryText:{color:"#15120C",fontSize:11,fontWeight:"800"}});
