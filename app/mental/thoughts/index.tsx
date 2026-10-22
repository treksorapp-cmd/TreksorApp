"use client";

import { usePowerThoughtStore } from "@/store/thought-store";
import { PowerThought } from "@/types/powerThought";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Animated as RNAnimated,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function PowerThoughtsScreen() {
  const {powerThoughts} = usePowerThoughtStore();
  const insets = useSafeAreaInsets();
  const [animatedValues] = useState(
    powerThoughts.map(() => new RNAnimated.Value(0))
  );

  useEffect(() => {
    // Stagger the card animations
    const animations = animatedValues.map((animatedValue, index) =>
      RNAnimated.timing(animatedValue, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      })
    );

    RNAnimated.stagger(80, animations).start();
  }, []);

  const handleBackPress = () => {
    router.back();
  };

  const handleShare = async (thought: PowerThought) => {
    try {
      await Share.share({
        message: `${thought.thought}\n\n- Power Thought from Treksor`,
        title: "Power Thought",
      });
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Unable to share this thought. Please try again.");
    }
  };

  const renderThoughtCard = (thought: PowerThought, index: number) => {
    const animatedValue = animatedValues[index];
    if (!animatedValue) return null;

    const translateY = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
    });

    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const scale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.95, 1],
    });

    return (
      <RNAnimated.View
        key={thought._id}
        style={[
          styles.thoughtCard,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        {/* Outer LinearGradient for the border */}
        <LinearGradient
          colors={["rgba(205,235,248,0.22)", "rgba(205,235,248,0.08)"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.borderGradient}
        >
          {/* Inner LinearGradient for the button background */}
          <LinearGradient
            colors={["rgba(183,221,240,0.10)", "rgba(183,221,240,0.045)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.innerGradient}
          >
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                {thought?.isToday ? 
                <Text style={[styles.dateText,thought.isToday && {textAlign: "center"}]}>TODAY'S THOUGHT</Text>:
                <Text style={[styles.dateText,thought.isToday && {textAlign: "center"}]}>{thought.date}</Text>}
              </View>

              <Text style={[styles.thoughtText,thought.isToday && {textAlign: "center"}]}>{thought.thought}</Text>
              <View style={styles.cardFooter}>
              <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => handleShare(thought)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>
      </RNAnimated.View>
    );
  };

  return (
    <View style={[styles.container]}>
      <StatusBar style="light" />

      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Power Thought</Text>
        <View style={styles.headerSpacer} />
      </View> */}

      <View style={[styles.titleArea,{paddingTop:insets.top+72}]}><Text style={styles.eyebrow}>MIND / DAILY INSPIRATION</Text><Text style={styles.heroTitle}>POWER THOUGHTS</Text></View>
      {/* Thoughts List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
        // showsVerticalScrollIndicator={false}
      >
        {powerThoughts.map((thought, index) =>
          renderThoughtCard(thought, index)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  titleArea:{paddingHorizontal:22,paddingBottom:22},
  eyebrow:{color:"#D7B877",fontSize:11,fontWeight:"700",letterSpacing:1.7},
  heroTitle:{color:"#FFFFFF",fontSize:34,fontWeight:"600",letterSpacing:-1.2,marginTop:9},
  container: {
    flex: 1,
    backgroundColor: "#02050C",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardFooter: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginTop: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#D7B877",
  },
  shareButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  thoughtText: {
    fontSize: 19,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 29,
    textAlign: "left",
  },
  borderGradient: {
    borderRadius: 19,
    padding: 1,
  },
  innerGradient: {
    borderRadius: 18,
    minHeight: 120, // Add minimum height
  },
  thoughtCard: {
    width: width - 40, // Account for horizontal padding
    borderRadius: 12,
    overflow: "hidden",
    // marginVertical: 8,
  },
  card: {
    width: "100%",
    padding: 20, // Add padding back
  },
});