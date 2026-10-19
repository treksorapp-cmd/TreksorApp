import { useAuthStore } from "@/store/auth-store"
import { getEntries, localDate, moodAverage, saveEntry, type JournalEntry, type Mood } from "@/lib/mood-journal"
import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"

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
 const stats=moodAverage(entries,period)
 return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
  <Text style={styles.eyebrow}>TREKSOR · MIND</Text><Text style={styles.heading}>Personal Journal</Text>
  <Text style={styles.subtitle}>A private space to reflect on how you feel.</Text>
  <View style={styles.card}>
   <Text style={styles.section}>How are you feeling?</Text><Text style={styles.date}>{selectedDate}</Text>
   <View style={styles.moods}>{labels.map((label,i)=><TouchableOpacity accessibilityRole="button" accessibilityState={{selected:mood===i+1}} key={label} onPress={()=>setMood((i+1) as Mood)} style={[styles.mood,mood===i+1&&styles.active]}><Text style={[styles.moodText,mood===i+1&&styles.activeText]}>{label}</Text></TouchableOpacity>)}</View>
   <Text style={styles.section}>Why do you feel this way?</Text>
   <TextInput accessibilityLabel="Private journal entry" multiline maxLength={1200} placeholder="Write what's on your mind..." placeholderTextColor="#777" value={note} onChangeText={setNote} style={styles.input} textAlignVertical="top"/>
   <Text style={styles.privacy}>Private on this device · Not yet synced to your web account</Text>
   <TouchableOpacity disabled={busy||!userId} style={styles.button} onPress={()=>void save()}><Text style={styles.buttonText}>{busy?"Saving...":"Save entry"}</Text></TouchableOpacity>
  </View>
  <View style={styles.card}><Text style={styles.section}>Emotional Wellbeing</Text><View style={styles.moods}>{(["week","month","year"] as const).map(p=><TouchableOpacity key={p} onPress={()=>setPeriod(p)} style={[styles.period,period===p&&styles.active]}><Text style={[styles.moodText,period===p&&styles.activeText]}>{p==="week"?"7 days":p==="month"?"30 days":"365 days"}</Text></TouchableOpacity>)}</View>
  <Text style={styles.average}>{stats.average===null?"—":stats.average.toFixed(1)} <Text style={styles.outOf}>/ 5</Text></Text><Text style={styles.subtitle}>{stats.days} recorded {stats.days===1?"day":"days"} · Missing days are not scored</Text></View>
  <Text style={styles.section}>Past entries</Text>
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
