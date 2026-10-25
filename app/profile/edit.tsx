"use client"

import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import Button from "@/components/ui/Button"
import TextInput from "@/components/ui/TextInput"
import { useAuthStore } from "@/store/auth-store"
import { Image } from "expo-image"

export default function EditProfile() {
  const insets = useSafeAreaInsets()
  const { user, updateProfile, loading, getCurrentUser, requestResetPassword } = useAuthStore()
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null)
  const [tempAvatar, setTempAvatar] = useState<string | null>(null)
  const [tempAvatarFile, setTempAvatarFile] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => { if (user?.name) setName(user.name); if (user?.avatar) setAvatar(user.avatar) }, [user?.name,user?.avatar])

  useEffect(() => {
    // Request permission for image library
    const requestPermission = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Required", "Sorry, we need camera roll permissions to upload an avatar.")
      }
    }

    requestPermission()
  }, [])

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.65,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setTempAvatar(result.assets[0].uri)
        setTempAvatarFile(result.assets[0])
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image. Please try again.")
    }
  }

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Required", "Sorry, we need camera permissions to take a photo.")
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        base64: true,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setTempAvatar(result.assets[0].uri)
        setTempAvatarFile(result.assets[0])
      }
    } catch (error) {
      console.error("Error taking photo:", error)
      Alert.alert("Error", "Failed to take photo. Please try again.")
    }
  }

  const handleAvatarOptions = () => {
    Alert.alert(
      "Change Profile Picture",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: handleTakePhoto,
        },
        {
          text: "Choose from Library",
          onPress: handlePickImage,
        },
        // {
        //   text: "Remove Current Photo",
        //   onPress: handleRemoveAvatar,
        //   style: "destructive",
        // },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true },
    )
  }

  const handleSave = async () => {
    try {
      if (!name.trim()) { Alert.alert("Name required","Please enter your name."); return; }
      setIsUploading(true)
      await updateProfile({ name: name.trim(), avatar: tempAvatarFile });
      setTempAvatar(null)
      setTempAvatarFile(null)
      Alert.alert("Profile updated","Your changes were saved successfully.")

      // Navigate back after successful update
      router.back()
    } catch (error) {
      console.error("Error updating profile:", error)
      Alert.alert("Unable to save profile", error instanceof Error ? error.message : "Please try again.")
    } finally { setIsUploading(false) }
  }

  const handleChangePassword = () => {
    requestResetPassword({ email: user?.email || "", isChangePassword: true })
        .then(() => {
            const requestError = useAuthStore.getState().error;
            if (requestError) { Alert.alert("Unable to send code", requestError); return; }
            router.push({ pathname: "/(auth)/verify-otp", params: { email:user.email, purpose: 'reset-password' } });
        })
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarOptions}>
              {isUploading ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              ) : tempAvatar || avatar ? (
                <Image source={{ uri: tempAvatar || avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{name.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.editIconContainer}>
                <LinearGradient colors={["#E8B44D", "#A87720"]} style={styles.editIconGradient}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </LinearGradient>
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Enter your name" icon="person-outline" />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Your email address"
                icon="mail-outline"
                editable={false}
                style={styles.disabledInput}
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            <View style={styles.passwordSection}>
              <Text style={styles.sectionTitle}>Security</Text>
              <TouchableOpacity style={styles.changePasswordButton} onPress={handleChangePassword}>
                <Ionicons name="lock-closed-outline" size={22} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.changePasswordText}>Change Password</Text>
                <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button onPress={handleSave} loading={loading || isUploading}>
            SAVE CHANGES
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 30,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#3B2C15",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  uploadingContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  editIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#121212",
  },
  changePhotoText: {
    color: "#E8B44D",
    fontSize: 16,
    marginTop: 12,
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  disabledInput: {
    opacity: 0.7,
  },
  helperText: {
    color: "#AAAAAA",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  passwordSection: {
    marginTop: 20,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15, lineHeight: 25, letterSpacing: -0.2, includeFontPadding: false, },
  changePasswordButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 12,
  },
  buttonIcon: {
    marginRight: 12,
  },
  changePasswordText: {
    color: "#FFFFFF",
    fontSize: 16,
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(18, 18, 18, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
})
