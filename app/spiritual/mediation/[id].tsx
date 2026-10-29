import React, { useEffect, useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { useMediationStore } from "@/store/mediation-store";
import BodyPageHeading from "@/components/BodyPageHeading";
import Button from "@/components/ui/Button";
import { colors, surface, type } from "@/theme/architect";
export default function MeditationDetailScreen() {
    const { id } = useLocalSearchParams<{
        id: string;
    }>();
    const insets = useSafeAreaInsets();
    const meditation = useMediationStore(s => s.mediation.find(item => item.id === id));
    const locked = useMediationStore(s => s.locked.includes(id));
    const markComplete = useMediationStore(s => s.markMediationAsRead);
    const sound = useRef<Audio.Sound | null>(null);
    const download = useRef<FileSystem.DownloadResumable | null>(null);
    const temporaryFile = useRef<string | null>(null);
    const session = useRef(0);
    const busyRef = useRef(false);
    const [busy, setBusy] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState<number | null>(null);
    const [playback, setPlayback] = useState({ position: 0, duration: 0 });
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        session.current += 1;
        busyRef.current = false;
        setBusy(false);
        setPlaying(false);
        setProgress(null);
        setError(null);
        setPlayback({ position: 0, duration: 0 });
        return () => {
            session.current += 1;
            const task = download.current;
            const partial = temporaryFile.current;
            download.current = null;
            temporaryFile.current = null;
            void (async () => {
                try { await task?.pauseAsync(); } catch {}
                if (partial) await FileSystem.deleteAsync(partial, {idempotent:true}).catch(() => {});
            })();
            const previous = sound.current;
            sound.current = null;
            void previous?.unloadAsync().catch(() => {});
        };
    }, [id]);
    async function toggleAudio() {
        if (!meditation || busyRef.current)
            return;
        const version = session.current;
        busyRef.current = true;
        setBusy(true);
        setError(null);
        let partial: string | null = null;
        try {
            if (sound.current) {
                const status = await sound.current.getStatusAsync();
                if (status.isLoaded) {
                    if (status.isPlaying)
                        await sound.current.pauseAsync();
                    else if (status.durationMillis && status.positionMillis >= status.durationMillis)
                        await sound.current.replayAsync();
                    else
                        await sound.current.playAsync();
                    return;
                }
                await sound.current.unloadAsync();
                sound.current = null;
            }
            if (!FileSystem.cacheDirectory)
                throw new Error("Audio storage unavailable");
            const fileUri = FileSystem.cacheDirectory + encodeURIComponent(meditation.audioUrl);
            const info = await FileSystem.getInfoAsync(fileUri);
            if (version !== session.current) return;
            let uri = fileUri;
            if (!info.exists) {
                setProgress(0);
                partial = `${fileUri}.download-${Date.now()}-${version}`;
                temporaryFile.current = partial;
                const task = FileSystem.createDownloadResumable(meditation.audioUrl, partial, {}, p => {
                    if (version === session.current)
                        setProgress(p.totalBytesExpectedToWrite > 0 ? Math.min(100, Math.round(p.totalBytesWritten / p.totalBytesExpectedToWrite * 100)) : null);
                });
                download.current = task;
                const result = await task.downloadAsync();
                if (version !== session.current)
                    return;
                download.current = null;
                if (!result?.uri || result.status < 200 || result.status >= 300)
                    throw new Error("Download incomplete");
                await FileSystem.moveAsync({from:result.uri,to:fileUri});
                temporaryFile.current = null;
                partial = null;
                uri = fileUri;
            }
            if (version !== session.current)
                return;
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true, shouldDuckAndroid: true, staysActiveInBackground: false });
            if (version !== session.current) return;
            const loaded = await Audio.Sound.createAsync({ uri }, { shouldPlay: true }, status => {
                if (version !== session.current)
                    return;
                if (status.isLoaded) {
                    setPlaying(status.isPlaying);
                    setPlayback({ position: status.positionMillis, duration: status.durationMillis || 0 });
                }
                else if (status.error) {
                    setPlaying(false);
                    setError("The audio stopped. Tap play to try again.");
                }
            });
            if (version !== session.current) {
                await loaded.sound.unloadAsync();
                return;
            }
            sound.current = loaded.sound;
        }
        catch {
            if (version === session.current) {
                setPlaying(false);
                setError("Unable to play this meditation. Check your connection and try again.");
            }
        }
        finally {
            if (partial) await FileSystem.deleteAsync(partial, {idempotent:true}).catch(() => {});
            if (version === session.current) {
                temporaryFile.current = null;
                download.current = null;
                busyRef.current = false;
                setBusy(false);
                setProgress(null);
            }
        }
    }
    const time = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
    if (!meditation)
        return <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 12 }}><BodyPageHeading title="Meditation unavailable" trail="BALANCE" subtitle="Return to Balance to choose another practice."/></ScrollView>;
    const image = meditation.id === "beginner" ? require("@/assets/images/meditation-beginner.png") : meditation.id === "intermediate" ? require("@/assets/images/meditation-intermediate.png") : require("@/assets/images/meditation-advanced.png");
    return <ScrollView style={styles.screen} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}>
    <BodyPageHeading title={meditation.title} trail="BALANCE / MEDITATION"/>
    <View style={styles.content}>
      <Text style={styles.description}>{meditation.content.description.replace(/<[^>]*>/g, "")}</Text>
      <View style={styles.player}>
        <Image source={image} resizeMode="cover" style={styles.image} accessibilityLabel={meditation.title}/>
        <View style={styles.controls}>
          <View style={styles.playerLabel}><Ionicons name="headset-outline" size={20} color={colors.gold}/><Text style={styles.playerTitle}>Your moment of stillness</Text></View>
          <Button onPress={() => void toggleAudio()} loading={busy} iconName={playing ? "pause-outline" : "play-outline"}>{playing ? "Pause meditation" : "Play meditation"}</Button>
          <Text accessibilityLiveRegion="polite" style={styles.caption}>{busy ? (progress === null ? "Preparing your meditation…" : `Downloading audio · ${progress}%`) : playback.duration ? `${time(playback.position)} / ${time(playback.duration)}` : "Press play when you are ready."}</Text>
          {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        </View>
      </View>
      <View style={styles.experience}><Text style={styles.section}>What you’ll experience</Text>{meditation.content.experience.map((item, index) => <View key={index} style={styles.bullet}><View style={styles.dot}/><Text style={styles.body}>{item}</Text></View>)}</View>
      {meditation.tip ? <View style={styles.tip}><Text style={styles.eyebrow}>A GENTLE REMINDER</Text><Text style={styles.body}>{meditation.tip}</Text></View> : null}
      <Button disabled={Boolean(meditation.isRead) || locked} iconName="checkmark-circle-outline" onPress={() => markComplete(meditation.id)}>{meditation.isRead ? "Practice completed" : locked ? "Complete the previous level first" : "Mark practice complete"}</Button>
      <Text style={styles.caption}>Practices for relaxation and mindfulness. If you have health concerns, consult your healthcare professional.</Text>
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 22 }, description: { ...type.body, marginTop: 16, marginBottom: 24 },
    player: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, overflow: "hidden" }, image: { width: "100%", aspectRatio: 1.5 }, controls: { padding: 18 },
    playerLabel: { flexDirection: "row", gap: 10, alignItems: "center" }, playerTitle: { ...type.card, flex: 1 }, caption: type.caption, error: { ...type.body, color: colors.danger, marginTop: 12 },
    experience: { marginTop: 28, gap: 12 }, section: type.section, body: { ...type.body, flexShrink: 1 }, bullet: { flexDirection: "row", alignItems: "flex-start", gap: 12 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.gold, marginTop: 9 },
    tip: { ...surface.card, marginVertical: 24, gap: 8 }, eyebrow: type.eyebrow,
});
