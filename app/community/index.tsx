import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import { colors, surface, type } from "@/theme/architect";
import { upcomingEvents, myRegistrations, myPastEvents, joinEvent, leaveEvent, submitExperience,
  type CommunityEvent } from "@/lib/community-api";

function eventTime(value: string) {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? parsed.toLocaleString("en-US", {month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"})
    : "Date to be confirmed";
}
export default function CommunityScreen() {
  const userId = useAuthStore(s => s.isAuthenticated ? s.user.id : undefined);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [history, setHistory] = useState<CommunityEvent[]>([]);
  const [joined, setJoined] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<Record<string,{connection:boolean|null;again:boolean|null}>>({});

  const load = useCallback(async () => {
    setLoading(true);setError("");
    try {
      const [upcoming, registrations, past] = await Promise.all([
        upcomingEvents(),
        userId ? myRegistrations(userId) : Promise.resolve([]),
        userId ? myPastEvents() : Promise.resolve([]),
      ]);
      if (userId && useAuthStore.getState().user.id !== userId) return;
      const ids = new Set(registrations.map(r => r.event_id));
      setEvents(upcoming);
      setJoined([...ids]);
      setHistory(past.filter(event => ids.has(event.id)));
    } catch {
      setError("Community listings are unavailable. Pull back later to try again.");
    } finally { setLoading(false); }
  }, [userId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function changeRsvp(eventId: string, isJoined: boolean) {
    if (!userId || busyId) return;
    setBusyId(eventId);setError("");
    try {
      if (isJoined) await leaveEvent(userId, eventId);
      else await joinEvent(userId, eventId);
      await load();
    } catch {
      setError(isJoined ? "Couldn't cancel your registration." : "Couldn't join. The event may be full or registration may have closed.");
    } finally { setBusyId(null); }
  }
  function confirmLeave(eventId: string) {
    Alert.alert("Leave this event?", "You can register again if places are still available.", [
      {text:"Keep my place",style:"cancel"},
      {text:"Leave event",style:"destructive",onPress:()=>void changeRsvp(eventId,true)},
    ]);
  }
  async function submit(eventId: string) {
    if (!userId || busyId) return;
    const value = feedback[eventId];
    if (value?.connection == null || value.again == null) return;
    setBusyId(eventId);setError("");
    try {
      await submitExperience(userId,{
        event_id:eventId,connected_with_someone:value.connection,would_attend_again:value.again,
      });
      Alert.alert("Thank you", "Your private feedback was saved. It helps us build better in-person experiences.");
    } catch { setError("Couldn't save your feedback. Please try again."); }
    finally { setBusyId(null); }
  }
  function question(eventId: string, field: "connection" | "again", label: string) {
    const current=feedback[eventId]?.[field]??null;
    return <View style={styles.question}>
      <Text style={styles.small}>{label}</Text>
      <View style={styles.actions}>{([true,false] as const).map(v=>
        <TouchableOpacity key={String(v)} accessibilityRole="radio" accessibilityState={{checked:current===v}}
          onPress={()=>setFeedback(a=>({...a,[eventId]:{
            connection:a[eventId]?.connection??null,
            again:a[eventId]?.again??null,
            [field]:v,
          }}))}
          style={[styles.choice,current===v&&styles.selected]}>
          <Text style={styles.choiceText}>{v?"Yes":"No"}</Text>
        </TouchableOpacity>
      )}</View>
    </View>;
  }

  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Return to Today"
        onPress={()=>router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.gold}/>
        <Text style={styles.backLabel}>TODAY</Text>
      </TouchableOpacity>
      <Text style={styles.eyebrow}>TREKSOR COMMUNITY</Text>
      <Text style={styles.title}>Experience it together.</Text>
      <Text style={styles.subtitle}>Small-group experiences. Shared effort. Connections that last beyond the screen.</Text>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Upcoming experiences</Text>
        <TouchableOpacity accessibilityRole="button" onPress={()=>void load()} style={styles.refresh}>
          <Ionicons name="refresh" color={colors.gold} size={16}/><Text style={styles.link}>REFRESH</Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator color={colors.gold}/>}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {!loading && events.length === 0 && <View style={styles.tile}>
        <Ionicons name="people-outline" size={25} color={colors.gold}/>
        <Text style={styles.eventTitle}>No upcoming events yet.</Text>
        <Text style={styles.subtitle}>Treksor is preparing its first experiences. No invented attendance lists or empty promises.</Text>
      </View>}
      {events.map(event => {
        const isJoined = joined.includes(event.id);
        return <View key={event.id} style={styles.tile}>
          <Text style={styles.eyebrow}>{event.category.toUpperCase()} · {event.city.toUpperCase()}</Text>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.small}>{eventTime(event.starts_at)}</Text>
          {!!event.description && <Text style={styles.subtitle}>{event.description}</Text>}
          <Text style={styles.small}>Host: {event.organizer_name} · Capacity: {event.capacity} people</Text>
          <TouchableOpacity disabled={!userId||!!busyId} accessibilityRole="button"
            accessibilityLabel={isJoined?"Cancel event registration":"Join event"}
            onPress={()=>isJoined?confirmLeave(event.id):void changeRsvp(event.id,false)}
            style={[styles.button,isJoined&&styles.outline,(!userId||!!busyId)&&styles.disabled]}>
            <Text style={[styles.buttonText,isJoined&&styles.outlineText]}>
              {busyId===event.id?"UPDATING…":!userId?"SIGN IN TO JOIN":isJoined?"LEAVE EVENT":"JOIN EXPERIENCE"}
            </Text>
          </TouchableOpacity>
          {isJoined && <Text style={styles.small}>You're registered. Organizers will share practical details through the event process.</Text>}
        </View>;
      })}
      {!!history.length && <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Past experiences</Text></View>}
      {history.map(event => <View key={event.id} style={styles.tile}>
        <Text style={styles.eyebrow}>{event.category.toUpperCase()} · {event.city.toUpperCase()}</Text>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.small}>{eventTime(event.starts_at)} · Feedback is optional; registration does not prove attendance</Text>
        {question(event.id,"connection","Did you connect with someone you'd like to meet again?")}
        {question(event.id,"again","Would you attend another experience?")}
        <TouchableOpacity accessibilityRole="button"
          disabled={!!busyId||feedback[event.id]?.connection==null||feedback[event.id]?.again==null}
          onPress={()=>void submit(event.id)}
          style={[styles.button,(!!busyId||feedback[event.id]?.connection==null||feedback[event.id]?.again==null)&&styles.disabled]}>
          <Text style={styles.buttonText}>SAVE PRIVATE FEEDBACK</Text>
        </TouchableOpacity>
      </View>)}
      <Text style={[styles.small,{marginTop:18}]}>
        Event city and general details may be public. We do not show participant names or a directory. Private messaging, host verification and safety reporting must be completed before social matching launches.
      </Text>
    </ScrollView>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.background},
  page:{paddingHorizontal:22,paddingVertical:16,paddingBottom:100,gap:13},
  back:{flexDirection:"row",alignItems:"center",gap:9,paddingVertical:8,alignSelf:"flex-start"},
  backLabel:{color:colors.gold,fontSize:11,fontWeight:"700",letterSpacing:1.3},
  eyebrow:type.eyebrow,
  title:{...type.page,fontSize:32},
  subtitle:{...type.body,fontSize:13,lineHeight:20},
  sectionHead:{marginTop:12,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  sectionTitle:type.section,
  refresh:{flexDirection:"row",alignItems:"center",gap:6,padding:10},
  link:{fontSize:10,fontWeight:"700",color:colors.gold},
  tile:{...surface.card,padding:17,gap:9},
  eventTitle:{...type.card,fontSize:19},
  small:{...type.caption,fontSize:12,lineHeight:19},
  button:{backgroundColor:colors.gold,padding:13,borderRadius:10,alignItems:"center"},
  buttonText:{fontWeight:"800",color:colors.background,fontSize:11,letterSpacing:0.5},
  outline:{borderColor:colors.gold,borderWidth:1,backgroundColor:colors.surface},
  outlineText:{color:colors.gold},
  disabled:{opacity:0.5},
  error:{color:colors.danger,fontSize:12},
  question:{gap:8,marginTop:5},
  actions:{flexDirection:"row",gap:8},
  choice:{padding:10,borderRadius:10,borderWidth:1,borderColor:colors.border,minWidth:54,alignItems:"center"},
  selected:{borderColor:colors.gold,backgroundColor:colors.goldSoft},
  choiceText:{color:colors.text,fontWeight:"700",fontSize:12},
});
