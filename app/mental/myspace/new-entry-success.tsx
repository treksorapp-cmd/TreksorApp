import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {ScrollView,Text,View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import BodyPageHeading from "@/components/BodyPageHeading";
import Button from "@/components/ui/Button";
import {useReflectionContext} from "@/hooks/useReflectionContext";
import {colors,type} from "@/theme/architect";
export default function EntrySaved(){const insets=useSafeAreaInsets();const {home,trail}=useReflectionContext();return <ScrollView style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{paddingTop:insets.top+12,paddingBottom:insets.bottom+32}}><BodyPageHeading title="Reflection saved" trail={trail}/><View style={{padding:22,gap:24,alignItems:"center",marginTop:40}}><Ionicons name="checkmark-circle-outline" size={72} color={colors.gold}/><Text style={type.body}>A moment of reflection is a step forward.</Text><Button onPress={()=>router.replace(home)}>Return to my space</Button></View></ScrollView>;}
