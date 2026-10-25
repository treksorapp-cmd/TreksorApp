"use client"

import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import { StyleSheet, Text, TouchableOpacity } from "react-native"
import Svg, { Circle } from "react-native-svg"

interface AudioControlButtonProps {
  isAudioDownloaded: boolean
  isPlaying: boolean
  downloadProgress: number
  isDownloading: boolean
  onPress: () => void
}

export default function AudioControlButton({
  isAudioDownloaded,
  isPlaying,
  downloadProgress,
  isDownloading,
  onPress,
}: AudioControlButtonProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    setAnimatedProgress(downloadProgress)
  }, [downloadProgress])

  const getIconName = () => {
    if (!isAudioDownloaded) {
      return isDownloading ? "stop" : "download"
    }
    return isPlaying ? "pause" : "play"
  }

  const getButtonText = () => {
    if (!isAudioDownloaded && isDownloading) {
      return `${Math.round(downloadProgress)}%`
    }
    return null
  }

  // Circle progress calculation
  const radius = 25
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference

  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
      {/* Progress Circle (only show during download) */}
      {!isAudioDownloaded && isDownloading && (
        <Svg width={60} height={60} style={styles.progressCircle}>
          {/* Background circle */}
          <Circle cx={30} cy={30} r={radius} stroke="rgba(255, 255, 255, 0.2)" strokeWidth={3} fill="transparent" />
          {/* Progress circle */}
          <Circle
            cx={30}
            cy={30}
            r={radius}
            stroke="#D7B877"
            strokeWidth={3}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 30 30)`}
          />
        </Svg>
      )}

      {/* Icon */}
      <Ionicons name={getIconName()} size={30} color="#FFFFFF" style={styles.icon} />

      {/* Progress Text */}
      {getButtonText() && <Text style={styles.progressText}>{getButtonText()}</Text>}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -30 }, { translateY: -30 }],
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  progressCircle: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  icon: {
    zIndex: 2,
  },
  progressText: {
    position: "absolute",
    bottom: -20,
    fontSize: 10,
    color: "#D7B877",
    fontWeight: "600",
    textAlign: "center",
  },
})
