import BodyPageHeading from "@/components/BodyPageHeading";
import {useReflectionContext} from "@/hooks/useReflectionContext";
"use client"

import Button from "@/components/ui/Button"
import { useMySpaceStore } from "@/store/myspace-store"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

const { width, height } = Dimensions.get("window")

// List of mood options
const moodOptions = ["Happy", "Sad", "Stressed", "Anxious", "Calm", "Frustrated", "Grateful", "Tired"]

export default function NewEntryScreen() {
  const insets = useSafeAreaInsets()
  const {origin,home,trail}=useReflectionContext();
  const [mood, setMood] = useState("Happy")
  const {addMySpace} = useMySpaceStore();
  const [entryText, setEntryText] = useState("")
  const [showMoodDropdown, setShowMoodDropdown] = useState(false)

  const handleAddEntry = () => {
    if (!entryText.trim()) {
      Alert.alert("Error", "Please enter some text for your entry.")
      return
    }
    try {
      addMySpace({mood,text:entryText.trim()})
      router.replace(home);
    } catch (error) {
      Alert.alert('Unable to save entry', 'Please try again.');
    }
  }

  const selectMood = (selectedMood: string) => {
    setMood(selectedMood)
    setShowMoodDropdown(false)
  }

  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar style="light" />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
      
          <BodyPageHeading trail={trail} title="New reflection" style={{paddingHorizontal:0}} />
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require("@/assets/images/new-entry.png")}
              style={styles.illustration}
              contentFit="contain"
            />
          </View>

          {/* Mood Selector */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowMoodDropdown(!showMoodDropdown)}>
              <Text style={styles.dropdownButtonText}>{mood}</Text>
              <Ionicons name={showMoodDropdown ? "chevron-up" : "chevron-down"} size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {showMoodDropdown && (
              <View style={styles.dropdownMenu}>
              <ScrollView 
                style={styles.dropDownScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
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
              </View>
            )}
          </View>

          {/* Entry Text Input */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Your reflection</Text>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder={origin === "purpose" ? "What matters to you, and what is one step you can take?" : "Write your thoughts here..."}
              placeholderTextColor="#666"
              value={entryText}
              onChangeText={setEntryText}
              textAlignVertical="top"
            />
          </View>

          {/* Add Button */}
          <Button iconName="checkmark-outline" onPress={handleAddEntry}>SAVE ENTRY</Button>
          <View style={styles.bottomPadding} />
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingVertical: 20,
  },
  illustrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    height: 110, // Responsive height
  },
  illustration: {
    width: "70%",
    height: "100%",
  },
  sectionContainer: {
    marginBottom: 24,
    zIndex: 1000,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F5F4F1",
    marginBottom: 10, lineHeight: 23, letterSpacing: -0.2, includeFontPadding: false, },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  dropdownMenu: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
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
    color: "#D7B877",
  },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 15,
    color: "#FFFFFF",
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  addButton: {
    backgroundColor: "#D7B877",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  bottomPadding: {
    height: 100, // Extra padding for keyboard
  },
  dropDownScroll: {
    maxHeight: 200,
  }
})
