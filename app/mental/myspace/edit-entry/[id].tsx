"use client"

import { useMySpaceStore } from "@/store/myspace-store"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width, height } = Dimensions.get("window")

// List of mood options
const moodOptions = ["Happy", "Sad", "Stressed", "Anxious", "Calm", "Frustrated", "Grateful", "Tired"]

export default function EditEntryScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams()
  const { myspaces, updateMySpace } = useMySpaceStore()
  const [mood, setMood] = useState("Happy")
  const [entryText, setEntryText] = useState("")
  const [showMoodDropdown, setShowMoodDropdown] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Find the entry by ID
  const entry = myspaces.find((space) => space.id === id)

  useEffect(() => {
    if (entry) {
      setMood(entry.mood)
      setEntryText(entry.text)
    }
  }, [entry])

  useEffect(() => {
    if (entry) {
      const hasTextChanged = entryText !== entry.text
      const hasMoodChanged = mood !== entry.mood
      setHasChanges(hasTextChanged || hasMoodChanged)
    }
  }, [mood, entryText, entry])

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert("Unsaved Changes", "You have unsaved changes. Are you sure you want to go back?", [
        {
          text: "Stay",
          style: "cancel",
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => router.back(),
        },
      ])
    } else {
      router.back()
    }
  }

  const handleSaveEntry = () => {
    if (!entry) return

    if (!entryText.trim()) {
      Alert.alert("Error", "Please enter some text for your entry.")
      return
    }

    updateMySpace(entry.id, { mood, text: entryText.trim() })
    router.back()
  }

  const selectMood = (selectedMood: string) => {
    setMood(selectedMood)
    setShowMoodDropdown(false)
  }

  if (!entry) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Entry not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Entry</Text>
        <TouchableOpacity
          style={[styles.headerButton, !hasChanges && styles.disabledButton]}
          onPress={handleSaveEntry}
          disabled={!hasChanges}
        >
          <Text style={[styles.saveText, !hasChanges && styles.disabledText]}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image source={require("@/assets/images/new-entry.png")} style={styles.illustration} contentFit="contain" />
          </View>

          {/* Mood Selector */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Select Mood</Text>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowMoodDropdown(!showMoodDropdown)}>
              <Text style={styles.dropdownButtonText}>{mood}</Text>
              <Ionicons name={showMoodDropdown ? "chevron-up" : "chevron-down"} size={20} color="#E5B94B" />
            </TouchableOpacity>

            {showMoodDropdown && (
              <ScrollView style={styles.dropdownMenu}>
                {moodOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.dropdownItem, mood === option && styles.dropdownItemSelected]}
                    onPress={() => selectMood(option)}
                  >
                    <Text style={[styles.dropdownItemText, mood === option && styles.dropdownItemTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Entry Text Input */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Edit entry text</Text>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Write your thoughts here..."
              placeholderTextColor="#666"
              value={entryText}
              onChangeText={setEntryText}
              textAlignVertical="top"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, !hasChanges && styles.disabledSaveButton]}
            onPress={handleSaveEntry}
            activeOpacity={0.8}
            disabled={!hasChanges}
          >
            <Text style={[styles.saveButtonText, !hasChanges && styles.disabledSaveButtonText]}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    color: "#FFFFFF", lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EFB33F",
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#666",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  illustrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    height: height * 0.2,
  },
  illustration: {
    width: width * 0.6,
    height: "100%",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 10, lineHeight: 25, letterSpacing: -0.2, includeFontPadding: false, },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  dropdownMenu: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#333",
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  dropdownItemSelected: {
    backgroundColor: "rgba(229, 185, 75, 0.2)",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  dropdownItemTextSelected: {
    color: "#E5B94B",
  },
  textInput: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    padding: 15,
    color: "#FFFFFF",
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#333",
  },
  saveButton: {
    backgroundColor: "#EFB33F",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  disabledSaveButton: {
    backgroundColor: "#333",
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  disabledSaveButtonText: {
    color: "#666",
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
    backgroundColor: "#EFB33F",
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
