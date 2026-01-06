import { createClient } from '@/lib/supabase/server'
import { RankingClient } from './ranking-client'
import { calculatePlayerStats, sortPlayersByPerformance } from '@/lib/utils/player-stats'
import { ERROR_MESSAGES } from '@/lib/constants/messages'
import { logger } from '@/lib/utils/logger'

export const revalidate = 3600 // 1 hora

export default async function RankingPage() {
  const supabase = await createClient()

  // Query otimizada com LEFT JOIN
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select(`
      *,
      tournament_results(
        placement, 
        tournament_id,
        tournaments(date)
      ),
      penalties(player_id)
    `)
    .order('name')

  if (playersError) {
    logger.error(ERROR_MESSAGES.LOAD_PLAYERS_ERROR, playersError)
    return (
      <div className="text-center py-12">
        <p className="text-xl text-red-600">{ERROR_MESSAGES.LOAD_PLAYERS_ERROR}</p>
      </div>
    )
  }

  // Calcular estatísticas para cada jogador
  const playersWithStats = players?.map(player => {
    const stats = calculatePlayerStats(player, player.penalties || [])
    const points = (stats.firstPlace * 4) + (stats.secondPlace * 3) + (stats.thirdPlace * 2) + (stats.fourthPlace * 2)
    return { 
      ...stats, 
      points,
      tournament_results: player.tournament_results || [] // Manter os resultados para calcular tendência
    }
  }).sort(sortPlayersByPerformance) || []

  // Calcular tier para cada jogador
  const eligiblePlayersCount = playersWithStats.filter(p => p.totalTournaments >= 1).length
  const tierSlots = {
    S: Math.max(1, Math.floor(eligiblePlayersCount * 0.10)),
    A: Math.max(1, Math.floor(eligiblePlayersCount * 0.20)),
    B: Math.max(1, Math.floor(eligiblePlayersCount * 0.30))
  }

  const top10Players = playersWithStats.slice(0, 10).filter(p => p.points > 0)
  const avgPoints = top10Players.length > 0 
    ? Math.ceil(top10Players.reduce((sum, p) => sum + p.points, 0) / top10Players.length)
    : 0

  const getTier = (player: any, index: number, total: number) => {
    if (player.totalTournaments < 1) return null
    const percentile = (index / total) * 100
    
    if (percentile < 10 && player.topPercentage >= 51 && player.points >= avgPoints) return 'S'
    if (percentile < 30 && player.topPercentage >= 40 && player.points >= avgPoints * 0.7) return 'A'
    if (percentile < 60 && player.points >= avgPoints * 0.5) return 'B'
    if (percentile < 85 && player.points >= avgPoints * 0.3) return 'C'
    return 'D'
  }

  const playersWithTiers = playersWithStats.map((player, index) => ({
    ...player,
    tier: getTier(player, index, playersWithStats.length)
  }))

  // Query para penalidades
  const { data: penaltyPlayers, error: penaltyError } = await supabase
    .from('players')
    .select(`
      *,
      tournament_results(placement, tournament_id),
      penalties(player_id)
    `)
    .order('name')

  const penaltyStats = penaltyPlayers?.map(player => {
    const stats = calculatePlayerStats(player, player.penalties || [])
    return stats
  }).filter(p => p.penalties > 0)
    .sort((a, b) => {
      if (b.penalties !== a.penalties) return b.penalties - a.penalties
      const aPenaltyRate = a.totalTournaments > 0 ? (a.penalties / a.totalTournaments) * 100 : 0
      const bPenaltyRate = b.totalTournaments > 0 ? (b.penalties / b.totalTournaments) * 100 : 0
      if (bPenaltyRate !== aPenaltyRate) return bPenaltyRate - aPenaltyRate
      return b.totalTournaments - a.totalTournaments
    }).map(p => ({
      ...p,
      totalPenalties: p.penalties,
      penaltyRate: p.totalTournaments > 0 ? (p.penalties / p.totalTournaments) * 100 : 0
    })) || []

  return <RankingClient players={playersWithTiers} penaltyStats={penaltyStats} tierSlots={tierSlots} avgPoints={avgPoints} />
}
