import BodyPageHeading from "@/components/BodyPageHeading";
import Button from "@/components/ui/Button";
import { ImageBackground } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SupplementsHome = () => {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require("@/assets/images/supplements-home.png")}
        contentFit="cover"
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        <BodyPageHeading trail="BODY / NUTRITION" title="SUPPLEMENTS" style={{position:"absolute",top:insets.top+12,left:0,right:0}} />
        <View style={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
          <Button onPress={()=>router.push("/body/nutrition/beverages")} icon={require("@/assets/images/creatine-icon.png")}>CREATINE</Button>
          <Button icon={require("@/assets/images/omega-icon.png")}>OMEGA-3</Button>
          <Button icon={require("@/assets/images/b12-icon.png")}>B12</Button>
        </View>
      </ImageBackground>
    </View>
  );
};

export default SupplementsHome;

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
});
