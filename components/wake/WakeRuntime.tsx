import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Modal } from "react-native";
import * as Notifications from "expo-notifications";
import {
  cancelWake,
  currentAlert,
  wakeForNotification,
} from "@/lib/wake/service";
import { ScheduledWake } from "@/lib/wake/model";
import { useWakeOverlay } from "@/store/wake-overlay-store";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import WakePlayer from "./WakePlayer";
export default function WakeRuntime() {
  const [wake, setWake] = useState<ScheduledWake | null>(null),
    active = useRef<ScheduledWake | null>(null),
    busy = useRef(false),
    reduced = useReducedMotion();
  const display = useCallback((value: ScheduledWake | null) => {
    active.current = value;
    setWake(value);
    useWakeOverlay.getState().setVisible(!!value);
  }, []);
  useEffect(() => {
    let live = true,
      checking = false;
    const show = (value: ScheduledWake | null) => {
      if (
        live &&
        value &&
        AppState.currentState === "active" &&
        !busy.current &&
        active.current?.id !== value.id
      )
        display(value);
    };
    const check = async () => {
      if (checking || AppState.currentState !== "active") return;
      checking = true;
      try {
        const value = await currentAlert();
        if (!live) return;
        if (value) show(value);
        else if (active.current?.kind === "alarmkit" && !busy.current)
          display(null);
      } catch {
        /* Native alert remains active if it cannot be queried. */
      } finally {
        checking = false;
      }
    };
    const onNotification = async (n: Notifications.Notification) => {
      if (n.request.content.data?.kind !== "treksor-wake") return;
      try {
        show(await wakeForNotification(n.request.identifier));
      } catch {}
    };
    const received = Notifications.addNotificationReceivedListener(
      (n) => void onNotification(n),
    );
    const response = Notifications.addNotificationResponseReceivedListener(
      (r) => void onNotification(r.notification),
    );
    void Notifications.getLastNotificationResponseAsync()
      .then((r) => {
        if (r && live) void onNotification(r.notification);
      })
      .catch(() => {});
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void check();
      else display(null);
    });
    const timer = setInterval(() => void check(), 2500);
    void check();
    return () => {
      live = false;
      clearInterval(timer);
      received.remove();
      response.remove();
      sub.remove();
      useWakeOverlay.getState().setVisible(false);
    };
  }, [display]);
  const close = useCallback(() => {
    const item = active.current;
    if (!item || busy.current) return;
    busy.current = true;
    void cancelWake(item.id)
      .then(() => display(null))
      .catch(() =>
        Alert.alert(
          "Unable to stop the alarm",
          "Use the device alarm controls to stop it, then try again.",
        ),
      )
      .finally(() => {
        busy.current = false;
      });
  }, [display]);
  return (
    <Modal
      visible={!!wake}
      animationType={reduced ? "none" : "fade"}
      onRequestClose={close}
    >
      {wake && (
        <WakePlayer
          settings={wake.settings}
          preview={false}
          playSound={false}
          onClose={close}
        />
      )}
    </Modal>
  );
}
