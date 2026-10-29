import BodyPageHeading from "@/components/BodyPageHeading";
import NutritionArtwork from "@/components/nutrition/NutritionArtwork";
import {Nutritions} from "@/mock/nutrition";
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {ScrollView,StyleSheet,Text,TouchableOpacity,View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {colors,type} from "@/theme/architect";
export default function NutritionHome(){
 const insets=useSafeAreaInsets();
 return <ScrollView style={s.screen} contentContainerStyle={{padding:22,paddingTop:insets.top+12,paddingBottom:insets.bottom+40}}><BodyPageHeading title="Nutrition" trail="BODY / FUEL & RESTORE" subtitle="Small rituals. A stronger foundation." style={{paddingHorizontal:0}}/><View style={{marginTop:24,gap:17}}>{(["beverages","supplements"] as const).map(key=>{const category=Nutritions[key];return <TouchableOpacity key={key} accessibilityRole="button" onPress={()=>router.push(`/body/nutrition/${key}`)} activeOpacity={.86} style={s.card}><NutritionArtwork source={category.backgroundImage} label={category.headerTitle} height={195} cover/><View style={s.copy}><View style={{flex:1}}><Text style={s.eyebrow}>{category.data.length} EVERYDAY RITUALS</Text><Text style={s.title}>{category.headerTitle}</Text><Text style={s.note}>{key==="beverages"?"Prepare something that brings you back to yourself.":"Understand what you choose to add to your routine."}</Text></View><View style={s.arrow}><Ionicons name="arrow-forward" color={colors.gold} size={21}/></View></View></TouchableOpacity>})}</View></ScrollView>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:colors.background},card:{borderRadius:21,padding:10,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},copy:{padding:11,flexDirection:"row",alignItems:"center",gap:14},eyebrow:{...type.eyebrow,fontSize:9,lineHeight:15},title:{...type.section,marginTop:5},note:{...type.caption,marginTop:6},arrow:{width:40,height:40,borderRadius:20,alignItems:"center",justifyContent:"center",backgroundColor:colors.goldSoft}});
