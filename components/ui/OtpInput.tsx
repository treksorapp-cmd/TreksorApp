"use client"

import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useRef, useState } from "react"
import {
  Animated,
  Clipboard,
  Dimensions,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native"

const { width } = Dimensions.get("window")

interface OtpInputProps {
  codeLength?: number
  onCodeFilled?: (code: string) => void
  error?: boolean
}

const OtpInput = ({ codeLength = 4, onCodeFilled, error = false }: OtpInputProps) => {
  const [code, setCode] = useState<string[]>(Array(codeLength).fill(""))
  const [focusedIndex, setFocusedIndex] = useState<number>(0)
  const inputRefs = useRef<Array<TextInput | null>>([])
  const animatedValues = useRef<Animated.Value[]>(Array(codeLength).fill(null))

  // Initialize animated values
  useEffect(() => {
    animatedValues.current = Array(codeLength)
      .fill(null)
      .map(() => new Animated.Value(0))
  }, [codeLength])

  // Focus first input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 100)

    // Check for clipboard content
    const checkClipboard = async () => {
      try {
        const clipboardContent = await Clipboard.getString()
        if (clipboardContent && /^\d+$/.test(clipboardContent) && clipboardContent.length === codeLength) {
          const codeArray = clipboardContent.split("")
          setCode(codeArray)
          if (onCodeFilled) {
            onCodeFilled(clipboardContent)
          }
        }
      } catch (error) {
        console.error("Failed to read clipboard", error)
      }
    }

    checkClipboard()
  }, [codeLength, onCodeFilled])

  const handleChange = (text: string, index: number) => {
    // Only allow digits
    if (!/^\d*$/.test(text)) return

    const newCode = [...code]

    // Handle paste event (multiple digits)
    if (text.length > 1) {
      const pastedCode = text.split("").slice(0, codeLength - index)
      for (let i = 0; i < pastedCode.length; i++) {
        if (index + i < codeLength) {
          newCode[index + i] = pastedCode[i]
        }
      }
      setCode(newCode)

      // Focus on the next empty input or the last one
      const nextIndex = Math.min(index + pastedCode.length, codeLength - 1)
      setFocusedIndex(nextIndex)
      inputRefs.current[nextIndex]?.focus()
    } else {
      // Handle single digit input
      newCode[index] = text
      setCode(newCode)

      // Auto-advance to next input
      if (text && index < codeLength - 1) {
        setFocusedIndex(index + 1)
        inputRefs.current[index + 1]?.focus()
      }
    }

    // Check if code is complete
    const filledCode = newCode.join("")
    if (filledCode.length === codeLength && onCodeFilled) {
      onCodeFilled(filledCode)
    }
  }

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      const newCode = [...code]
      newCode[index - 1] = ""
      setCode(newCode)
      setFocusedIndex(index - 1)
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleFocus = (index: number) => {
    setFocusedIndex(index)
    // Animate the focused input
    Animated.timing(animatedValues.current[index], {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }

  const handleBlur = (index: number) => {
    // Animate the blurred input
    Animated.timing(animatedValues.current[index], {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {code.map((digit, index) => {
          // Interpolate animation for border glow
          const borderGlowOpacity = animatedValues.current[index]?.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.8],
          })

          return (
            <View key={index} style={styles.inputContainer}>
              {/* Focus glow effect */}
              {focusedIndex === index && (
                <Animated.View
                  style={[
                    styles.focusGlow,
                    {
                      opacity: borderGlowOpacity,
                    },
                  ]}
                />
              )}

              {/* Outer Gradient Border */}
              <LinearGradient
                colors={[
                  error ? "rgba(255, 100, 100, 0.5)" : "rgba(255, 255, 255, 0.3)",
                  error ? "rgba(255, 50, 50, 0.6)" : "rgba(255, 255, 255, 0.4)",
                ]}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.borderGradient}
              >
                {/* Inner Background Gradient */}
                <LinearGradient
                  colors={["#262626", "#0a0a0a"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.innerGradient}
                >
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={styles.input}
                    accessibilityLabel={`Code digit ${index+1} of ${codeLength}`}
                    keyboardType="number-pad"
                    maxLength={codeLength}
                    value={digit}
                    onChangeText={(text) => handleChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => handleFocus(index)}
                    onBlur={() => handleBlur(index)}
                    selectionColor="#D7B877"
                    textContentType="oneTimeCode" // iOS autofill support
                  />
                </LinearGradient>
              </LinearGradient>
            </View>
          )
        })}
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 420,
    gap: 6,
    marginVertical: 20,
  },
  inputContainer: {
    flex: 1,
    minWidth: 0,
    height: 60,
    borderRadius: 12,
    overflow: "visible",
    position: "relative",
  },
  focusGlow: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 15,
    backgroundColor: "#D7B877",
    zIndex: -1,
  },
  borderGradient: {
    height: 60,
    borderRadius: 12,
    padding: 1,
  },
  innerGradient: {
    flex: 1,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    width: "100%",
    height: "100%",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
})

export default OtpInput
