import { useState, useEffect } from "react";
import { Linking, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BrandIcon from "@/components/ui/BrandIcon";
import UnreadBadge from "@/components/UnreadBadge";
import { useNotificationStore } from "@/store/notification-store";
import { useAuthStore } from "@/store/auth-store";
import { usePowerThoughtStore } from "@/store/thought-store";
import { useArticleStore } from "@/store/article-store";
import { Notice } from "@/lib/notification-inbox";
import { colors, type } from "@/theme/architect";
export default function NotificationBell() {
  const [open,setOpen] = useState(false);
  const owner = useAuthStore(s=>s.user?.id);
  const inbox = useNotificationStore();
  const insets = useSafeAreaInsets();
  const items = inbox.owner === owner && inbox.ready ? inbox.items.filter(i=>!i.read) : [];
  useEffect(()=>setOpen(false),[owner]);
  const read = (item:Notice) => {
    if(item.kind === "thought") usePowerThoughtStore.getState().markPowerThoughtAsRead(item.id.slice(8));
    if(item.kind === "article") useArticleStore.getState().markArticleAsRead("all",item.id.slice(8));
    inbox.markRead([item.id]);
  };
  const go = (item:Notice) => {
    if(item.kind === "reminder" || item.kind === "update") read(item);
    setOpen(false); router.push(item.route as any);
  };
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={`Notifications, ${items.length} unread`} onPress={()=>setOpen(true)} style={{width:38,height:40,alignItems:"center",justifyContent:"center"}}>
      <BrandIcon name="notifications-outline" size={21} color={colors.gold}/>
      {!!items.length && <View style={{position:"absolute",right:0,top:0}}><UnreadBadge count={items.length}/></View>}
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
      <View style={{flex:1,backgroundColor:"#000B",paddingTop:insets.top+20,justifyContent:"flex-end"}}>
        <View style={{maxHeight:"85%",backgroundColor:colors.surface,borderTopLeftRadius:22,borderTopRightRadius:22,padding:20,paddingBottom:insets.bottom+20}}>
          <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}><Text style={type.section}>Notifications</Text><Pressable accessibilityLabel="Close notifications" accessibilityRole="button" onPress={()=>setOpen(false)} style={{padding:12}}><BrandIcon name="close" size={24} color={colors.text}/></Pressable></View>
          <Text style={[type.caption,{marginBottom:15}]}>Unread content and reminders</Text>
          <ScrollView contentContainerStyle={{gap:12}}>
            {inbox.badgeAllowed === false && <Pressable accessibilityRole="button" onPress={()=>void Linking.openSettings()} style={{paddingVertical:12}}><Text style={{color:colors.danger}}>Icon badges are disabled in iPhone Settings. Tap to enable them.</Text></Pressable>}
            {inbox.error && <Text accessibilityRole="alert" style={{color:colors.danger}}>{inbox.error}</Text>}
            {!inbox.ready && !inbox.error && <Text style={type.body}>Loading notifications…</Text>}
            {inbox.ready && !items.length && <Text style={type.body}>You're all caught up.</Text>}
            {items.map(item=><View key={item.id} style={{backgroundColor:colors.surfaceRaised,borderRadius:12,padding:14,gap:8}}>
              <Pressable accessibilityRole="button" onPress={()=>go(item)} style={{flexDirection:"row",gap:10,alignItems:"center",minHeight:44}}><UnreadBadge dot/><View style={{flex:1}}><Text style={type.eyebrow}>{item.kind === "thought" ? "POWER THOUGHT" : item.kind.toUpperCase()}</Text><Text style={[type.body,{color:colors.text}]} numberOfLines={3}>{item.title}</Text></View><BrandIcon name="chevron-forward" size={18} color={colors.gold}/></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Mark as read: ${item.title}`} onPress={()=>read(item)} style={{paddingVertical:12}}><Text style={{color:colors.gold,fontSize:12,fontWeight:"700"}}>MARK AS READ</Text></Pressable>
            </View>)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}
