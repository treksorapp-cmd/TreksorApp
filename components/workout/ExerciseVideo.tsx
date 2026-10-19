import React, { useEffect, useState } from "react"
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native"
import { useVideoPlayer, VideoView } from "expo-video"
import axios from "axios"

const API = "https://treksor-admin-production.up.railway.app"

export default function ExerciseVideo({ exerciseId }: { exerciseId: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const player = useVideoPlayer(url, p => { p.loop = true })

  useEffect(() => {
    return () => { player.pause() }
  }, [player])

  async function load() {
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
        {loading ? <ActivityIndicator color="#D6AE67" /> : <Text style={{ color: "#D6AE67", fontWeight: "700" }}>Watch demonstration</Text>}
      </TouchableOpacity>}
    {!!error && <Text style={{ color: "#D9A6A6", marginTop: 8 }}>{error}</Text>}
  </View>
}
