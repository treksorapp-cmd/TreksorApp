import Header from "@/components/ui/Header";
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
          headerShown:true,
          header:()=><Header title="ARTICLES" showBackButton={false} showAvatar={false} />
        }}
      />

      <Stack.Screen
        name="[id]"
        options={{
          headerShown:false,
          header:()=><Header title="ARTICLES" showBackButton={true} showAvatar={false} />
        }}
      />
    </Stack>
  );
}
