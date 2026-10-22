import Button from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Selection = () => {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require("@/assets/images/Workout_2.png")}
        contentFit="cover"
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}><Text style={styles.eyebrow}>BODY / MOVEMENT</Text><Text style={styles.headerTitle}>WORKOUT</Text></View>
        <View style={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
          <Button borderless iconName="barbell-outline" onPress={() => router.push("/body/workout")}>GYM</Button>
          <Button iconName="body-outline" disabled>CALISTHENICS · COMING SOON</Button>
        </View>
      </ImageBackground>
    </View>
  );
};

export default Selection;

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
    opacity: 1,
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
  gymButtonContainer: {
    width: width - 40, // Full width minus margins
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 10,
    backgroundColor: "#EFB33F",
    alignItems: "center",
    justifyContent: "center",
  },
  otherButtonContainer: {
    width: width - 40, // Full width minus margins
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 10,
    backgroundColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
  },
  gymButtonText: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1,
    lineHeight: 24,
  },
  otherButtonText: {
    color: "#EFB33F",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    lineHeight: 24,
  },
  otherButtonSubText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
    lineHeight: 24,
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
    letterSpacing: 1.5,
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSpacer: {
    width: 34,
  },
});
