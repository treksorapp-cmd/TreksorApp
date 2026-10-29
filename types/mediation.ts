export interface MediationContentData {
    description: string
    experience: string[]
}

export type MeditationLevel = "beginner" | "intermediate" | "advanced";
export type MeditationCategory = "breathing" | "mindfulness" | "visualization" | "focus" | "relaxation" | "sleep";

export interface Mediation {
  id: string
  title: string
  level?: MeditationLevel
  category?: MeditationCategory
  audioUrl: string
  content: MediationContentData
  tip: string
  isRead?: boolean
  source: string
  url: string
}
