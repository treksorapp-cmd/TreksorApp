import { Entypo } from "@expo/vector-icons";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ButtonProps = {
  children: React.ReactNode | string;
  onPress?: () => void;
  loading?: boolean;
  icon?: string;
  iconStyle?: object; // Optional custom styles for the icon image
  buttonStyle?: object;
  disabled?: boolean;
  iconImage?: boolean; // Optional custom icon component
  iconImageIcon?: string; // Optional icon name for Entypo
};

const Button = ({
  children,
  onPress,
  loading,
  icon,
  iconStyle,
  buttonStyle,
  disabled,
  iconImage,
  iconImageIcon
}: ButtonProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={!disabled ? onPress : undefined}
      style={[
        styles.buttonContainer,
        disabled && styles.disabledButtonContainer,
        buttonStyle,
      ]}
      disabled={disabled}
    >
      {/* Outer LinearGradient for the border */}
      <LinearGradient
        colors={
          disabled
            ? ["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.2)"]
            : ["rgba(255, 255, 255, 0.32)", "rgba(255, 255, 255, 0.11)"]
        }
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.borderGradient}
      >
        <BlurView intensity={14} tint="dark" pointerEvents="none" style={StyleSheet.absoluteFill} />
        {/* Inner LinearGradient for the button background */}
        <LinearGradient
          colors={disabled ? ["rgba(255, 255, 255, 0.045)", "rgba(255, 255, 255, 0.015)"] : ["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.035)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.innerGradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : typeof children === "string" ? (
            icon ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {!iconImage ? <Image
                  source={icon}
                  style={[{ marginRight: 10, width: 20, height: 20 }, iconStyle]} // Apply custom styles
                />: <Entypo style={{ marginRight: 10 }} name={iconImageIcon} size={28} color="#FFFFFF" />}
                <Text style={styles.buttonText}>{children}</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>{children}</Text>
            )
          ) : (
            children
          )}
        </LinearGradient>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  buttonContainer: {
    width: width - 40, // Full width minus margins
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    marginVertical: 10,
  },
  disabledButtonContainer: {
    opacity: 0.5, // Reduce opacity for disabled state
  },
  borderGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 1, // This creates the border thickness
  },
  innerGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15, // Slightly smaller than outer radius
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: 1,
    lineHeight: 24,
  },
});

export default Button;
