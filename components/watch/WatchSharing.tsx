import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth-store';
import { changeSharing, readGrant, watchBridge } from '@/lib/watch/connection';
import { colors,surface,type } from '@/theme/architect';
export default function WatchSharing() {
  const owner=useAuthStore(s=>s.user?.id);
  const [loaded,setLoaded]=useState<{owner:string;enabled:boolean}|null>(null),[busy,setBusy]=useState(false);
  const [retry,setRetry]=useState(0),[failed,setFailed]=useState(false);
  useEffect(()=>{let active=true;setFailed(false);if(watchBridge && owner) readGrant(owner).then(value=>{if(active)setLoaded({owner,enabled:!!value})}).catch(()=>{if(active)setFailed(true)});return ()=>{active=false};},[owner,retry]);
  if(!watchBridge || !owner) return null;
  const enabled=loaded?.owner===owner && loaded.enabled;
  async function toggle(){if(!owner || busy)return;setBusy(true);try{await changeSharing(owner,!enabled);setLoaded({owner,enabled:!enabled});}catch{Alert.alert('Could not update sharing','Open your account and try again.')}finally{setBusy(false)}}
  return <View style={{...surface.card,gap:12}}><Ionicons name="watch-outline" size={26} color={colors.gold}/><Text style={type.card}>Treksor on Apple Watch</Text><Text style={type.body}>Share routines, personal tracker names and progress with your paired watch. The watch can record sets, practices and check-ins. You can also load saved sleep totals and manage the paired iPhone’s wake-up time and sound.</Text><Text style={type.caption}>Install Treksor from the Watch app on your iPhone, then open both apps. Turn sharing off here at any time.</Text><TouchableOpacity accessibilityRole="button" disabled={busy || (!failed && loaded?.owner!==owner)} onPress={failed?()=>setRetry(n=>n+1):toggle} style={{padding:12,minHeight:44,justifyContent:'center',backgroundColor:colors.goldSoft,borderRadius:12}}><Text style={{...type.body,color:colors.gold}}>{failed?'Retry connection settings':enabled?'Turn off watch sharing':'Enable watch sharing'}</Text></TouchableOpacity></View>;
}
