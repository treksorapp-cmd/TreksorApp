"use client"

import type React from "react"
import { useEffect } from "react"
import { StyleSheet, Text, View } from "react-native"
import Animated, { Easing, interpolate, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated"
import Svg, { Circle } from "react-native-svg"

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface AnimatedDonutChartProps {
  percentage: number
  size?: number
  strokeWidth?: number
  color: string
}

const AnimatedDonutChart: React.FC<AnimatedDonutChartProps> = ({
  percentage,
  size = 60,
  strokeWidth = 4,
  color,
}) => {
  const progress = useSharedValue(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    progress.value = withTiming(Math.min(1, Math.max(0, percentage / 100)), {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    })
  }, [percentage])

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = interpolate(progress.value, [0, 1], [circumference, 0])

    return {
      strokeDashoffset,
    }
  })

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Circle */}
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#D9D9D9" strokeWidth={strokeWidth} fill="transparent" />
        {/* Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={[styles.percentageText,{fontSize: Math.max(14, size / 5.8)}]}>{Math.round(percentage)}%</Text>
        <Text style={[styles.completeText,{fontSize: Math.max(10, size / 7)}]}>Complete</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  svg: {
    position: "absolute",
  },
  textContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  percentageText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  completeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "500",
    marginTop: -2,
  },
})

export default AnimatedDonutChart
