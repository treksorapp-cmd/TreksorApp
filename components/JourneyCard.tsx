import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { router, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuthStore } from "@/store/auth-store";
import { colors, surface, type } from "@/theme/architect";

type DailyStep = "body" | "mind" | "mentor";
type DailyRecord = {
  priority: string;
  reflection: string;
  done: DailyStep[];
};
type StepDefinition = {
  id: DailyStep;
  title: string;
  description: string;
  destination: string;
  route: Href;
  icon: keyof typeof Ionicons.glyphMap;
};

const STEPS: StepDefinition[] = [
  {
    id: "body",
    title: "Move with intention",
    description: "10 minutes of purposeful movement",
    destination: "BODY",
    route: "/body/workout/guide",
    icon: "barbell-outline",
  },
  {
    id: "mind",
    title: "Make space to think",
    description: "5 minutes of reading or reflection",
    destination: "MIND",
    route: "/mental",
    icon: "book-outline",
  },
  {
    id: "mentor",
    title: "Find your next step",
    description: "Ask one useful question or reflect",
    destination: "MENTOR",
    route: "/chat",
    icon: "chatbubble-ellipses-outline",
  },
];

const emptyRecord = (): DailyRecord => ({ priority: "", reflection: "", done: [] });

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function normalizeRecord(raw: string | null): DailyRecord {
  if (!raw) return emptyRecord();
  try {
    const stored: unknown = JSON.parse(raw);
    if (!stored || typeof stored !== "object") return emptyRecord();
    const data = stored as Partial<DailyRecord>;
    const done = Array.isArray(data.done)
      ? STEPS.map((step) => step.id).filter((id) => data.done?.includes(id))
      : [];
    return {
      priority: typeof data.priority === "string" ? data.priority.slice(0, 120) : "",
      reflection: typeof data.reflection === "string" ? data.reflection.slice(0, 240) : "",
      done,
    };
  } catch {
    return emptyRecord();
  }
}

/**
 * Today v1 is intentionally offline-first.
 * Each authenticated account has a separate, local, day-scoped record.
 * We do not infer completion from simply opening a pillar.
 * Cloud sync and cross-device continuity are a later integration.
 */
