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
  placement: number
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

export interface TournamentWithResults extends Tournament {
  results: (TournamentResult & {
    player: Player
  })[]
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
