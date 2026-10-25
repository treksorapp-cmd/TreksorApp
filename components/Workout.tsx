import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AnimatedDonutChart from "./ui/Donut";

type WorkoutProps = {
  onPress: () => void;
  icon: string;
  title: string;
  description?: string;
  percentage: number;
};

const Workout = ({
  onPress,
  icon,
  title,
  description,
  percentage,
}: WorkoutProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.buttonContainer}
    >
      {/* Outer LinearGradient for the border */}
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.4)"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.borderGradient}
      >
        {/* Inner LinearGradient for the button background */}
        <LinearGradient
          colors={["#262626", "#0a0a0a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.innerGradient}
        >
          <View
            style={{
              flex: 1,
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
            }}
          >
            <View style={{
                gap:10,
                flexDirection:'row',
                alignItems:"center"
            }}>
              <Image
                source={icon}
                style={{ marginRight: 10, width: 30, height: 26 }}
              />
              <View style={{ gap: 10 }}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
              </View>
            </View>
            <AnimatedDonutChart
              percentage={percentage}
              size={70}
              strokeWidth={6}
              color="#D7B877"
            />
          </View>
        </LinearGradient>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  buttonContainer: {
    width: width - 40, // Full width minus margins
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 10,
  },
  borderGradient: {
    flex: 1,
    borderRadius: 12,
    padding: 1, // This creates the border thickness
  },
  innerGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 11, // Slightly smaller than outer radius
  },
  title: {
    color: "#F5F4F1",
    fontSize: 22,
    fontWeight: "600", lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
  description: {
    color: "#D7B877",
    fontSize: 16,
    fontWeight: "medium",
  },
});

export default Workout;
