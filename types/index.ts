export type TimeSlot = 'morning' | 'lunch' | 'dinner' | 'bedtime'
export type Severity = 'low' | 'medium' | 'high' | 'contraindicated'
export type Provider = 'email' | 'kakao' | 'google' | 'naver'

export interface Profile {
  id: string
  email: string
  name: string
  avatar_url?: string
  provider: Provider
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  height?: number
  weight?: number
  conditions?: string[]
  created_at: string
}

export interface Medication {
  id: string
  item_seq?: string
  item_name: string
  entp_name?: string
  class_name?: string
  efficacy?: string
  usage_info?: string
  caution?: string
  side_effect?: string
  interaction_info?: string
  image_url?: string
  created_at: string
}

export interface Schedule {
  id: string
  user_id: string
  medication_id: string
  medication?: Medication
  start_date: string
  end_date?: string
  time_slots: TimeSlot[]
  dosage?: string
  memo?: string
  is_active: boolean
  created_at: string
}

export interface MedicationLog {
  id: string
  user_id: string
  schedule_id: string
  medication_id: string
  medication?: Medication
  log_date: string
  time_slot: TimeSlot
  taken: boolean
  taken_at?: string
}

export interface DrugInteraction {
  id: string
  medication_a_id: string
  medication_b_id: string
  medication_a?: Medication
  medication_b?: Medication
  severity: Severity
  description?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface DashboardTimeSlot {
  slot: TimeSlot
  label: string
  emoji: string
  medications: Array<{
    scheduleId: string
    medicationId: string
    medicationName: string
    dosage?: string
    taken: boolean
    logId?: string
  }>
}
