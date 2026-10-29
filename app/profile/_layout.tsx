import {colors} from "@/theme/architect";
import Header from "@/components/ui/Header";
import { router, Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="moments" options={{headerShown:false}} />
      <Stack.Screen
        name="index"
        options={{
          header: () => (
            <Header
              showBackButton={true}
              onBackPress={() => router.back()}
              showAvatar={false}
              title="Profile"
            />
          ),
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          header: () => (
            <Header
              showBackButton={true}
              onBackPress={() => router.back()}
              showAvatar={false}
              title="Edit Profile"
            />
          ),
        }}
      />
    </Stack>
  );
}
