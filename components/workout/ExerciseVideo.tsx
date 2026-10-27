import React, { useEffect, useState } from "react"
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native"
import { useVideoPlayer, VideoView } from "expo-video"
import axios from "axios"

const API = "https://treksor-admin-production.up.railway.app"

export default function ExerciseVideo({ exerciseId, videoUrl }: { exerciseId: string; videoUrl?: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const player = useVideoPlayer(url, p => { p.loop = true })

  useEffect(() => { if(url) void player.replaceAsync(url).catch(()=>setError("Unable to play this video. Please retry.")) }, [url,player])
  useEffect(() => { void load() }, [exerciseId,videoUrl])

  useEffect(() => {
    return () => { try { player.pause() } catch { /* Player may already be released by the video hook. */ } }
  }, [player])

  async function load() {
    if (!exerciseId) { setError("No video is linked to this exercise yet."); return }
    setLoading(true)
    setError("")
    try {
      const response = await axios.get<{ url: string }>(API + "/api/public/workout-video", {
        params: { id: exerciseId }, timeout: 12000
      })
      setUrl(response.data.url)
    } catch {
      if(videoUrl) setUrl(videoUrl)
      else setError("No demonstration is linked yet. Link this exercise in dashboard Media.")
    } finally {
      setLoading(false)
    }
  }

  return <View style={{ marginTop: 12 }}>
    {url ? <VideoView player={player} style={{ width: "100%", height: 210, borderRadius: 12 }} nativeControls contentFit="contain" /> :
      <TouchableOpacity onPress={() => void load()} disabled={loading} style={{ padding: 12, backgroundColor: "#34302A", borderRadius: 10, alignItems: "center" }}>
        {loading ? <ActivityIndicator color="#D7B877" /> : <Text style={{ color: "#D7B877", fontWeight: "700" }}>Watch demonstration</Text>}
      </TouchableOpacity>}
    {!!error && <Text style={{ color: "#D9A6A6", marginTop: 8 }}>{error}</Text>}
  </View>
}
