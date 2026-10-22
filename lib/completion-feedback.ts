import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { encode } from "base-64";

/** Small, locally generated two-note success chime. No network or extra asset required. */
function chimeUri(): string {
  const sampleRate = 22050;
  const duration = 0.42;
  const frames = Math.floor(sampleRate * duration);
  const bytes = new Uint8Array(44 + frames * 2);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) bytes[offset + i] = value.charCodeAt(i);
  };
  write(0, "RIFF");
  view.setUint32(4, bytes.length - 8, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, frames * 2, true);
  for (let i = 0; i < frames; i++) {
    const t = i / sampleRate;
    const first = Math.sin(2 * Math.PI * 659.25 * t) * Math.exp(-t * 18);
    const secondT = Math.max(0, t - 0.11);
    const second = t >= 0.11 ? Math.sin(2 * Math.PI * 880 * secondT) * Math.exp(-secondT * 10) : 0;
    const fadeIn = Math.min(1, t * 120);
    const sample = Math.max(-1, Math.min(1, (first * 0.28 + second * 0.36) * fadeIn));
    view.setInt16(44 + i * 2, Math.round(sample * 32767), true);
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return "data:audio/wav;base64," + encode(binary);
}

let sound: Audio.Sound | null = null;
export async function playCompletionFeedback(): Promise<void> {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  try {
    if (sound) {
      await sound.replayAsync();
      return;
    }
    const created = await Audio.Sound.createAsync({ uri: chimeUri() }, { shouldPlay: true, volume: 0.42 });
    sound = created.sound;
  } catch (error) {
    // Some native players cannot decode data URIs. The completion itself must never fail.
    console.warn("Completion sound unavailable", error);
  }
}
