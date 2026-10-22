"use client"

import Header from "@/components/ui/Header"
import { Nutritions } from "@/mock/nutrition"
import { useAuthStore } from "@/store/auth-store"
import { Ionicons } from "@expo/vector-icons"
import { ImageBackground } from "expo-image"
import { router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import {
  Dimensions,
  Linking,
  Pressable,
  Animated as RNAnimated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface SupplementData {
  id: string
  name: string
  backgroundImage: string
  description: string
  warning: string
  source: string
  url: string
}

const SupplementDetails = () => {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams()
  const [supplement, setSupplement] = useState<SupplementData | null>(null)
  const [fadeAnim] = useState(new RNAnimated.Value(0))
  const [slideAnim] = useState(new RNAnimated.Value(30))
  const [scaleAnim] = useState(new RNAnimated.Value(0.8))
  const supplementsData = Nutritions['supplements'].data;
  const { user } = useAuthStore();

  useEffect(() => {
    // Load supplement data based on ID
    const supplementKey = id as keyof typeof supplementsData
    const supplement = supplementsData.find(supplement => supplement.id === supplementKey);
    if (supplement) {
      const supplementInfo = supplement as SupplementData
      setSupplement(supplementInfo)

      // Start entrance animations
      RNAnimated.parallel([
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        RNAnimated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        RNAnimated.timing(scaleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [id])

  const handleBackPress = () => {
    router.back()
  }

  if (!supplement) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading supplement...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={supplement.backgroundImage}
        contentFit="cover"
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        {/* Header */}
         {!user?.plan && <Header showTitle={false} showBackButton={false} showAvatar={false} />}
        <View style={[styles.header, { paddingTop: user?.plan && (insets.top + 10), position: !user?.plan ? "relative": "absolute" }]}>
          <View style={styles.backButton} />
          <Text style={styles.headerTitle}>{supplement.name}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content]}
          showsVerticalScrollIndicator={false}
        >
          <RNAnimated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Product Title */}
            <Text style={styles.productTitle}>{supplement.name}</Text>

            {/* Description */}
            <View style={styles.descriptionContainer}>
              {/* <LinearGradient
                colors={["rgba(0, 0, 0, 0.7)", "rgba(0, 0, 0, 0.9)"]}
                style={styles.descriptionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              > */}
                <Text style={styles.description}>{supplement.description}</Text>

                {/* Warning Note */}
                <View style={styles.warningContainer}>
                  <Text style={styles.warningText}>{supplement.warning}</Text>
                </View>
                <View style={styles.warningContainer}>
                   <Pressable onPress={() => {
                  // Open the URL in a web browser
                  if (supplement.url) {
                    // Using Linking API to open URL
                      Linking.openURL(supplement.url)
                  }
                }}>
                  {/* <Text style={[styles.sourceText, { textDecorationLine: 'underline', color: '#3498db' }]}>Click Here for Reference</Text> */}
                  <Text style={[styles.sourceText, { textDecorationLine: 'underline', color: '#3498db' }]}>{supplement.source}</Text>
                </Pressable>
                </View>
               
              {/* </LinearGradient> */}
            </View>
          </RNAnimated.View>
        </ScrollView>
      </ImageBackground>
    </View>
  )
}

export default SupplementDetails

const { width, height } = Dimensions.get("window")

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0A0A",
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
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 200, // Account for header
  },
  contentContainer: {
    width: "100%",
    alignItems: "center",
  },
  productImageContainer: {
    marginBottom: 30,
    alignItems: "center",
  },
  productImage: {
    width: width * 0.4,
    height: height * 0.25,
    maxWidth: 200,
    maxHeight: 300,
  },
  productTitle: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 30,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: 'Nunito-Regular'
  },
  descriptionContainer: {
    width: "100%",
    // borderRadius: 16,
    overflow: "hidden",
    // marginTop: 20,
  },
  descriptionGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
  },
  description: {
    fontSize: 18,
    color: "#FFFFFF",
    lineHeight: 24,
    textAlign: "left",
    marginBottom: 20,
    fontFamily: 'Nunito-Regular'
  },
  warningContainer: {
    // marginTop: 10,
    // paddingTop: 20,
    borderTopWidth: 1,
    // borderTopColor: "rgba(243, 156, 18, 0.3)",
  },
  warningText: {
    fontSize: 16,
    color: "#F39C12",
    fontWeight: "600",
    textAlign: "left",
    lineHeight: 20,
    fontFamily: 'Nunito-Regular'
  },
  sourceText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    textAlign: "left",
    lineHeight: 20,
    fontFamily: 'Nunito-Regular',
    marginTop: 10
  },
})
