import BodyPageHeading from "@/components/BodyPageHeading";
import NutritionArtwork from "@/components/nutrition/NutritionArtwork";
import {Nutritions} from "@/mock/nutrition";
import {router,useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {ScrollView,StyleSheet,Text,TouchableOpacity,View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {colors,type as typography} from "@/theme/architect";
export default function NutritionCategory(){
 const {type}=useLocalSearchParams<{type:string}>(),insets=useSafeAreaInsets(),category=Nutritions[type==="supplements"?"supplements":"beverages"];
 return <ScrollView style={s.screen} contentContainerStyle={{padding:22,paddingTop:insets.top+12,paddingBottom:insets.bottom+40}}><BodyPageHeading title={category.headerTitle} trail="BODY / NUTRITION" subtitle={type==="supplements"?"Learn about your options, one at a time.":"A moment to prepare. A ritual to return to."} style={{paddingHorizontal:0}}/><View style={s.list}>{category.data.map((item,index)=><TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`Open ${item.name}`} onPress={()=>router.push({pathname:category.route,params:{id:item.id}})} activeOpacity={.85} style={s.card}><View style={{width:93}}><NutritionArtwork source={item.backgroundImage} label={item.name} height={115}/></View><View style={{flex:1}}><Text style={s.eyebrow}>RITUAL {String(index+1).padStart(2,"0")}</Text><Text style={s.title}>{item.name.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())}</Text><Text style={s.note}>{"quantity" in item?item.quantity.replace(/[()]/g,""):"Overview & references"}</Text></View><Ionicons name="chevron-forward" size={19} color={colors.gold}/></TouchableOpacity>)}</View></ScrollView>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:colors.background},list:{gap:14,marginTop:25},card:{padding:11,gap:14,borderRadius:20,flexDirection:"row",alignItems:"center",backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},eyebrow:{...typography.eyebrow,fontSize:9,lineHeight:15},title:{...typography.card,marginTop:7,fontSize:17,lineHeight:23},note:{...typography.caption,marginTop:7}});
