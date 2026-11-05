import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { useAuthStore } from '@/store/auth-store';
import { isProgressAccountReady } from '@/lib/local-progress';
interface Bridge {
  changed(): void;
  reply(id: string, json: string): void;
  addListener(name: string, fn: (event: { id: string; json: string }) => void): {remove():void};
}
export const watchBridge = Platform.OS === 'ios' ? requireOptionalNativeModule<Bridge>('TreksorWatch') : null;
export function ownerNow() {
  const auth = useAuthStore.getState();
  const owner = auth.user?.id;
  return auth.isAuthenticated && auth.isVerified && owner && isProgressAccountReady(owner) ? owner : null;
}
const key = (owner: string) => `treksor.watch.grant.v1.${encodeURIComponent(owner)}`;
export const readGrant = (owner: string) => AsyncStorage.getItem(key(owner));
export async function changeSharing(owner: string, enable: boolean) {
  if (!watchBridge || ownerNow() !== owner) throw Error('Open your signed-in Treksor account first.');
  if (enable) await AsyncStorage.setItem(key(owner), randomUUID());
  else await AsyncStorage.removeItem(key(owner));
  watchBridge.changed();
}
