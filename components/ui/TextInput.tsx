import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useState } from "react"
import {
  Animated,
  TextInput as RNTextInput,
  StyleSheet,
  Text,
  type TextInputProps,
  TouchableOpacity,
  View
} from "react-native"



interface EnhancedTextInputProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap
  secureTextEntry?: boolean
  error?: string
}

const TextInput = (props: EnhancedTextInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const { icon, secureTextEntry, error, ...restProps } = props

  // Animation value for focus effect
  const [focusAnim] = useState(new Animated.Value(0))

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  return (
    <View style={styles.container}>
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
          {icon && (
            <Ionicons name={icon} size={20} color={isFocused ? "#fff" : "rgba(255,255,255,0.6)"} style={styles.icon} />
          )}

          <RNTextInput
            {...restProps}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={[styles.input, props.style, icon && { paddingLeft: 40 }]}
            onFocus={(e) => {
              handleFocus()
              props.onFocus && props.onFocus(e)
            }}
            onBlur={(e) => {
              handleBlur()
              props.onBlur && props.onBlur(e)
            }}
          />

          {secureTextEntry && (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"} style={styles.eyeIcon} onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
              <Ionicons
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="rgba(255,255,255,0.6)"
              />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </LinearGradient>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 56,
    borderRadius: 12,
    overflow: "visible", // Changed to visible to show error text
    marginVertical: 10,
  },
  focusGlow: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 15,
    backgroundColor: "#3498db",
    zIndex: -1,
  },
  borderGradient: {
    minHeight: 56,
    borderRadius: 12,
    padding: 1,
  },
  innerGradient: {
    minHeight: 54,
    borderRadius: 11,
    paddingHorizontal: 16,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "400",
    minHeight: 54,
    paddingVertical: 14,
    lineHeight: 24,
  },
  icon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  eyeIcon: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginLeft: 4,
  },
})

export default TextInput
