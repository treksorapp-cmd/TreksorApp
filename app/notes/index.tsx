import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from '@/components/ui/BrandIcon';
import {router} from "expo-router";
import * as Notifications from "expo-notifications";
import {useAuthStore} from "@/store/auth-store";
import {colors} from "@/theme/architect";
import React,{useCallback,useEffect,useRef,useState} from "react";
import {Alert,AppState,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

type Note={id:string;body:string;done:boolean;createdAt:string;updatedAt:string;kind:"task"|"note";remindAt?:string;notificationId?:string};
const parseReminder=(date:string,time:string):Date|null=>{if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)||!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(time))return null;const [y,m,d]=date.split("-").map(Number),[h,min]=time.split(":").map(Number);const when=new Date(y,m-1,d,h,min);return when.getFullYear()===y&&when.getMonth()===m-1&&when.getDate()===d&&when.getTime()>Date.now()+60000?when:null};
const dateInput=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const timeInput=(d:Date)=>String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
const cancelReminder=async(n:Note)=>{if(n.notificationId)try{await Notifications.cancelScheduledNotificationAsync(n.notificationId)}catch{}};
const parse=(raw:string|null):Note[]=>{try{const data=JSON.parse(raw||"[]");return Array.isArray(data)?data.filter(x=>x&&typeof x.id==="string"&&typeof x.body==="string"&&["task","note"].includes(x.kind)).slice(0,300):[]}catch{return []}};
export default function QuickNotes(){
 const insets=useSafeAreaInsets(),userId=useAuthStore(s=>s.user?.id),key=userId?"treksor.quick-notes.v1."+userId:null;
 const [items,setItems]=useState<Note[]>([]),[draft,setDraft]=useState(""),[kind,setKind]=useState<"task"|"note">("task"),[loaded,setLoaded]=useState(false),[error,setError]=useState(""),[filter,setFilter]=useState<"open"|"all">("open"),[remind,setRemind]=useState(false),[reminderDate,setReminderDate]=useState(()=>dateInput(new Date(Date.now()+86400000))),[reminderTime,setReminderTime]=useState("09:00");
 const ref=useRef<Note[]>([]),queue=useRef<Promise<void>>(Promise.resolve());
 useEffect(()=>{let active=true;setLoaded(false);setItems([]);ref.current=[];setError("");queue.current=Promise.resolve();if(!key)return()=>{active=false};AsyncStorage.getItem(key).then(raw=>{if(active){const next=parse(raw);ref.current=next;setItems(next)}}).catch(()=>{if(active)setError("Could not load your notes.")}).finally(()=>{if(active)setLoaded(true)});return()=>{active=false}},[key]);
 const update=useCallback((fn:(old:Note[])=>Note[])=>{if(!loaded||!key)return;const next=fn(ref.current);ref.current=next;setItems(next);setError("");queue.current=queue.current.catch(()=>undefined).then(()=>AsyncStorage.setItem(key,JSON.stringify(next)));void queue.current.catch(()=>setError("Could not save. Try again."))},[key,loaded]);
 const add=async()=>{const body=draft.trim().slice(0,500);if(!body||!loaded)return;const when=remind?parseReminder(reminderDate.trim(),reminderTime.trim()):null;if(remind&&!when){Alert.alert("Check reminder","Choose a future date (YYYY-MM-DD) and time (HH:mm).");return}
  let notificationId:string|undefined;
  if(when){try{const permissions=await Notifications.getPermissionsAsync();const granted=permissions.granted||(await Notifications.requestPermissionsAsync()).granted;if(!granted){Alert.alert("Notifications disabled","Enable notifications in iPhone Settings to receive reminders. Your note was not saved.");return}
    notificationId=await Notifications.scheduleNotificationAsync({content:{title:"Treksor reminder",body, data:{source:"quick-notes"}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:when}})}
   catch{Alert.alert("Reminder unavailable","Could not schedule the notification. Your note was not saved.");return}}
  const now=new Date().toISOString();update(old=>[{id:now+"-"+Math.random().toString(36).slice(2,8),body,done:false,kind,createdAt:now,updatedAt:now,...(when?{remindAt:when.toISOString(),notificationId}:{})},...old].slice(0,300));setDraft("");setRemind(false)
 };
 const visible=items.filter(n=>filter==="all"||n.kind==="note"||!n.done);
 return <View style={{flex:1,backgroundColor:colors.background}}>
 <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingTop:insets.top+10,paddingBottom:insets.bottom+45,paddingHorizontal:20,gap:15}}>
  <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={()=>router.back()} style={{width:44,height:44,justifyContent:"center"}}><Ionicons name="arrow-back" size={24} color={colors.text}/></Pressable>
  <Text style={{color:colors.gold,fontSize:11,letterSpacing:2,fontWeight:"700"}}>YOUR SPACE</Text><Text style={{color:colors.text,fontSize:31,fontWeight:"600"}}>Quick Notes</Text>
  <Text style={{color:colors.muted,fontSize:13,lineHeight:20}}>Get it out of your head. Keep your day clear.</Text>
  <View style={{borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,borderRadius:17,padding:15,gap:12}}>
   <View style={{flexDirection:"row",gap:8}}>{(["task","note"] as const).map(v=><Pressable key={v} onPress={()=>setKind(v)} style={{paddingHorizontal:15,paddingVertical:10,borderRadius:9,backgroundColor:kind===v?colors.gold:colors.surfaceRaised}}><Text style={{color:kind===v?colors.background:colors.text,fontWeight:"700",fontSize:12}}>{v==="task"?"To-do":"Note"}</Text></Pressable>)}</View>
   <TextInput accessibilityLabel="Write a quick note or task" value={draft} onChangeText={setDraft} multiline maxLength={500} placeholder={kind==="task"?"e.g. Send an email, call the mechanic…":"Write down an idea…"} placeholderTextColor={colors.muted} style={{color:colors.text,minHeight:68,borderColor:colors.border,borderWidth:1,borderRadius:11,padding:12,fontSize:15,textAlignVertical:"top"}}/>
   <Pressable accessibilityRole="switch" accessibilityState={{checked:remind}} accessibilityLabel="Add optional reminder" onPress={()=>setRemind(v=>!v)} style={{flexDirection:"row",alignItems:"center",gap:9,paddingVertical:5}}>
    <Ionicons name={remind?"notifications":"notifications-outline"} color={remind?colors.gold:colors.secondary} size={21}/><Text style={{color:colors.text,flex:1,fontSize:13}}>Remind me</Text><Ionicons name={remind?"checkbox":"square-outline"} size={22} color={remind?colors.gold:colors.muted}/>
   </Pressable>
   {remind&&<View style={{gap:9}}><Text style={{color:colors.secondary,fontSize:12}}>Choose a date and time (local to this phone)</Text>
    <View style={{flexDirection:"row",gap:9}}><TextInput accessibilityLabel="Reminder date YYYY-MM-DD" value={reminderDate} onChangeText={setReminderDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} autoCapitalize="none" style={{flex:1,color:colors.text,borderWidth:1,borderColor:colors.border,borderRadius:9,padding:11}}/><TextInput accessibilityLabel="Reminder time HH:mm" value={reminderTime} onChangeText={setReminderTime} placeholder="HH:mm" placeholderTextColor={colors.muted} style={{width:90,color:colors.text,borderWidth:1,borderColor:colors.border,borderRadius:9,padding:11}}/></View>
    <View style={{flexDirection:"row",gap:8}}>{[1,3].map(days=><Pressable key={days} onPress={()=>{const d=new Date();d.setDate(d.getDate()+days);d.setHours(9,0,0,0);setReminderDate(dateInput(d));setReminderTime(timeInput(d))}} style={{backgroundColor:colors.surfaceRaised,padding:10,borderRadius:9}}><Text style={{color:colors.secondary,fontSize:12}}>{days===1?"Tomorrow 9 AM":"In 3 days · 9 AM"}</Text></Pressable>)}</View>
   </View>}
   <Pressable accessibilityRole="button" disabled={!loaded||!draft.trim()} onPress={add} style={{alignItems:"center",backgroundColor:colors.gold,borderRadius:11,padding:14,opacity:!loaded||!draft.trim()?0.45:1}}><Text style={{color:colors.background,fontWeight:"800"}}>SAVE {kind==="task"?"TASK":"NOTE"}</Text></Pressable>
  </View>
  <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:10}}><Text style={{color:colors.text,fontSize:19,fontWeight:"600"}}>My list</Text><Pressable onPress={()=>setFilter(v=>v==="open"?"all":"open")}><Text style={{color:colors.gold,fontSize:12}}>{filter==="open"?"Show completed":"Show active"}</Text></Pressable></View>
  {!visible.length&&<Text style={{color:colors.muted,fontSize:13}}>Nothing here yet. One small note is a good start.</Text>}
  {visible.map(n=><View key={n.id} style={{flexDirection:"row",alignItems:"flex-start",gap:11,padding:14,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface}}>
   <Pressable accessibilityRole="checkbox" accessibilityState={{checked:n.done}} accessibilityLabel={n.kind==="task"?"Mark task complete":"Note"} disabled={n.kind!=="task"} onPress={()=>{if(!n.done)void cancelReminder(n);update(old=>old.map(x=>x.id===n.id?{...x,done:!x.done,notificationId:undefined,remindAt:!x.done?undefined:x.remindAt,updatedAt:new Date().toISOString()}:x))}} style={{paddingTop:2}}><Ionicons name={n.kind==="note"?"document-text-outline":n.done?"checkbox":"square-outline"} size={24} color={n.done?colors.gold:colors.secondary}/></Pressable>
   <View style={{flex:1}}><Text style={{color:n.done?colors.muted:colors.text,fontSize:14,lineHeight:21,textDecorationLine:n.done?"line-through":"none"}}>{n.body}</Text><Text style={{color:colors.muted,fontSize:10,marginTop:6}}>{n.kind==="task"?"TO-DO":"NOTE"}{n.remindAt?" · REMINDER "+new Date(n.remindAt).toLocaleString():""}</Text></View>
   <Pressable accessibilityRole="button" accessibilityLabel="Delete item" onPress={()=>Alert.alert("Delete this item?","This cannot be undone.",[{text:"Cancel",style:"cancel"},{text:"Delete",style:"destructive",onPress:()=>{void cancelReminder(n);update(old=>old.filter(x=>x.id!==n.id))}}])} style={{padding:5}}><Ionicons name="trash-outline" color={colors.muted} size={18}/></Pressable>
  </View>)}
  {!!error&&<Text accessibilityRole="alert" style={{color:colors.danger}}>{error}</Text>}
  <Text style={{color:colors.muted,fontSize:11,marginTop:8}}>Saved privately on this device. Reminders use local phone notifications when enabled. Cross-device sync is not enabled yet.</Text>
 </ScrollView></View>
}
