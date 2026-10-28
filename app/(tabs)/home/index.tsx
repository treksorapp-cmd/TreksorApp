import PillarUpdates from "@/components/PillarUpdates";
import { useContentRefresh } from "@/hooks/useContentRefresh";
import {colors} from "@/theme/architect";
import {useReducedMotion} from "@/hooks/useReducedMotion";
import JourneyCard from "@/components/JourneyCard";
import { scheduleTodaysPowerThought } from "@/lib/daily-thought-notification";
import { playCompletionFeedback } from "@/lib/completion-feedback";
import { useAuthStore } from "@/store/auth-store";
import { usePowerThoughtStore } from "@/store/thought-store";
import { Ionicons } from "@expo/vector-icons";
import { Image, ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, AppState, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GOLD = "#D7B877";
const ATMOSPHERE_ENDPOINT = "https://niakfwerfqmrmhuypkpd.supabase.co/rest/v1/atmosphere_images?select=*&published_at=lte.&order=published_at.desc&limit=1";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8";
const DAILY_MESSAGES = [
["Move with","intention.","Strength. Clarity. Balance. Purpose."],
["Become who","you envision.","Your future begins with today's choices."],
["Build a life","worth living.","Choose direction over distraction."],
["Find strength","in stillness.","A clear mind changes everything."],
["Progress is","a practice.","Show up every day with purpose."],
["Own your","direction.","Every step shapes who you become."],
["Live with","purpose.","Small actions. Extraordinary change."]
] as const;
const DAILY_HERO_IMAGES = [
  require("@/assets/images/purpose-background.png"),
  require("@/assets/images/Body_2.png"),
  require("@/assets/images/purpose-background.png"),
  require("@/assets/images/mental-home-bg.jpeg"),
  require("@/assets/images/Body_2.png"),
  require("@/assets/images/spiritual-ritual.png"),
  require("@/assets/images/purpose-background.png"),
];
const pillars: { name: string; subtitle: string; route: Href; image: number; icon: keyof typeof Ionicons.glyphMap; index: string }[] = [
  { name: "Body", subtitle: "Strength & movement", route: "/body", image: require("@/assets/images/Body_2.png"), icon: "barbell-outline", index: "01" },
  { name: "Mind", subtitle: "Clarity & focus", route: "/mental", image: require("@/assets/images/mental-home-bg.jpeg"), icon: "book-outline", index: "02" },
  { name: "Balance", subtitle: "Recovery & presence", route: "/spiritual", image: require("@/assets/images/spiritual-ritual.png"), icon: "shield-outline", index: "03" },
  { name: "Purpose", subtitle: "Direction & intention", route: "/purpose", image: require("@/assets/images/purpose-background.png"), icon: "compass-outline", index: "04" },
];

export default function HomeScreen() {
  const user = useAuthStore(state => state.user);
  const powerThoughts = usePowerThoughtStore(state => state.powerThoughts);
  const fetchPowerThoughts = usePowerThoughtStore(state => state.fetchPowerThoughts);
  const markRead = usePowerThoughtStore(state => state.markPowerThoughtAsRead);
  useContentRefresh(fetchPowerThoughts);

  const firstName = user?.name?.trim().split(" ")[0] || "Explorer";
  const [now,setNow]=useState(()=>new Date());
  const [atmosphereUrl,setAtmosphereUrl]=useState<string | null>(null);
  const [atmosphereMessage,setAtmosphereMessage]=useState<readonly [string,string,string] | null>(null);
  const refreshAtmosphere=useCallback(async()=>{
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
    try{const response=await fetch(ATMOSPHERE_ENDPOINT.replace("published_at=lte.","published_at=lte."+encodeURIComponent(new Date().toISOString())),{headers:{apikey:SUPABASE_PUBLISHABLE_KEY},signal:controller.signal});if(!response.ok)return;const rows=await response.json();const url=rows?.[0]?.public_url;if(typeof url==="string"&&url.startsWith("https://")){
      setAtmosphereUrl(url);
      const row=rows[0];
      const title=typeof row.headline==="string"?row.headline.trim():typeof row.title==="string"?row.title.trim():"";
      const subtitle=typeof row.subtitle==="string"?row.subtitle.trim():typeof row.caption==="string"?row.caption.trim():"";
      const lines=title.split(/\n|\|/).map((part:string)=>part.trim()).filter(Boolean);
      setAtmosphereMessage(lines.length>=2 ? [lines[0],lines.slice(1).join(" "),subtitle] : null);
    }}catch{}finally{clearTimeout(timeout)}
  },[]);
  useContentRefresh(refreshAtmosphere);
  const reveal=useRef(new Animated.Value(0)).current;
  const reducedMotion=useReducedMotion();
  const pulse=useRef(new Animated.Value(0)).current;
  useEffect(()=>{if(reducedMotion){pulse.setValue(0);return;}const loop=Animated.loop(Animated.sequence([Animated.timing(pulse,{toValue:1,duration:1450,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),Animated.timing(pulse,{toValue:0,duration:1450,easing:Easing.inOut(Easing.sin),useNativeDriver:true})]));loop.start();return()=>loop.stop()},[pulse,reducedMotion]);
  useEffect(()=>{Animated.timing(reveal,{toValue:1,duration:reducedMotion?0:480,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start()},[reveal,reducedMotion]);
  useEffect(()=>{const refresh=()=>setNow(new Date());const timer=setInterval(refresh,60000);const sub=AppState.addEventListener("change",v=>{if(v==="active")refresh()});return()=>{clearInterval(timer);sub.remove()}},[]);
  const hour = now.getHours();
  const dailyIndex=Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000)%DAILY_MESSAGES.length;
  const dailyMessage=atmosphereUrl && atmosphereMessage ? atmosphereMessage : DAILY_MESSAGES[dailyIndex];
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayThought = powerThoughts?.find(item => item.isToday) || powerThoughts?.[0];
  const isCurrentThought = !!todayThought?.isToday;
  useEffect(() => { if (todayThought?.isToday && todayThought.thought) void scheduleTodaysPowerThought(todayThought.thought, todayThought._id).catch(console.warn); }, [todayThought?._id, todayThought?.isToday, todayThought?.thought]);
  const completeThought = () => { if (!todayThought || todayThought.isRead) return; markRead(todayThought._id); void playCompletionFeedback(); };
  const thought = todayThought?.thought || "Your daily perspective will appear here when published.";

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <View style={styles.brand}>
            <Image source={require("@/assets/images/appicon-treksor.png")} style={styles.logo} />
            <View>
              <Text style={styles.brandText}>TREKSOR</Text>
              <Text style={styles.brandCaption}>BUILT WITH PURPOSE</Text>
            </View>
          </View>
          <View style={styles.topRight}><TouchableOpacity onPress={() => router.push("/profile")} style={styles.profile} accessibilityLabel="Open profile">
            {user?.avatar?<Image source={{uri:user.avatar.startsWith("http")?user.avatar:`https://app.treksor.com/${user.avatar}`}} style={styles.profileImage} cachePolicy="memory-disk"/>:<Text style={styles.profileLetter}>{firstName.charAt(0).toUpperCase()}</Text>}
          </TouchableOpacity></View>
        </View>

        <Animated.View style={[styles.hero,{opacity:reveal,transform:[{translateY:reveal.interpolate({inputRange:[0,1],outputRange:[12,0]})}]}]}>
          <ImageBackground source={atmosphereUrl ? {uri:atmosphereUrl} : DAILY_HERO_IMAGES[dailyIndex]} onError={() => { if (atmosphereUrl) { setAtmosphereUrl(null); setAtmosphereMessage(null); } }} contentFit="cover" contentPosition={{left:"50%",top:"58%"}} cachePolicy="memory-disk" transition={350} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={["rgba(8,9,11,0.08)", "rgba(8,9,11,0.45)", "#08090B"]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroGreetingWrap}><View style={styles.pulseShell}><Animated.View style={[styles.pulseHalo,{opacity:pulse.interpolate({inputRange:[0,1],outputRange:[0.06,0.24]}),transform:[{scale:pulse.interpolate({inputRange:[0,1],outputRange:[1,1.65]})}]}]}/><Animated.View style={[styles.greetingDot,{opacity:pulse.interpolate({inputRange:[0,1],outputRange:[0.70,1]})}]}/></View><Text style={styles.heroGreeting}>{greeting}</Text></View>
          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>YOUR DAILY DIRECTION</Text>
            <Text style={styles.heroTitle}>{dailyMessage[0]}{"\n"}<Text style={styles.name}>{dailyMessage[1]}</Text></Text>
            <Text style={styles.heroSub}>{dailyMessage[2]}</Text>
          </View>
        </Animated.View>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>THE TREKSOR METHOD</Text>
            <Text style={styles.sectionTitle}>Four pillars. One direction.</Text>
            <Text style={styles.sectionHint}>Choose a pillar to explore <Ionicons name="arrow-down" size={12} color="#C6AE84"/></Text>
          </View>
        </View>

        <Animated.View style={[styles.grid,{opacity:reveal,transform:[{translateY:reveal.interpolate({inputRange:[0,1],outputRange:[18,0]})}]}]}>
          {pillars.map(pillar => (
            <TouchableOpacity key={pillar.name} activeOpacity={0.72} style={styles.tile} onPress={() => router.push(pillar.route)} accessibilityRole="button" accessibilityLabel={pillar.name + ": " + pillar.subtitle}>
              <ImageBackground source={pillar.image} contentFit="cover" contentPosition={pillar.name==="Mind"?{left:"50%",top:"18%"}:"center"} style={StyleSheet.absoluteFill} transition={180} cachePolicy="memory-disk" />
              <LinearGradient colors={["rgba(0,0,0,0.20)", "rgba(0,0,0,0.22)", "rgba(0,0,0,0.95)"]} locations={[0, 0.34, 1]} style={StyleSheet.absoluteFill} />
              <View style={styles.tileTop}>
                <View style={styles.tileIcon}><Ionicons name={pillar.icon} color="#FFFFFF" size={18} /></View>
              </View>
              <View style={styles.tileBottom}>
                <Text style={styles.tileTitle}>{pillar.name}</Text>
                <Text style={styles.tileCaption}>{pillar.subtitle}</Text><PillarUpdates pillar={pillar.name} compact/>

              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <JourneyCard />
        <View style={styles.thoughtSection}>
          <View style={styles.thoughtHeading}><Ionicons name="sunny-outline" color={GOLD} size={19} /><Text style={styles.thoughtLabel}>TODAY ON TREKSOR</Text></View>
          <View style={styles.thoughtCard}>
            <Text style={{color:GOLD,fontSize:10,fontWeight:"800",letterSpacing:1.8,marginBottom:15}}>{isCurrentThought?"POWER THOUGHT · TODAY":"POWER THOUGHT · LATEST"}</Text>
            <Text style={styles.thoughtText}>{thought}</Text>
            <View style={styles.thoughtFooter}><TouchableOpacity onPress={() => router.push("/mental/thoughts")}><Text style={styles.thoughtLink}>EXPLORE THOUGHTS →</Text></TouchableOpacity><TouchableOpacity disabled={!todayThought || !!todayThought.isRead} accessibilityRole="checkbox" accessibilityState={{checked:!!todayThought?.isRead}} onPress={completeThought} style={{flexDirection:"row",alignItems:"center",gap:8,backgroundColor:todayThought?.isRead?"rgba(183,221,240,0.17)":"rgba(183,221,240,0.085)",paddingHorizontal:13,paddingVertical:11,borderRadius:12}}><Ionicons name={todayThought?.isRead?"checkmark-circle":"checkmark-circle-outline"} size={19} color={todayThought?.isRead?"#BFE7F4":GOLD}/><Text style={{color:todayThought?.isRead?"#BFE7F4":GOLD,fontWeight:"800",fontSize:12}}>{todayThought?.isRead?(isCurrentThought?"READ TODAY":"READ"):"MARK AS READ"}</Text></TouchableOpacity></View>
          </View>
        </View>
        <Text style={styles.footer}>TREKSOR · BUILT WITH PURPOSE</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 118 },
  hero: { minHeight: 276, marginHorizontal: -20, marginTop: -8, marginBottom: 26, overflow: "hidden", backgroundColor: "#151715" },
  heroContent: { flex: 1, paddingTop: 88, justifyContent: "flex-end", paddingHorizontal: 24, paddingBottom: 28 },
  heroTitle: { color: "#F7F5F0", fontSize: 34, lineHeight: 42, fontWeight: "600", letterSpacing: -0.6, includeFontPadding: false, },
  heroSub: { color: "#D0C8B9", fontSize: 12, letterSpacing: 0.7, marginTop: 13 },
  sectionCount: { color: GOLD, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  topRight:{flexDirection:"column",alignItems:"flex-end",gap:5},
  heroGreetingWrap:{position:"absolute",top:14,right:20,zIndex:2,flexDirection:"row",alignItems:"center",gap:7,paddingHorizontal:12,paddingVertical:8,borderRadius:20,backgroundColor:"rgba(183,221,240,0.075)"},
  pulseShell:{width:9,height:9,alignItems:"center",justifyContent:"center"},
  pulseHalo:{position:"absolute",width:9,height:9,borderRadius:5,backgroundColor:"#D7B877"},
  greetingDot:{width:6,height:6,borderRadius:3,backgroundColor:"#FFE4A1"},
  heroGreeting:{color:"#D7B877",fontSize:11,fontWeight:"600",letterSpacing:0.55},
  profileImage:{width:40,height:40,borderRadius:20},
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 11 },
  brandText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", letterSpacing: 4.2 },
  brandCaption: { color: "#C6A568", fontSize: 8, fontWeight: "700", letterSpacing: 2.4, marginTop: 3 },
  profile: { height: 42, width: 42, borderRadius: 21, backgroundColor: "rgba(183,221,240,0.075)", alignItems: "center", justifyContent: "center" },
  profileLetter: { color: GOLD, fontWeight: "800", fontSize: 17 },
  intro: { marginBottom: 34 },
  eyebrow: { color: GOLD, fontSize: 10, fontWeight: "600", letterSpacing: 2.1, marginBottom: 12 },
  greeting: { color: "#F8F7F5", fontSize: 38, lineHeight: 44, fontWeight: "800", letterSpacing: -1.1 },
  name: { color: GOLD },
  subtitle: { color: "#A9A7A4", fontSize: 14, lineHeight: 21, marginTop: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 17 },
  sectionEyebrow: { color: "#C6AE84", fontSize: 10, letterSpacing: 2.1, fontWeight: "600", marginBottom: 7 },
  sectionTitle: { color: "#F5F4F1", fontSize: 22, fontWeight: "600", letterSpacing: -0.2, lineHeight: 29, includeFontPadding: false, },
  sectionHint:{color:"#AFA89C",fontSize:11,marginTop:8,letterSpacing:0.2},
  fourBadge: { width: 37, height: 37, borderRadius: 19, borderWidth: 1, borderColor: "#514332", alignItems: "center", justifyContent: "center" },
  fourBadgeText: { color: GOLD, fontSize: 12, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 13 },
  tile: { width: "48.3%", minHeight: 230, borderRadius: 13, overflow: "hidden", backgroundColor: "rgba(183,221,240,0.075)" },
  tileTop: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: 13 },
  tileIcon: { height: 34, width: 34, borderRadius: 11, backgroundColor: "rgba(183,221,240,0.13)", alignItems: "center", justifyContent: "center" },
  tileIndex: { color: "#FFFFFF", fontSize: 10, fontWeight: "700", opacity: 0.85 },
  tileBottom: { flex: 1, justifyContent: "flex-end", padding: 13 },
  tileTitle: { color: "#F5F4F1", fontSize: 22, fontWeight: "600", letterSpacing: -0.2, lineHeight: 29, includeFontPadding: false, },
  tileCaption: { color: "#E4DBCA", fontSize: 12, lineHeight: 17, marginTop: 6 },
  tileFooter: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.25)", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  explore: { color: GOLD, fontSize: 9, fontWeight: "800", letterSpacing: 1.6 },
  thoughtSection: { marginTop: 33 },
  thoughtHeading: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 14 },
  thoughtLabel: { color: GOLD, fontSize: 10, fontWeight: "800", letterSpacing: 1.8 },
  thoughtCard: { borderRadius: 19, backgroundColor: "rgba(183,221,240,0.075)", padding: 20 },
  quoteMark: { color: GOLD, fontSize: 42, fontWeight: "700", height: 38 },
  thoughtText: { color: "#F4EEE5", fontSize: 19, lineHeight: 29, fontWeight: "500", marginTop: 0 },
  thoughtFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 15, marginTop: 22, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(205,235,248,0.10)" },
  thoughtLink: { color: GOLD, fontSize: 9, fontWeight: "800", letterSpacing: 1.6 },
  footer: { color: "#A99D88", textAlign: "center", marginTop: 29, fontSize: 9, fontWeight: "700", letterSpacing: 2.2 },
});
