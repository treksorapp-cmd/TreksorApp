import { requireOptionalNativeModule } from "expo-modules-core";
const native = requireOptionalNativeModule<{
  getBrightnessAsync: () => Promise<number>;
  setBrightnessAsync: (value: number) => Promise<void>;
}>("ExpoBrightness");
export const brightnessAvailable = !!native;
export async function getBrightnessAsync() {
  if (!native)
    throw Error("Install the updated Treksor build to use screen glow.");
  return native.getBrightnessAsync();
}
export async function setBrightnessAsync(value: number) {
  if (!native) throw Error("Screen glow is unavailable in this build.");
  return native.setBrightnessAsync(Math.max(0, Math.min(1, value)));
}
