import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { router, useRootNavigationState } from "expo-router";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationStore } from "@/store/notification-store";
import { usePowerThoughtStore } from "@/store/thought-store";
import { useArticleStore } from "@/store/article-store";
import { isProgressAccountReady } from "@/lib/local-progress";
import { cancelThoughtReminder, scheduleTodaysPowerThought } from "@/lib/daily-thought-notification";
import { Notice, noticeCount, noticeFromNotification } from "@/lib/notification-inbox";
let badgeWrites: Promise<unknown> = Promise.resolve();
export function useNotificationInbox() {
  const owner = useAuthStore(s => s.isAuthenticated && s.isVerified ? s.user?.id : "") || "";
  const navigation = useRootNavigationState();
  const [pending, setPending] = useState<Notice | null>(null);
  const ready = useNotificationStore(s => s.ready && s.owner === owner);
  useEffect(() => {
    let alive = true, started = false, busy = false;
    const receivedBeforeReady: Notifications.Notification[] = [];
    const current = () => alive && useAuthStore.getState().user?.id === owner && useAuthStore.getState().isAuthenticated;
    const writeBadge = () => {
      const inbox = useNotificationStore.getState();
      if(Platform.OS !== "ios" || !inbox.ready || inbox.owner !== owner || !current()) return;
      const count = noticeCount(inbox.items);
      badgeWrites = badgeWrites.catch(() => {}).then(async () => {
        if(current()) await Notifications.setBadgeCountAsync(count);
      });
      void badgeWrites.catch(console.warn);
    };
    const syncThoughts = () => {
      const s = usePowerThoughtStore.getState();
      if(!current() || !isProgressAccountReady(owner)) return;
      const inbox = useNotificationStore.getState();
      const newlyRead = s.powerThoughts.filter(t=>t.isRead && !inbox.read[`thought:${t._id}`]).map(t=>`thought:${t._id}`);
      if(newlyRead.length) inbox.markRead(newlyRead);
      if(s.loading || s.error) return;
      const receipts = useNotificationStore.getState().read;
      const restored = s.powerThoughts.map(t => receipts[`thought:${t._id}`] && !t.isRead ? {...t,isRead:true} : t);
      if(restored.some((t,i)=>t !== s.powerThoughts[i])) { usePowerThoughtStore.setState({powerThoughts:restored}); return; }
      useNotificationStore.getState().sync("thought",s.powerThoughts.map(t => ({id:`thought:${t._id}`,kind:"thought",title:t.thought,route:"/mental/thoughts",date:t.date,read:t.isRead})));
    };
    const syncArticles = () => {
      const s = useArticleStore.getState();
      if(!current() || !isProgressAccountReady(owner)) return;
      const inbox = useNotificationStore.getState();
      const newlyRead = Object.values(s.articles).flat().filter(a=>a.isRead && !inbox.read[`article:${a._id}`]).map(a=>`article:${a._id}`);
      if(newlyRead.length) inbox.markRead(newlyRead);
      if(s.loading || s.error) return;
      const receipts = useNotificationStore.getState().read;
      let changed = false;
      const restored = Object.fromEntries(Object.entries(s.articles).map(([key,list])=>[key,list.map(a=>{if(receipts[`article:${a._id}`] && !a.isRead){changed=true;return {...a,isRead:true}} return a;})]));
      if(changed) { useArticleStore.setState({articles:restored}); useArticleStore.getState().getUnreadArticlesCount(); return; }
      const articles = [...new Map(Object.values(s.articles).flat().map(a => [a._id,a])).values()];
      useNotificationStore.getState().sync("article",articles.map(a => ({id:`article:${a._id}`,kind:"article",title:a.title,route:`/article/${encodeURIComponent(a._id)}`,date:a.date || "",read:a.isRead})));
    };
    const receive = (n: Notifications.Notification) => {
      if(!current()) return;
      if(!useNotificationStore.getState().ready || useNotificationStore.getState().owner !== owner) { receivedBeforeReady.push(n); return; }
      const notice = noticeFromNotification(n.request.identifier,n.request.content,new Date(n.date).toISOString());
      if(notice) useNotificationStore.getState().receive([notice]);
    };
    const refresh = async () => {
      if(!current() || busy || AppState.currentState !== "active" || !isProgressAccountReady(owner)) return;
      busy = true;
      try {
        if(!started) {
          await useNotificationStore.getState().activate(owner);
          if(!current()) return;
          started = useNotificationStore.getState().ready;
        }
        if(!started) return;
        receivedBeforeReady.splice(0).forEach(receive);
        const permission = await Notifications.getPermissionsAsync().catch(()=>null);
        if(current() && Platform.OS === "ios" && permission) useNotificationStore.setState({badgeAllowed:permission.ios?.allowsBadge === true});
        const presented = await Notifications.getPresentedNotificationsAsync().catch(() => []);
        presented.forEach(receive);
        await Promise.all([usePowerThoughtStore.getState().fetchPowerThoughts(),useArticleStore.getState().fetchArticles("category=all")]);
        if(current()) {
          syncThoughts(); syncArticles(); writeBadge();
          const today=usePowerThoughtStore.getState().powerThoughts.find(t=>t.isToday);
          if(today) {
            if(today.isRead) await cancelThoughtReminder(today._id);
            else await scheduleTodaysPowerThought(today.thought,today._id);
          }
        }
      } catch(error) { console.warn("Notification refresh failed",error); } finally { busy = false; }
    };
    if(!owner) {
      void useNotificationStore.getState().activate(""); setPending(null);
      if(Platform.OS === "ios") { badgeWrites = badgeWrites.catch(()=>{}).then(() => Notifications.setBadgeCountAsync(0)); void badgeWrites.catch(console.warn); }
      return;
    }
    void useNotificationStore.getState().activate("");
    const off = [usePowerThoughtStore.subscribe((next,previous)=>{
      syncThoughts();
      next.powerThoughts.filter(t=>t.isRead && !previous.powerThoughts.find(p=>p._id===t._id)?.isRead).forEach(t=>void cancelThoughtReminder(t._id).catch(console.warn));
    }),useArticleStore.subscribe(syncArticles),useNotificationStore.subscribe(writeBadge)];
    const received = Notifications.addNotificationReceivedListener(n => { receive(n); void refresh(); });
    const handleResponse = (r: Notifications.NotificationResponse) => {
      if(!current()) return;
      const notice = noticeFromNotification(r.notification.request.identifier,r.notification.request.content,new Date(r.notification.date).toISOString());
      if(notice && (!notice.owner || notice.owner === owner)) { receive(r.notification); setPending(notice); }
      void refresh();
    };
    const response = Notifications.addNotificationResponseReceivedListener(handleResponse);
    void Notifications.getLastNotificationResponseAsync().then(r => { if(r && alive) handleResponse(r); }).catch(console.warn);
    const active = AppState.addEventListener("change",s => { if(s === "active") void refresh(); });
    // Account restoration is asynchronous; wait for it before reading its caches.
    const bootstrap = setInterval(() => { if(!started) void refresh(); },1000);
    const timer = setInterval(() => void refresh(),60000);
    void refresh();
    return () => { alive=false; off.forEach(fn=>fn()); received.remove(); response.remove(); active.remove(); clearInterval(bootstrap); clearInterval(timer); };
  },[owner]);
  useEffect(() => {
    if(!pending || !ready || !navigation?.key) return;
    if(pending.owner && pending.owner !== owner) { setPending(null); return; }
    useNotificationStore.getState().receive([pending]);
    // Content stays unread until the explicit read action; opening a reminder
    // acknowledges its delivery without completing the user's task.
    if(pending.kind === "reminder" || pending.kind === "update") useNotificationStore.getState().markRead([pending.id]);
    router.push(pending.route as any);
    setPending(null);
    void Notifications.clearLastNotificationResponseAsync().catch(console.warn);
  },[pending,ready,navigation?.key,owner]);
}
