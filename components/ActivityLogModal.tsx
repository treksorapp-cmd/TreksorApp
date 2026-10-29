import React, { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTrackingStore } from "@/store/tracking-store";
import { applyTrackerDay, dayKey, displayDay, isScheduled, trackerCompletion } from "@/lib/progress-metrics";
import type { TrackingCategory } from "@/types/tracking";
import { colors, surface, type } from "@/theme/architect";
interface Props { visible: boolean; onClose: () => void; selectedDate: string; selectedCategory?: string; onCreate?: () => void; onDismiss?: () => void }
export default function ActivityLogModal({ visible, onClose, selectedDate, selectedCategory, onCreate, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const [trackers, setTrackers] = useState<TrackingCategory[]>([]);
  const [checked, setChecked] = useState<Record<string, Record<string, boolean>>>({});
  // Snapshot on open. Background sync must not replace an unfinished edit.
  useEffect(() => {
    if (!visible) return;
    const selected = useTrackingStore.getState().trackingData.filter(t => t.custom && (!selectedCategory || t.id === selectedCategory));
    setTrackers(selected);
    setChecked(Object.fromEntries(selected.map(t => [t.id, Object.fromEntries(t.items.filter(i => isScheduled(i, selectedDate)).map(i => [i.id, !!i.record?.[selectedDate]]))])));
  }, [visible, selectedDate, selectedCategory]);
  const today = dayKey();
  const scheduled = trackers.reduce((n, t) => n + t.items.filter(i => isScheduled(i, selectedDate)).length, 0);
  const future = selectedDate > today;
  const save = () => {
    const store = useTrackingStore.getState();
    store.trackingData.filter(t => t.custom && checked[t.id]).forEach(t => {
      const items = applyTrackerDay(t.items, selectedDate, checked[t.id], today);
      store.updateTrackingCategory(t.id, { items, percentage: trackerCompletion(items, today).percentage ?? 0 });
    });
    onClose();
  };
  const remove = () => {
    if (!selectedCategory || trackers.length !== 1) return;
    Alert.alert("Delete this tracker?", "This removes its scheduled actions and saved check-ins from this device.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { useTrackingStore.getState().deleteTrackingCategory(selectedCategory); onClose(); } },
    ]);
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onDismiss={onDismiss}>
    <View style={[styles.overlay, { paddingTop: insets.top + 20 }]}><View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}><View style={styles.flex}><Text style={styles.eyebrow}>PERSONAL TRACKERS · MANUAL</Text><Text style={styles.title}>Log your actions</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Close tracker log" onPress={onClose} style={styles.close}><Ionicons name="close" size={24} color={colors.text}/></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>{displayDay(selectedDate)}</Text><Text style={styles.copy}>Check what you completed. Uncheck an item to correct it. Changes apply when you save.</Text>
        {future && <Text style={styles.copy}>Future days are not available to log.</Text>}
        {trackers.map(t => {
          const due = t.items.filter(i => isScheduled(i, selectedDate));
          return <View key={t.id} style={styles.card}><Text style={styles.cardTitle}>{t.title}</Text>{!due.length && <Text style={styles.copy}>No actions scheduled for this date.</Text>}{due.map(item => {
            const done = !!checked[t.id]?.[item.id];
            return <TouchableOpacity key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: done, disabled: future }} disabled={future} onPress={() => setChecked(s => ({ ...s, [t.id]: { ...s[t.id], [item.id]: !done } }))} style={styles.item}><View style={[styles.checkbox, done && styles.checked]}>{done && <Ionicons name="checkmark" size={18} color={colors.background}/>}</View><Text style={styles.itemText}>{item.label}</Text><Text style={styles.state}>{done ? "Done" : "To do"}</Text></TouchableOpacity>;
          })}</View>;
        })}
        {!trackers.length && <View style={styles.card}><Text style={styles.cardTitle}>Start with one daily action</Text><Text style={styles.copy}>Create a tracker first. Gym sessions and journal entries are recorded in their own sections.</Text>{onCreate && <TouchableOpacity accessibilityRole="button" onPress={onCreate} style={styles.create}><Text style={styles.gold}>Create a tracker</Text></TouchableOpacity>}</View>}
        {selectedCategory && trackers.length === 1 && <TouchableOpacity accessibilityRole="button" onPress={remove} style={styles.delete}><Text style={styles.deleteText}>Delete tracker</Text></TouchableOpacity>}
      </ScrollView>
      <View style={styles.actions}><TouchableOpacity accessibilityRole="button" onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !scheduled || future }} disabled={!scheduled || future} onPress={save} style={[styles.save, (!scheduled || future) && styles.disabled]}><Text style={styles.saveText}>Save changes</Text></TouchableOpacity></View>
    </View></View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }, sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "95%", borderWidth: 1, borderColor: colors.border },
  flex: { flex: 1 }, header: { padding: 20, flexDirection: "row", alignItems: "center", gap: 12 }, eyebrow: { ...type.eyebrow, fontSize: 10 }, title: { ...type.section, marginTop: 6 }, close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, content: { paddingHorizontal: 20, paddingBottom: 16, gap: 14 }, date: { ...type.card, color: colors.gold }, copy: type.body,
  card: { ...surface.card, backgroundColor: colors.surfaceRaised, padding: 16, gap: 12 }, cardTitle: type.card, item: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }, checkbox: { width: 26, height: 26, borderRadius: 7, borderWidth: 1, borderColor: colors.gold, alignItems: "center", justifyContent: "center" }, checked: { backgroundColor: colors.gold }, itemText: { ...type.body, color: colors.text, flex: 1 }, state: type.caption,
  actions: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 12 }, cancel: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: colors.surfaceRaised, padding: 14, alignItems: "center", justifyContent: "center" }, cancelText: { color: colors.text, fontWeight: "600", fontSize: 14 }, save: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: colors.gold, padding: 14, alignItems: "center", justifyContent: "center" }, saveText: { color: colors.background, fontWeight: "700", fontSize: 14 }, disabled: { opacity: 0.4 }, create: { paddingVertical: 12, minHeight: 44 }, gold: { color: colors.gold, fontWeight: "600" }, delete: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center" }, deleteText: { color: colors.danger, fontSize: 13 },
});
