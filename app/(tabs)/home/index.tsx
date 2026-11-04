"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { ritualCards } from "@/mock/rituals";
import { useArticleStore } from "@/store/article-store";
import { useAuthStore } from "@/store/auth-store";
import { usePowerThoughtStore } from "@/store/thought-store";
import { useUserStore } from "@/store/user-store";
import { PowerThought } from "@/types/powerThought";
import { RitualCard } from "@/types/ritualCard";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView
} from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const cardWidth = (width - 60) / 2; // Account for padding and gap

export default function HomeScreen() {
  const {powerThoughts, fetchPowerThoughts, markPowerThoughtAsRead} = usePowerThoughtStore();
  const [currentThoughtIndex, setCurrentThoughtIndex] = useState(0);
  const [homePowerThoughts, setHomePowerThoughts] = useState<PowerThought[]>([]);
  const thoughtsRef = useRef<FlatList>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<Set<string>>(new Set());
  const {pushToken} = useNotifications();
  const {getUnreadArticlesCount} = useArticleStore();
  const {savePushToken} = useUserStore();
  const { getCurrentUser } = useAuthStore();

  useEffect(() => {
    getCurrentUser();
  }, []);
  
  useEffect(()=>{
    if(pushToken && pushToken?.data) {
      savePushToken({ pushToken:pushToken?.data });
    }
  },[pushToken,savePushToken])

  useEffect(()=>{
    fetchPowerThoughts();
    getUnreadArticlesCount();
  },[fetchPowerThoughts]);

  useEffect(() => {
    if(powerThoughts){      
      const firstUnreadThoughts = powerThoughts.filter(thought => !thought.isRead).slice(0, 3);
      const todayThought = powerThoughts.find(thought => thought.isToday);
      
      const selected = [todayThought, ...firstUnreadThoughts]
        .filter((thought): thought is PowerThought => Boolean(thought));
      setHomePowerThoughts(
        selected.filter((thought, index, items) =>
          items.findIndex((candidate) => candidate._id === thought._id) === index
        ).slice(0, 3)
      );
    }
  },[powerThoughts])

  const toggleExpand = (id: string) => {
    setExpandedThoughts(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleMarkAsRead = (id: string) => {
    markPowerThoughtAsRead(id);
  };

  const handleRitualPress = (ritual: RitualCard) => {
    if (ritual.isLocked) {
      return; // Don't navigate if locked
    }
    router.push(ritual.route);
  };

  const renderRitualCard = (ritual: RitualCard) => {
    return (
      <TouchableOpacity
        key={ritual.id}
        style={[styles.ritualCard, { backgroundColor: ritual.backgroundColor }]}
        onPress={() => handleRitualPress(ritual)}
        activeOpacity={0.8}
      >
        {ritual.isLocked ? (
          <ImageBackground
            source={ritual.image}
            style={styles.cardImage}
            imageStyle={styles.cardImageStyle}
          >
            <BlurView intensity={20} style={styles.blurOverlay}>
              <View style={styles.lockedCard}>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { marginBottom: 15 }]}>
                    {ritual.title}
                  </Text>
                  <Text style={styles.lockedText}>{ritual.availableDate}</Text>
                </View>
              </View>
            </BlurView>
          </ImageBackground>
        ) : (
          <ImageBackground
            source={ritual.image}
            style={styles.cardImage}
            imageStyle={styles.cardImageStyle}
          >
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{ritual.title}</Text>
                <View style={styles.ritualProgress}>
                  <Text style={styles.progressText}>Explore pillar</Text>
                  <Ionicons name="arrow-forward" size={16} color="#EFB33F" />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        )}
      </TouchableOpacity>
    );
  };

  const renderPowerThought = ({
    item,
    index,
  }: {
    item: PowerThought;
    index: number;
  }) => {
    const isRead = item.isRead;
    const isExpanded = expandedThoughts.has(item._id);

    return (
      <View style={styles.powerThoughtCard}>
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
            <View>
              <Text style={styles.powerThoughtCategory}>Power Thought</Text>
              <Text style={styles.powerThoughtContent} onPress={() => toggleExpand(item._id)} numberOfLines={isExpanded ? undefined: 3}>{item.thought}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.markAsReadButton,
                isRead && styles.markAsReadButtonRead,
              ]}
              onPress={() => handleMarkAsRead(item._id)}
              accessibilityRole="button"
              accessibilityLabel={isRead ? "Thought already read" : "Mark thought as read"}
              disabled={isRead}
            >
              <Ionicons
                name={"checkmark"}
                size={14}
                color="#02050C"
                style={{
                  backgroundColor: "#EFB33F",
                  borderRadius: 6,
                  borderColor: "#EFB33F",
                }}
              />
              <Text
                style={[
                  styles.markAsReadText,
                  isRead && styles.markAsReadTextRead,
                ]}
              >
                {isRead ? "Read" : "Mark as read"}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>YOUR JOURNEY</Text>
          <Text style={styles.sectionTitle}>The four pillars</Text>
        </View>
          {/* <View style={styles.streakContainer}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>4-Day Streak</Text>
          </View>
        </View> */}

        {/* Ritual Cards Grid */}
        <View style={styles.ritualsGrid}>
          <View style={styles.ritualsRow}>
            {renderRitualCard(ritualCards[0])}
            {renderRitualCard(ritualCards[1])}
          </View>
          <View style={styles.ritualsRow}>
            {renderRitualCard(ritualCards[2])}
            {renderRitualCard(ritualCards[3])}
          </View>
        </View>

        {/* Power Thought Section */}
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>DAILY REFLECTION</Text>
          <Text style={styles.sectionTitle}>A moment to reset</Text>
        </View>
        <View style={styles.powerThoughtSection}>
          <FlatList
            ref={thoughtsRef}
            data={homePowerThoughts}
            renderItem={renderPowerThought}
            keyExtractor={(item) => item._id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyReflection}>A new reflection will appear here soon.</Text>}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              setCurrentThoughtIndex(index);
            }}
          />

          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            {homePowerThoughts.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentThoughtIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          {/* Power Thought Icon */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionHeading: {
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 14,
  },
  sectionEyebrow: {
    color: "#EFB33F",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
    marginBottom: 5,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  emptyReflection: {
    color: "#BAC2CF",
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 10,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  streakText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  ritualsGrid: {
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  ritualsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  ritualCard: {
    width: cardWidth,
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardImage: {
    flex: 1,
    justifyContent: "flex-end",
  },
  cardImageStyle: {
    borderRadius: 16,
  },
  cardGradient: {
    flex: 1,
    justifyContent: "flex-end",
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  ritualProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderColor: "#EFB33F",
    borderWidth: 1,
  },
  progressNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#EFB33F",
  },
  progressText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  lockedCard: {
    flex: 1,
    justifyContent: "flex-end",
  },
  blurOverlay: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  lockIcon: {
    marginBottom: 8,
    opacity: 0.7,
  },
  lockedText: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
    opacity: 0.7,
  },
  powerThoughtSection: {
    position: "relative",
    marginBottom: 100,
  },
  powerThoughtCard: {
    minHeight: 200,
    width: width - 40,
    // backgroundColor: "#1A1A1A",
    borderRadius: 16,
    // padding: 20,
    marginHorizontal: 20,
    // borderColor:"gray",
    // borderWidth:1
  },
  powerThoughtCategory: {
    fontSize: 16,
    color: "#EFB33F",
    fontWeight: "600",
    marginBottom: 12,
  },
  powerThoughtContent: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "600",
    lineHeight: 32,
    marginBottom: 20,
    overflow: "hidden",
  },
  markAsReadButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  markAsReadButtonRead: {
    backgroundColor: "rgba(239, 179, 63, 0.12)",
  },
  markAsReadText: {
    color: "#FFFFFF",
    fontSize: 13,
    marginLeft: 8,
  },
  markAsReadTextRead: {
    color: "#EFB33F",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#EFB33F",
  },
  powerThoughtIcon: {
    position: "absolute",
    bottom: -10,
    left: 10,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  borderGradient: {
    borderRadius: 12,
    padding: 1, // This creates the border thickness
    minHeight: 200,
  },
  innerGradient: {
    // flexDirection: "row",
    // justifyContent: "center",
    // alignItems: "center",
    borderRadius: 11, // Slightly smaller than outer radius
    padding: 10,
    minHeight: 200,
    justifyContent:'space-between',
  },
  checkmarkContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F39C12",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
});
