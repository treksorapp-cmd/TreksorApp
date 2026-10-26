import {displayLabel} from "@/lib/pillar-navigation";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ButtonProps = {
  children: React.ReactNode | string;
  onPress?: () => void;
  loading?: boolean;
  icon?: number | string;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  iconStyle?: object; // Optional custom styles for the icon image
  buttonStyle?: object;
  disabled?: boolean;
  borderless?: boolean;
  iconImage?: boolean; // Optional custom icon component
  iconImageIcon?: string; // Optional icon name for Entypo
};

const Button = ({
  children,
  onPress,
  loading,
  icon,
  iconName,
  iconStyle,
  buttonStyle,
  disabled,
  borderless = false,
  iconImage,
  iconImageIcon
}: ButtonProps) => {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={typeof children === "string" ? children : undefined}
      activeOpacity={0.8}
      onPress={!disabled && !loading ? onPress : undefined}
      style={[
        styles.buttonContainer,
        disabled && styles.disabledButtonContainer,
        buttonStyle,
      ]}
      disabled={disabled || loading}
      accessibilityState={{disabled: Boolean(disabled || loading), busy: Boolean(loading)}}
    >
      {/* Outer LinearGradient for the border */}
      <LinearGradient
        colors={
          disabled
            ? ["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.2)"]
            : ["rgba(205, 235, 248, 0.24)", "rgba(220, 241, 252, 0.088)"]
        }
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.borderGradient, borderless && styles.borderlessGradient]}
      >
        <BlurView intensity={14} tint="dark" pointerEvents="none" style={StyleSheet.absoluteFill} />
        {/* Inner LinearGradient for the button background */}
        <LinearGradient
          colors={disabled ? ["rgba(255, 255, 255, 0.045)", "rgba(255, 255, 255, 0.015)"] : ["rgba(183, 221, 240, 0.076)", "rgba(194, 231, 249, 0.020)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.innerGradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : typeof children === "string" ? (
            <View style={styles.labelRow}>
              {iconName ? <Ionicons name={iconName} size={23} color="#FFFFFF" style={styles.leadingIcon} /> :
                icon ? (!iconImage ? <Image source={icon} style={[styles.imageIcon, iconStyle, { tintColor: "#FFFFFF" }]} /> :
                <Entypo name={iconImageIcon as React.ComponentProps<typeof Entypo>["name"]} size={24} color="#FFFFFF" style={styles.leadingIcon} />) : null}
              <Text style={styles.buttonText}>{displayLabel(children)}</Text>
            </View>
          ) : (
            children
          )}
        </LinearGradient>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: "100%", // Match parent container on every screen
    minHeight: 56,
    borderRadius: 18,
    overflow: "hidden",
    marginVertical: 10,
  },
  disabledButtonContainer: {
    opacity: 0.5, // Reduce opacity for disabled state
  },
  borderGradient: {
    minHeight: 56,
    borderRadius: 18,
    padding: 1, // This creates the border thickness
  },
  borderlessGradient:{padding:0},
  innerGradient: {
    minHeight: 54,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 17, // Slightly smaller than outer radius
  },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 18, width: "100%" },
  leadingIcon: { marginRight: 12 },
  imageIcon: { width: 23, height: 23, marginRight: 12 },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0,
    flexShrink: 1,
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 24,
  },
});

export default Button;
