import Header from "@/components/ui/Header";
import { router, Stack } from "expo-router";
import React from "react";

const SpiritualLayout = () => {
  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: "#02050C",
        },
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          header: () => (
            <Header
              title="Balance"
              showBackButton={true}
              onBackPress={() => router.back()}
              showAvatar={false}
            />
          ),
        }}
      />

      <Stack.Screen
          name="mediation/[id]"
          options={{
            headerShown: true,
          }}
      />
    </Stack>
  );
};

export default SpiritualLayout;