"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
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

export default function ForgotPassword() {
  const {requestResetPassword, loading, error: authError, clearError} = useAuthStore();
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")

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

  const validateEmail = () => {
    if (!email) {
      setError("Email is required")
      return false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email is invalid")
      return false
    }
    setError("")
    return true
  }

  const handleSendResetLink = async () => {
    Keyboard.dismiss()

    if (!validateEmail() || loading) return
    clearError()
    await requestResetPassword({ email: email.trim().toLowerCase() })
    const requestError = useAuthStore.getState().error
    if (requestError) {
      setError(requestError)
      return
    }
    router.push({ pathname: "/(auth)/verify-otp", params: { email: email.trim().toLowerCase(), purpose: "reset-password" } })
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.overlay} />
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.heading}>Reset Password</Text>
          <Text style={styles.subHeading}>
            Enter your email address and we'll send you a otp to reset your password
          </Text>

          <View style={styles.form}>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={(value) => { setEmail(value); setError(""); if (authError) clearError() }}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
              error={error}
            />

            <Button onPress={handleSendResetLink} loading={loading}>
              SEND RESET OTP
            </Button>
          </View>
        
          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // adjust opacity as needed
    zIndex: -1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
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
  resendLink: {
    marginTop: 20,
  },
  resendText: {
    color: "#3498db",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    marginTop: 30,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  signInText: {
    color: "#3498db",
    fontSize: 14,
    fontWeight: "bold",
  },
})
