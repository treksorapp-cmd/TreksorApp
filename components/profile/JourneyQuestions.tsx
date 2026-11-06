import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { goals, JourneyProfile, ProfilePrompt, profileNextStep } from "@/lib/journey-profile";
import { colors, surface, type } from "@/theme/architect";

export type ProfileSettingsPatch = Pick<JourneyProfile, "goal" | "trainingDays" | "mealMinutes" | "reminders">;

export default function JourneyQuestions({ mode, value, save, close }: {
  mode: ProfilePrompt | "profile-settings";
  value: JourneyProfile;
  save: (answers: ProfileSettingsPatch) => Promise<void>;
  close: () => void;
}) {
  const [answers, setAnswers] = useState<ProfileSettingsPatch>(() => ({
    goal: value.goal,
    trainingDays: value.trainingDays,
    mealMinutes: value.mealMinutes,
    reminders: value.reminders,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const settings = mode === "profile-settings";
  const next = settings ? profileNextStep(value.goal) : null;
  const title = mode === "schedule" ? "How many days fit your week?"
    : mode === "meals" ? "How much time do you have to cook?"
    : mode === "goal" ? "Is this still your priority?"
    : "What would you like to work on?";
  async function apply() {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await save(answers);
      close();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Text style={type.section}>{title}</Text>
      <Text style={type.body}>{settings || mode === "start"
        ? "Pick a focus to help Treksor surface relevant tools. These answers are optional and saved on this device."
        : "Help Treksor reflect what fits your life now. You can change this any time in Profile."}</Text>
      {(settings || mode === "start" || mode === "goal") && (
        <View style={styles.group} accessibilityLabel="Your goal">
          {goals.map((goal) => (
            <Choice key={goal.id} selected={answers.goal === goal.id} label={goal.label} detail={goal.detail}
              onPress={() => setAnswers((a) => ({ ...a, goal: a.goal === goal.id ? null : goal.id }))} />
          ))}
        </View>
      )}
      {(settings || mode === "schedule") && (
        <View style={styles.group}>
          {settings && <Text style={type.card}>Training days per week</Text>}
          <Text style={type.caption}>This can prefill the training questionnaire when you choose to use your profile.</Text>
          <View style={styles.row}>{[2, 3, 4, 5].map((days) => (
            <Choice key={days} selected={answers.trainingDays === days} label={String(days)}
              onPress={() => setAnswers((a) => ({ ...a, trainingDays: a.trainingDays === days ? null : days }))} />
          ))}</View>
        </View>
      )}
      {(settings || mode === "meals") && (
        <View style={styles.group}>
          {settings && <Text style={type.card}>Time for meal preparation</Text>}
          <Text style={type.caption}>Use this to set the default filter in Meal ideas.</Text>
          <Choice selected={answers.mealMinutes === 15} label="Up to 15 minutes"
            onPress={() => setAnswers((a) => ({ ...a, mealMinutes: a.mealMinutes === 15 ? null : 15 }))} />
          <Choice selected={answers.mealMinutes === 30} label="Up to 30 minutes"
            onPress={() => setAnswers((a) => ({ ...a, mealMinutes: a.mealMinutes === 30 ? null : 30 }))} />
        </View>
      )}
      <View style={styles.row}>
        <View style={styles.flex}><Text style={type.body}>Occasional profile questions</Text>
          <Text style={type.caption}>On Home, at most once every 28 days.</Text></View>
        <Switch value={answers.reminders} disabled={busy} accessibilityLabel="Occasional profile questions"
          onValueChange={(reminders) => setAnswers((a) => ({ ...a, reminders }))} />
      </View>
      {error && <Text accessibilityRole="alert" style={{ color: colors.danger }}>Could not save your answers. Please try again.</Text>}
      <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => void apply()} style={styles.save}>
        <Text style={styles.saveText}>{busy ? "Saving…" : "Save preferences"}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={close} style={styles.skip}>
        <Text style={type.body}>{settings ? "Close" : "Maybe later"}</Text>
      </TouchableOpacity>
      {next && (
        <TouchableOpacity accessibilityRole="button" disabled={busy}
          onPress={() => { close(); router.push(next.route); }} style={surface.card}>
          <Text style={type.eyebrow}>BASED ON YOUR SAVED FOCUS</Text>
          <Text style={type.card}>{next.title}</Text>
          <Text style={type.caption}>{next.detail}</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

function Choice({ selected, label, detail, onPress }: { selected: boolean; label: string; detail?: string; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={[styles.choice, selected && styles.selected]}>
      <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} color={selected ? colors.gold : colors.muted} size={18} />
      <View style={detail ? styles.flex : undefined}>
        <Text style={type.body}>{label}</Text>
        {detail && <Text style={type.caption}>{detail}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  flex: { flex: 1, minWidth: 0 },
  group: { gap: 8 },
  choice: { ...surface.card, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 },
  selected: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  save: { backgroundColor: colors.gold, borderRadius: 14, minHeight: 48, justifyContent: "center", alignItems: "center", padding: 12 },
  saveText: { color: colors.background, fontSize: 15, fontWeight: "600" },
  skip: { minHeight: 44, alignItems: "center", justifyContent: "center" },
});
