import Header from "@/components/ui/Header";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { Image, ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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

const { width, height } = Dimensions.get("window");

const PurposeHome = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require("@/assets/images/purpose-background.png")}
        contentFit="contain"
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        {!user?.plan && (
          <Header showTitle={false} showBackButton={false} showAvatar={false} />
        )}
        <View
          style={[
            styles.header,
            {
              paddingTop: user?.plan && insets.top + 10,
              position: !user?.plan ? "relative" : "absolute",
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PURPOSE</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.content]}>
          <Image
            source={require("@/assets/images/purpose-home-icon.png")}
            style={{ width: "30%", height: "15%" }}
            contentFit="contain"
          />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#FFFFFF",
              textAlign: "center",
              marginTop: 20,
            }}
          >
            Purpose
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: "#FFFFFF",
              textAlign: "center",
              marginTop: 10,
              paddingHorizontal: 24,
            }}
          >
            In development for annual members
          </Text>
          <LinearGradient
            colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            locations={[0.3, 1]} // start fully white at 30%, fade to transparent at the end
            style={{
              borderRadius: 12,
              borderColor: "rgba(255,255,255,0.3)",
              borderWidth: 1,
              marginTop: 20,
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              flexDirection: "row",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              We’re building{" "}
            </Text>
            <Text
              style={{
                color: "#EFB33F",
                fontSize: 18,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              something meaningful
            </Text>
            {/* </View> */}
          </LinearGradient>
        </View>
      </ImageBackground>
    </View>
  );
};

export default PurposeHome;

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
    justifyContent: "center",
    alignItems: "center",
    // paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSpacer: {
    width: 34,
  },
});
