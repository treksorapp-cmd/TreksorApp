import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BodyPageHeading from '@/components/BodyPageHeading';
import BrandIcon from '@/components/ui/BrandIcon';
import { useWalks } from '@/hooks/useWalks';
import { useAuthStore } from '@/store/auth-store';
import { dayKey, displayDay } from '@/lib/progress-metrics';
import { saveWalk, removeWalk, walkTotals, type Walk } from '@/lib/walks';
import { colors, surface, type } from '@/theme/architect';
export default function WalksScreen(){
  const {owner,rows,loading,error,now,reload}=useWalks();
  const [minutes,setMinutes]=useState(''),[saving,setSaving]=useState(false),[message,setMessage]=useState<{owner:string;text:string}|null>(null);
  const busy=useRef(false),pending=useRef<{owner:string;walk:Walk}|null>(null);
  useEffect(()=>{setMinutes('');setMessage(null);pending.current=null},[owner]);
  const totals=walkTotals(rows,now);
  const current=()=>!!owner&&useAuthStore.getState().isAuthenticated&&useAuthStore.getState().user?.id===owner;
  async function record(){
    if(busy.current||loading||error||!current())return;
    const duration=minutes.trim()?Number(minutes.trim()):null;
    if(duration!==null&&(!/^\d+$/.test(minutes.trim())||!Number.isInteger(duration)||duration<1||duration>1440)){setMessage({owner,text:'Enter whole minutes between 1 and 1440, or leave it blank.'});return;}
    busy.current=true;setSaving(true);setMessage(null);
    // Retain the same ID on a failed save/retry; two taps cannot record one walk twice.
    if(!pending.current||pending.current.owner!==owner||pending.current.walk.minutes!==duration||pending.current.walk.date!==dayKey())pending.current={owner,walk:{id:`walk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,date:dayKey(),minutes:duration,createdAt:new Date().toISOString()}};
    try{await saveWalk(owner,pending.current.walk,current);if(current()){pending.current=null;setMinutes('');setMessage({owner,text:'Walk recorded. It is now included in your progress.'});await reload()}}
    catch(e){if(current())setMessage({owner,text:e instanceof Error?e.message:'Could not save. Please try again.'})}
    finally{busy.current=false;setSaving(false)}
  }
  async function remove(id:string){if(busy.current||!current())return;busy.current=true;setSaving(true);try{await removeWalk(owner,id,current);if(current())await reload()}catch(e){if(current())setMessage({owner,text:e instanceof Error?e.message:'Could not remove walk.'})}finally{busy.current=false;setSaving(false)}}
  return <SafeAreaView edges={['top']} style={s.screen}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <BodyPageHeading title="Daily walks" trail="BODY / WALKS" subtitle="A little movement. A day well spent." style={{paddingHorizontal:0}}/>
    <View style={s.card}><Text style={type.eyebrow}>YOUR RECORDED MOVEMENT</Text><Text style={s.total}>{loading?'—':totals.today}<Text style={type.body}> walks today</Text></Text><Text style={type.body}>{totals.week} walks · {totals.activeDays} active days · last 7 days</Text><Text style={type.caption}>{totals.minutes} minutes with a recorded duration. No steps are estimated.</Text></View>
    {!!error&&<View style={s.card}><Text accessibilityRole="alert" style={s.error}>{error}</Text><TouchableOpacity accessibilityRole="button" onPress={()=>void reload()} style={s.button}><Text style={s.buttonText}>Try again</Text></TouchableOpacity></View>}
    <View style={s.card}><Text style={type.card}>Finished a walk?</Text><Text style={type.body}>Record one completed walk for today. Add the time if you know it.</Text><Text style={type.caption}>Duration in minutes · optional</Text><TextInput value={minutes} onChangeText={setMinutes} accessibilityLabel="Walk duration in minutes, optional" keyboardType="number-pad" maxLength={4} placeholder="For example, 20" placeholderTextColor={colors.muted} editable={!saving} style={s.input}/><TouchableOpacity accessibilityRole="button" accessibilityState={{disabled:saving||loading||!!error||!owner,busy:saving}} disabled={saving||loading||!!error||!owner} onPress={()=>void record()} style={[s.button,{opacity:saving||loading||!!error||!owner?0.5:1}]}>{saving?<ActivityIndicator color={colors.background}/>:<BrandIcon name="walk-outline" size={22} color={colors.background}/>}<Text style={s.buttonText}>{saving?'Saving…':'Record one walk'}</Text></TouchableOpacity>{message?.owner===owner&&<Text accessibilityLiveRegion="polite" style={type.body}>{message.text}</Text>}</View>
    <Text style={type.section}>Your walks</Text>{loading?<ActivityIndicator color={colors.gold}/>:!error&&!rows.length?<Text style={type.body}>Your first recorded walk will appear here.</Text>:rows.slice(0,30).map(walk=><View key={walk.id} style={s.entry}><View style={{flex:1,gap:4}}><Text style={type.card}>{displayDay(walk.date)}</Text><Text style={type.caption}>{walk.minutes===null?'Duration not recorded':`${walk.minutes} minutes`} · recorded manually</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove walk from ${displayDay(walk.date)}`} disabled={saving} style={s.remove} onPress={()=>Alert.alert('Remove this walk?','This also removes it from your active-day record.',[{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:()=>void remove(walk.id)}])}><BrandIcon name="trash-outline" size={21} color={colors.muted}/></TouchableOpacity></View>)}
    <Text style={type.caption}>Private to your account on this phone. Walks are not yet synced to the website or imported from Apple Health, Garmin or a step sensor. {rows.length>30?'Showing your 30 most recent walks.':''}</Text>
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:colors.background},content:{padding:20,paddingBottom:40,gap:18},card:{...surface.card,gap:12},total:{...type.page,fontVariant:['tabular-nums']},input:{backgroundColor:colors.background,borderWidth:1,borderColor:colors.border,borderRadius:13,padding:14,minHeight:48,color:colors.text,fontSize:16},button:{backgroundColor:colors.gold,borderRadius:13,minHeight:48,padding:14,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10},buttonText:{color:colors.background,fontWeight:'600',fontSize:15},error:{...type.body,color:colors.danger},entry:{...surface.card,padding:16,flexDirection:'row',alignItems:'center',gap:12},remove:{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}});
