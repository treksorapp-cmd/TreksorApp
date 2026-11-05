import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";


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
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let base64 = "";
  for (let i = 0; i < binary.length; i += 3) {
    const a = binary.charCodeAt(i), b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0, c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;
    const triple = (a << 16) | (b << 8) | c;
    base64 += alphabet[(triple >>> 18) & 63] + alphabet[(triple >>> 12) & 63] + (i + 1 < binary.length ? alphabet[(triple >>> 6) & 63] : "=") + (i + 2 < binary.length ? alphabet[triple & 63] : "=");
  }
  return "data:audio/wav;base64," + base64;
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
