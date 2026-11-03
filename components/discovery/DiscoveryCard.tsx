import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDiscovery } from "./DiscoveryProvider";
import { colors, surface, type } from "@/theme/architect";
export default function DiscoveryCard() {
  const { open, count } = useDiscovery();
  return (
    <TouchableOpacity
      onPress={open}
      accessibilityRole="button"
      style={{
        ...surface.card,
        marginVertical: 16,
        flexDirection: "row",
        gap: 14,
        alignItems: "center",
      }}
    >
      <Ionicons name="compass-outline" size={28} color={colors.gold} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={type.card}>Your Treksor guide</Text>
        <Text style={type.caption}>
          {count}/8 spaces explored · Discover your next step
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color={colors.gold} />
    </TouchableOpacity>
  );
}
