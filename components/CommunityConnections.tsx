import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { openTreksorWeb } from "@/lib/treksor-links";
import { colors, surface, type } from "@/theme/architect";
const connections = [
    { title: "Find your people", description: "Explore groups and shared activities.", icon: "people-outline", route: "community" },
    { title: "Start one to one", description: "A quieter way to make a connection.", icon: "chatbubbles-outline", route: "community/one-to-one" },
    { title: "Connect with a mentor", description: "Find guidance for your next step.", icon: "compass-outline", route: "community/mentors" },
] as const;
export default function CommunityConnections() {
    return <View style={styles.section}>
  <Text style={styles.title}>Connection, at your pace</Text>
  <Text style={styles.caption}>Continue on Treksor web with your Treksor email account.</Text>
  {connections.map(item => <TouchableOpacity key={item.route} accessibilityRole="link" accessibilityLabel={`${item.title}, opens Treksor web`} onPress={() => void openTreksorWeb(item.route)} style={styles.card}>
    <View style={styles.icon}><Ionicons name={item.icon} size={22} color={colors.gold}/></View>
    <View style={styles.copy}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.description}>{item.description}</Text></View>
    <Ionicons name="open-outline" size={17} color={colors.muted}/>
  </TouchableOpacity>)}
    </View>;
}
const styles = StyleSheet.create({ section: { marginVertical: 24, gap: 12 }, title: type.section, caption: type.caption, card: { ...surface.card, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }, icon: surface.icon, copy: { flex: 1, minWidth: 0 }, cardTitle: type.card, description: { ...type.caption, marginTop: 4 } });
