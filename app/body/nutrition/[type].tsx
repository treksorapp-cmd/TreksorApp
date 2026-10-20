import Button from "@/components/ui/Button";
import Header from "@/components/ui/Header";
import { Nutritions } from "@/mock/nutrition";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
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

const BeveragesHome = () => {
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams();
  const category = Nutritions[typeof type === "string" ? type as keyof typeof Nutritions : "beverages"];
  const { backgroundImage, data, route, headerTitle } = category ?? Nutritions.beverages;
    const { user } = useAuthStore();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={backgroundImage}
        contentFit="cover"
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        {/* Header */}
         {!user?.plan && <Header showTitle={false} showBackButton={false} showAvatar={false} />}
        <View style={[styles.header, { paddingTop: user?.plan ? insets.top + 10 : 0, position: !user?.plan ? "relative" : "absolute" }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
          {data?.map((item) => (
            <Button
              key={item.id}
              onPress={() =>
                router.push({ pathname: route, params: { id: item.id } })
              }
              icon={"icon" in item ? item.icon : undefined}
            >
              {item.name}
            </Button>
          ))}
        </View>
      </ImageBackground>
    </View>
  );
};

export default BeveragesHome;

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
