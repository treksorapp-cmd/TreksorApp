import {useSafeAreaInsets} from "react-native-safe-area-context";
"use client"

import { Ionicons } from "@expo/vector-icons"
import { Redirect, router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import React, { useState } from "react"
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"

import Button from "@/components/ui/Button"
import TextInput from "@/components/ui/TextInput"
import { useAuthStore } from "@/store/auth-store"

export default function ResetPassword() {
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams();
  if(!token)
  {
    return <Redirect href={"/"} />
  }
  const {resetPassword, loading} = useAuthStore();
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  })
  const [success, setSuccess] = useState(false)

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const slideAnim = React.useRef(new Animated.Value(50)).current

  React.useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const validateForm = () => {
    let valid = true
    const newErrors = { password: "", confirmPassword: "" }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required"
      valid = false
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
      valid = false
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
      valid = false
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match"
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleResetPassword = () => {
    Keyboard.dismiss()

    if (validateForm()) {
      resetPassword({
        token: token as string,
        password: password
      }).then(() => {
        if (!useAuthStore.getState().error) setSuccess(true)
      });
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.overlay} />
        <Animated.View
          style={[
            styles.content,
              {paddingTop:insets.top+12,paddingBottom:insets.bottom+24},
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {!success ? (
            <>
              <Text style={styles.heading}>Reset Password</Text>
              <Text style={styles.subHeading}>Create a new password for your account</Text>

              <View style={styles.form}>
                <TextInput
                  placeholder="New Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  icon="lock-closed-outline"
                  error={errors.password}
                />

                <TextInput
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  icon="shield-checkmark-outline"
                  error={errors.confirmPassword}
                />

                <Button onPress={handleResetPassword} loading={loading}>
                  RESET PASSWORD
                </Button>
              </View>
            </>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#D7B877" />
              </View>

              <Text style={styles.heading}>Password Reset</Text>
              <Text style={styles.subHeading}>Your password has been successfully reset</Text>
              <View style={{marginTop: 20}}>
                <Button onPress={() => router.replace("/login")}>
                  BACK TO LOGIN
                </Button>
              </View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // adjust opacity as needed
    zIndex: -1,
  },
  backButton: { alignSelf:"flex-start", minWidth:44, minHeight:44, justifyContent:"center", marginBottom:20 },
  heading: {
    fontSize: 34,
    fontWeight: "600",
    color: "#F5F4F1",
    textAlign: "center", lineHeight: 42, letterSpacing: -0.6, includeFontPadding: false, },
  subHeading: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 30,
    paddingHorizontal: 20, lineHeight: 23, fontWeight: "600", letterSpacing: -0.2, includeFontPadding: false, },
  form: {
    width: "100%",
    alignItems: "center",
  },
  successContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  successIconContainer: {
    marginBottom: 20,
  },
})
