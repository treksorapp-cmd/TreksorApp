import { colors } from "@/theme/architect";
import Header from "@/components/ui/Header";
import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown:false
        }}
      />
    </Stack>
  );
}
