import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { mergeNotices, Notice, NoticeKind, safeNoticeRoute } from "@/lib/notification-inbox";
const prefix = "treksor.notifications.v1.";
let writes: Promise<unknown> = Promise.resolve();
let generation = 0;
interface Inbox {
  owner: string; ready: boolean; badgeAllowed: boolean | null; items: Notice[]; read: Record<string, true>; error: string | null; catalogues: Partial<Record<NoticeKind,string[]>>;
  activate: (owner: string) => Promise<void>;
  receive: (items: Notice[]) => void;
  sync: (kind: NoticeKind, items: Notice[]) => void;
  markRead: (ids: string[]) => void;
}
export const useNotificationStore = create<Inbox>((set, get) => {
  const save = () => {
    const { owner, items, read, catalogues } = get();
    if (!owner || !get().ready) return;
    const json = JSON.stringify({ items, read, catalogues });
    writes = writes.catch(() => {}).then(() => AsyncStorage.setItem(prefix + owner, json));
    void writes.catch(() => { if(get().owner === owner) set({error:"Could not save notification status. Try again."}); });
  };
  return {
    owner:"", ready:false, badgeAllowed:null, items:[], read:{}, error:null, catalogues:{},
    activate: async owner => {
      const version = ++generation;
      set({owner,ready:false,items:[],read:{},error:null,catalogues:{}});
      if(!owner) return;
      try {
        await writes.catch(() => {});
        const raw = await AsyncStorage.getItem(prefix + owner);
        const value = raw ? JSON.parse(raw) : {};
        const items: Notice[] = Array.isArray(value.items) ? value.items.filter((i:any) => i && typeof i.id === "string" && typeof i.title === "string" && typeof i.date === "string" && ["thought","article","reminder","update"].includes(i.kind) && safeNoticeRoute(i.route)) : [];
        const read = Object.fromEntries(Object.entries(value.read || {}).filter(([,v]) => v === true)) as Record<string,true>;
        if(version === generation) set({items:mergeNotices([],items,read),read,catalogues:value.catalogues || {},ready:true});
      } catch { if(version === generation) set({error:"Could not load notifications. Reopen the app to retry."}); }
    },
    receive: incoming => {
      const s = get(); if(!s.ready) return;
      const items = incoming.filter(i => (!i.owner || i.owner === s.owner) && safeNoticeRoute(i.route));
      set({items:mergeNotices(s.items,items,s.read),error:null}); save();
    },
    sync: (kind, incoming) => {
      const s = get(); if(!s.ready) return;
      // Feed refreshes never acknowledge a notification. Keep push-only notices
      // until their content arrives, including while the editorial service is offline.
      const read = {...s.read};
      incoming.forEach(i => { if(i.read) read[i.id] = true; });
      const ids = incoming.map(i=>i.id);
      const previous = new Set(s.catalogues[kind] || []);
      const items = mergeNotices(s.items.filter(i=>!previous.has(i.id) || ids.includes(i.id)),incoming.filter(i => i.kind === kind),read);
      const catalogues = {...s.catalogues,[kind]:ids};
      if(JSON.stringify(items) === JSON.stringify(s.items) && JSON.stringify(read) === JSON.stringify(s.read) && JSON.stringify(catalogues) === JSON.stringify(s.catalogues)) return;
      set({items,read,catalogues,error:null}); save();
    },
    markRead: ids => {
      const s = get(); if(!s.ready) return;
      const read = {...s.read}; ids.forEach(id => { read[id] = true; });
      set({read,items:s.items.map(i => read[i.id] ? {...i,read:true} : i),error:null}); save();
    },
  };
});
