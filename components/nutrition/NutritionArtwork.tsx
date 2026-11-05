import {Image} from "expo-image";
import {StyleSheet,View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
/** Legacy portrait artwork includes a long dark footer: frame its subject, not its footer. */
export default function NutritionArtwork({source,label,height=270,cover=false}:{source:number;label:string;height?:number;cover?:boolean}){
 return <View style={[s.frame,{height}]}><Image source={source} accessibilityLabel={label} accessible contentFit={cover?"cover":"contain"} contentPosition={cover?"center":"top"} transition={120} style={cover?StyleSheet.absoluteFill:{position:"absolute",top:0,width:"100%",height:"190%"}}/><LinearGradient pointerEvents="none" colors={["transparent","rgba(2,5,12,.15)","#09111B"]} locations={[0,.7,1]} style={StyleSheet.absoluteFill}/></View>;
}
const s=StyleSheet.create({frame:{width:"100%",overflow:"hidden",borderRadius:18,backgroundColor:"#09111B",borderWidth:1,borderColor:"rgba(215,184,119,.16)"}});
