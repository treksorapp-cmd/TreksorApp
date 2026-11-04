"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from "react-native"

const { width } = Dimensions.get("window")

interface CategoryFilterProps {
  categories: string[]
  activeCategory: string
  onCategoryChange: (category: string) => void
}

interface CategoryLayout {
  [key: string]: {
    x: number
    width: number
  }
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, activeCategory, onCategoryChange }) => {
  const scrollViewRef = useRef<ScrollView>(null)
  const [layouts, setLayouts] = useState<CategoryLayout>({})
  const indicatorAnim = useRef(new Animated.Value(0)).current
  const indicatorWidthAnim = useRef(new Animated.Value(0)).current

  // Store layout information when a category button is rendered
  const onCategoryLayout = (category: string, event: LayoutChangeEvent) => {
    const { x, width: itemWidth } = event.nativeEvent.layout
    setLayouts((prev) => ({
      ...prev,
      [category]: { x, width: itemWidth },
    }))
  }

  // Animate the indicator when the active category changes
  useEffect(() => {
    if (layouts[activeCategory]) {
      Animated.parallel([
        Animated.timing(indicatorAnim, {
          toValue: layouts[activeCategory].x,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(indicatorWidthAnim, {
          toValue: layouts[activeCategory].width,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start()

      // Scroll to make the active category visible
      scrollViewRef.current?.scrollTo({
        x: Math.max(0, layouts[activeCategory].x - width / 4),
        animated: true,
      })
    }
  }, [activeCategory, layouts])

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={styles.categoryButton}
            onPress={() => onCategoryChange(category)}
            onLayout={(event) => onCategoryLayout(category, event)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === category ? styles.activeCategoryText : styles.inactiveCategoryText,
              ]}
            >
              {category === "Mental" ? "Mind" : category}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Animated indicator line */}
        <Animated.View
          style={[
            styles.indicator,
            {
              left: indicatorAnim,
              width: indicatorWidthAnim,
            },
          ]}
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    // paddingHorizontal: 20,
    // paddingVertical: 20,
    marginBottom:20,
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: "center",
    height: "100%",
  },
  categoryButton: {
    paddingHorizontal: 16,
    height: "100%",
    justifyContent: "center",
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  activeCategoryText: {
    color: "#FFFFFF",
  },
  inactiveCategoryText: {
    color: 'rgba(255,255,255,0.75)',
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    backgroundColor: "#EFB33F",
    borderRadius: 1.5,
  },
})

export default CategoryFilter
