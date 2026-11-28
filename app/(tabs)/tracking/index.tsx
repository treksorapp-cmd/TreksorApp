import ProgressSummary from "@/components/progress/ProgressSummary";
import { useProgressHealth } from "@/hooks/useProgressHealth";
import { buildProgressSummary } from "@/lib/progress-summary";
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
import { ActivityIndicator, AppState, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
import { useTrackingStore } from "@/store/tracking-store";
import { useWorkoutStore } from "@/store/workout-store";
import { useMySpaceStore } from "@/store/myspace-store";
import { useMediationStore } from "@/store/mediation-store";
import { useArticleStore } from "@/store/article-store";
import { getEntries } from "@/lib/mood-journal";
import { buildProgressOverview, dayKey } from "@/lib/progress-metrics";
import { isProgressAccountReady, prepareProgressAccount } from "@/lib/local-progress";
import { colors, layout, type } from "@/theme/architect";

export default function TrackingScreen() {
  const health = useProgressHealth();
  const scroll = useRef<ScrollView>(null);
  const [detailTab, setDetailTab] = useState<"activity" | "wellbeing" | "plan">("activity");
  const walks = useWalks();
  const dailyWork = useDailyActivities();
  const userId = useAuthStore(s => s.user?.id);
  const trackingData = useTrackingStore(s => s.trackingData);
  const { checkIns, gymSets } = useWorkoutStore();
  const reflections = useMySpaceStore(s => s.myspaces);
  const meditations = useMediationStore(s => s.mediation);
  const { articles } = useArticleStore();
  const [showRecorder,setShowRecorder]=useState(false);
  const [showAdvanced,setShowAdvanced]=useState(false);
  const [period, setPeriod] = useState<7 | 30>(7);
  const [now, setNow] = useState(new Date());
  const [reload, setReload] = useState(0);
  const [extras, setExtras] = useState<{ owner?: string; ready: boolean; accountError: boolean; activityError:boolean; journalDates: string[]; journeyDates:string[]; sharedToday:boolean|null; momentDates:string[]; visionAnswers: unknown[] | null; journalLoading: boolean; visionLoading: boolean; journalError: boolean; visionError: boolean }>({ ready: false, accountError: false, activityError:false, journalDates: [], journeyDates:[], sharedToday:null, momentDates:[], visionAnswers: null, journalLoading: true, visionLoading: true, journalError: false, visionError: false });
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
    setExtras({ owner: userId, ready: false, accountError: false, activityError:false, journalDates: [], journeyDates:[], sharedToday:null, momentDates:[], visionAnswers: null, journalLoading: true, visionLoading: true, journalError: false, visionError: false });
    void (async () => {
      try { if (userId && !isProgressAccountReady(userId)) await prepareProgressAccount(userId); }
      catch { if (active) setExtras(s => ({ ...s, accountError: true })); return; }
      if (!active) return;
      setExtras(s => ({ ...s, ready: true }));
    void Promise.allSettled([getJourneyCheckIns(userId||""),getSharedTodayDates(userId||"")]).then(results=>{if(!active)return;const local=results[0].status==="fulfilled"?results[0].value.map(row=>row.date):[];const remote=results[1].status==="fulfilled"?results[1].value:[];setExtras(s=>({...s,journeyDates:[...new Set([...local,...remote])].sort(),activityError:results.some(result=>result.status==="rejected"),sharedToday:results[1].status==="fulfilled"?remote.includes(dayKey()):null}))});
    void getLifeMoments(userId||"").then(rows=>{if(active)setExtras(s=>({...s,momentDates:rows.map(row=>row.date)}))}).catch(()=>{if(active)setExtras(s=>({...s,activityError:true}))});
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
  const ownReady=ownExtras&&extras.ready;
  const data = buildProgressOverview({ walks: walks.rows, dailyActivities: dailyWork.entries, checkIns:ownReady?checkIns:{}, gymSets:ownReady?gymSets:[], reflections:ownReady?reflections:[], meditations:ownReady?meditations:[], articles:ownReady?articles:{}, trackers:ownReady?trackingData:[], journalDates: ownExtras ? extras.journalDates : [], dailyCheckInDates:ownExtras?extras.journeyDates:[], momentDates:ownExtras?extras.momentDates:[], visionAnswers: ownExtras ? extras.visionAnswers : null }, period, now);
  const openLog = (date: string, trackerId?: string) => setLog({ date, trackerId });
  const today=dayKey(now);
  const statsLoading=(!ownReady && !extras.accountError)||dailyWork.loading||walks.loading||(ownReady&&extras.journalLoading);
  const summary=buildProgressSummary(data,health.rows,health.sourceId,period,now);
  const refresh=()=>{setReload(v=>v+1);void health.refresh();void dailyWork.reload();void walks.reload()};
  const openDetails=(tab:typeof detailTab)=>{setDetailTab(tab);setShowAdvanced(true);scroll.current?.scrollTo({y:0,animated:false})};
  const closeDetails=()=>{setShowAdvanced(false);scroll.current?.scrollTo({y:0,animated:false})};
  const openConnections=()=>router.push(("/progress/connections?source="+encodeURIComponent(health.sourceId)+"&period="+period) as any);
  const openEvent=(event:typeof summary.recent[number])=>{
    if(event.route==="/progress/connections")openConnections();
    else if(event.trackerId)openLog(event.date,event.trackerId);
    else if(event.route==="/(tabs)/today"){setShowRecorder(true);scroll.current?.scrollTo({y:0,animated:true})}
    else if(event.route==="/(tabs)/tracking")openDetails("wellbeing");
    else if(event.route)router.push(event.route as any);
  };

  return <SafeAreaView edges={[]} style={styles.screen}>
    <StatusBar style="light"/>
    <ScrollView ref={scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={statsLoading} onRefresh={refresh} tintColor={colors.gold}/>}>
      <BodyPageHeading trail="YOUR JOURNEY" title="Progress" goldTitle style={styles.heading}/>
      {!showAdvanced ? <>
        <ProgressSummary summary={summary} period={period}
          loading={statsLoading} unavailable={!ownReady&&extras.accountError} error={extras.accountError||extras.activityError||extras.journalError||!!dailyWork.error||!!walks.error}
          onRetry={refresh} health={health}
          onConnections={openConnections} onEvent={openEvent} onDetails={()=>openDetails("activity")}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Log an activity" accessibilityState={{expanded:showRecorder}} onPress={()=>setShowRecorder(value=>!value)} style={styles.mainAction}>
            <Icon name={showRecorder?"close":"add"} size={22} color={colors.background}/><Text style={styles.mainText}>{showRecorder?"Close activity log":"Log activity"}</Text>
          </TouchableOpacity>
          {showRecorder&&<DailyWork embedded/>}
        </ProgressSummary>
      </> : <>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to progress overview" onPress={closeDetails} style={styles.back}><Icon name="chevron-back" color={colors.gold} size={20}/><Text style={styles.link}>Overview</Text></TouchableOpacity>
        <View accessibilityRole="tablist" style={styles.detailTabs}>{([['activity','Activity'],['wellbeing','Wellbeing'],['plan','Plan & habits']] as const).map(([value,label])=><TouchableOpacity key={value} accessibilityRole="tab" accessibilityState={{selected:detailTab===value}} onPress={()=>setDetailTab(value)} style={[styles.detailTab,detailTab===value&&styles.selected]}><Text style={[styles.label,detailTab===value&&styles.selectedText]}>{label}</Text></TouchableOpacity>)}</View>
        <View style={styles.periodRow}><Text style={styles.caption}>Last {period} days</Text><View style={styles.quickActions}>{([7,30] as const).map(value=><TouchableOpacity key={value} accessibilityRole="button" accessibilityLabel={'Show last '+value+' days'} accessibilityState={{selected:period===value}} onPress={()=>setPeriod(value)} style={styles.periodButton}><Text style={[styles.label,period===value&&styles.link]}>{value}D</Text></TouchableOpacity>)}</View></View>
        {!ownReady ? <View style={styles.loading}>{extras.accountError ? <TouchableOpacity accessibilityRole="button" onPress={refresh}><Text style={styles.error}>Unable to load details · Retry</Text></TouchableOpacity> : <><ActivityIndicator color={colors.gold}/><Text style={styles.caption}>Loading detailed progress…</Text></>}</View> : <>
          {detailTab==="activity"&&<>
            <View style={styles.detailNote}><Text style={styles.actionTitle}>Your recorded movement</Text>
              <Text style={styles.label}>{data.sessions} Treksor sessions · {health.loading||!health.hasSnapshot?'—':summary.watch.sessions} imported workouts</Text><Text style={styles.label}>{data.dailyWorkCount} activities · {data.dailyWorkMinutes} minutes logged manually</Text><Text style={styles.caption}>Treksor and imported workout totals remain separate because the same session may be recorded in both.</Text>
              {health.sources.length>1&&<View accessibilityRole="tablist" style={styles.detailTabs}>{health.sources.map(source=><TouchableOpacity key={source.id} accessibilityRole="tab" accessibilityState={{selected:health.sourceId===source.id}} onPress={()=>health.selectSource(source.id)} style={[styles.detailTab,health.sourceId===source.id&&styles.selected]}><Text style={styles.label}>{source.name}</Text></TouchableOpacity>)}</View>}
              <TouchableOpacity accessibilityRole="button" onPress={openConnections} style={styles.back}><Text style={styles.link}>Imported workout history</Text></TouchableOpacity>
            </View>
            <ProgressDashboard compactOverview data={data} period={period} onPeriod={setPeriod} trackers={trackingData} today={today} journalLoading={!ownExtras||extras.journalLoading} visionLoading={!ownExtras||extras.visionLoading} journalError={ownExtras&&extras.journalError} visionError={ownExtras&&extras.visionError} onRetry={refresh} onRoute={route=>route==="/(tabs)/today"?(closeDetails(),setShowRecorder(true)):router.push(route as any)} onLog={openLog} onCreate={()=>setShowAddTracker(true)} onCalendar={()=>setShowCalendar(true)}/>
            <WalkingSummary rows={walks.rows} now={walks.now} loading={walks.loading} error={walks.error}/>
          </>}
          {detailTab==="wellbeing"&&<JourneyDashboard focused data={data} period={period} onPeriod={setPeriod} detailsOpen={false} onDetails={()=>setDetailTab("activity")} onCheckInSaved={date=>setExtras(s=>({...s,journeyDates:Array.from(new Set([...s.journeyDates,date]))}))}/>}
          {detailTab==="plan"&&<>
            <JourneyCard/>
            <WeeklyHabits/>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open Quick Notes and tasks" onPress={()=>router.push("/notes" as any)} style={styles.detailsButton}><Icon name="create-outline" color={colors.gold} size={20}/><Text style={styles.link}>Quick Notes</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open goals and weekly review" onPress={()=>router.push("/progress/journey" as any)} style={styles.detailsButton}><Icon name="flag-outline" size={22} color={colors.gold}/><View style={styles.flex}><Text style={styles.actionTitle}>Goals & weekly review</Text><Text style={styles.caption}>Reflect on what matters</Text></View><Icon name="chevron-forward" size={18} color={colors.gold}/></TouchableOpacity>
            {extras.sharedToday===true&&<Text style={styles.caption}>Your completed day is recorded in your Treksor account.</Text>}
          </>}
        </>}
        <View style={styles.sync}><ProgressSyncStatus/></View>
      </>}
    </ScrollView>
    <AddTrackerModal visible={showAddTracker} onClose={()=>setShowAddTracker(false)}/>
    <ActivityLogModal visible={!!log} onClose={()=>setLog(null)} selectedDate={log?.date??today} selectedCategory={log?.trackerId} onDismiss={afterDismiss} onCreate={()=>afterClose(()=>setLog(null),()=>setShowAddTracker(true))}/>
    <CalendarModal visible={showCalendar} onClose={()=>setShowCalendar(false)} onDismiss={afterDismiss} onDateSelect={date=>afterClose(()=>setShowCalendar(false),()=>openLog(date))} selectedDate={log?.date??today} maxDate={today}/>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.background},
  content:{paddingHorizontal:20,paddingTop:layout.compactTop,paddingBottom:38,flexGrow:1},
  heading:{paddingHorizontal:0,paddingTop:0,paddingBottom:0,marginBottom:16},
  flex:{flex:1,minWidth:0}, eyebrow:{...type.eyebrow,fontSize:12},
  caption:{color:colors.muted,fontSize:12,lineHeight:19}, label:{color:colors.secondary,fontSize:14,lineHeight:21},
  link:{color:colors.gold,fontSize:14,fontWeight:"600",lineHeight:21},
  quickActions:{flexDirection:"row",flexWrap:"wrap",gap:10},
  mainAction:{minHeight:52,flexGrow:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10,backgroundColor:colors.gold,borderRadius:14,padding:14},
  mainText:{color:colors.background,fontSize:16,fontWeight:"600"},
  actionTitle:{color:colors.text,fontSize:16,lineHeight:24,fontWeight:"600"},
  detailsButton:{minHeight:76,flexDirection:"row",alignItems:"center",gap:12,padding:16,marginTop:18,borderRadius:16,borderWidth:1,borderColor:colors.border},
  back:{minHeight:44,flexDirection:"row",alignItems:"center",gap:8},
  detailTabs:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:8},
  detailTab:{minHeight:48,justifyContent:"center",alignItems:"center",flexGrow:1,padding:12,borderRadius:12,borderWidth:1,borderColor:colors.border},
  selected:{backgroundColor:colors.goldSoft,borderColor:colors.gold},selectedText:{color:colors.gold},
  periodRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginTop:8},periodButton:{padding:12,minHeight:44,minWidth:44},
  detailNote:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:16,padding:18,gap:8,marginTop:12},
  loading:{paddingVertical:40,alignItems:"center",gap:16},error:{color:colors.danger,fontSize:14,lineHeight:21},sync:{marginTop:24}
});
