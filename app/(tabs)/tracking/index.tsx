import JourneyCard from "@/components/JourneyCard";
import WeeklyHabits from "@/components/WeeklyHabits";
import DailyWork from "@/components/DailyWork";
import WalkingSummary from "@/components/WalkingSummary";
import { useWalks } from "@/hooks/useWalks";
import { useDailyActivities } from "@/hooks/useDailyActivities";
import Icon from "@/components/ui/BrandIcon";
import JourneyDashboard from "@/components/progress/JourneyDashboard";
import {getJourneyCheckIns} from "@/lib/journey-checkins";
import {getSharedTodayDates} from "@/lib/shared-today";
import {getLifeMoments} from "@/lib/life-moments";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BodyPageHeading from "@/components/BodyPageHeading";
import ProgressDashboard from "@/components/progress/ProgressDashboard";
import ProgressSyncStatus from "@/components/ProgressSyncStatus";
import ActivityLogModal from "@/components/ActivityLogModal";
import AddTrackerModal from "@/components/AddTrackerModal";
import CalendarModal from "@/components/ui/CalendarModal";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { useTrackingStore } from "@/store/tracking-store";
import { useWorkoutStore } from "@/store/workout-store";
import { useMySpaceStore } from "@/store/myspace-store";
import { useMediationStore } from "@/store/mediation-store";
import { useArticleStore } from "@/store/article-store";
import { getEntries } from "@/lib/mood-journal";
import { buildProgressOverview, dayKey } from "@/lib/progress-metrics";
import { isProgressAccountReady, prepareProgressAccount } from "@/lib/local-progress";
import { colors } from "@/theme/architect";

