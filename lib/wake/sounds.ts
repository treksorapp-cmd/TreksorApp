export const wakeSounds = [
  {
    id: "wake_01",
    name: "First light",
    family: "Plucked",
    source: require("@/assets/audio/wake/wake_01.wav"),
  },
  {
    id: "wake_02",
    name: "Soft horizon",
    family: "Plucked",
    source: require("@/assets/audio/wake/wake_02.wav"),
  },
  {
    id: "wake_03",
    name: "Quiet beginning",
    family: "Plucked",
    source: require("@/assets/audio/wake/wake_03.wav"),
  },
  {
    id: "wake_04",
    name: "Golden hour",
    family: "Plucked",
    source: require("@/assets/audio/wake/wake_04.wav"),
  },
  {
    id: "wake_05",
    name: "Open sky",
    family: "Plucked",
    source: require("@/assets/audio/wake/wake_05.wav"),
  },
  {
    id: "wake_06",
    name: "Warm welcome",
    family: "Bell-like",
    source: require("@/assets/audio/wake/wake_06.wav"),
  },
  {
    id: "wake_07",
    name: "Gentle glow",
    family: "Bell-like",
    source: require("@/assets/audio/wake/wake_07.wav"),
  },
  {
    id: "wake_08",
    name: "Morning rhythm",
    family: "Bell-like",
    source: require("@/assets/audio/wake/wake_08.wav"),
  },
  {
    id: "wake_09",
    name: "Amber dawn",
    family: "Bell-like",
    source: require("@/assets/audio/wake/wake_09.wav"),
  },
  {
    id: "wake_10",
    name: "Slow sunrise",
    family: "Bell-like",
    source: require("@/assets/audio/wake/wake_10.wav"),
  },
  {
    id: "wake_11",
    name: "Blue hour",
    family: "Warm brass",
    source: require("@/assets/audio/wake/wake_11.wav"),
  },
  {
    id: "wake_12",
    name: "Clear morning",
    family: "Warm brass",
    source: require("@/assets/audio/wake/wake_12.wav"),
  },
  {
    id: "wake_13",
    name: "Silver light",
    family: "Warm brass",
    source: require("@/assets/audio/wake/wake_13.wav"),
  },
  {
    id: "wake_14",
    name: "Fresh start",
    family: "Warm brass",
    source: require("@/assets/audio/wake/wake_14.wav"),
  },
  {
    id: "wake_15",
    name: "New day",
    family: "Warm brass",
    source: require("@/assets/audio/wake/wake_15.wav"),
  },
] as const;
export type WakeSoundId = (typeof wakeSounds)[number]["id"];
