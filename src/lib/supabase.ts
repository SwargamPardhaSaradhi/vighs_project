import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface Farmer {
  id: number
  name: string
  email: string
  password: string
  phone_number?: string
  address?: string
  date_of_birth?: string
  registered_at: string
}

export interface Land {
  id: number
  farmer_id: number
  acres: number
  location: string
  created_at: string
}

export interface Plant {
  id: number
  land_id: number
  plant_name: string
  disease_percentage: number
  previous_fertilizers?: string
  created_at: string
}

export interface PlantDiagnosis {
  id: number
  farmer_id: number
  status: string
  predicted_class: string
  confidence: number
  created_at: string
}

export interface TreatmentSchedule {
  id: number
  farmer_id: number
  pesticide_name: string
  scheduled_date: string
  completed: boolean
}