export default function TrackingScreen() {
  const walks = useWalks();
  const dailyWork = useDailyActivities();
  const userId = useAuthStore(s => s.user?.id);
  const mentorOwner = useChatStore(s => s.currentUserId);
  const mentorConversation = useChatStore(s => userId ? s.chats[userId] : undefined);
  const mentorReplies = userId && mentorOwner === userId && mentorConversation ? mentorConversation.filter(message=>message.role==="assistant").length : null;
  const trackingData = useTrackingStore(s => s.trackingData);
  const { checkIns, gymSets } = useWorkoutStore();
  const reflections = useMySpaceStore(s => s.myspaces);
  const meditations = useMediationStore(s => s.mediation);
  const { articles } = useArticleStore();
  const [detailsOpen,setDetailsOpen]=useState(false);
  const [showRecorder,setShowRecorder]=useState(false);
  const [showPlan,setShowPlan]=useState(false);
  const [showHabits,setShowHabits]=useState(false);
  const [showAdvanced,setShowAdvanced]=useState(false);
  const [period, setPeriod] = useState<7 | 30>(7);
  const [now, setNow] = useState(new Date());
  const [reload, setReload] = useState(0);
  const [extras, setExtras] = useState<{ owner?: string; ready: boolean; accountError: boolean; journalDates: string[]; journeyDates:string[]; sharedToday:boolean|null; momentDates:string[]; visionAnswers: unknown[] | null; journalLoading: boolean; visionLoading: boolean; journalError: boolean; visionError: boolean }>({ ready: false, accountError: false, journalDates: [], journeyDates:[], sharedToday:null, momentDates:[], visionAnswers: null, journalLoading: true, visionLoading: true, journalError: false, visionError: false });
  const [showAddTracker, setShowAddTracker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const pendingModalAction = useRef<(() => void) | null>(null);
  const afterDismiss = () => { const action = pendingModalAction.current; pendingModalAction.current = null; action?.(); };
  const afterClose = (close: () => void, action: () => void) => {
    if (Platform.OS === "ios") pendingModalAction.current = action;
    close();
    if (Platform.OS !== "ios") action();
  };
  const [log, setLog] = useState<{ date: string; trackerId?: string } | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    setNow(new Date());
    setDetailsOpen(false);
    setExtras({ owner: userId, ready: false, accountError: false, journalDates: [], journeyDates:[], sharedToday:null, momentDates:[], visionAnswers: null, journalLoading: true, visionLoading: true, journalError: false, visionError: false });
    void (async () => {
      try { if (userId && !isProgressAccountReady(userId)) await prepareProgressAccount(userId); }
      catch { if (active) setExtras(s => ({ ...s, accountError: true })); return; }
      if (!active) return;
      setExtras(s => ({ ...s, ready: true }));
    void Promise.allSettled([getJourneyCheckIns(userId||""),getSharedTodayDates(userId||"")]).then(results=>{if(!active)return;const local=results[0].status==="fulfilled"?results[0].value.map(row=>row.date):[];const remote=results[1].status==="fulfilled"?results[1].value:[];setExtras(s=>({...s,journeyDates:[...new Set([...local,...remote])].sort(),sharedToday:results[1].status==="fulfilled"?remote.includes(dayKey()):null}))});
    void getLifeMoments(userId||"").then(rows=>{if(active)setExtras(s=>({...s,momentDates:rows.map(row=>row.date)}))}).catch(()=>{});
    void getEntries(userId || "").then(entries => {
      if (active) setExtras(s => ({ ...s, journalDates: entries.map(e => e.date), journalLoading: false }));
    }).catch(() => { if (active) setExtras(s => ({ ...s, journalError: true, journalLoading: false })); });
    void AsyncStorage.getItem("treksor.vision-board.v1").then(raw => {
      const saved = raw ? JSON.parse(raw) : [];
      const answers = Array.isArray(saved) ? saved : saved?.answers;
      if (!Array.isArray(answers)) throw new Error("Invalid saved vision");
      if (active) setExtras(s => ({ ...s, visionAnswers: answers, visionLoading: false }));
    }).catch(() => { if (active) setExtras(s => ({ ...s, visionError: true, visionLoading: false })); });
    })();
    return () => { active = false; };
  }, [userId, reload]));
  useEffect(() => {
    const sub = AppState.addEventListener("change", state => { if (state === "active") setReload(v => v + 1); });
    const clock = setInterval(() => setNow(new Date()), 60000);
    return () => { sub.remove(); clearInterval(clock); };
  }, []);

  const ownExtras = extras.owner === userId;
  const data = buildProgressOverview({ walks: walks.rows, dailyActivities: dailyWork.entries, checkIns, gymSets, reflections, meditations, articles, trackers: trackingData, journalDates: ownExtras ? extras.journalDates : [], dailyCheckInDates:ownExtras?extras.journeyDates:[], momentDates:ownExtras?extras.momentDates:[], visionAnswers: ownExtras ? extras.visionAnswers : null }, period, now);
  const openLog = (date: string, trackerId?: string) => setLog({ date, trackerId });
  const today=dayKey(now);
  const ownReady=ownExtras&&extras.ready;
  const statsLoading=!ownReady||dailyWork.loading||walks.loading;
  const periodSummary=period===7?"7 days":"30 days";

  return <SafeAreaView edges={[]} style={styles.screen}>
    <StatusBar style="light"/>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <BodyPageHeading trail="YOUR JOURNEY" title="Progress" goldTitle subtitle="Your day and your growth. One place." style={styles.heading} compactSubtitle/>

      <View style={styles.summary}>
        <View style={styles.headingRow}>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>YOUR RHYTHM</Text>
            <Text style={styles.summaryTitle}>Small steps count.</Text>
          </View>
          <View accessibilityRole="tablist" style={styles.periodTabs}>
            {([7,30] as const).map(value=><TouchableOpacity key={value} accessibilityRole="tab" accessibilityState={{selected:period===value}} onPress={()=>setPeriod(value)} style={[styles.periodOption,period===value&&styles.periodSelected]}>
              <Text style={[styles.periodLabel,period===value&&styles.periodLabelSelected]}>{value===7?"7D":"30D"}</Text>
            </TouchableOpacity>)}
          </View>
        </View>
        {extras.accountError ? <TouchableOpacity accessibilityRole="button" onPress={()=>setReload(v=>v+1)}><Text style={styles.error}>Your saved progress could not load. Tap to retry.</Text></TouchableOpacity> : statsLoading ? <View style={styles.loadingSmall}><ActivityIndicator color={colors.gold}/><Text style={styles.hint}>Updating your progress…</Text></View> :
          <View style={styles.metrics}>
            <View style={styles.metric}><Text style={styles.metricValue}>{data.activeDays}</Text><Text style={styles.metricCaption}>Active days</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{data.dailyWorkCount}</Text><Text style={styles.metricCaption}>Activities</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{data.dailyWorkMinutes}</Text><Text style={styles.metricCaption}>Minutes logged</Text></View>
          </View>}
        <Text style={styles.hint}>Last {periodSummary} · based on your saved actions, not estimates.</Text>
        {period===7&&<View accessibilityLabel="Your activity over the past seven days" style={styles.days}>
          {data.days.map(day=><View key={day.date} accessible accessibilityLabel={day.date+(day.active?" — activity recorded":" — no recorded activity")} style={[styles.dayTile,day.active&&styles.dayTileActive]}/>)}
        </View>}
        {ownReady&&extras.sharedToday===true&&<Text style={styles.sharedNote}>Your completed day is also recorded in your Treksor account.</Text>}
      </View>

      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Log an activity" accessibilityState={{expanded:showRecorder}} onPress={()=>setShowRecorder(value=>!value)} style={styles.mainAction}>
        <View style={styles.mainIcon}><Icon name="add" size={23} color={colors.gold}/></View>
        <View style={styles.flex}><Text style={styles.mainText}>Log an activity</Text><Text style={styles.mainCaption}>Walk, hiking, sports or add your own</Text></View>
        <Icon name={showRecorder?"chevron-up":"chevron-down"} size={20} color={colors.gold}/>
      </TouchableOpacity>
      {showRecorder&&<DailyWork embedded/>}

      <Text style={[styles.sectionTitle,{marginTop:25}]}>Your day</Text>
      <View style={styles.actions}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open daily direction" accessibilityState={{expanded:showPlan}} onPress={()=>setShowPlan(value=>!value)} style={styles.action}>
          <Icon name="compass-outline" size={22} color={colors.gold}/>
          <View style={styles.flex}><Text style={styles.actionTitle}>Daily direction</Text><Text style={styles.actionSubtitle}>Your plan and evening reflection</Text></View>
          <Icon name={showPlan?"chevron-up":"chevron-down"} size={18} color={colors.gold}/>
        </TouchableOpacity>
        {showPlan&&<View style={styles.expanded}><JourneyCard/></View>}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open Quick Notes and tasks" onPress={()=>router.push("/notes" as any)} style={styles.action}>
          <Icon name="create-outline" size={22} color={colors.gold}/>
          <View style={styles.flex}><Text style={styles.actionTitle}>Quick Notes</Text><Text style={styles.actionSubtitle}>Notes, tasks and reminders</Text></View>
          <Icon name="chevron-forward" size={18} color={colors.gold}/>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open weekly habits" accessibilityState={{expanded:showHabits}} onPress={()=>setShowHabits(value=>!value)} style={styles.action}>
          <Icon name="checkmark-circle-outline" size={22} color={colors.gold}/>
          <View style={styles.flex}><Text style={styles.actionTitle}>Weekly habits</Text><Text style={styles.actionSubtitle}>Build and mark your routines</Text></View>
          <Icon name={showHabits?"chevron-up":"chevron-down"} size={18} color={colors.gold}/>
        </TouchableOpacity>
        {showHabits&&<View style={styles.expanded}><WeeklyHabits/></View>}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open goals and weekly review" onPress={()=>router.push("/progress/journey" as any)} style={styles.action}>
          <Icon name="flag-outline" size={22} color={colors.gold}/>
          <View style={styles.flex}><Text style={styles.actionTitle}>Goals & weekly review</Text><Text style={styles.actionSubtitle}>Reflect on what matters</Text></View>
          <Icon name="chevron-forward" size={18} color={colors.gold}/>
        </TouchableOpacity>
      </View>

      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Explore detailed progress" accessibilityState={{expanded:showAdvanced}} onPress={()=>setShowAdvanced(value=>!value)} style={styles.advancedButton}>
        <Icon name="stats-chart-outline" size={18} color={colors.gold}/>
        <Text style={styles.advancedText}>{showAdvanced?"Hide detailed progress":"View detailed progress"}</Text>
        <Icon name={showAdvanced?"chevron-up":"chevron-down"} size={17} color={colors.gold}/>
      </TouchableOpacity>

      {showAdvanced&&<View style={styles.advanced}>
        {!ownReady? <View style={styles.loading}>{extras.accountError ? <TouchableOpacity accessibilityRole="button" onPress={()=>setReload(v=>v+1)}><Text style={styles.error}>Unable to load details · Retry</Text></TouchableOpacity> : <><ActivityIndicator color={colors.gold}/><Text style={styles.loadingText}>Loading detailed progress…</Text></>}</View> :
          <>
            <JourneyDashboard data={data} period={period} onPeriod={setPeriod} detailsOpen={detailsOpen} onDetails={()=>setDetailsOpen(value=>!value)} onCheckInSaved={date=>setExtras(s=>({...s,journeyDates:Array.from(new Set([...s.journeyDates,date]))}))}/>
            {detailsOpen&&<ProgressDashboard compactOverview mentorReplies={mentorReplies} data={data} period={period} onPeriod={setPeriod} trackers={trackingData} today={today} journalLoading={!ownExtras||extras.journalLoading} visionLoading={!ownExtras||extras.visionLoading} journalError={ownExtras&&extras.journalError} visionError={ownExtras&&extras.visionError} onRetry={()=>setReload(v=>v+1)} onRoute={route=>router.push(route as any)} onLog={openLog} onCreate={()=>setShowAddTracker(true)} onCalendar={()=>setShowCalendar(true)}/>}
          </>}
        <WalkingSummary rows={walks.rows} now={walks.now} loading={walks.loading} error={walks.error}/>
        <ProgressSyncStatus/>
      </View>}
    </ScrollView>
    <AddTrackerModal visible={showAddTracker} onClose={()=>setShowAddTracker(false)}/>
    <ActivityLogModal visible={!!log} onClose={()=>setLog(null)} selectedDate={log?.date??today} selectedCategory={log?.trackerId} onDismiss={afterDismiss} onCreate={()=>afterClose(()=>setLog(null),()=>setShowAddTracker(true))}/>
    <CalendarModal visible={showCalendar} onClose={()=>setShowCalendar(false)} onDismiss={afterDismiss} onDateSelect={date=>afterClose(()=>setShowCalendar(false),()=>openLog(date))} selectedDate={log?.date??today} maxDate={today}/>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.background},
  content:{paddingHorizontal:20,paddingTop:0,paddingBottom:38,flexGrow:1},
  heading:{paddingHorizontal:0,paddingTop:0,paddingBottom:0,marginBottom:10},
  flex:{flex:1},
  eyebrow:{fontSize:10,fontWeight:"700",letterSpacing:1.6,color:colors.gold},
  sectionTitle:{fontSize:22,lineHeight:29,fontWeight:"600",letterSpacing:-0.2,color:colors.text,marginBottom:10},
  summary:{backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1,borderRadius:18,padding:17,marginTop:0,gap:12},
  headingRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12},
  summaryTitle:{color:colors.text,fontSize:19,fontWeight:"600",marginTop:6},
  periodTabs:{flexDirection:"row",padding:3,backgroundColor:colors.background,borderRadius:12,borderColor:colors.border,borderWidth:1},
  periodOption:{minWidth:43,minHeight:36,alignItems:"center",justifyContent:"center",borderRadius:9},
  periodSelected:{backgroundColor:colors.gold},
  periodLabel:{color:colors.secondary,fontSize:12,fontWeight:"700"},
  periodLabelSelected:{color:colors.background},
  metrics:{flexDirection:"row",alignItems:"flex-start",gap:12,marginVertical:7},
  metric:{flex:1},
  metricValue:{fontSize:25,fontWeight:"600",color:colors.text},
  metricCaption:{fontSize:11,lineHeight:16,color:colors.secondary,marginTop:4},
  hint:{fontSize:11,lineHeight:17,color:colors.muted},
  days:{flexDirection:"row",gap:6},
  dayTile:{flex:1,height:5,borderRadius:4,backgroundColor:colors.surfaceRaised},
  dayTileActive:{backgroundColor:colors.gold},
  sharedNote:{fontSize:11,lineHeight:17,color:colors.gold},
  loadingSmall:{flexDirection:"row",alignItems:"center",gap:10,minHeight:47},
  mainAction:{minHeight:72,flexDirection:"row",alignItems:"center",gap:12,backgroundColor:colors.surfaceRaised,borderColor:colors.gold,borderWidth:1,borderRadius:16,paddingHorizontal:17,marginTop:18},
  mainIcon:{height:40,width:40,borderRadius:12,backgroundColor:colors.goldSoft,alignItems:"center",justifyContent:"center"},
  mainText:{color:colors.text,fontSize:17,fontWeight:"700"},
  mainCaption:{color:colors.secondary,fontSize:11,marginTop:4},
  actions:{borderColor:colors.border,borderWidth:1,borderRadius:16,overflow:"hidden",backgroundColor:colors.surface},
  action:{minHeight:68,flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:15,borderBottomColor:colors.border,borderBottomWidth:1},
  actionTitle:{fontSize:14,fontWeight:"600",color:colors.text},
  actionSubtitle:{fontSize:11,color:colors.secondary,marginTop:4},
  expanded:{paddingHorizontal:14,paddingBottom:14,borderBottomWidth:1,borderColor:colors.border},
  advancedButton:{marginTop:19,minHeight:52,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:11,borderColor:colors.border,borderWidth:1,borderRadius:14},
  advancedText:{color:colors.gold,fontSize:13,fontWeight:"600",flex:1},
  advanced:{marginTop:10,gap:14},
  loading:{paddingVertical:40,alignItems:"center",gap:16},
  loadingText:{color:colors.secondary,fontSize:14},
  error:{color:colors.danger,fontSize:12,lineHeight:20}
});
