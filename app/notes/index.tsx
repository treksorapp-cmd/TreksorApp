import AsyncStorage from "@react-native-async-storage/async-storage";
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useAuthStore} from "@/store/auth-store";
import {colors} from "@/theme/architect";
import React,{useCallback,useEffect,useRef,useState} from "react";
import {Alert,AppState,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

type Note={id:string;body:string;done:boolean;createdAt:string;updatedAt:string;kind:"task"|"note"};
const parse=(raw:string|null):Note[]=>{try{const data=JSON.parse(raw||"[]");return Array.isArray(data)?data.filter(x=>x&&typeof x.id==="string"&&typeof x.body==="string"&&["task","note"].includes(x.kind)).slice(0,300):[]}catch{return []}};
export default function QuickNotes(){
 const insets=useSafeAreaInsets(),userId=useAuthStore(s=>s.user?.id),key=userId?"treksor.quick-notes.v1."+userId:null;
 const [items,setItems]=useState<Note[]>([]),[draft,setDraft]=useState(""),[kind,setKind]=useState<"task"|"note">("task"),[loaded,setLoaded]=useState(false),[error,setError]=useState(""),[filter,setFilter]=useState<"open"|"all">("open");
 const ref=useRef<Note[]>([]),queue=useRef<Promise<void>>(Promise.resolve());
 useEffect(()=>{let active=true;setLoaded(false);setItems([]);ref.current=[];setError("");queue.current=Promise.resolve();if(!key)return()=>{active=false};AsyncStorage.getItem(key).then(raw=>{if(active){const next=parse(raw);ref.current=next;setItems(next)}}).catch(()=>{if(active)setError("Could not load your notes.")}).finally(()=>{if(active)setLoaded(true)});return()=>{active=false}},[key]);
 const update=useCallback((fn:(old:Note[])=>Note[])=>{if(!loaded||!key)return;const next=fn(ref.current);ref.current=next;setItems(next);setError("");queue.current=queue.current.catch(()=>undefined).then(()=>AsyncStorage.setItem(key,JSON.stringify(next)));void queue.current.catch(()=>setError("Could not save. Try again."))},[key,loaded]);
 const add=()=>{const body=draft.trim().slice(0,500);if(!body)return;const now=new Date().toISOString();update(old=>[{id:now+"-"+Math.random().toString(36).slice(2,8),body,done:false,kind,createdAt:now,updatedAt:now},...old].slice(0,300));setDraft("")};
 const visible=items.filter(n=>filter==="all"||n.kind==="note"||!n.done);
 return <View style={{flex:1,backgroundColor:colors.background}}>
 <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingTop:insets.top+10,paddingBottom:insets.bottom+45,paddingHorizontal:20,gap:15}}>
  <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={()=>router.back()} style={{width:44,height:44,justifyContent:"center"}}><Ionicons name="arrow-back" size={24} color={colors.text}/></Pressable>
  <Text style={{color:colors.gold,fontSize:11,letterSpacing:2,fontWeight:"700"}}>YOUR SPACE</Text><Text style={{color:colors.text,fontSize:31,fontWeight:"600"}}>Quick Notes</Text>
  <Text style={{color:colors.muted,fontSize:13,lineHeight:20}}>Get it out of your head. Keep your day clear.</Text>
  <View style={{borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,borderRadius:17,padding:15,gap:12}}>
   <View style={{flexDirection:"row",gap:8}}>{(["task","note"] as const).map(v=><Pressable key={v} onPress={()=>setKind(v)} style={{paddingHorizontal:15,paddingVertical:10,borderRadius:9,backgroundColor:kind===v?colors.gold:colors.surfaceRaised}}><Text style={{color:kind===v?colors.background:colors.text,fontWeight:"700",fontSize:12}}>{v==="task"?"To-do":"Note"}</Text></Pressable>)}</View>
   <TextInput accessibilityLabel="Write a quick note or task" value={draft} onChangeText={setDraft} multiline maxLength={500} placeholder={kind==="task"?"e.g. Send an email, call the mechanic…":"Write down an idea…"} placeholderTextColor={colors.muted} style={{color:colors.text,minHeight:68,borderColor:colors.border,borderWidth:1,borderRadius:11,padding:12,fontSize:15,textAlignVertical:"top"}}/>
   <Pressable accessibilityRole="button" disabled={!loaded||!draft.trim()} onPress={add} style={{alignItems:"center",backgroundColor:colors.gold,borderRadius:11,padding:14,opacity:!loaded||!draft.trim()?0.45:1}}><Text style={{color:colors.background,fontWeight:"800"}}>SAVE {kind==="task"?"TASK":"NOTE"}</Text></Pressable>
  </View>
  <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:10}}><Text style={{color:colors.text,fontSize:19,fontWeight:"600"}}>My list</Text><Pressable onPress={()=>setFilter(v=>v==="open"?"all":"open")}><Text style={{color:colors.gold,fontSize:12}}>{filter==="open"?"Show completed":"Show active"}</Text></Pressable></View>
  {!visible.length&&<Text style={{color:colors.muted,fontSize:13}}>Nothing here yet. One small note is a good start.</Text>}
  {visible.map(n=><View key={n.id} style={{flexDirection:"row",alignItems:"flex-start",gap:11,padding:14,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface}}>
   <Pressable accessibilityRole="checkbox" accessibilityState={{checked:n.done}} accessibilityLabel={n.kind==="task"?"Mark task complete":"Note"} disabled={n.kind!=="task"} onPress={()=>update(old=>old.map(x=>x.id===n.id?{...x,done:!x.done,updatedAt:new Date().toISOString()}:x))} style={{paddingTop:2}}><Ionicons name={n.kind==="note"?"document-text-outline":n.done?"checkbox":"square-outline"} size={24} color={n.done?colors.gold:colors.secondary}/></Pressable>
   <View style={{flex:1}}><Text style={{color:n.done?colors.muted:colors.text,fontSize:14,lineHeight:21,textDecorationLine:n.done?"line-through":"none"}}>{n.body}</Text><Text style={{color:colors.muted,fontSize:10,marginTop:6}}>{n.kind==="task"?"TO-DO":"NOTE"}</Text></View>
   <Pressable accessibilityRole="button" accessibilityLabel="Delete item" onPress={()=>Alert.alert("Delete this item?","This cannot be undone.",[{text:"Cancel",style:"cancel"},{text:"Delete",style:"destructive",onPress:()=>update(old=>old.filter(x=>x.id!==n.id))}])} style={{padding:5}}><Ionicons name="trash-outline" color={colors.muted} size={18}/></Pressable>
  </View>)}
  {!!error&&<Text accessibilityRole="alert" style={{color:colors.danger}}>{error}</Text>}
  <Text style={{color:colors.muted,fontSize:11,marginTop:8}}>Saved privately on this device. Notifications and cross-device sync are not enabled yet.</Text>
 </ScrollView></View>
}
