import {colors} from "@/theme/architect";
import { Stack } from "expo-router";

export default function ArticleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown:false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    />
  );
}
