import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { StyleSheet, Text, TouchableOpacity, View, type TouchableOpacityProps } from "react-native"

interface SocialButtonProps extends TouchableOpacityProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  color: string
}

const SocialButton = ({ icon, label, color, ...props }: SocialButtonProps) => {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.container} {...props}>
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: 54,
    borderRadius: 12,
    marginVertical: 8,
    width: "48%",
    overflow: "hidden",
  },
  gradient: {
    minHeight: 54,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
    fontWeight: "500",
  },
})

export default SocialButton
