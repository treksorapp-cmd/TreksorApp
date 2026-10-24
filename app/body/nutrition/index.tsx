import BodyPageHeading from "@/components/BodyPageHeading";
import Button from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const NutritionHome = () => {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require("@/assets/images/Nutrition_2.png")}
        contentFit="cover"
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
                {/* Header */}
                <BodyPageHeading trail="BODY" title="NUTRITION" style={{position:"absolute",top:insets.top+12,left:0,right:0,zIndex:2}} />
        <View style={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
          <Button borderless onPress={()=>router.push("/body/nutrition/beverages")} icon={require("@/assets/images/beverages.png")}>BEVERAGES</Button>
          <Button onPress={()=>router.push("/body/nutrition/supplements")} icon={require("@/assets/images/supplements.png")}>SUPPLEMENTS</Button>
        </View>
      </ImageBackground>
    </View>
  );
};

export default NutritionHome;

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    width,
    height,
  },
  imageStyle: {
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  eyebrow:{color:"#D7B877",fontSize:11,fontWeight:"700",letterSpacing:1.7,marginBottom:7},
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 0,
    alignItems:"flex-start",
    flexDirection:"column",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing:-1.2,
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSpacer: {
    width: 34,
  },
});
