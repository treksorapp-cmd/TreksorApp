import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { getWalks, subscribeWalks, type Walk } from '@/lib/walks';
export function useWalks() {
  const owner=useAuthStore(s=>s.isAuthenticated?s.user?.id||'':'');
  const [data,setData]=useState<{owner:string;rows:Walk[];loading:boolean;error:string}>({owner:'',rows:[],loading:true,error:''});
  const [now,setNow]=useState(new Date());
  const generation=useRef(0),mounted=useRef(false);
  const reload=useCallback(async()=>{
    const id=++generation.current;
    if(!owner){if(mounted.current)setData({owner:'',rows:[],loading:false,error:''});return;}
    setNow(new Date());setData(previous=>({owner,rows:previous.owner===owner?previous.rows:[],loading:true,error:''}));
    try{const rows=await getWalks(owner);if(mounted.current&&generation.current===id)setData({owner,rows,loading:false,error:''})}
    catch(error){if(mounted.current&&generation.current===id)setData({owner,rows:[],loading:false,error:error instanceof Error?error.message:'Unable to load walks. Please try again.'})}
  },[owner]);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;++generation.current}},[]);
  useFocusEffect(useCallback(()=>{void reload();return()=>{++generation.current}},[reload]));
  useEffect(()=>subscribeWalks(changed=>{if(changed===owner)void reload()}),[owner,reload]);
  useEffect(()=>{const sub=AppState.addEventListener('change',state=>{if(state==='active')void reload()});const timer=setInterval(()=>setNow(new Date()),60000);return()=>{sub.remove();clearInterval(timer)}},[reload]);
  return {owner,rows:data.owner===owner?data.rows:[],loading:data.owner!==owner||data.loading,error:data.owner===owner?data.error:'',now,reload};
}
