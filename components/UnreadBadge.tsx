import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/architect";
export default function UnreadBadge({count = 1, label = "unread", dot = false}:{count?:number;label?:string;dot?:boolean}) {
  if(count <= 0) return null;
  return <View accessibilityLabel={`${count} ${label}`} style={dot ? s.dot : s.badge}>{!dot && <Text style={s.text}>{count > 99 ? "99+" : count}</Text>}</View>;
}
const s = StyleSheet.create({
  badge:{minWidth:19,height:19,paddingHorizontal:4,borderRadius:10,backgroundColor:colors.danger,alignItems:"center",justifyContent:"center"},
  dot:{width:8,height:8,borderRadius:4,backgroundColor:colors.danger},
  text:{color:colors.background,fontSize:11,fontWeight:"800"},
});
