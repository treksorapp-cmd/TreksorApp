import Ionicons from '@/components/ui/BrandIcon';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { openTreksorWeb } from '@/lib/treksor-links';
import { colors, surface, type } from '@/theme/architect';

export default function CommunityMentors() {
  return <View style={s.card}>
    <View style={s.heading}>
      <View style={surface.icon}><Ionicons name="people-outline" size={24} color={colors.gold}/></View>
      <View style={s.copy}><Text style={type.eyebrow}>PEOPLE HELPING PEOPLE</Text><Text style={type.section}>Mentor</Text></View>
    </View>
    <Text style={type.card}>Something you know can open a door for someone else.</Text>
    <Text style={type.body}>Find someone to learn from, or apply to share your experience. From photography to financial literacy, start with what you want to learn or teach.</Text>
    <TouchableOpacity accessibilityRole="link" accessibilityLabel="Find a mentor or apply, opens Treksor web" onPress={() => void openTreksorWeb('community/mentors')} style={s.button}>
      <Text style={s.buttonText}>Explore mentors & apply</Text><Ionicons name="open-outline" size={18} color={colors.background}/>
    </TouchableOpacity>
    <Text style={type.caption}>Continue on Treksor web with your Treksor account. Mentor applications are reviewed before appearing in the directory.</Text>
  </View>;
}
const s = StyleSheet.create({
  card: {...surface.card, gap:16, marginBottom:24},
  heading: {flexDirection:'row', alignItems:'center', gap:12},
  copy: {flex:1, gap:4},
  button: {backgroundColor:colors.gold, borderRadius:13, minHeight:48, padding:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:12},
  buttonText: {color:colors.background, fontSize:15, fontWeight:'600', flexShrink:1},
});
