import { useEffect, useState } from "react";
import {
  AppState,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Audio } from "expo-av";
import * as Brightness from "@/lib/wake/brightness";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { wakeSounds } from "@/lib/wake/sounds";
import { WakeSettings, wakeThemes } from "@/lib/wake/model";
import { colors, type } from "@/theme/architect";
import WakePulse from "./WakePulse";
export default function WakePlayer({
  settings,
  preview,
  onClose,
  playSound = true,
}: {
  settings: WakeSettings;
  preview: boolean;
  onClose: () => void;
  playSound?: boolean;
}) {
  const insets = useSafeAreaInsets(),
    [error, setError] = useState("");
  useEffect(() => {
    let closed = false,
      sound: Audio.Sound | null = null,
      previous: number | undefined;
    const stop = () => {
      closed = true;
      if (sound) void sound.unloadAsync().catch(() => {});
      if (previous !== undefined)
        void Brightness.setBrightnessAsync(previous).catch(() => {});
    };
    const start = async () => {
      try {
        if (playSound) {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
          });
          if (closed) return;
          const created = await Audio.Sound.createAsync(
            wakeSounds.find((s) => s.id === settings.sound)!.source,
            { shouldPlay: false, isLooping: !preview, volume: 0.75 },
          );
          sound = created.sound;
          if (closed) {
            await sound.unloadAsync();
            return;
          }
          await sound.playAsync();
        }
        if (settings.brightness) {
          previous = await Brightness.getBrightnessAsync();
          if (closed) return;
          await Brightness.setBrightnessAsync(Math.max(previous, 0.75));
          if (closed) await Brightness.setBrightnessAsync(previous);
        }
      } catch {
        if (!closed)
          setError(
            "The sound or screen glow could not start. Check the device volume and permissions.",
          );
      }
    };
    void start();
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active") stop();
    });
    const timer = preview
      ? setTimeout(() => {
          stop();
          onClose();
        }, 20000)
      : null;
    return () => {
      if (timer) clearTimeout(timer);
      sub.remove();
      stop();
    };
  }, [settings, onClose, preview, playSound]);
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        paddingTop: insets.top + 30,
        paddingBottom: insets.bottom + 30,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <Text style={type.eyebrow}>
        {preview ? "WAKE PREVIEW" : "BALANCE · A NEW DAY"}
      </Text>
      <WakePulse theme={settings.theme} motion={settings.motion} />
      <Text
        style={[
          type.page,
          { textAlign: "center", color: wakeThemes[settings.theme].color },
        ]}
      >
        Begin gently.
      </Text>
      <Text style={[type.body, { textAlign: "center" }]}>
        One breath. A little light. Your own pace.
      </Text>
      {!!error && <Text style={{ color: colors.danger }}>{error}</Text>}
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onClose}
        style={{
          padding: 20,
          borderRadius: 18,
          backgroundColor: wakeThemes[settings.theme].color,
          minWidth: 220,
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.background, fontWeight: "700" }}>
          {preview ? "Close preview" : "Start my day"}
        </Text>
      </TouchableOpacity>
      <Text style={type.caption}>
        Screen glow is restored when this view closes.
      </Text>
    </ScrollView>
  );
}
