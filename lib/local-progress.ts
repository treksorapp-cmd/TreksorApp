import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWorkoutStore } from '@/store/workout-store';
import { useTrackingStore } from '@/store/tracking-store';
import { useArticleStore } from '@/store/article-store';
import { useMediationStore } from '@/store/mediation-store';
import { useMySpaceStore } from '@/store/myspace-store';
import { usePowerThoughtStore } from '@/store/thought-store';

const OWNER = 'treksor.progress.owner.v1';
const CACHE = 'treksor.progress.local.v1.';
const THOUGHTS = 'treksor.thoughts.read.v1';
const VISION = 'treksor.vision-board.v1';
const stores = [useWorkoutStore, useTrackingStore, useArticleStore, useMediationStore, useMySpaceStore];
let queue: Promise<unknown> = Promise.resolve();
let activeProgressUser = '';
export const isProgressAccountReady = (id:string) => activeProgressUser === id;
function exclusive<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.then(work, work); queue = next.catch(() => {}); return next;
}
async function hydrate() {
  await Promise.all(stores.map(store => store.persist.hasHydrated() ? Promise.resolve() : new Promise<void>(resolve => {
    const off = store.persist.onFinishHydration(() => { off(); resolve(); });
    if (store.persist.hasHydrated()) { off(); resolve(); }
  })));
}
async function backup(userId: string) {
  const workout = useWorkoutStore.getState();
  // These account caches stay on the device; journal and vision text never enter a cloud payload.
  await AsyncStorage.setItem(CACHE + userId, JSON.stringify({
    workout: {activeGymWorkout:workout.activeGymWorkout,trainingPlan: workout.trainingPlan, gymSets: workout.gymSets, checkIns: workout.checkIns, exerciseOverrides: workout.exerciseOverrides, workouts: workout.workouts},
    tracking: useTrackingStore.getState().trackingData,
    articles: useArticleStore.getState().articles,
    meditation: useMediationStore.getState().mediation.map(m => ({id:m.id,isRead:!!m.isRead})),
    myspaces: useMySpaceStore.getState().myspaces,
    thoughts: await AsyncStorage.getItem(THOUGHTS), vision: await AsyncStorage.getItem(VISION),
  }));
}
export function checkpointProgress(userId: string) {
  activeProgressUser = '';
  return exclusive(async () => { await hydrate(); if (userId) { await backup(userId); await AsyncStorage.setItem(OWNER, "signed-out:" + userId); } });
}
export function prepareProgressAccount(userId: string) {
  return exclusive(async () => {
    activeProgressUser = '';
    await hydrate();
    const previous = await AsyncStorage.getItem(OWNER);
    if (previous === userId) { activeProgressUser=userId; return; }
    if (!previous) { await AsyncStorage.setItem(OWNER,userId); activeProgressUser=userId; return; } // Adopt existing progress once on upgrade.
    if (!previous.startsWith("signed-out:")) await backup(previous);
    const saved = await AsyncStorage.getItem(CACHE + userId);
    stores.forEach(store => store.getState().clearData());
    usePowerThoughtStore.getState().clearData();
    await AsyncStorage.multiRemove([THOUGHTS,VISION]);
    if (saved) {
      const data = JSON.parse(saved);
      useWorkoutStore.setState(data.workout);
      useTrackingStore.setState({trackingData:data.tracking});
      useArticleStore.setState({articles:data.articles});
      const complete = new Set(data.meditation.filter((m: {isRead:boolean}) => m.isRead).map((m: {id:string}) => m.id));
      useMediationStore.setState({mediation:useMediationStore.getState().mediation.map(m => ({...m,isRead:complete.has(m.id)}))});
      useMediationStore.getState().updateLockedStatus();
      useMySpaceStore.setState({myspaces:data.myspaces});
      if (data.thoughts) await AsyncStorage.setItem(THOUGHTS,data.thoughts);
      if (data.vision) await AsyncStorage.setItem(VISION,data.vision);
    }
    await AsyncStorage.setItem(OWNER,userId);
    activeProgressUser=userId;
  });
}
