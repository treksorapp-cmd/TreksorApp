import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { AppState } from "react-native";

/** Refresh only while this screen is visible; resume immediately on foreground. */
export function useContentRefresh(refresh: () => Promise<void>) {
  useFocusEffect(useCallback(() => {
    let busy = false;
    const run = async () => {
      if (busy || AppState.currentState === "background" || AppState.currentState === "inactive") return;
      busy = true;
      try { await refresh(); } finally { busy = false; }
    };
    void run();
    const subscription = AppState.addEventListener("change", state => { if (state === "active") void run(); });
    const timer = setInterval(() => void run(), 60_000);
    return () => { clearInterval(timer); subscription.remove(); };
  }, [refresh]));
}
