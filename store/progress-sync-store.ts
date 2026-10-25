import { create } from 'zustand';
export const useProgressSyncStore = create<{
  status:'idle'|'syncing'|'synced'|'error'; lastSynced:string|null; message:string; requestSync:()=>void;
}>(() => ({status:'idle',lastSynced:null,message:'Sign in to sync with your web profile.',requestSync:()=>{}}));
