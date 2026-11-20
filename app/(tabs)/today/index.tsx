import { Redirect } from "expo-router";

/** Saved Today links now open the unified Progress screen. */
export default function TodayScreen() {
  return <Redirect href="/(tabs)/tracking" />;
}
