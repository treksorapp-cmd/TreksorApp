"use client";

import AudioControlButton from "@/components/AudioControlButton";
import Header from "@/components/ui/Header";
import { useMediationStore } from "@/store/mediation-store";
import { Mediation } from "@/types/mediation";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  Image,
  Animated as RNAnimated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MediationDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { fetchMediationById, markMediationAsRead } = useMediationStore();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [mediation, setMediation] = useState<Mediation | null>(null);
  const [fadeAnim] = useState(new RNAnimated.Value(0));
  const [slideAnim] = useState(new RNAnimated.Value(30));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioDownloaded, setIsAudioDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const navigation = useNavigation();

  // async function playSound() {
  //   if(mediation)
  //   {
  //     const { sound } = await Audio.Sound.createAsync(
  //       { uri: mediation.audioUrl },
  //       { shouldPlay: true }
  //     );
  //     setSound(sound);
  //     setIsPlaying(true);
  //   }
  // }

  useEffect(() => {
    async function checkforAudioFile() {
      if (mediation) {
        const filename = encodeURIComponent(mediation.audioUrl);
        const fileUri = FileSystem.cacheDirectory + filename;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.exists) {
          setIsAudioDownloaded(true);
        }
      }
    }
    checkforAudioFile();
  }, [mediation]);

  async function playSound() {
    if (!mediation || !mediation.audioUrl) return;

    try {
      const filename = encodeURIComponent(mediation.audioUrl);
      const fileUri = FileSystem.cacheDirectory + filename;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      let localUri = fileUri;

      if (!fileInfo.exists) {
        setIsDownloading(true);
        const downloadResumable = FileSystem.createDownloadResumable(
          mediation.audioUrl,
          fileUri,
          {},
          (progress) => {
            const progressPercent =
              progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
            setDownloadProgress(Math.round(progressPercent * 100)); // update state
          }
        );

        const { uri } = await downloadResumable.downloadAsync();
        localUri = uri;

        setIsAudioDownloaded(true);
        setDownloadProgress(0);
        setIsDownloading(false);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });

      // Load and play from local URI
      const { sound } = await Audio.Sound.createAsync(
        { uri: localUri },
        { shouldPlay: true }
      );

      setSound(sound);
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          title={(id as string).toUpperCase()}
          showBackButton={true}
          onBackPress={() => router.back()}
          showAvatar={false}
          headerRightButton={<TouchableOpacity accessibilityRole="button" accessibilityLabel="Return to Balance" onPress={() => router.dismissTo("/spiritual")} style={{width:42,height:42,borderRadius:14,backgroundColor:"rgba(185,220,238,0.1)",borderWidth:1,borderColor:"rgba(220,239,249,0.22)",alignItems:"center",justifyContent:"center"}}><Ionicons name="shield-outline" size={22} color="#D7B877" /></TouchableOpacity>}
        />
      ),
    });
  }, [navigation, id]);

  useEffect(() => {
    fetchMediationById({ id: id as string }).then((resp) => {
      if (resp) {
        setMediation(resp);
        RNAnimated.parallel([
          RNAnimated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          RNAnimated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [id]);

  const handleMarkAsRead = () => {
    if (mediation) {
      markMediationAsRead(mediation.id);
    }
  };

  // Parse HTML content (simple implementation)
  const parseHTMLContent = (htmlString: string) => {
    // Remove HTML tags for React Native Text component
    return htmlString.replace(/<[^>]*>/g, "");
  };

  if (!mediation) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading mediation...</Text>
        </View>
      </View>
    );
  }

  async function handleAudioControlPress() {
    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      await playSound();
    }
  }

  console.log("Mediation details:", mediation);

  return (
    <View style={[styles.container]}>
      <StatusBar style="light" />

      {/* Custom Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{id.toString().toUpperCase()}</Text>
        <View style={styles.headerSpacer} />
      </View> */}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RNAnimated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Video/Image Section */}
          {/* <View style={styles.videoSection}> */}
          {/* <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture /> */}
          {mediation && (
            <View style={{ position: "relative" }}>
              <Image
                source={
                  mediation.id === "beginner"
                    ? require(`@/assets/images/meditation-beginner.png`)
                    : mediation.id === "intermediate"
                    ? require(`@/assets/images/meditation-intermediate.png`)
                    : require(`@/assets/images/meditation-advanced.png`)
                }
                style={styles.meditationImage}
                resizeMode="cover"
              />
              {/* <TouchableOpacity
                style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: [{ translateX: -30 }, { translateY: -30 }],
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: 30,
                width: 60,
                height: 60,
                justifyContent: 'center',
                alignItems: 'center',
                }}
                onPress={async () => {
                  if (sound) {
                    const status = await sound.getStatusAsync();
                    if (status.isPlaying) {
                      await sound.pauseAsync();
                      setIsPlaying(false);
                    } else {
                      await sound.playAsync();
                      setIsPlaying(true);
                    }
                  } else {
                    await playSound();
                  }
                }}
                
              >
                <Ionicons
                name={!isAudioDownloaded ? 'download' : isPlaying ? 'pause' : 'play'}
                size={30}
                color="#FFFFFF"
                />
              </TouchableOpacity> */}
              <AudioControlButton
                isAudioDownloaded={isAudioDownloaded}
                isPlaying={isPlaying}
                downloadProgress={downloadProgress}
                isDownloading={isDownloading}
                onPress={handleAudioControlPress}
              />
            </View>
          )}
          {/* </View> */}

          {/* Content Section */}
          <View style={styles.contentSection}>
            <View style={styles.titleRow}>
              <Text style={styles.workoutTitle}>{mediation.title.toUpperCase()}</Text>
            </View>

            <Text style={styles.description}>
              {parseHTMLContent(mediation.content.description)}
            </Text>

            <View style={styles.goalsSection}>
              <Text style={styles.goalsTitle}>What You'll Experience:</Text>
              {mediation.content.experience.map((goal, index) => (
                <View key={index} style={styles.goalItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.goalText}>{goal}</Text>
                </View>
              ))}
              {/* horizontal line  */}
              <View
                style={{
                  borderBottomColor: "rgba(255, 255, 255, 0.1)",
                  borderBottomWidth: 1,
                  marginVertical: 20,
                }}
              />
              <Text style={styles.goalText}>
                Note: These practices are intended for relaxation and
                mindfulness only. They are not medical or psychological
                treatment. If you have any health concerns or conditions,
                consult your doctor before starting.
              </Text>
              {/* <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: "400",
                  fontFamily: "Nunito-Regular",
                }}
              >
                <Text
                  style={{ textDecorationLine: "underline", color: "#3498db" }}
                  onPress={() => Linking.openURL(mediation.url!)}
                >
                  {mediation?.source}
                </Text>
              </Text> */}
            </View>
          </View>
        </RNAnimated.View>
      </ScrollView>

      {/* Mark as Read Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.markAsReadButton,
            mediation.isRead && styles.markAsReadButtonRead,
          ]}
          onPress={handleMarkAsRead}
          disabled={mediation.isRead}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              mediation.isRead ? ["#4CAF50", "#45A049"] : ["#D7B877", "#E67E22"]
            }
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>
              {mediation.isRead ? "Read ✓" : "Mark as read"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02050C",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#F5F4F1", lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
  headerSpacer: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 120,
  },
  animatedContainer: {
    flex: 1,
  },
  // videoSection: {
  //   position: "relative",
  //   marginHorizontal: 20,
  //   marginTop: 20,
  //   borderRadius: 16,
  //   overflow: "hidden",
  // },
  videoThumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  playButtonBlur: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  statsOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  statsBlur: {
    borderRadius: 12,
    overflow: "hidden",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 8,
    marginRight: 4,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 15,
  },
  contentSection: {
    padding: 20,
  },
  workoutTitle: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.2,
    color: "#F5F4F1", lineHeight: 29, includeFontPadding: false, },
  description: {
    fontSize: 16,
    color: "#CCCCCC",
    lineHeight: 24,
    marginBottom: 24,
  },
  goalsSection: {
    marginTop: 8,
  },
  goalsTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#F5F4F1",
    marginBottom: 16, lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
  goalItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D7B877",
    marginTop: 8,
    marginRight: 12,
  },
  goalText: {
    fontSize: 16,
    color: "#CCCCCC",
    lineHeight: 24,
    flex: 1,
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10, 10, 10, 0.95)",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  markAsReadButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  markAsReadButtonRead: {
    opacity: 0.8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 50,
  },
  video: {
    width: "100%",
    height: 275,
    borderRadius: 12,
  },
  controlsContainer: {
    padding: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  meditationImage: {
    width: "93%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "gray",
    alignSelf: "center",
  },
});
