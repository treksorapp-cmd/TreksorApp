"use client"

import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import React, { useEffect, useRef, useState } from "react"
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
import OtpInput from "@/components/ui/OtpInput"
import { useAuthStore } from "@/store/auth-store"

export default function VerifyOtp() {
  const { verifyOtp, loading, getCurrentUser, requestOtp, requestResetPassword} = useAuthStore();
  const params = useLocalSearchParams()
  const { email, purpose = "registration" } = params

  const codeLength = purpose === "reset-password" ? 8 : 6
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [timeLeft, setTimeLeft] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const [resendNotice, setResendNotice] = useState("")
  const timerRef = useRef<number | null>(null)

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const slideAnim = React.useRef(new Animated.Value(50)).current

  useEffect(() => {
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

    // Start countdown timer
    startTimer()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startTimer = () => {
    setTimeLeft(30)
    setCanResend(false)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current!)
          setCanResend(true)
          return 0
        }
        return prevTime - 1
      })
    }, 1000)
  }

  const handleVerify = () => {
    Keyboard.dismiss()

    if (!otp || otp.length !== codeLength) {
      setError(`Please enter a valid ${codeLength}-digit code`)
      return
    }

    setError("")
    setResendNotice("")

    verifyOtp({ email: email as string, otp, type: purpose as string }).then((token)=>{
      if(purpose === 'reset-password')
      {
        if (token) router.push({ pathname: "/(auth)/reset-password", params: { token } });
      }
      else if (useAuthStore.getState().isAuthenticated) {
        getCurrentUser();
      }
      const authError = useAuthStore.getState().error
      if (authError) setError(authError)
    })
  }

  const handleResendCode = () => {
    if (!canResend || loading) return
    setError("")
    setResendNotice("")

    const resend = purpose === "reset-password"
      ? requestResetPassword({ email: email as string })
      : requestOtp({ email: email as string })
    resend.then(() => {
      const resendError = useAuthStore.getState().error
      if (resendError) {
        setError(resendError)
        return
      }
      setOtp("")
      setResendNotice("Request accepted. Email delivery is not guaranteed. Check your inbox and spam folder.")
      startTimer()
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
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

          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark-outline" size={60} color="#3498db" />
          </View>

          <Text style={styles.heading}>Verification Code</Text>
          <Text style={styles.subHeading}>
            If a code was issued, it will be sent to {email}. Enter the {codeLength}-digit code to verify your{" "}
            {purpose === "reset-password" ? "identity" : "account"}.
          </Text>

          <OtpInput codeLength={codeLength} onCodeFilled={setOtp} error={!!error} />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {resendNotice ? <Text style={styles.noticeText}>{resendNotice}</Text> : null}

          <Button onPress={handleVerify} loading={loading}>
            VERIFY
          </Button>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResendCode} disabled={loading}>
                <Text style={styles.resendButton}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>Resend in {formatTime(timeLeft)}</Text>
            )}
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
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  heading: {
    fontSize: 34,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center", lineHeight: 42, letterSpacing: -0.6, includeFontPadding: false, },
  subHeading: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 20, lineHeight: 25, fontWeight: "600", letterSpacing: -0.2, includeFontPadding: false, },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  noticeText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    marginBottom: 16,
    textAlign: "center",
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  resendText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  resendButton: {
    color: "#3498db",
    fontSize: 14,
    fontWeight: "bold",
  },
  timerText: {
    color: "#3498db",
    fontSize: 14,
  },
})
