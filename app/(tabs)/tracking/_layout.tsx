import Header from "@/components/ui/Header";
import { Stack } from "expo-router";

export default function TrackingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#02050C",
        },
      }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown:false,
          header:()=><Header title="TRACKING" showBackButton={false} showAvatar={false} />
        }}
      />
    </Stack>
  );
}
