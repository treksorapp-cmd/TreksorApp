import { useCallback, useEffect, useState } from "react";
import {
  AppState,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import BodyPageHeading from "@/components/BodyPageHeading";
import WakePlayer from "@/components/wake/WakePlayer";
import { wakeSounds } from "@/lib/wake/sounds";
import {
  defaultWake,
  WakeSettings,
  wakeThemes,
  ScheduledWake,
} from "@/lib/wake/model";
import {
  readWake,
  refreshWake,
  scheduleWake,
  cancelWake,
  saveWakeSettings,
  wakeCapability,
} from "@/lib/wake/service";
import { colors, type, surface } from "@/theme/architect";
export default function WakeScreen() {
  const insets = useSafeAreaInsets(),
    [settings, setSettings] = useState<WakeSettings>(defaultWake),
    [hour, setHour] = useState("07"),
    [minute, setMinute] = useState("00"),
    [scheduled, setScheduled] = useState<ScheduledWake | null>(null),
    [preview, setPreview] = useState<WakeSettings | null>(null),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") setPreview(null);
    });
    return () => sub.remove();
  }, []);
  const mode = wakeCapability();
  const closePreview = useCallback(() => setPreview(null), []);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      refreshWake()
        .then((data) => {
          if (!active) return;
          setSettings(data.settings);
          setHour(String(data.settings.hour).padStart(2, "0"));
          setMinute(String(data.settings.minute).padStart(2, "0"));
          setScheduled(data.scheduled);
          setLoaded(true);
        })
        .catch(() => {
          if (active)
            setError(
              "Could not restore wake settings. Reopen this page before scheduling.",
            );
        });
      return () => {
        active = false;
      };
    }, []),
  );
  const values = () => {
    if (!/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute))
      throw Error("Enter hours and minutes.");
    return { ...settings, hour: Number(hour), minute: Number(minute) };
  };
  async function save() {
    setBusy(true);
    setError("");
    try {
      const next = await scheduleWake(values());
      setScheduled(next ?? (await readWake()).scheduled);
      setMessage(
        next
          ? `${mode === "alarmkit" ? "Alarm" : "Reminder"} set for ${new Date(next.at).toLocaleString()}.`
          : "Review and confirm the time and sound in your device Clock. Manage or delete that alarm there.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to schedule wake-up.");
      try {
        setScheduled((await refreshWake()).scheduled);
      } catch {}
    } finally {
      setBusy(false);
    }
  }
  async function cancel() {
    setBusy(true);
    try {
      await cancelWake();
      setScheduled(null);
      setMessage("Wake-up cancelled.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <ScrollView
        style={s.screen}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 36,
        }}
      >
        <BodyPageHeading
          title="Wake gently"
          trail="BALANCE / MORNING"
          subtitle="A quieter beginning. Chosen by you."
        />
        <View style={s.content}>
          <View style={s.card}>
            <Text style={type.eyebrow}>YOUR NEXT MORNING</Text>
            <View style={s.timeRow}>
              <TextInput
                accessibilityLabel="Wake hour, 24-hour clock"
                keyboardType="number-pad"
                maxLength={2}
                value={hour}
                onChangeText={setHour}
                style={s.time}
              />
              <Text style={type.page}>:</Text>
              <TextInput
                accessibilityLabel="Wake minutes"
                keyboardType="number-pad"
                maxLength={2}
                value={minute}
                onChangeText={setMinute}
                style={s.time}
              />
            </View>
            <Text style={type.caption}>
              24-hour time · Next occurrence only · Set in your current time
              zone
            </Text>
            <Text style={type.body}>
              {mode === "alarmkit"
                ? "System alarm on this iPhone. Apple can forward the alert to a paired Apple Watch."
                : mode === "clock"
                  ? "Confirm your alarm in the device Clock. Check the selected sound there; support varies by Clock app."
                  : "This build supports a wake reminder, not a guaranteed alarm. Silent mode, Focus and battery settings can affect it. Use your device Clock for a dependable wake-up."}
            </Text>
            {scheduled && (
              <Text style={s.link}>
                Saved {scheduled.kind === "alarmkit" ? "alarm" : "reminder"}:{" "}
                {new Date(scheduled.at).toLocaleString()}
              </Text>
            )}
          </View>
          <Text style={type.section}>Choose your morning sound</Text>
          <Text style={type.caption}>
            15 musical tones · Tap play to hear each one. Your device volume
            controls loudness.
          </Text>
          <View style={s.list}>
            {wakeSounds.map((sound) => (
              <View
                key={sound.id}
                style={[s.sound, settings.sound === sound.id && s.selected]}
              >
                <TouchableOpacity
                  accessibilityRole="radio"
                  accessibilityState={{ selected: settings.sound === sound.id }}
                  onPress={() =>
                    setSettings((v) => ({ ...v, sound: sound.id }))
                  }
                  style={s.soundChoice}
                >
                  <Ionicons
                    name={
                      settings.sound === sound.id
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    color={colors.gold}
                    size={20}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={type.card}>{sound.name}</Text>
                    <Text style={type.caption}>{sound.family}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Preview ${sound.name}`}
                  onPress={() =>
                    setPreview({
                      ...settings,
                      sound: sound.id,
                      brightness: false,
                    })
                  }
                  style={s.play}
                >
                  <Ionicons name="play-outline" color={colors.gold} size={23} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={s.card}>
            <Text style={type.section}>Your morning atmosphere</Text>
            <View style={s.between}>
              <Text style={[type.body, { flex: 1 }]}>Slow particle pulse</Text>
              <Switch
                accessibilityLabel="Animate slow particles"
                value={settings.motion}
                onValueChange={(motion) =>
                  setSettings((v) => ({ ...v, motion }))
                }
              />
            </View>
            <View style={s.between}>
              <Text style={[type.body, { flex: 1 }]}>
                Raise screen glow while open
              </Text>
              <Switch
                accessibilityLabel="Optional screen brightness"
                value={settings.brightness}
                onValueChange={(brightness) =>
                  setSettings((v) => ({ ...v, brightness }))
                }
              />
            </View>
            <View style={s.palette}>
              {(["gold", "warm", "cool"] as const).map((theme) => (
                <TouchableOpacity
                  accessibilityRole="radio"
                  accessibilityState={{ selected: settings.theme === theme }}
                  key={theme}
                  onPress={() => setSettings((v) => ({ ...v, theme }))}
                  style={[
                    s.swatch,
                    {
                      borderColor:
                        settings.theme === theme
                          ? wakeThemes[theme].color
                          : colors.border,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: wakeThemes[theme].color,
                    }}
                  />
                  <Text style={type.caption}>{theme}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={type.caption}>
              If you travel across time zones, set your next wake-up again.
              Animation and glow run only while Treksor is open. Reduced Motion
              is respected. No camera flash or flashing lights.
            </Text>
            <TouchableOpacity
              onPress={() => setPreview(settings)}
              style={s.secondary}
            >
              <Text style={s.link}>Preview sound & atmosphere</Text>
            </TouchableOpacity>
          </View>
          <View style={s.card}>
            <Text style={type.card}>Phone & smartwatch</Text>
            <Text style={type.body}>
              {mode === "alarmkit"
                ? "A paired Apple Watch uses Apple’s alarm screen and device sound settings. Treksor’s particles and brightness apply to this phone."
                : "Watch alerts depend on your phone and watch notification settings. This does not install an independent watch alarm."}
            </Text>
            <Text style={type.caption}>
              Check a short test alarm on your actual devices before relying on
              it overnight.
            </Text>
          </View>
          {!!error && (
            <Text
              accessibilityLiveRegion="polite"
              style={{ color: colors.danger }}
            >
              {error}
            </Text>
          )}
          {!!message && (
            <Text
              accessibilityLiveRegion="polite"
              style={{ color: colors.success }}
            >
              {message}
            </Text>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            disabled={busy || !loaded}
            onPress={() => void save()}
            style={[s.button, { opacity: busy || !loaded ? 0.5 : 1 }]}
          >
            <Text style={s.buttonText}>
              {busy
                ? "Saving…"
                : mode === "clock"
                  ? "CONTINUE IN DEVICE CLOCK"
                  : mode === "alarmkit"
                    ? "SET NEXT WAKE ALARM"
                    : "SET NEXT WAKE REMINDER"}
            </Text>
          </TouchableOpacity>
          {scheduled && (
            <TouchableOpacity
              disabled={busy}
              onPress={() => void cancel()}
              style={s.secondary}
            >
              <Text style={s.link}>Cancel saved wake-up</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            disabled={busy || !loaded}
            onPress={async () => {
              try {
                await saveWakeSettings(values());
                setMessage(
                  "Preferences saved. Your already scheduled alarm stays unchanged until you set it again.",
                );
              } catch (e) {
                setError(e instanceof Error ? e.message : "Unable to save");
              }
            }}
            style={s.secondary}
          >
            <Text style={s.link}>Save preferences only</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              void Linking.openURL("https://kenney.nl/assets/music-jingles")
            }
          >
            <Text style={type.caption}>
              Audio by Kenney · CC0 · Adapted with softer gain and spaced
              repeats. View source & licence.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal
        visible={!!preview}
        animationType="fade"
        onRequestClose={closePreview}
      >
        {preview && (
          <WakePlayer settings={preview} preview onClose={closePreview} />
        )}
      </Modal>
    </>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, gap: 16 },
  card: { ...surface.card, gap: 14 },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  time: {
    color: colors.text,
    fontSize: 44,
    fontWeight: "600",
    padding: 12,
    textAlign: "center",
    minWidth: 84,
    borderRadius: 15,
    backgroundColor: colors.background,
  },
  list: { gap: 8 },
  sound: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  soundChoice: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    flex: 1,
    padding: 16,
  },
  play: {
    minWidth: 52,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  between: { flexDirection: "row", gap: 12, alignItems: "center" },
  palette: { flexDirection: "row", gap: 9 },
  swatch: {
    flex: 1,
    padding: 12,
    gap: 8,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
  },
  button: {
    minHeight: 54,
    backgroundColor: colors.gold,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: {
    color: colors.background,
    fontWeight: "700",
    textAlign: "center",
  },
  secondary: { minHeight: 48, justifyContent: "center", alignItems: "center" },
  link: { color: colors.gold, fontSize: 13, lineHeight: 20 },
});
