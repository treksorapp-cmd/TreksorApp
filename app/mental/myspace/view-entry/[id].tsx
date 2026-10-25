"use client"

import { useMySpaceStore } from "@/store/myspace-store"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"
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
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width } = Dimensions.get("window")

export default function ViewEntryScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams()
  const { myspaces, deleteMySpace } = useMySpaceStore()
  const [fadeAnim] = useState(new RNAnimated.Value(0))
  const [scaleAnim] = useState(new RNAnimated.Value(0.9))

  // Find the entry by ID
  const entry = myspaces.find((space) => space.id === id)

  useState(() => {
    // Start animations
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      RNAnimated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  })

  const handleBack = () => {
    router.back()
  }

  const handleEdit = () => {
    router.push(`/mental/myspace/edit-entry/${id}`)
  }

  const handleDelete = () => {
    Alert.alert("Delete Entry", "Are you sure you want to delete this entry? This action cannot be undone.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteMySpace(id as string)
          router.back()
        },
      },
    ])
  }

  const handleShare = async () => {
    if (!entry) return

    try {
      await Share.share({
        message: `${entry.text}\n\nMood: ${entry.mood}\nDate: ${entry.date}\n\n- From My Space`,
        title: "My Space Entry",
      })
    } catch (error) {
      console.error("Error sharing:", error)
      Alert.alert("Error", "Unable to share this entry. Please try again.")
    }
  }

  if (!entry) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Entry not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>View Entry</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <RNAnimated.View
          style={[
            styles.entryContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.4)"]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.borderGradient}
          >
            <LinearGradient
              colors={["#262626", "#0a0a0a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.innerGradient}
            >
              <View style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.dateText}>{entry.date}</Text>
                  <View style={styles.mood}>
                    <Text style={styles.moodText}>{entry.mood}</Text>
                  </View>
                </View>

                <Text style={styles.entryText}>{entry.text}</Text>
              </View>
            </LinearGradient>
          </LinearGradient>
        </RNAnimated.View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color="#000000" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
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
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#F5F4F1", lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  entryContainer: {
    marginBottom: 30,
  },
  borderGradient: {
    borderRadius: 16,
    padding: 1,
  },
  innerGradient: {
    borderRadius: 15,
  },
  entryCard: {
    padding: 24,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#D7B877",
  },
  mood: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(239, 179, 63, 0.2)",
  },
  moodText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  entryText: {
    fontSize: 18,
    color: "#FFFFFF",
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 15,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D7B877",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    borderWidth: 1,
    borderColor: "#FF6B6B",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#D7B877",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
})
