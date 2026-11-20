import { Redirect } from "expo-router";

/** Legacy /today links stay valid, but Today is no longer a tab. */
export default function LegacyTodayRedirect() {
  return <Redirect href="/(tabs)/tracking" />;
}
