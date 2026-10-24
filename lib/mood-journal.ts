import * as SecureStore from "expo-secure-store"

export type Mood = 1 | 2 | 3 | 4 | 5
export type JournalEntry = { date: string; mood: Mood; note: string; updatedAt: string }
// Local-only journal: never send records to API, analytics, or cloud services.
const prefix = "treksor-journal-v1"
const key = (userId: string, date: string) => `${prefix}:${userId}:${date}`
const indexKey = (userId: string) => `${prefix}:${userId}:dates`
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`

export async function getEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return []
  const dates = JSON.parse((await SecureStore.getItemAsync(indexKey(userId))) || "[]") as string[]
  const records = await Promise.all(dates.map(async date => {
    const raw = await SecureStore.getItemAsync(key(userId,date))
    if (!raw) return null
    try {
      const entry = JSON.parse(raw) as JournalEntry
      return entry.date === date && [1,2,3,4,5].includes(entry.mood) && typeof entry.note === "string" ? entry : null
    } catch { return null }
  }))
  return records.filter((entry): entry is JournalEntry => entry !== null).sort((a,b)=>b.date.localeCompare(a.date))
}
export async function saveEntry(userId: string, mood: Mood, note: string, date = localDate()): Promise<void> {
  if (!userId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || ![1,2,3,4,5].includes(mood)) throw new Error("Invalid journal entry")
  if (note.length > 450) throw new Error("Maximum 450 characters")
  await SecureStore.setItemAsync(key(userId,date),JSON.stringify({date,mood,note,updatedAt:new Date().toISOString()}))
  const dates = JSON.parse((await SecureStore.getItemAsync(indexKey(userId))) || "[]") as string[]
  if (!dates.includes(date)) await SecureStore.setItemAsync(indexKey(userId),JSON.stringify([...dates,date].sort()))
}
export function moodAverage(entries: JournalEntry[], period: "week"|"month"|"year", now = new Date()) {
  const start = new Date(now.getFullYear(),now.getMonth(),now.getDate())
  if (period==="week") start.setDate(start.getDate()-6)
  if (period==="month") start.setDate(start.getDate()-29)
  if (period==="year") start.setDate(start.getDate()-364)
  const first=localDate(start),last=localDate(now)
  const included=entries.filter(e=>e.date>=first&&e.date<=last)
  return {average:included.length?included.reduce((sum,e)=>sum+e.mood,0)/included.length:null,days:included.length}
}

export async function deleteEntry(userId: string, date: string): Promise<void> {
  if (!userId || date.length !== 10 || !Number.isFinite(Date.parse(date))) throw new Error("Invalid entry")
  await SecureStore.deleteItemAsync(key(userId,date))
  const dates = JSON.parse((await SecureStore.getItemAsync(indexKey(userId))) || "[]") as string[]
  await SecureStore.setItemAsync(indexKey(userId),JSON.stringify(dates.filter(d=>d!==date)))
}

export async function clearJournal(userId: string): Promise<void> {
  if (!userId) return
  const dates = JSON.parse((await SecureStore.getItemAsync(indexKey(userId))) || "[]") as string[]
  for (const date of dates) {
    await SecureStore.deleteItemAsync(key(userId,date))
  }
  await SecureStore.deleteItemAsync(indexKey(userId))
}
