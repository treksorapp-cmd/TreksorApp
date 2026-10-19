import { useAuthStore } from "@/store/auth-store"
import { deleteEntry, getEntries, localDate, moodAverage, saveEntry, type JournalEntry, type Mood } from "@/lib/mood-journal"
import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { Alert, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"

const labels=["Very low","Low","Okay","Good","Great"]
export default function MindJournalScreen(){
 const userId=useAuthStore(s=>s.user?.id)
 const [mood,setMood]=useState<Mood>(3)
 const [note,setNote]=useState("")
 const [entries,setEntries]=useState<JournalEntry[]>([])
 const [busy,setBusy]=useState(false)
 const [period,setPeriod]=useState<"week"|"month"|"year">("week")
 const [selectedDate,setSelectedDate]=useState(localDate())
 const load=useCallback(async()=>{if(!userId)return;try{const all=await getEntries(userId);setEntries(all);const entry=all.find(e=>e.date===selectedDate);setMood(entry?.mood||3);setNote(entry?.note||"")}catch{Alert.alert("Journal unavailable","Unable to read your saved entries.")}},[userId,selectedDate])
 useFocusEffect(useCallback(()=>{void load()},[load]))
 async function save(){if(!userId)return;setBusy(true);try{await saveEntry(userId,mood,note,selectedDate);await load();Alert.alert("Saved","Your private entry was saved on this device.")}catch{Alert.alert("Unable to save","Please try again.")}finally{setBusy(false)}}
 async function remove(){if(!userId)return;Alert.alert("Delete entry?","This cannot be undone.",[{text:"Cancel",style:"cancel"},{text:"Delete",style:"destructive",onPress:async()=>{try{await deleteEntry(userId,selectedDate);await load();setNote("");setMood(3);Alert.alert("Deleted","Entry removed from this device.")}catch{Alert.alert("Unable to delete","Please try again.")}}}])}
 async function exportJournal(){
  try {
   if(entries.length===0){Alert.alert("Nothing to export","Add a journal entry first.");return}
   const content=entries.map(e=>e.date+" | "+labels[e.mood-1]+" ("+e.mood+"/5)"+(e.note?"\n"+e.note:"")).join("\n\n")
   await Share.share({message:"TREKSOR · MY PRIVATE JOURNAL\n\n"+content})
  }catch{Alert.alert("Export unavailable","Please try again.")}
 }
 const stats=moodAverage(entries,period)
 const days=period==="week"?7:period==="month"?30:365
 const chart=Array.from({length:days},(_,i)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-(days-i-1));const date=localDate(d);return {date,mood:entries.find(e=>e.date===date)?.mood||0}})
 const grouped=period==="year"?Array.from({length:53},(_,i)=>chart.slice(i*7,i*7+7)).filter(group=>group.length>0).map(group=>({date:group[0].date,mood:group.filter(e=>e.mood>0).reduce((sum,e)=>sum+e.mood,0)/Math.max(1,group.filter(e=>e.mood>0).length)})):chart
 return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
  <Text style={styles.eyebrow}>TREKSOR · MIND</Text><Text style={styles.heading}>Personal Journal</Text>
  <Text style={styles.subtitle}>A private space to reflect on how you feel.</Text>
  <View style={styles.card}>
   <Text style={styles.section}>How are you feeling?</Text><Text style={styles.date}>{selectedDate}</Text>
   <View style={styles.moods}>{labels.map((label,i)=><TouchableOpacity accessibilityRole="button" accessibilityState={{selected:mood===i+1}} key={label} onPress={()=>setMood((i+1) as Mood)} style={[styles.mood,mood===i+1&&styles.active]}><Text style={[styles.moodText,mood===i+1&&styles.activeText]}>{label}</Text></TouchableOpacity>)}</View>
   <Text style={styles.section}>Why do you feel this way?</Text>
   <TextInput accessibilityLabel="Private journal entry" multiline maxLength={450} placeholder="Write what's on your mind..." placeholderTextColor="#777" value={note} onChangeText={setNote} style={styles.input} textAlignVertical="top"/>
   <Text style={styles.privacy}>Private on this device · Not yet synced to your web account</Text>
   <TouchableOpacity disabled={busy||!userId} style={styles.button} onPress={()=>void save()}><Text style={styles.buttonText}>{busy?"Saving...":"Save entry"}</Text></TouchableOpacity>
   {entries.some(e=>e.date===selectedDate)&&<TouchableOpacity onPress={()=>void remove()} style={{padding:14,alignItems:"center"}}><Text style={{color:"#C99A9A"}}>Delete this entry</Text></TouchableOpacity>}
  </View>
  <View style={styles.card}><Text style={styles.section}>Emotional Wellbeing</Text><View style={styles.moods}>{(["week","month","year"] as const).map(p=><TouchableOpacity key={p} onPress={()=>setPeriod(p)} style={[styles.period,period===p&&styles.active]}><Text style={[styles.moodText,period===p&&styles.activeText]}>{p==="week"?"7 days":p==="month"?"30 days":"365 days"}</Text></TouchableOpacity>)}</View>
  <View accessible accessibilityLabel="Mood history chart" style={{flexDirection:"row",height:85,alignItems:"flex-end",gap:2,marginTop:16}}>{grouped.map((item,i)=><View key={item.date+"-"+i} style={{flex:1,height:item.mood>0?Math.max(5,item.mood/5*80):3,backgroundColor:item.mood>0?"#D6AE67":"#454545",borderRadius:2}} />)}</View>
  <Text style={styles.average}>{stats.average===null?"—":stats.average.toFixed(1)} <Text style={styles.outOf}>/ 5</Text></Text><Text style={styles.subtitle}>{stats.days} recorded {stats.days===1?"day":"days"} · Missing days are not scored</Text></View>
  <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginVertical:18}}><Text style={styles.section}>Past entries</Text><TouchableOpacity accessibilityRole="button" onPress={()=>void exportJournal()}><Text style={{color:"#D6AE67",fontWeight:"700"}}>Export my journal ↗</Text></TouchableOpacity></View>
  {entries.length===0?<Text style={styles.subtitle}>Your entries will appear here.</Text>:entries.map(entry=><TouchableOpacity key={entry.date} style={styles.history} onPress={()=>setSelectedDate(entry.date)}><View><Text style={styles.date}>{entry.date} · {labels[entry.mood-1]}</Text><Text numberOfLines={2} style={styles.subtitle}>{entry.note||"No written reflection"}</Text></View><Text style={styles.arrow}>›</Text></TouchableOpacity>)}
  {selectedDate!==localDate()&&<TouchableOpacity onPress={()=>setSelectedDate(localDate())}><Text style={styles.return}>Return to today →</Text></TouchableOpacity>}
 </ScrollView>
}
const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:"#080b0f"},content:{padding:22,paddingTop:65,paddingBottom:80},
 eyebrow:{color:"#D6AE67",fontSize:11,letterSpacing:3,fontWeight:"700"},heading:{fontSize:34,color:"#fff",fontWeight:"700",marginTop:10},subtitle:{color:"#A1A1AA",fontSize:13,lineHeight:20,marginTop:7},
 card:{backgroundColor:"#1A1D22",borderRadius:18,borderWidth:1,borderColor:"#38302A",padding:18,marginTop:22},
 section:{color:"#fff",fontSize:18,fontWeight:"700",marginBottom:10},date:{color:"#D6AE67",fontSize:13,marginBottom:12},
 moods:{flexDirection:"row",flexWrap:"wrap",gap:7,marginVertical:12},mood:{paddingHorizontal:10,paddingVertical:10,borderRadius:10,backgroundColor:"#292D33",borderWidth:1,borderColor:"#414141"},
 active:{backgroundColor:"#D6AE67",borderColor:"#D6AE67"},moodText:{color:"#E5E5E5",fontSize:12},activeText:{color:"#101010",fontWeight:"700"},
 input:{minHeight:130,backgroundColor:"#0D1015",borderRadius:12,color:"#fff",padding:14,fontSize:15},
 privacy:{color:"#929292",fontSize:11,marginTop:12},button:{backgroundColor:"#D6AE67",padding:15,borderRadius:12,alignItems:"center",marginTop:18},buttonText:{color:"#101010",fontWeight:"800"},
 period:{paddingHorizontal:12,paddingVertical:10,borderRadius:10,backgroundColor:"#292D33"},average:{fontSize:40,color:"#D6AE67",fontWeight:"700",marginTop:8},outOf:{fontSize:18,color:"#aaa"},
 history:{backgroundColor:"#1A1D22",padding:16,borderRadius:12,marginBottom:9,flexDirection:"row",justifyContent:"space-between"},arrow:{color:"#D6AE67",fontSize:24},return:{color:"#D6AE67",marginTop:20}
})
