export interface Player {
  id: number
  name: string
  image_url: string | null
  created_at: string
}

export interface Tournament {
  id: number
  name: string
  date: string
  player_count: number
  location: string | null
  created_at: string
}

export interface TournamentResult {
  id: number
  player_id: number
  tournament_id: number
  placement: number | null
  created_at?: string
}

export interface Penalty {
  id: string
  player_id: number
  created_at: string
}

export interface PlayerStats {
  id: number
  name: string
  image_url: string | null
  totalTournaments: number
  totalTops: number
  topPercentage: number
  firstPlace: number
  secondPlace: number
  thirdPlace: number
  fourthPlace: number
}

export interface PenaltyPlayerStats {
  id: number
  name: string
  image_url: string | null
  totalPenalties: number
  totalTournaments: number
  penaltyRate: number
}

// Tipos compostos do Supabase com relações
export interface PlayerWithResults extends Player {
  tournament_results?: TournamentResult[]
  penalties?: Penalty[]
}

export interface TournamentWithResults extends Tournament {
  tournament_results?: (TournamentResult & {
    player?: Player
  })[]
}

export interface PenaltyWithPlayer extends Penalty {
  player?: Player
}

export interface ChartData {
  name: string
  value: number
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'subadmin'
  created_at: string
}

// Tipos de formulários
export interface PlayerFormData {
  name: string
  image_url?: string
}

export interface TournamentFormData {
  name: string
  date: string
  player_count: number
  location?: string
  firstPlace: number
  secondPlace: number
  thirdPlace: number
  fourthPlace: number
  otherParticipants: number[]
}
