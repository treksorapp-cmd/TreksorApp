import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import Icon from '@/components/ui/BrandIcon';
import { colors, surface, type } from '@/theme/architect';
import { useAuthStore } from '@/store/auth-store';
import { useWalks } from '@/hooks/useWalks';
import { useDailyActivities } from '@/hooks/useDailyActivities';
import { DAILY_ACTIVITY_OPTIONS, saveDailyActivity, removeDailyActivity, type DailyActivityKind } from '@/lib/daily-activities';
import { saveWalk, removeWalk } from '@/lib/walks';
import { dayKey } from '@/lib/progress-metrics';

export default function DailyWork({embedded=false}:{embedded?:boolean} = {}) {
  const owner=useAuthStore(s=>s.isAuthenticated?s.user?.id||'':'');
  const activities=useDailyActivities(),walks=useWalks();
  const [kind,setKind]=useState<DailyActivityKind|'walk'>('walk');
  const [customName,setCustomName]=useState('');
  const [minutes,setMinutes]=useState('');
  const [saving,setSaving]=useState(false);
  const [notice,setNotice]=useState('');
  const today=dayKey();
  const presets=DAILY_ACTIVITY_OPTIONS;
  const current=useMemo(()=>{
    const ownActivities=activities.owner===owner?activities.entries:[];
    const ownWalks=walks.owner===owner?walks.rows:[];
    return [
      ...ownActivities.filter(row=>row.date===today).map(row=>({id:row.id,title:row.title,minutes:row.minutes,source:'activity' as const,stamp:row.createdAt})),
      ...ownWalks.filter(row=>row.date===today).map(row=>({id:row.id,title:'Walk',minutes:row.minutes,source:'walk' as const,stamp:row.createdAt})),
    ].sort((a,b)=>b.stamp.localeCompare(a.stamp));
  },[activities.entries,activities.owner,walks.rows,walks.owner,owner,today]);
  const ready=!!owner&&!activities.loading&&!walks.loading&&!activities.error&&!walks.error;
  async function log(){
    if(!ready||saving)return;
    const title=kind==='custom'?customName.trim().replace(/\s+/g,' '):presets.find(item=>item.id===kind)?.label||'';
    if(!title||title.length>55){Alert.alert('Name your activity','Use a name up to 55 characters.');return;}
    const trimmed=minutes.trim();
    if(trimmed && (!/^\d+$/.test(trimmed)||Number(trimmed)<1||Number(trimmed)>1440)){
      Alert.alert('Check the duration','Enter 1–1440 minutes or leave it blank.');return;
    }
    const duration=trimmed?Number(trimmed):null,stamp=new Date().toISOString();
    const isCurrent=()=>useAuthStore.getState().isAuthenticated&&useAuthStore.getState().user?.id===owner;
    const id='daily-'+Date.now()+'-'+Math.random().toString(36).slice(2,9);
    setSaving(true);setNotice('');
    try{
      if(kind==='walk') await saveWalk(owner,{id,date:today,minutes:duration,createdAt:stamp},isCurrent);
      else await saveDailyActivity(owner,{id,date:today,kind,title,minutes:duration,createdAt:stamp},isCurrent);
      if(isCurrent()){setNotice(title+' recorded in Progress.');setMinutes('');}
    }catch(error){if(isCurrent())Alert.alert('Could not save activity',error instanceof Error?error.message:'Try again.');}
    finally{setSaving(false)}
  }
  function confirmRemove(row:{id:string;title:string;source:'walk'|'activity'}){
    Alert.alert('Remove activity?',row.title+' will no longer count toward Progress.',[
      {text:'Cancel',style:'cancel'},
      {text:'Remove',style:'destructive',onPress:()=>void (async()=>{
        const isCurrent=()=>useAuthStore.getState().isAuthenticated&&useAuthStore.getState().user?.id===owner;
        try {
          if(row.source==='walk')await removeWalk(owner,row.id,isCurrent);
          else await removeDailyActivity(owner,row.id,isCurrent);
          if(isCurrent())setNotice('Activity removed from Progress.');
        }catch{if(isCurrent())Alert.alert('Unable to remove activity','Please try again.')}
      })()},
    ]);
  }
  return <View style={{marginTop:embedded?8:25,gap:12}}>
    {!embedded ? <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
      <View style={{flex:1}}>
        <Text style={type.eyebrow}>DAILY WORK</Text>
        <Text style={[type.section,{marginTop:5}]}>Keep moving.</Text>
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open Progress" onPress={()=>router.push('/(tabs)/tracking' as any)} style={{padding:10,flexDirection:'row',alignItems:'center',gap:5}}>
        <Text style={{color:colors.gold,fontSize:12,fontWeight:'600'}}>PROGRESS</Text><Icon name="arrow-forward" size={16} color={colors.gold}/>
      </TouchableOpacity>
    </View> : <Text style={type.card}>What did you do?</Text>}
    {!embedded&&<Text style={type.caption}>Log what you actually completed. Walks, the outdoors, sports, or something entirely yours.</Text>}
    <View style={[surface.card,{padding:15,gap:13}]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingVertical:3}}>
        {presets.map(item=><TouchableOpacity key={item.id} accessibilityRole="radio" accessibilityState={{checked:kind===item.id}} onPress={()=>{setKind(item.id);setNotice('')}} style={{minHeight:64,minWidth:92,paddingVertical:10,paddingHorizontal:12,alignItems:'center',justifyContent:'center',gap:5,borderRadius:12,borderColor:kind===item.id?colors.gold:colors.border,borderWidth:1,backgroundColor:kind===item.id?colors.goldSoft:colors.surfaceRaised}}>
          <Icon name={item.icon as React.ComponentProps<typeof Icon>['name']} color={colors.gold} size={20}/>
          <Text style={{fontSize:11,fontWeight:'600',color:colors.text}}>{item.label}</Text>
        </TouchableOpacity>)}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Add your own activity" onPress={()=>{setKind('custom');setNotice('')}} style={{minHeight:64,minWidth:92,paddingHorizontal:12,alignItems:'center',justifyContent:'center',gap:5,borderRadius:12,borderWidth:1,borderColor:kind==='custom'?colors.gold:colors.border,backgroundColor:kind==='custom'?colors.goldSoft:colors.surfaceRaised}}>
          <Icon name="add-circle-outline" size={20} color={colors.gold}/><Text style={{fontSize:11,fontWeight:'600',color:colors.text}}>Add your own</Text>
        </TouchableOpacity>
      </ScrollView>
      {kind==='custom'&&<>
        <TextInput accessibilityLabel="Name your activity" value={customName} onChangeText={setCustomName} maxLength={55} placeholder="e.g. Basketball, climbing, gardening" placeholderTextColor={colors.muted} style={{color:colors.text,backgroundColor:colors.background,borderColor:colors.border,borderWidth:1,borderRadius:12,paddingHorizontal:13,paddingVertical:12,fontSize:13}}/>
        {!!activities.customTitles.length&&<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7}}>
          {activities.customTitles.map(label=><TouchableOpacity key={label} accessibilityRole="button" accessibilityLabel={'Use '+label} onPress={()=>setCustomName(label)} style={{paddingVertical:9,paddingHorizontal:12,borderRadius:20,borderWidth:1,borderColor:colors.border}}>
            <Text style={{fontSize:12,color:colors.secondary}}>{label}</Text>
          </TouchableOpacity>)}
        </ScrollView>}
      </>}
      <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
        <View style={{flex:1}}>
          <Text style={[type.eyebrow,{marginBottom:6}]}>DURATION · OPTIONAL</Text>
          <TextInput accessibilityLabel="Activity duration in minutes" keyboardType="number-pad" value={minutes} onChangeText={setMinutes} maxLength={4} placeholder="Minutes" placeholderTextColor={colors.muted} style={{height:44,color:colors.text,backgroundColor:colors.background,borderColor:colors.border,borderWidth:1,borderRadius:11,paddingHorizontal:12}}/>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Log completed activity" accessibilityState={{disabled:!ready||saving}} disabled={!ready||saving} onPress={()=>void log()} style={{flex:1,backgroundColor:colors.gold,borderRadius:12,minHeight:44,paddingHorizontal:10,alignItems:'center',justifyContent:'center',alignSelf:'flex-end',opacity:ready&&!saving?1:0.45}}>
          <Text style={{fontSize:12,fontWeight:'800',color:colors.background}}>{saving?'SAVING…':'LOG COMPLETED'}</Text>
        </TouchableOpacity>
      </View>
      {!!(activities.error||walks.error)&&<TouchableOpacity onPress={()=>{void activities.reload();void walks.reload()}} accessibilityRole="button"><Text style={{color:colors.danger,fontSize:12}}>{activities.error||walks.error} · Tap to retry</Text></TouchableOpacity>}
      {!!notice&&<Text accessibilityLiveRegion="polite" style={{color:colors.gold,fontSize:12}}>{notice}</Text>}
      <View style={{borderTopWidth:1,borderTopColor:colors.border,paddingTop:11,gap:8}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
          <Text style={{color:colors.text,fontSize:14,fontWeight:'600'}}>Completed today</Text>
          <Text style={{color:colors.gold,fontWeight:'700'}}>{current.length}</Text>
        </View>
        {!current.length&&<Text style={type.caption}>Nothing recorded yet. Your day is yours to shape.</Text>}
        {current.slice(0,5).map(row=><View key={row.source+':'+row.id} style={{flexDirection:'row',gap:9,alignItems:'center',minHeight:32}}>
          <Icon name="checkmark-circle-outline" size={17} color={colors.gold}/>
          <Text style={{flex:1,color:colors.secondary,fontSize:13}}>{row.title}{row.minutes!==null?' · '+row.minutes+' min':''}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={'Remove '+row.title} onPress={()=>confirmRemove(row)} style={{padding:8}}><Icon name="close" size={16} color={colors.muted}/></TouchableOpacity>
        </View>)}
        {current.length>5&&<Text style={type.caption}>{current.length-5} more saved in Progress</Text>}
      </View>
    </View>
    {!embedded && <Text style={[type.caption,{fontSize:11}]}>Manual entries stay on this iPhone. Walks share the existing Body record; each saved day counts once in Progress.</Text>}
  </View>;
}
