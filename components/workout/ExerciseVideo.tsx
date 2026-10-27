import React, { useEffect, useState } from "react"
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native"
import { useVideoPlayer, VideoView } from "expo-video"
import axios from "axios"

const API = "https://treksor-admin-production.up.railway.app"

export default function ExerciseVideo({ exerciseId, videoUrl }: { exerciseId: string; videoUrl?: string }) {
  const [url, setUrl] = useState<string | null>(videoUrl ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const player = useVideoPlayer(url, p => { p.loop = true })

  useEffect(() => {
    if (videoUrl) setUrl(videoUrl)
  }, [videoUrl])

  useEffect(() => {
    return () => { player.pause() }
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
      setError("Video temporarily unavailable. Please try again.")
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
