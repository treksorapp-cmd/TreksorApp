import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTrackingStore } from "@/store/tracking-store";
import { generateRandomId } from "@/lib/utils";
import { colors, type } from "@/theme/architect";
interface Props { visible: boolean; onClose: () => void }
export default function AddTrackerModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [actions, setActions] = useState([""]);
  const [days, setDays] = useState("21");
  const submit = () => {
    const duration = Number(days);
    if (!name.trim()) return Alert.alert("Name your tracker", "For example, Morning routine or Time outdoors.");
    if (actions.some(action => !action.trim())) return Alert.alert("Name each action", "Fill in each action, or remove any empty rows.");
    if (!Number.isInteger(duration) || duration < 1 || duration > 365) return Alert.alert("Choose a duration", "Enter a whole number from 1 to 365 days.");
    useTrackingStore.getState().addTrackingCategory({ id: generateRandomId(), title: name.trim(), percentage: 0, custom: true, items: actions.map(action => ({ id: generateRandomId(), label: action.trim(), value: String(duration) })) });
    setName(""); setActions([""]); setDays("21"); onClose();
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboard}><View style={[styles.overlay, { paddingTop: insets.top + 20 }]}><View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}><View style={styles.flex}><Text style={styles.eyebrow}>ONE INTENTION. DAILY ACTION.</Text><Text style={styles.title}>Create a tracker</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Close new tracker" onPress={onClose} style={styles.iconButton}><Ionicons name="close" size={24} color={colors.text}/></TouchableOpacity></View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.copy}>Track what matters to you. Each action gets one checkmark per day, starting today.</Text>
        <Text style={styles.label}>Tracker name</Text><TextInput accessibilityLabel="Tracker name" maxLength={60} value={name} onChangeText={setName} placeholder="e.g. Morning routine" placeholderTextColor={colors.muted} style={styles.input}/>
        <Text style={styles.label}>Daily actions</Text><Text style={styles.caption}>Make them specific and achievable.</Text>
        {actions.map((action, index) => <View key={index} style={styles.actionRow}><TextInput accessibilityLabel={`Daily action ${index + 1}`} maxLength={100} value={action} onChangeText={value => setActions(old => old.map((a, i) => i === index ? value : a))} placeholder={index ? "Another small step" : "e.g. Walk outside for 20 minutes"} placeholderTextColor={colors.muted} style={[styles.input, styles.flex]}/>{actions.length > 1 && <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove action ${index + 1}`} onPress={() => setActions(old => old.filter((_, i) => i !== index))} style={styles.iconButton}><Ionicons name="close-circle-outline" size={22} color={colors.muted}/></TouchableOpacity>}</View>)}
        {actions.length < 10 && <TouchableOpacity accessibilityRole="button" onPress={() => setActions(old => [...old, ""])} style={styles.addAction}><Ionicons name="add" size={18} color={colors.gold}/><Text style={styles.link}>Add another action</Text></TouchableOpacity>}
        <Text style={styles.label}>How many days?</Text><View style={styles.presets}>{[7, 21, 30].map(preset => <TouchableOpacity key={preset} accessibilityRole="button" accessibilityState={{ selected: days === String(preset) }} onPress={() => setDays(String(preset))} style={[styles.preset, days === String(preset) && styles.selected]}><Text style={[styles.presetText, days === String(preset) && styles.selectedText]}>{preset} days</Text></TouchableOpacity>)}</View>
        <TextInput accessibilityLabel="Tracker duration in days" keyboardType="number-pad" maxLength={3} value={days} onChangeText={value => setDays(value.replace(/[^0-9]/g, ""))} style={styles.input}/>
        <Text style={styles.caption}>1–365 consecutive days. You log each action manually in Progress. These checkmarks do not add gym sessions or meditation completions.</Text>
      </ScrollView>
      <View style={styles.footer}><TouchableOpacity accessibilityRole="button" onPress={submit} style={styles.primary}><Text style={styles.primaryText}>Create tracker</Text><Ionicons name="arrow-forward" size={18} color={colors.background}/></TouchableOpacity></View>
    </View></View></KeyboardAvoidingView>
  </Modal>;
}
const styles = StyleSheet.create({
  keyboard: { flex: 1 }, overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }, sheet: { maxHeight: "95%", backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: colors.border }, header: { flexDirection: "row", alignItems: "center", gap: 10, padding: 20 }, flex: { flex: 1 }, eyebrow: { ...type.eyebrow, fontSize: 10 }, title: { ...type.section, marginTop: 5 }, iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, content: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 }, copy: type.body, caption: type.caption, label: { color: colors.text, fontSize: 15, fontWeight: "600", marginTop: 12 }, input: { minHeight: 50, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text }, actionRow: { flexDirection: "row", alignItems: "center", gap: 6 }, addAction: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 }, link: { color: colors.gold, fontSize: 13, fontWeight: "600" }, presets: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, preset: { minHeight: 44, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: colors.surfaceRaised }, presetText: { color: colors.text, fontWeight: "600" }, selected: { backgroundColor: colors.gold }, selectedText: { color: colors.background }, footer: { paddingHorizontal: 20, paddingTop: 12 }, primary: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.gold, borderRadius: 12, padding: 15 }, primaryText: { color: colors.background, fontSize: 15, fontWeight: "700" },
});
