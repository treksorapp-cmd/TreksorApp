import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
interface HealthModule {
 isAvailable(): boolean;
 requestReadAccess(): Promise<boolean>;
 readWorkouts(): Promise<unknown[]>;
}
// Existing installs and Android remain usable without the native module.
const native = Platform.OS === "ios" ? requireOptionalNativeModule<HealthModule>("TreksorHealth") : null;
export function healthAvailability(): "ready" | "update" | "unsupported" {
 if (Platform.OS !== "ios") return "unsupported";
 if (!native) return "update";
 return native.isAvailable() ? "ready" : "unsupported";
}
export async function previewHealthWorkouts() {
 if (!native || healthAvailability() !== "ready") throw Error("Install the Health-enabled iPhone build first.");
 await native.requestReadAccess();
 return native.readWorkouts();
}
