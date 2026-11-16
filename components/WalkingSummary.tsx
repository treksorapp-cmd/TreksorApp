import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import BrandIcon from '@/components/ui/BrandIcon';
import { walkTotals, type Walk } from '@/lib/walks';
import { colors, surface, type } from '@/theme/architect';
export default function WalkingSummary({rows,now,loading,error}:{rows:Walk[];now:Date;loading:boolean;error:string}){
  const totals=walkTotals(rows,now);
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open daily walks" onPress={()=>router.push('/body/walks' as any)} style={s.card}>
    <View style={s.row}><BrandIcon name="walk-outline" size={25} color={colors.gold}/><Text style={type.card}>Daily walks</Text><BrandIcon name="chevron-forward" size={20} color={colors.gold}/></View>
    <Text style={type.body}>{loading?'Loading your walks…':error?'Walks unavailable · open to retry':`${totals.today} today · ${totals.week} in the last 7 days`}</Text>
    <Text style={type.caption}>Manually recorded on this phone. Each walk counts towards your active days.</Text>
  </TouchableOpacity>;
}
const s=StyleSheet.create({card:{...surface.card,gap:10,marginVertical:16},row:{flexDirection:'row',alignItems:'center',gap:12}});
