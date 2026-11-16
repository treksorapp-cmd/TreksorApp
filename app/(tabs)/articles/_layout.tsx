import { Stack } from "expo-router";

export default function ArticlesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation:"ios_from_right",
        contentStyle: {
          backgroundColor: "#02050C",
        },
      }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown:false
        }}
      />

      <Stack.Screen
        name="[id]"
        options={{
          headerShown:false
        }}
      />
    </Stack>
  );
}
