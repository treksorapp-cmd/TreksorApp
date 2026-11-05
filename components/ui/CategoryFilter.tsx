"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  Animated,
  useWindowDimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from "react-native"



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
  const { width } = useWindowDimensions()
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
  }, [activeCategory, layouts, width])

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
            accessibilityRole="tab"
            accessibilityState={{selected: activeCategory === category}}
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
              {category === "Mental" ? "Mind" : category === "Spiritual" ? "Balance" : category}
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
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    // paddingHorizontal: 20,
    // paddingVertical: 20,
    marginBottom:20,
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: "center",
    minHeight: 50,
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    minHeight: 50,
    paddingVertical: 8,
    justifyContent: "center",
  },
  categoryText: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
    includeFontPadding: false,
  },
  activeCategoryText: {
    color: "#FFFFFF",
  },
  inactiveCategoryText: {
    color: 'rgba(255,255,255,0.5)',
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    backgroundColor: "#D7B877",
    borderRadius: 1.5,
  },
})

export default CategoryFilter
