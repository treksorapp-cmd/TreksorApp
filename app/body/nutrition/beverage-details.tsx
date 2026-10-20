"use client"

import Header from "@/components/ui/Header"
import { Nutritions } from "@/mock/nutrition"
import { useAuthStore } from "@/store/auth-store"
import { Ionicons } from "@expo/vector-icons"
import { ImageBackground } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { Dimensions, FlatList, Linking, Animated as RNAnimated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface Ingredient {
  id: string
  name: string
  measurement: string
}

interface BeverageData {
  id: string
  name: string
  description: string
  backgroundImage: string
  quantity: string
  ingredients: Ingredient[]
  footNote?: string
  source_1?: string
  url_1?: string
  source_2?: string
  url_2?: string
  source_3?: string
  url_3?: string
}

const BeveragesDetails = () => {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams()
  const [beverage, setBeverage] = useState<BeverageData | null>(null)
  const [animatedValues, setAnimatedValues] = useState<RNAnimated.Value[]>([])
  const beveragesData = Nutritions['beverages'].data;
  const { user } = useAuthStore();

  useEffect(() => {
    // Load beverage data based on ID
    const beverageKey = id as keyof typeof beveragesData
    const beverage = beveragesData.find(beverage => beverage.id === beverageKey);
    if (beverage) {
      const beverageInfo = beverage as BeverageData
      setBeverage(beverageInfo)

      // Create animated values for each ingredient
      const animValues = beverageInfo.ingredients.map(() => new RNAnimated.Value(0))
      setAnimatedValues(animValues)

      // Start staggered animations
      const animations = animValues.map((animValue, index) =>
        RNAnimated.timing(animValue, {
          toValue: 1,
          duration: 600,
          delay: index * 100,
          useNativeDriver: true,
        }),
      )

      RNAnimated.stagger(80, animations).start()
    }
  }, [id])

  const handleBackPress = () => {
    router.back()
  }

  const renderIngredientCard = ({ item, index }: { item: Ingredient; index: number }) => {
    const animatedValue = animatedValues[index]

    if (!animatedValue) return null

    const translateY = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
    })

    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    })

    const scale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1],
    })

    return (
      <RNAnimated.View
        style={[
          styles.ingredientCard,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <TouchableOpacity style={styles.cardTouchable} activeOpacity={0.8}>
          <LinearGradient
            colors={["rgba(0, 0, 0, 0.6)", "rgba(0, 0, 0, 0.8)"]}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Text style={styles.ingredientName}>{item.name}</Text>
            <Text style={styles.ingredientMeasurement}>{item.measurement}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </RNAnimated.View>
    )
  }

  if (!beverage) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading beverage...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={beverage.backgroundImage}
        contentFit="cover"
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        {/* Header */}
         {!user?.plan && <Header showTitle={false} showBackButton={false} showAvatar={false} />}
        <View style={[styles.header, { paddingTop: user?.plan ? insets.top + 10 : 0, position: !user?.plan ? "relative" : "absolute" }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{beverage.name}</Text>
          <View style={styles.headerSpacer} />
        </View>
  
        {/* Scrollable Content */}
        <ScrollView
          style={[styles.scrollView, { marginTop: insets.top + 60 }]} // Add marginTop to avoid overlapping
          contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%' }}>
            <Text style={{ color: "#FFFFFF", fontSize: 18, marginBottom: 20, fontWeight: 'bold',  }}>{beverage.description}</Text>
          </View>
        
          <LinearGradient
            colors={["transparent", "rgba(0, 0, 0, 0.8)", "rgba(0, 0, 0, 0.95)"]}
            style={styles.contentOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={styles.ingredientsSection}>
              <Text style={styles.ingredientsTitle}>Ingredients {beverage.quantity}:</Text>
        
              <FlatList
          data={beverage.ingredients}
          renderItem={renderIngredientCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContainer}
          scrollEnabled={false}
              />
            </View>
          </LinearGradient>
        
          {beverage.footNote && (
            <View style={{ width: '100%', marginTop: 10 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: '400',  }}>{beverage.footNote}</Text>
            </View>
          )}
          {(beverage.source_1 || beverage.source_2 || beverage.source_3) && (
            <View style={{ width: '100%', marginTop: 10 }}>
              {beverage.source_1 && beverage.url_1 && (
                <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: '400',  }}>
                  <Text style={{ textDecorationLine: 'underline', color: '#E8B44D' }} onPress={() => Linking.openURL(beverage.url_1!)}>Source 1: {beverage.source_1}</Text>
                </Text>
              )}
              {beverage.source_2 && beverage.url_2 && (
                <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: '400',  }}>
                  <Text style={{ textDecorationLine: 'underline', color: '#E8B44D' }} onPress={() => Linking.openURL(beverage.url_2!)}>Source 2: {beverage.source_2}</Text>
                </Text>
              )}
              {beverage.source_3 && beverage.url_3 && (
                <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: '400',  }}>
                  <Text style={{ textDecorationLine: 'underline', color: '#E8B44D' }} onPress={() => Linking.openURL(beverage.url_3!)}>Source 3: {beverage.source_3}</Text>
                </Text>
              )}
            </View>
          )}
        {/* </LinearGradient> */}
        </ScrollView>
      </ImageBackground>
    </View>
  )  
}

export default BeveragesDetails

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
  content: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  contentOverlay: {
    width: "100%",
  },
  ingredientsSection: {
    width: "100%",
  },
  ingredientsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    
  },
  gridContainer: {
    paddingBottom: 10,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  ingredientCard: {
    width: (width - 60) / 2, // Account for padding and gap
    minHeight: 80,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardTouchable: {
    flex: 1,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
    lineHeight: 20,
    
  },
  ingredientMeasurement: {
    fontSize: 14,
    color: "#F39C12",
    fontWeight: "500",
    lineHeight: 18,
    
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },  
})
