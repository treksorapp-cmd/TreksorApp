import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from "expo-router";
import Toast from "react-native-toast-message";

export default function Login() {
  const { login, loading, getCurrentUser, requestOtp, signInWithThirdParty } =
    useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isAppleSigninAvailable, setIsAppleSigninAvailable] = useState(false);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(()=>{
    try {
      GoogleSignin.configure({
        webClientId: '894029547682-p9dcenr39r26nppsosheb35egjdaetlq.apps.googleusercontent.com',
        offlineAccess: true,
        iosClientId: '894029547682-7ts2smp9pska8209lge6gkbphktbk24h.apps.googleusercontent.com'
      });
      const checkAvailable = async () => {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        setIsAppleSigninAvailable(isAvailable && Platform.OS === 'ios');
      }      
      checkAvailable();
    } catch (error) {
      console.error("Google Signin configuration error:", error);
    }

  },[])

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
    ]).start();
  }, []);

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: "", password: "" };

    // Simple email validation
    if (!email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = () => {
    Keyboard.dismiss();

    if (validateForm()) {
      login({ email: email.toLowerCase(), password });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const currentUser = GoogleSignin.getCurrentUser();
      if(currentUser) {
        const {user} = currentUser;
        signInWithThirdParty({ email:user.email, name:user.name, photo:user.photo, provider: 'google' }).then(() => {
          getCurrentUser();
        });
        return;
      }
      const response = await GoogleSignin.signIn();
      // const response = {"data": {"user": {"email": "chaudharyhouse1211@gmail.com", "familyName": null, "givenName": "Chaudhary", "id": "107538304071486047850", "name": "Chaudhary", "photo": null}}, "type": "success"}
      const user = response?.data ? response.data.user : null;
      if (!user) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Google sign-in failed: No user data received",
        })
        return;
      }
      const { email, photo, name } = user;
      if (!email || !name) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Google sign-in failed: Missing email or name",
        })
        return;
      }
      signInWithThirdParty({ email, name, photo, provider: 'google' }).then(() => {
        getCurrentUser();
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Google sign-in failed",
      })
    }
  };

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      // signInWithThirdParty({ email, name, photo, provider: 'apple' }).then(() => {
      //   getCurrentUser();
      // });
    } catch (error) {
      console.error("Apple Sign in failed: ", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Apple sign-in failed",
      })
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <StatusBar style="light" />
        <View style={styles.overlay} />
        <ScrollView
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.heading}>Welcome To Treksor</Text>
            <Text style={styles.subHeading}>Sign in to your account</Text>

            <View style={styles.form}>
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
                error={errors.email}
              />

              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon="lock-closed-outline"
                error={errors.password}
              />

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push("/(auth)/request-reset-password")}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Button onPress={handleLogin} loading={loading}>
                SIGN IN
              </Button>

              {/* <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View> */}

              {/* <View style={[styles.socialButtons,{justifyContent:isAppleSigninAvailable?'space-between':'center'}]}>
                <SocialButton
                  icon="logo-google"
                  label="Google"
                  color="#DB4437"
                  onPress={handleGoogleLogin}
                />
                {isAppleSigninAvailable && <SocialButton
                  icon="logo-apple"
                  label="Apple"
                  color="#000000"
                  onPress={handleAppleLogin}
                />}
              </View> */}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
    justifyContent: "center",
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
    marginBottom: 30, lineHeight: 23, fontWeight: "600", letterSpacing: -0.2, includeFontPadding: false, },
  form: {
    width: "100%",
    alignItems: "center",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginRight: 20,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#3498db",
    fontSize: 14,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  dividerText: {
    color: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 10,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: "row",
    width: "100%",
  },
  footer: {
    flexDirection: "row",
    marginTop: 30,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  signUpText: {
    color: "#3498db",
    fontSize: 14,
    fontWeight: "bold",
  },
});
