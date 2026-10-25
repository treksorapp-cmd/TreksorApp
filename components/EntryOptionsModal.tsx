"use client"

import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useState } from "react"
import {
    Alert,
    Dimensions,
    Modal,
    Animated as RNAnimated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"

const { width } = Dimensions.get("window")

interface EntryOptionsModalProps {
  visible: boolean
  onClose: () => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  entryId: string
}

export default function EntryOptionsModal({
  visible,
  onClose,
  onView,
  onEdit,
  onDelete,
  entryId,
}: EntryOptionsModalProps) {
  const [fadeAnim] = useState(new RNAnimated.Value(0))
  const [scaleAnim] = useState(new RNAnimated.Value(0.8))

  const showModal = () => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      RNAnimated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const hideModal = () => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      RNAnimated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose()
    })
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
          onDelete()
          hideModal()
        },
      },
    ])
  }

  const handleView = () => {
    onView()
    hideModal()
  }

  const handleEdit = () => {
    onEdit()
    hideModal()
  }

  if (visible) {
    showModal()
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={hideModal}>
      <RNAnimated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.overlayTouch} onPress={hideModal} activeOpacity={1} />

        <RNAnimated.View
          style={[
            styles.modalContainer,
            {
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
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Entry Options</Text>

                <TouchableOpacity style={styles.optionButton} onPress={handleView}>
                  <Ionicons name="eye-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.optionText}>View</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionButton} onPress={handleEdit}>
                  <Ionicons name="create-outline" size={24} color="#EFB33F" />
                  <Text style={styles.optionText}>Edit</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionButton} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                  <Text style={[styles.optionText, styles.deleteText]}>Delete</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={hideModal}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </LinearGradient>
        </RNAnimated.View>
      </RNAnimated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayTouch: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: width - 60,
    borderRadius: 16,
    overflow: "hidden",
  },
  borderGradient: {
    borderRadius: 16,
    padding: 1,
  },
  innerGradient: {
    borderRadius: 15,
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 24, lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  optionText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginLeft: 16,
    flex: 1,
  },
  deleteText: {
    color: "#FF6B6B",
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
})
