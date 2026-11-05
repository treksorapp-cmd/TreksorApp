import { create } from "zustand";
/** Presentation only: device alarms remain owned by the native OS. */
export const useWakeOverlay = create<{
  visible: boolean;
  setVisible: (visible: boolean) => void;
}>((set) => ({ visible: false, setVisible: (visible) => set({ visible }) }));
