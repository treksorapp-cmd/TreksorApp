import { Image, ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return <SafeAreaView style={styles.screen}>
    <ImageBackground source={require("@/assets/images/onboarding.png")} contentFit="cover" style={StyleSheet.absoluteFill} />
    <LinearGradient colors={["rgba(0,0,0,0.78)", "rgba(0,0,0,0.14)", "rgba(0,0,0,0.88)"]} style={StyleSheet.absoluteFill} />
    <View style={styles.brand}><Image source={require("@/assets/images/appicon-treksor.png")} style={styles.logo} contentFit="contain" /><Text style={styles.heading}>Treksor</Text><Text style={styles.subHeading}>A STRONGER YOU{"\n"}A BRIGHTER TOMORROW</Text></View>
    <View style={styles.bottom}><Text style={styles.mantra}>More than an app.{"\n"}A life companion.</Text><TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => router.push("/login")}><Text style={styles.buttonText}>GET STARTED  →</Text></TouchableOpacity></View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050505", justifyContent: "space-between" },
  brand: { alignItems: "center", paddingTop: "20%" },
  logo: { width: 160, height: 160 },
  heading: { fontSize: 34, fontWeight: "600", color: "#F5F4F1", marginTop: 3, lineHeight: 42, letterSpacing: -0.6, includeFontPadding: false, },
  subHeading: { fontSize: 12, lineHeight: 21, letterSpacing: 3.2, color: "#fff", textAlign: "center", marginTop: 12 },
  bottom: { alignItems: "center", paddingHorizontal: 28, paddingBottom: 35 },
  mantra: { color: "#D8D5CF", fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 28 },
  button: { backgroundColor: "#D7B877", width: "100%", padding: 17, borderRadius: 12 },
  buttonText: { color: "#12100B", fontWeight: "800", fontSize: 15, textAlign: "center", letterSpacing: 1 },
});