export default function JourneyCard() {
  const userId = useAuthStore((state) => state.user?.id);
  const [dateKey, setDateKey] = useState(() => localDateKey(new Date()));
  const [record, setRecord] = useState<DailyRecord>(emptyRecord);
  const [priorityDraft, setPriorityDraft] = useState("");
  const [reflectionDraft, setReflectionDraft] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const recordRef = useRef<DailyRecord>(emptyRecord());
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  const storageKey = userId
    ? "treksor.today.v1." + String(userId).replace(/[^a-zA-Z0-9_-]/g, "_") + "." + dateKey
    : null;

  useEffect(() => {
    const refreshDay = () => setDateKey(localDateKey(new Date()));
    const timer = setInterval(refreshDay, 60_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshDay();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    setSaveStatus("");
    recordRef.current = emptyRecord();
    setRecord(emptyRecord());
    setPriorityDraft("");
    setReflectionDraft("");

    if (!storageKey) return () => { active = false; };

    void SecureStore.getItemAsync(storageKey)
      .then((value) => {
        if (!active) return;
        const next = normalizeRecord(value);
        recordRef.current = next;
        setRecord(next);
        setPriorityDraft(next.priority);
        setReflectionDraft(next.reflection);
      })
      .catch(() => {
        if (active) setSaveStatus("Local storage is unavailable on this device.");
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => { active = false; };
  }, [storageKey]);

  const persist = useCallback(
    (changes: Partial<DailyRecord> = {}) => {
      if (!storageKey || !loaded) return;
      const next: DailyRecord = {
        ...recordRef.current,
        priority: priorityDraft.trim(),
        reflection: reflectionDraft.trim(),
        ...changes,
      };
      recordRef.current = next;
      setRecord(next);
      setSaveStatus("");
      // Serializing writes prevents rapid taps from saving an older record last.
      writeQueue.current = writeQueue.current
        .catch(() => undefined)
        .then(() => SecureStore.setItemAsync(storageKey, JSON.stringify(next)));
      void writeQueue.current
        .then(() => setSaveStatus("Saved securely on this device"))
        .catch(() => setSaveStatus("Could not save. Please try again."));
    },
    [loaded, priorityDraft, reflectionDraft, storageKey]
  );

  const toggleStep = (id: DailyStep) => {
    const current = recordRef.current.done;
    const done = current.includes(id)
      ? current.filter((step) => step !== id)
      : [...current, id];
    persist({ done });
  };

  const completed = record.done.length;
  const dateLabel = new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>THE DAILY PRACTICE</Text>
          <Text style={styles.sectionTitle}>Today</Text>
        </View>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.introRow}>
          <View style={styles.introCopy}>
            <Text style={styles.headline}>One day. One direction.</Text>
            <Text style={styles.subtitle}>
              Set your priority, take three small actions, and close the day with clarity.
            </Text>
          </View>
          <View style={styles.progressCount}>
            <Text style={styles.progressNumber}>{completed}/3</Text>
            <Text style={styles.progressLabel}>DONE</Text>
          </View>
        </View>
        <View style={styles.progressTrack} accessibilityLabel={completed + " of 3 daily actions complete"}>
          <View style={[styles.progressFill, { width: String((completed / 3) * 100) + "%" }]} />
        </View>

        <Text style={styles.fieldLabel}>YOUR ONE PRIORITY</Text>
        <TextInput
          accessibilityLabel="Your priority for today"
          editable={loaded}
          style={styles.input}
          placeholder={loaded ? "What would make today meaningful?" : "Opening today's plan..."}
          placeholderTextColor={colors.muted}
          value={priorityDraft}
          onChangeText={setPriorityDraft}
          onBlur={() => persist()}
          onSubmitEditing={() => persist()}
          maxLength={120}
          returnKeyType="done"
        />

        <View style={styles.actionsHeading}>
          <Text style={styles.fieldLabel}>THREE DAILY MOVES</Text>
          <Text style={styles.hint}>Mark them when completed</Text>
        </View>
        {STEPS.map((step) => {
          const isDone = record.done.includes(step.id);
          return (
            <View key={step.id} style={styles.actionRow}>
              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityLabel={"Mark " + step.title + " complete"}
                accessibilityState={{ checked: isDone, disabled: !loaded }}
                disabled={!loaded}
                activeOpacity={0.8}
                onPress={() => toggleStep(step.id)}
                style={[styles.checkButton, isDone && styles.checkButtonDone]}
              >
                <Ionicons
                  name={isDone ? "checkmark" : "ellipse-outline"}
                  size={isDone ? 18 : 21}
                  color={isDone ? colors.background : colors.gold}
                />
              </TouchableOpacity>
              <View style={styles.actionCopy}>
                <Text style={[styles.actionTitle, isDone && styles.actionDone]}>{step.title}</Text>
                <Text style={styles.actionSubtitle}>{step.description}</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={"Open " + step.destination}
                onPress={() => {
                  persist();
                  router.push(step.route);
                }}
                style={styles.openButton}
              >
                <Text style={styles.openText}>{step.destination}</Text>
                <Ionicons name="arrow-forward" size={13} color={colors.gold} />
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.reflectionHeader}>
          <Text style={styles.fieldLabel}>EVENING REFLECTION</Text>
          <Text style={styles.hint}>Optional · 30 seconds</Text>
        </View>
        <TextInput
          accessibilityLabel="Your evening reflection"
          editable={loaded}
          style={[styles.input, styles.reflectionInput]}
          placeholder="What went well? What will you improve?"
          placeholderTextColor={colors.muted}
          value={reflectionDraft}
          onChangeText={setReflectionDraft}
          onBlur={() => persist()}
          maxLength={240}
          multiline
          textAlignVertical="top"
        />
        <View style={styles.footerRow}>
          <Text style={styles.saveStatus} accessibilityLiveRegion="polite">
            {saveStatus || "Your plan stays private on this device."}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Save today's plan and reflection"
            disabled={!loaded}
            onPress={() => persist()}
            style={styles.saveButton}
          >
            <Text style={styles.saveText}>SAVE DAY</Text>
            <Ionicons name="arrow-forward" color={colors.background} size={14} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 26, gap: 12 },
  headingRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  eyebrow: type.eyebrow,
  sectionTitle: type.section,
  date: { ...type.caption, marginBottom: 4 },
  card: { ...surface.card, padding: 17, gap: 13 },
  introRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  introCopy: { flex: 1 },
  headline: { ...type.card, fontSize: 19 },
  subtitle: { ...type.caption, marginTop: 5, lineHeight: 19 },
  progressCount: { minWidth: 57, alignItems: "center", padding: 9, borderRadius: 12, backgroundColor: colors.goldSoft },
  progressNumber: { color: colors.gold, fontSize: 20, fontWeight: "700" },
  progressLabel: { color: colors.gold, fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  progressTrack: { height: 4, borderRadius: 4, backgroundColor: colors.surfaceRaised, overflow: "hidden", marginBottom: 5 },
  progressFill: { height: 4, backgroundColor: colors.gold, borderRadius: 4 },
  fieldLabel: { ...type.eyebrow, fontSize: 10 },
  input: { color: colors.text, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12, fontSize: 14 },
  actionsHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 5 },
  hint: { ...type.caption, fontSize: 11 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border },
  checkButton: { width: 34, height: 34, borderColor: colors.border, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  checkButtonDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  actionCopy: { flex: 1 },
  actionTitle: { color: colors.text, fontSize: 13, fontWeight: "600" },
  actionDone: { color: colors.secondary, textDecorationLine: "line-through" },
  actionSubtitle: { ...type.caption, fontSize: 11, lineHeight: 15, marginTop: 3 },
  openButton: { minWidth: 68, flexDirection: "row", gap: 3, justifyContent: "flex-end", alignItems: "center", paddingVertical: 9 },
  openText: { color: colors.gold, fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  reflectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  reflectionInput: { minHeight: 72 },
  footerRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "space-between" },
  saveStatus: { ...type.caption, flex: 1, fontSize: 10 },
  saveButton: { backgroundColor: colors.gold, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  saveText: { color: colors.background, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
});
