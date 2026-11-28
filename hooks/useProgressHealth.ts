import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getHealthSnapshot } from '@/api/health-snapshot';
import { useAuthStore } from '@/store/auth-store';

type Snapshot = Awaited<ReturnType<typeof getHealthSnapshot>>;
type State = { owner?: string; snapshot: Snapshot; loading: boolean; error: boolean };

// Reads only a previously consented account snapshot. Opening Progress never
// requests HealthKit access and never uploads health data.
export function useProgressHealth() {
  const owner = useAuthStore(s => s.user?.id);
  const [state, setState] = useState<State>({ snapshot: null, loading: true, error: false });
  const [choice, setChoice] = useState({ owner, sourceId: '' });
  const generation = useRef(0);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; ++generation.current; }; }, []);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    if (!owner) { setState({ owner, snapshot: null, loading: false, error: false }); return; }
    setState(previous => ({ owner, snapshot: previous.owner === owner ? previous.snapshot : null, loading: true, error: false }));
    const current = () => mounted.current && request === generation.current && useAuthStore.getState().user?.id === owner;
    try {
      const snapshot = await getHealthSnapshot(owner);
      if (current()) setState({ owner, snapshot, loading: false, error: false });
    } catch {
      if (current()) setState(previous => ({ ...previous, loading: false, error: true }));
    }
  }, [owner]);
  useFocusEffect(useCallback(() => { void refresh(); return () => { ++generation.current; }; }, [refresh]));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', status => { if (status === 'active') void refresh(); });
    return () => subscription.remove();
  }, [refresh]);
  const own = state.owner === owner;
  const snapshot = own ? state.snapshot : null;
  const rows = snapshot?.snapshot.workouts || [];
  const sources = [...new Map(rows.map(row => [row.sourceId, { id: row.sourceId, name: row.sourceName }])).values()];
  const sourceId = choice.owner === owner && sources.some(source => source.id === choice.sourceId) ? choice.sourceId : sources[0]?.id || '';
  return {
    rows, sources, sourceId, selectSource: (id: string) => setChoice({ owner, sourceId: id }),
    savedAt: snapshot?.snapshot.capturedAt || null, hasSnapshot: !!snapshot,
    loading: !own || state.loading, error: own && state.error, refresh,
  };
}
