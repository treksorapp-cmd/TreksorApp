import { Text, TouchableOpacity, View, Linking } from 'react-native';
import { useProgressSyncStore } from '@/store/progress-sync-store';
export default function ProgressSyncStatus(){
  const sync=useProgressSyncStore();
  return <View style={{borderWidth:1,borderColor:'#29333D',borderRadius:12,padding:16,marginBottom:20,gap:8}}>
    <Text style={{color:'#D7B877',fontSize:15,fontWeight:'600'}}>App & web, one journey</Text>
    <Text style={{color:'#AAB4BE',fontSize:12}}>{sync.message}{sync.lastSynced?' Last synced '+new Date(sync.lastSynced).toLocaleString()+'.':''}</Text>
    <View style={{flexDirection:'row',gap:24}}><TouchableOpacity disabled={sync.status==='syncing'} onPress={sync.requestSync}><Text style={{color:'#F5F4F1',fontSize:12}}>{sync.status==='syncing'?'Syncing…':'Sync now ↻'}</Text></TouchableOpacity><TouchableOpacity onPress={()=>Linking.openURL('https://treksor-community.oceanicman.chatgpt.site/#/progress')}><Text style={{color:'#D7B877',fontSize:12}}>Open web profile ↗</Text></TouchableOpacity></View>
  </View>
}
