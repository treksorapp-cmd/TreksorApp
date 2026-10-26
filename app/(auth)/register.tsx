import {useSafeAreaInsets} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import React, { useState } from "react"
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native"

import LegalAgreement from "@/components/LegalAgreement"
import Button from "@/components/ui/Button"
import TextInput from "@/components/ui/TextInput"
import { useAuthStore } from "@/store/auth-store"

export default function Register() {
  const insets = useSafeAreaInsets();
  const {register, requestOtp, loading} = useAuthStore();
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  // const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    legal: "",
  })

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

  const validateStep1 = () => {
    let valid = true
    const newErrors = { ...errors }

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Name is required"
      valid = false
    } else {
      newErrors.name = ""
    }

    // Email validation
    if (!email) {
      newErrors.email = "Email is required"
      valid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid"
      valid = false
    } else {
      newErrors.email = ""
    }

    setErrors(newErrors)
    return valid
  }

  const validateStep2 = () => {
    let valid = true
    const newErrors = { ...errors }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required"
      valid = false
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
      valid = false
    } else {
      newErrors.password = ""
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
      valid = false
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match"
      valid = false
    } else {
      newErrors.confirmPassword = ""
    }

    setErrors(newErrors)
    return valid
  }

  const validateStep3 = () => {
    let valid = true
    const newErrors = { ...errors }

    if (!legalAgreed) {
      newErrors.legal = "You must agree to the Terms of Service and Privacy Policy"
      valid = false
    } else {
      newErrors.legal = ""
    }

    setErrors(newErrors)
    return valid
  }

  const handleNextStep = () => {
    Keyboard.dismiss()

    if (step === 1 && validateStep1()) {
      animateToNextStep()
    } else if (step === 2 && validateStep2()) {
      animateToNextStep()
    }
  }

  const animateToNextStep = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(step + 1)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    })
  }

  const handlePrevStep = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(step - 1)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    })
  }

  const handleRegister = () => {
    Keyboard.dismiss()

    if (validateStep3()) {
      register({ name, email: email.toLowerCase(), password, role: "user" }).then(() => {
        if (!useAuthStore.getState().error && !useAuthStore.getState().isAuthenticated) {
          router.push({ pathname: "/(auth)/verify-otp", params: { email } });
        }
      })
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Create Account"
      case 2:
        return "Set Password"
      case 3:
        return "Legal Agreements"
      default:
        return "Create Account"
    }
  }

  const getStepSubtitle = () => {
    switch (step) {
      case 1:
        return "Let's get started with your journey"
      case 2:
        return "Choose a strong password to secure your account"
      case 3:
        return "Please review and accept our policies"
      default:
        return "Let's get started with your journey"
    }
  }

  return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
            <TouchableOpacity style={styles.backButton} onPress={() => (step === 1 ? router.back() : handlePrevStep())}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.stepIndicator}>
              {[1, 2, 3].map((stepNumber) => (
                <React.Fragment key={stepNumber}>
                  <View style={[styles.stepDot, step >= stepNumber && styles.activeStepDot]} />
                  {stepNumber < 3 && <View style={styles.stepLine} />}
                </React.Fragment>
              ))}
            </View>

            <Text style={styles.heading}>{getStepTitle()}</Text>
            <Text style={styles.subHeading}>{getStepSubtitle()}</Text>

            <View style={styles.form}>
              {step === 1 ? (
                <>
                  <TextInput
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    icon="person-outline"
                    error={errors.name}
                  />

                  <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon="mail-outline"
                    error={errors.email}
                  />

                  <Button onPress={handleNextStep}>CONTINUE</Button>
                </>
              ) : step === 2 ? (
                <>
                  <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    icon="lock-closed-outline"
                    error={errors.password}
                  />

                  <TextInput
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    icon="shield-checkmark-outline"
                    error={errors.confirmPassword}
                  />

                  <Button onPress={handleNextStep}>CONTINUE</Button>
                </>
              )
              : step === 3 && (
                <>
                  <LegalAgreement onAgreementChange={setLegalAgreed} required={true} />

                  <Button onPress={handleRegister} loading={loading}>
                    CREATE ACCOUNT
                  </Button>
                </>
              )}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.signInText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
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
    paddingVertical: 40,
  },
  backButton: { alignSelf:"flex-start", minWidth:44, minHeight:44, justifyContent:"center", marginBottom:20 },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  activeStepDot: {
    backgroundColor: "#D7B877",
  },
  stepLine: {
    width: 50,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 5,
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
  footer: {
    flexDirection: "row",
    marginTop: 30,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  signInText: {
    color: "#D7B877",
    fontSize: 14,
    fontWeight: "bold",
  },
})
