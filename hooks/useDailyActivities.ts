import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { getDailyActivities, subscribeDailyActivities, type DailyActivities } from '@/lib/daily-activities';

const EMPTY: DailyActivities = { entries: [], customTitles: [] };
export function useDailyActivities() {
  const owner = useAuthStore(s => s.isAuthenticated ? s.user?.id || '' : '');
  const [data, setData] = useState<{owner:string;value:DailyActivities;loading:boolean;error:string}>({owner:'',value:EMPTY,loading:true,error:''});
  const generation = useRef(0),mounted = useRef(false);
  const reload = useCallback(async () => {
    const id = ++generation.current;
    if (!owner) { if (mounted.current) setData({owner:'',value:EMPTY,loading:false,error:''}); return; }
    setData(previous => ({owner,value:previous.owner===owner?previous.value:EMPTY,loading:true,error:''}));
    try {
      const value=await getDailyActivities(owner);
      if (mounted.current && generation.current === id) setData({owner,value,loading:false,error:''});
    } catch(error) {
      if (mounted.current && generation.current===id) setData({owner,value:EMPTY,loading:false,error:error instanceof Error ? error.message : 'Daily Work unavailable.'});
    }
  },[owner]);
  useEffect(() => { mounted.current=true; return()=>{mounted.current=false;++generation.current}; },[]);
  useFocusEffect(useCallback(() => { void reload(); return () => { ++generation.current; }; },[reload]));
  useEffect(() => subscribeDailyActivities(changed => { if (changed===owner) void reload(); }),[owner,reload]);
  useEffect(() => { const sub=AppState.addEventListener('change',state=>{if(state==='active')void reload()});return()=>sub.remove();},[reload]);
  return { owner, ...data.owner===owner?data.value:EMPTY, loading:data.owner!==owner||data.loading, error:data.owner===owner?data.error:'',reload };
}
