import BodyPageHeading from "@/components/BodyPageHeading";
import { Nutritions } from "@/mock/nutrition";
import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GOLD = "#D7B877";
const GLASS = "rgba(183,221,240,0.075)";
const BORDER = "rgba(205,235,248,0.20)";
type Beverage = (typeof Nutritions.beverages.data)[number];

export default function BeverageDetails() {
  const { id } = useLocalSearchParams<{id:string}>();
  const insets = useSafeAreaInsets();
  const [showReferences, setShowReferences] = useState(false);
  const beverage = Nutritions.beverages.data.find(item => item.id === id) as Beverage | undefined;
  if (!beverage) return <View style={styles.screen}><BodyPageHeading title="Beverage unavailable" trail="BODY / NUTRITION" subtitle="Return to Nutrition to choose a drink." style={{paddingTop:insets.top+12}} /></View>;

  const sources = [
    {title:beverage.source_1,url:beverage.url_1},
    {title:beverage.source_2,url:beverage.url_2},
    {title:beverage.source_3,url:beverage.url_3},
  ].filter((item):item is {title:string;url:string} => Boolean(item.title && item.url));
  const paragraphs = beverage.description.replace(/\s*\n\s*/g," ").split(/(?<=[.!?])\s+/).filter(Boolean);
  const openReference = (url:string) => { void Linking.openURL(url).catch(()=>{}); };

  return <View style={styles.screen}>
    <StatusBar style="light"/>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:insets.bottom+48}}>
      <BodyPageHeading trail="BODY / BEVERAGES" title={beverage.name} style={{paddingTop:insets.top+12,paddingBottom:24}} />
      <View style={styles.hero}>
        <ImageBackground source={beverage.backgroundImage} contentFit="cover" style={StyleSheet.absoluteFill}/>
        <LinearGradient colors={["rgba(2,5,12,0.35)","rgba(2,5,12,0.45)","#02050C"]} locations={[0,0.48,1]} style={StyleSheet.absoluteFill}/>

      </View>
      <View style={styles.content}>
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionEyebrow}>THE RITUAL</Text>
          {paragraphs.map((paragraph,index)=><Text key={index} style={[styles.description,index===0&&styles.lead]}>{paragraph}</Text>)}
        </View>
        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionEyebrow}>PREPARE YOUR DRINK</Text><Text style={styles.sectionTitle}>Ingredients</Text></View>
          <View style={styles.quantity}><Ionicons name="beaker-outline" color="#D6E9F2" size={16}/><Text style={styles.quantityText}>{beverage.quantity.replace(/[()]/g,"")}</Text></View>
        </View>
        <View style={styles.ingredients}>
          {beverage.ingredients.map((ingredient,index)=><View key={ingredient.id} style={styles.ingredientRow}>
            <View style={styles.numberCircle}><Text style={styles.number}>{String(index+1).padStart(2,"0")}</Text></View>
            <Text style={styles.ingredientName}>{ingredient.name}</Text>
            <Text style={styles.amount}>{ingredient.measurement.replace(/[()]/g,"")}</Text>
          </View>)}
        </View>
        {(beverage.footNote || sources.length>0) && <View style={styles.references}>
          <View style={styles.safetyRow}><Ionicons name="information-circle-outline" size={19} color="#C3D7E4"/><Text style={styles.safetyText}>{beverage.footNote || "Review ingredients before use."}</Text></View>
          {sources.length>0&&<>
            <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded:showReferences}} onPress={()=>setShowReferences(v=>!v)} style={styles.sourcesToggle}>
              <Ionicons name="document-text-outline" size={18} color="#DCECF5"/>
              <Text style={styles.sourcesLabel}>SOURCES & REFERENCES ({sources.length})</Text>
              <Ionicons name={showReferences?"chevron-up":"chevron-down"} size={18} color="#DCECF5"/>
            </TouchableOpacity>
            {showReferences&&sources.map((source,index)=><TouchableOpacity key={source.url+index} accessibilityRole="link" onPress={()=>openReference(source.url)} style={styles.sourceLink}>
              <Text style={styles.sourceText} numberOfLines={2}>{index+1}. {source.title}</Text><Ionicons name="open-outline" color={GOLD} size={17}/>
            </TouchableOpacity>)}
          </>}
        </View>}
      </View>
    </ScrollView>
  </View>;
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:"#02050C"},
  empty:{color:"#FFFFFF",textAlign:"center",marginTop:120},
  hero:{height:280,justifyContent:"space-between",overflow:"hidden"},
  topBar:{paddingHorizontal:20,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  back:{height:42,width:42,borderRadius:14,backgroundColor:"rgba(183,221,240,0.12)",alignItems:"center",justifyContent:"center"},
  topLabel:{color:"#F5F1E8",fontSize:13,fontWeight:"700",letterSpacing:2},
  heroCopy:{paddingHorizontal:22,paddingBottom:28},
  eyebrow:{color:"#D7B877",fontSize:11,fontWeight:"700",letterSpacing:1.7},
  heroTitle: {color: "#F5F4F1",fontSize: 34,fontWeight: "600",letterSpacing: -0.6,marginTop:9, lineHeight: 42, includeFontPadding: false, },
  heroCaption:{color:"#D8D6D2",fontSize:11,letterSpacing:1.7,marginTop:9,fontWeight:"600"},
  content:{paddingHorizontal:20},
  descriptionCard:{borderRadius:20,backgroundColor:GLASS,borderWidth:1,borderColor:BORDER,padding:20,marginBottom:28},
  sectionEyebrow:{color:"#D7B877",fontSize:10,fontWeight:"700",letterSpacing:1.5},
  description:{fontSize:14,color:"#C8CCD0",lineHeight:22,marginTop:10},
  lead:{fontSize:16,color:"#FFFFFF",fontWeight:"600",lineHeight:24},
  sectionHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:15},
  sectionTitle: {color: "#F5F4F1",fontSize: 22,fontWeight: "600",letterSpacing: -0.2,marginTop:6, lineHeight: 29, includeFontPadding: false, },
  quantity:{maxWidth:"47%",flexDirection:"row",alignItems:"center",gap:7,backgroundColor:GLASS,borderWidth:1,borderColor:BORDER,paddingHorizontal:11,paddingVertical:9,borderRadius:14},
  quantityText:{color:"#E1E8EC",fontSize:11,flexShrink:1},
  ingredients:{backgroundColor:GLASS,borderWidth:1,borderColor:BORDER,borderRadius:20,paddingHorizontal:16,paddingVertical:3},
  ingredientRow:{minHeight:66,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:1,borderBottomColor:"rgba(220,237,248,0.1)",paddingVertical:10},
  numberCircle:{height:32,width:32,borderRadius:11,backgroundColor:"rgba(193,227,244,0.085)",alignItems:"center",justifyContent:"center"},
  number:{fontSize:11,fontWeight:"700",color:"#D6E8F2"},
  ingredientName:{flex:1,color:"#FFFFFF",fontSize:14,fontWeight:"600",lineHeight:19},
  amount:{color:"#D5C29B",fontSize:12,fontWeight:"600",textAlign:"right",maxWidth:"37%",lineHeight:17},
  references:{marginTop:27,backgroundColor:"rgba(183,221,240,0.045)",borderRadius:18,padding:16},
  safetyRow:{flexDirection:"row",alignItems:"flex-start",gap:10},
  safetyText:{color:"#B8BEC2",fontSize:12,lineHeight:18,flex:1},
  sourcesToggle:{flexDirection:"row",alignItems:"center",gap:10,marginTop:17,paddingTop:14,borderTopWidth:1,borderTopColor:"rgba(255,255,255,0.1)"},
  sourcesLabel:{color:"#E5E9EB",fontSize:11,fontWeight:"700",letterSpacing:0.8,flex:1},
  sourceLink:{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:12,borderBottomWidth:1,borderBottomColor:"rgba(255,255,255,0.07)"},
  sourceText:{flex:1,color:"#C8CDD1",fontSize:12,lineHeight:18},
});
