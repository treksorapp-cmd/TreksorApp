import { playCompletionFeedback } from "@/lib/completion-feedback";
import { useAuthStore } from "@/store/auth-store";
import { usePowerThoughtStore } from "@/store/thought-store";
import { Ionicons } from "@expo/vector-icons";
import { Image, ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GOLD = "#E8B44D";
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
  { name: "BODY", subtitle: "Strength & movement", route: "/body", image: require("@/assets/images/Body_2.png"), icon: "barbell-outline", index: "01" },
  { name: "MIND", subtitle: "Clarity & focus", route: "/mental", image: require("@/assets/images/mental-home-bg.jpeg"), icon: "book-outline", index: "02" },
  { name: "BALANCE", subtitle: "Recovery & presence", route: "/spiritual", image: require("@/assets/images/spiritual-ritual.png"), icon: "shield-outline", index: "03" },
  { name: "PURPOSE", subtitle: "Direction & intention", route: "/purpose", image: require("@/assets/images/purpose-background.png"), icon: "compass-outline", index: "04" },
];

export default function HomeScreen() {
  const user = useAuthStore(state => state.user);
  const powerThoughts = usePowerThoughtStore(state => state.powerThoughts);
  const fetchPowerThoughts = usePowerThoughtStore(state => state.fetchPowerThoughts);
  const markRead = usePowerThoughtStore(state => state.markPowerThoughtAsRead);
  useEffect(() => { fetchPowerThoughts(); }, [fetchPowerThoughts]);

  const firstName = user?.name?.trim().split(" ")[0] || "Explorer";
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{const refresh=()=>setNow(new Date());const timer=setInterval(refresh,30000);const sub=AppState.addEventListener("change",v=>{if(v==="active")refresh()});return()=>{clearInterval(timer);sub.remove()}},[]);
  const hour = now.getHours();
  const dailyIndex=Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000)%DAILY_MESSAGES.length;
  const dailyMessage=DAILY_MESSAGES[dailyIndex];
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayThought = powerThoughts?.find(item => item.isToday) || powerThoughts?.[0];
  const isCurrentThought = !!todayThought?.isToday;
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
            {user?.avatar?<Image source={{uri:user.avatar}} style={styles.profileImage} cachePolicy="memory-disk"/>:<Text style={styles.profileLetter}>{firstName.charAt(0).toUpperCase()}</Text>}
          </TouchableOpacity></View>
        </View>

        <View style={styles.hero}>
          <ImageBackground source={DAILY_HERO_IMAGES[dailyIndex]} contentFit="cover" contentPosition="center 58%" cachePolicy="memory-disk" transition={350} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={["rgba(8,9,11,0.08)", "rgba(8,9,11,0.45)", "#08090B"]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroGreetingWrap}><View style={styles.greetingDot}/><Text style={styles.heroGreeting}>{greeting}</Text></View>
          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>YOUR DAILY DIRECTION</Text>
            <Text style={styles.heroTitle}>{dailyMessage[0]}{"\n"}<Text style={styles.name}>{dailyMessage[1]}</Text></Text>
            <Text style={styles.heroSub}>{dailyMessage[2]}</Text>
          </View>
        </View>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>THE TREKSOR METHOD</Text>
            <Text style={styles.sectionTitle}>Four pillars. One direction.</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {pillars.map(pillar => (
            <TouchableOpacity key={pillar.name} activeOpacity={0.84} style={styles.tile} onPress={() => router.push(pillar.route)} accessibilityRole="button" accessibilityLabel={pillar.name + ": " + pillar.subtitle}>
              <ImageBackground source={pillar.image} contentFit="cover" contentPosition={pillar.name==="MIND"?"center 18%":"center"} style={StyleSheet.absoluteFill} transition={180} cachePolicy="memory-disk" />
              <LinearGradient colors={["rgba(0,0,0,0.20)", "rgba(0,0,0,0.22)", "rgba(0,0,0,0.95)"]} locations={[0, 0.34, 1]} style={StyleSheet.absoluteFill} />
              <View style={styles.tileTop}>
                <View style={styles.tileIcon}><Ionicons name={pillar.icon} color="#FFFFFF" size={18} /></View>
              </View>
              <View style={styles.tileBottom}>
                <Text style={styles.tileTitle}>{pillar.name}</Text>
                <Text style={styles.tileCaption}>{pillar.subtitle}</Text>

              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.thoughtSection}>
          <View style={styles.thoughtHeading}><Ionicons name="sunny-outline" color={GOLD} size={19} /><Text style={styles.thoughtLabel}>TODAY ON TREKSOR</Text></View>
          <View style={styles.thoughtCard}>
            <Text style={{color:GOLD,fontSize:10,fontWeight:"800",letterSpacing:1.8,marginBottom:15}}>{isCurrentThought?"POWER THOUGHT · TODAY":"POWER THOUGHT · LATEST"}</Text>
            <Text style={styles.thoughtText}>{thought}</Text>
            <View style={styles.thoughtFooter}><TouchableOpacity onPress={() => router.push("/mental/thoughts")}><Text style={styles.thoughtLink}>EXPLORE THOUGHTS →</Text></TouchableOpacity><TouchableOpacity disabled={!todayThought || !!todayThought.isRead} accessibilityRole="checkbox" accessibilityState={{checked:!!todayThought?.isRead}} onPress={completeThought} style={{flexDirection:"row",alignItems:"center",gap:8,backgroundColor:todayThought?.isRead?GOLD:"#292823",paddingHorizontal:13,paddingVertical:11,borderRadius:12,borderWidth:1,borderColor:GOLD}}><Ionicons name={todayThought?.isRead?"checkmark-circle":"checkmark-circle-outline"} size={19} color={todayThought?.isRead?"#17130B":GOLD}/><Text style={{color:todayThought?.isRead?"#17130B":GOLD,fontWeight:"800",fontSize:12}}>{todayThought?.isRead?(isCurrentThought?"READ TODAY":"READ"):"MARK AS READ"}</Text></TouchableOpacity></View>
          </View>
        </View>
        <Text style={styles.footer}>TREKSOR · BUILT WITH PURPOSE</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#08090B" },
  content: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 118 },
  hero: { height: 276, marginHorizontal: -20, marginTop: -8, marginBottom: 26, overflow: "hidden", backgroundColor: "#151715" },
  heroContent: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 24, paddingBottom: 28 },
  heroTitle: { color: "#F7F5F0", fontSize: 43, lineHeight: 48, fontWeight: "700", letterSpacing: -1.5 },
  heroSub: { color: "#D0C8B9", fontSize: 12, letterSpacing: 0.7, marginTop: 13 },
  sectionCount: { color: GOLD, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  topRight:{flexDirection:"column",alignItems:"flex-end",gap:5},
  heroGreetingWrap:{position:"absolute",top:14,right:20,zIndex:2,flexDirection:"row",alignItems:"center",gap:7,paddingHorizontal:12,paddingVertical:8,borderRadius:20,backgroundColor:"rgba(10,12,12,0.56)",borderWidth:1,borderColor:"rgba(230,187,103,0.35)"},
  greetingDot:{width:5,height:5,borderRadius:3,backgroundColor:"#E8B44D"},
  heroGreeting:{color:"#F4D9A4",fontSize:11,fontWeight:"600",letterSpacing:0.55},
  profileImage:{width:40,height:40,borderRadius:20},
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 11 },
  brandText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", letterSpacing: 4.2 },
  brandCaption: { color: "#C6A568", fontSize: 8, fontWeight: "700", letterSpacing: 2.4, marginTop: 3 },
  profile: { height: 42, width: 42, borderRadius: 21, backgroundColor: "#1D1B18", borderColor: "#514737", borderWidth: 1, alignItems: "center", justifyContent: "center" },
  profileLetter: { color: GOLD, fontWeight: "800", fontSize: 17 },
  intro: { marginBottom: 34 },
  eyebrow: { color: GOLD, fontSize: 10, fontWeight: "600", letterSpacing: 2.1, marginBottom: 12 },
  greeting: { color: "#F8F7F5", fontSize: 38, lineHeight: 44, fontWeight: "800", letterSpacing: -1.1 },
  name: { color: GOLD },
  subtitle: { color: "#A9A7A4", fontSize: 14, lineHeight: 21, marginTop: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 17 },
  sectionEyebrow: { color: "#C6AE84", fontSize: 10, letterSpacing: 2.1, fontWeight: "600", marginBottom: 7 },
  sectionTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "600", letterSpacing: -0.5 },
  fourBadge: { width: 37, height: 37, borderRadius: 19, borderWidth: 1, borderColor: "#514332", alignItems: "center", justifyContent: "center" },
  fourBadgeText: { color: GOLD, fontSize: 12, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 13 },
  tile: { width: "48.3%", aspectRatio: 0.88, borderRadius: 13, overflow: "hidden", backgroundColor: "#191919", borderWidth: 1, borderColor: "#34302B" },
  tileTop: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: 13 },
  tileIcon: { height: 34, width: 34, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.40)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  tileIndex: { color: "#FFFFFF", fontSize: 10, fontWeight: "700", opacity: 0.85 },
  tileBottom: { flex: 1, justifyContent: "flex-end", padding: 13 },
  tileTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", letterSpacing: 1.7 },
  tileCaption: { color: "#E4DBCA", fontSize: 12, lineHeight: 17, marginTop: 6 },
  tileFooter: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.25)", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  explore: { color: GOLD, fontSize: 9, fontWeight: "800", letterSpacing: 1.6 },
  thoughtSection: { marginTop: 33 },
  thoughtHeading: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 14 },
  thoughtLabel: { color: GOLD, fontSize: 10, fontWeight: "800", letterSpacing: 1.8 },
  thoughtCard: { borderRadius: 16, borderWidth: 1, borderColor: "#554632", backgroundColor: "#191A18", padding: 20 },
  quoteMark: { color: GOLD, fontSize: 42, fontWeight: "700", height: 38 },
  thoughtText: { color: "#F4EEE5", fontSize: 19, lineHeight: 29, fontWeight: "500", marginTop: 0 },
  thoughtFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 15, marginTop: 22, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#39362F" },
  thoughtLink: { color: GOLD, fontSize: 9, fontWeight: "800", letterSpacing: 1.6 },
  footer: { color: "#A99D88", textAlign: "center", marginTop: 29, fontSize: 9, fontWeight: "700", letterSpacing: 2.2 },
});
