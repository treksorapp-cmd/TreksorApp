import {useSafeAreaInsets} from "react-native-safe-area-context";
import {colors} from "@/theme/architect";
"use client"

import { generateRandomId } from "@/lib/utils"
import { useTrackingStore } from "@/store/tracking-store"
import { Ionicons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
  Modal,
  Animated as RNAnimated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

const { width } = Dimensions.get("window")

interface AddTrackerModalProps {
  visible: boolean
  onClose: () => void
}

const categories = ["Body", "Mental", "Spiritual"] as const

export default function AddTrackerModal({ visible, onClose }: AddTrackerModalProps) {
  const insets=useSafeAreaInsets();
  const { addTrackingCategory } = useTrackingStore()

  const [formData, setFormData] = useState({
    title: "",
    percentage: 0,
    items: [
      { id: generateRandomId(), label: "", value: "" },
    ],
  })

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter a category title")
      return
    }

    const validItems = formData.items.filter((item) => item.label.trim() && item.value.trim())

    if (validItems.length === 0) {
      Alert.alert("Error", "Please add at least one tracking item")
      return
    }

    addTrackingCategory({
      id: generateRandomId(),
      title: formData.title.trim(),
      percentage: formData.percentage,
      items: validItems,
      custom: true
    })

    // Reset form
    setFormData({
      title: "",
      percentage: 0,
      items: [
        { id: "", label: "", value: "" },
      ],
    })

    onClose()
  }

  const updateItem = (index: number, field: "label" | "value", value: string) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} style={{flex:1}} keyboardVerticalOffset={0}><BlurView intensity={20} style={[styles.overlay,{paddingTop:insets.top+12,paddingBottom:insets.bottom+12}]}>
        <RNAnimated.View style={[styles.modalContainer]}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Add a tracker</Text>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close" style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:25}}>
                {/* Tracker name */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Tracker name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Fitness, Learning, Habits"
                    placeholderTextColor="#666"
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                  />
                </View>

                {/* Initial Percentage */}
                {/* <View style={styles.formGroup}>
                  <Text style={styles.label}>Initial Progress (%)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    placeholderTextColor="#666"
                    value={formData.percentage.toString()}
                    onChangeText={(text) => setFormData({ ...formData, percentage: Number.parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View> */}

                {/* Tracking Items */}
                <View style={styles.formGroup}>
                  <View style={styles.itemsHeader}>
                    <Text style={styles.label}>Tracking Items</Text>
                  </View>

                  {formData.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <View style={styles.itemInputs}>
                        <TextInput
                          style={[styles.textInput, styles.itemInput]}
                          placeholder="Label (e.g., Workouts)"
                          placeholderTextColor="#666"
                          value={item.label}
                          onChangeText={(text) => updateItem(index, "label", text)}
                        />
                        <TextInput
                          style={[styles.textInput, styles.itemInput]}
                          placeholder="Value (e.g., 5) Days"
                          placeholderTextColor="#666"
                          value={item.value}
                          onChangeText={(text) => {
                          const numericValue = text.replace(/[^0-9]/g, "")
                          updateItem(index, "value", numericValue)
                          }}
                          keyboardType="numeric"
                        />
                        </View>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={()=>{Keyboard.dismiss();handleSubmit()}}>
                  <Text style={styles.addButtonText}>Add tracker</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </RNAnimated.View>
      </BlurView></KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 520,
    maxHeight: "90%",
    borderRadius: 20,
    overflow: "hidden",
  },
  gradientBorder: {
    borderRadius: 20,
    padding: 1,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 19,
    maxHeight: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    flex: 1,
    marginRight: 12,
    fontSize: 22,
    fontWeight: "600",
    color: "#F5F4F1", lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 10,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(215,184,119, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addItemText: {
    color: "#D7B877",
    fontSize: 12,
    fontWeight: "500",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  itemInputs: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  itemInput: {
    flex: 1,
  },
  removeButton: {
    padding: 8,
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    borderRadius: 6,
  },
  actions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    flex: 1,
    backgroundColor: "#D7B877",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
})
