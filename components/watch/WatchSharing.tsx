import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@/components/ui/BrandIcon';
import { useAuthStore } from '@/store/auth-store';
import { changeSharing, readGrant, changeWorkoutSharing, readWorkoutGrant, watchBridge } from '@/lib/watch/connection';
import { colors,surface,type } from '@/theme/architect';
export default function WatchSharing() {
  const owner=useAuthStore(s=>s.user?.id);
  const [loaded,setLoaded]=useState<{owner:string;enabled:boolean}|null>(null),[busy,setBusy]=useState(false);
  const [gym,setGym]=useState<{owner:string;enabled:boolean}|null>(null),[gymBusy,setGymBusy]=useState(false);
  const [retry,setRetry]=useState(0),[failed,setFailed]=useState(false);
  useEffect(()=>{
    let active=true;setFailed(false);setLoaded(null);setGym(null);
    if(watchBridge&&owner) Promise.all([readGrant(owner),readWorkoutGrant(owner)])
      .then(([progress,workout])=>{if(active){setLoaded({owner,enabled:!!progress});setGym({owner,enabled:!!workout})}})
      .catch(()=>{if(active)setFailed(true)});
    return ()=>{active=false};
  },[owner,retry]);
  if(!watchBridge || !owner) return null;
  const enabled=loaded?.owner===owner && loaded.enabled;
  async function toggle(){if(!owner || busy)return;setBusy(true);try{await changeSharing(owner,!enabled);setLoaded({owner,enabled:!enabled});}catch{Alert.alert('Could not update sharing','Open your account and try again.')}finally{setBusy(false)}}
  const gymEnabled=gym?.owner===owner && gym.enabled;
  async function toggleGym(){
    if(!owner||gymBusy)return;
    setGymBusy(true);
    try{await changeWorkoutSharing(owner,!gymEnabled);setGym({owner,enabled:!gymEnabled})}
    catch{Alert.alert('Could not update watch workouts','Open your signed-in account and try again.')}
    finally{setGymBusy(false)}
  }
  return <View style={{...surface.card,gap:12}}><Ionicons name="watch-outline" size={26} color={colors.gold}/><Text style={type.card}>Progress on Apple Watch</Text><Text style={type.body}>Show seven-day totals for gym sessions, saved sets and timed practices on your paired watch.</Text><Text style={type.caption}>Install Treksor from the Watch app on your iPhone, then open both apps. Turn sharing off here at any time.</Text><TouchableOpacity accessibilityRole="button" disabled={busy || (!failed && loaded?.owner!==owner)} onPress={failed?()=>setRetry(n=>n+1):toggle} style={{padding:12,minHeight:44,justifyContent:'center',backgroundColor:colors.goldSoft,borderRadius:12}}><Text style={{...type.body,color:colors.gold}}>{failed?'Retry connection settings':enabled?'Turn off watch progress':'Enable watch progress'}</Text></TouchableOpacity>
  <View style={{height:1,backgroundColor:colors.border,marginVertical:2}}/>
  <Text style={type.card}>Gym on Apple Watch</Text>
  <Text style={type.body}>See your active exercise, play its demonstration and record kg and reps from the watch. Your iPhone saves the sets.</Text>
  <Text style={type.caption}>Optional and separate from progress sharing. Start the session on iPhone and keep both apps connected. Video requires internet; stopwatch works locally.</Text>
  <TouchableOpacity accessibilityRole="button" accessibilityLabel={gymEnabled?'Disable watch workouts':'Enable watch workouts'}
    disabled={gymBusy||failed||gym?.owner!==owner} onPress={toggleGym}
    style={{padding:12,minHeight:44,justifyContent:'center',backgroundColor:colors.goldSoft,borderRadius:12}}>
    <Text style={{...type.body,color:colors.gold}}>{gymBusy?'Saving…':gymEnabled?'Turn off watch workouts':'Enable watch workouts'}</Text>
  </TouchableOpacity>
  </View>;
}
