import React, { useEffect, useMemo, useState } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

export type WorkoutItem = {
  id: string
  name: string
  muscle_group: string
  location: string
  sets: number
  reps: string
  rest_seconds: number
}
type Props = { exercises: WorkoutItem[]; days: number; location: "Gym" | "Home" }
type Saved = { days: number; location: "Gym" | "Home"; selected: string[]; completed: string[] }
const KEY = "treksor.workout.plan.v1"
const groups: Record<string, string[]> = {
  "Full Body": ["Legs", "Chest", "Back", "Shoulders", "Core", "Glutes", "Arms"],
  "Upper Body": ["Chest", "Back", "Shoulders", "Arms", "Core"],
  "Lower Body": ["Legs", "Glutes", "Core"],
  "Push": ["Chest", "Shoulders", "Arms"],
  "Pull": ["Back", "Arms", "Core"],
  "Legs": ["Legs", "Glutes", "Core"]
}
function splitFor(days: number) {
  if (days === 2) return ["Full Body A", "Full Body B"]
  if (days === 3) return ["Full Body A", "Full Body B", "Full Body C"]
  if (days === 4) return ["Upper Body A", "Lower Body A", "Upper Body B", "Lower Body B"]
  return ["Push", "Pull", "Legs", "Upper Body", "Lower Body", "Full Body"].slice(0, days)
}
export default function WorkoutPlanner({ exercises, days, location }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [completed, setCompleted] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState("")
  useEffect(() => {
    let active = true
    AsyncStorage.getItem(KEY).then(raw => {
      if (!active) return
      if (raw) {
        const saved: Saved = JSON.parse(raw)
        if (saved.days === days && saved.location === location) {
          setSelected(Array.isArray(saved.selected) ? saved.selected : [])
          setCompleted(Array.isArray(saved.completed) ? saved.completed : [])
        } else { setSelected([]); setCompleted([]) }
      }
    }).catch(() => setMessage("Could not restore saved plan")).finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [days, location])
  const available = useMemo(() => exercises.filter(e => e.location === location || e.location === "Both"), [exercises, location])
  const split = splitFor(days)
  const sessions = split.map((name, index) => {
    const key = name.replace(/ [ABC]$/, "")
    const allowed = groups[key] || groups["Full Body"]
    const picks = available.filter(e => allowed.includes(e.muscle_group))
    const ordered = [...allowed.flatMap(group => picks.filter(e => e.muscle_group === group))]
    const unique = ordered.filter((e, i) => ordered.findIndex(v => v.id === e.id) === i)
    const offset = index % Math.max(1, unique.length)
    return { name, exercises: [...unique.slice(offset), ...unique.slice(0, offset)].slice(0, 5) }
  })
  async function persist(nextSelected: string[], nextCompleted: string[]) {
    setSelected(nextSelected); setCompleted(nextCompleted)
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify({ days, location, selected: nextSelected, completed: nextCompleted }))
      setMessage("Saved on this device")
    } catch { setMessage("Unable to save on this device") }
  }
  if (!ready) return null
  return <View style={{ marginTop: 28 }}>
    <Text style={{ color: "white", fontSize: 22, fontWeight: "700", marginBottom: 8 }}>Your Weekly Plan</Text>
    <Text style={{ color: "#AEB4BC", marginBottom: 16 }}>Select exercises and mark sets as completed. Your choices are stored on this device.</Text>
    {sessions.map((session, day) => <View key={day} style={{ backgroundColor: "#1A1D22", borderRadius: 14, padding: 16, marginBottom: 12 }}>
      <Text style={{ color: "#D6AE67", fontWeight: "700", fontSize: 17, marginBottom: 10 }}>Day {day + 1} · {session.name}</Text>
      {!session.exercises.length && <Text style={{ color: "#AEB4BC" }}>Exercises will appear when they are published in the library.</Text>}
      {session.exercises.map(exercise => {
        const itemKey = day + ":" + exercise.id
        const included = selected.includes(itemKey)
        const done = completed.includes(itemKey)
        return <View key={itemKey} style={{ paddingVertical: 9, borderTopWidth: 1, borderColor: "#35373B" }}>
          <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: included }} onPress={() => void persist(included ? selected.filter(v => v !== itemKey) : [...selected, itemKey], completed.filter(v => v !== itemKey || !included))}>
            <Text style={{ color: included ? "#D6AE67" : "white", fontWeight: "600" }}>{included ? "☑" : "☐"} {exercise.name}</Text>
          </TouchableOpacity>
          <Text style={{ color: "#BFC2C5", marginTop: 4 }}>{exercise.sets} sets · {exercise.reps} reps · {exercise.rest_seconds}s rest</Text>
          {included && <TouchableOpacity onPress={() => void persist(selected, done ? completed.filter(v => v !== itemKey) : [...completed, itemKey])} style={{ marginTop: 8 }}>
            <Text style={{ color: done ? "#8CD0A6" : "#D6AE67" }}>{done ? "✓ Session exercise completed" : "Mark exercise complete"}</Text>
          </TouchableOpacity>}
        </View>
      })}
    </View>)}
    {!!message && <Text accessibilityRole="text" style={{ color: "#AEB4BC" }}>{message}</Text>}
    <Text style={{ color: "#8F959C", marginTop: 12, fontSize: 12 }}>General training template only. Choose appropriate weights, recovery and technique for your experience.</Text>
  </View>
}
