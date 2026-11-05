import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

export const errorHandler = (error: any) => {
    // Network and native errors are not necessarily JSON. Never crash while reporting one.
    const status = error?.response?.status ?? error?.status ?? error?.errorCode;
    if (status === 401) {
        // Session refresh is handled by the auth store; avoid touching browser-only localStorage.
        console.warn("Unauthorized request; authentication may need refreshing.");
    }
}

export const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const generateRandomId = (length: number = 6): string => {
  const characters = "0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const calcPercentage = (done: number, total: number) =>
  total > 0 ? Math.round((done / total) * 100) : 0;

export const countRead = (items: {isRead?: boolean}[]) => items.filter(i => i.isRead).length;