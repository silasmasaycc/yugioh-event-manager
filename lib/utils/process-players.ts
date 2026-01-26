import { calculatePlayerStats, sortPlayersByPerformance } from './player-stats'
import type { TournamentResult, Penalty, PlayerWithResults } from '@/lib/types'

interface PlayerData extends PlayerWithResults {
  [key: string]: any
}

interface ProcessedPlayer {
  id: number
  name: string
  image_url: string | null
  points: number
  topPercentage: number
  totalTournaments: number
  totalTops: number
  firstPlace: number
  secondPlace: number
  thirdPlace: number
  fourthPlace: number
  penalties: number
  [key: string]: any
}

/**
 * Filtra resultados de torneios por tipo (veteranos ou novatos)
 * 
 * @param players - Array de jogadores com tournament_results
 * @param tournamentIds - IDs dos torneios a serem mantidos
 * @returns Jogadores com resultados filtrados
 */
export function filterPlayersByTournamentType(
  players: PlayerData[],
  tournamentIds: number[]
): PlayerData[] {
  return players?.map(player => ({
    ...player,
    tournament_results: player.tournament_results?.filter((result: TournamentResult) => 
      tournamentIds.includes(result.tournament_id)
    ) || []
  })) || []
}

/**
 * Processa jogadores calculando estatísticas e pontos
 * Centraliza a lógica de cálculo de stats que é repetida em múltiplos arquivos
 * 
 * @param players - Array de jogadores para processar
 * @param includePenaltySeparation - Se true, separa penalties por tipo (veteranos/novatos)
 * @returns Jogadores com estatísticas calculadas, ordenados por performance
 */
export function processPlayersWithStats(
  players: PlayerData[],
  includePenaltySeparation = false
): ProcessedPlayer[] {
  const playersWithStats = players?.map(player => {
    const stats = calculatePlayerStats(player, player.penalties || [])
    const points = (stats.firstPlace * 4) + (stats.secondPlace * 3) + (stats.thirdPlace * 2) + (stats.fourthPlace * 2)
    
    const baseStats = {
      ...stats,
      points
    }
    
    // Se solicitado, adicionar separação de penalties por tipo
    if (includePenaltySeparation) {
      const veteranPenalties = (player.penalties || []).filter((p: Penalty) => p.penalty_type !== 'beginner').length
      const beginnerPenalties = (player.penalties || []).filter((p: Penalty) => p.penalty_type === 'beginner').length
      
      return {
        ...baseStats,
        veteranPenalties,
        beginnerPenalties
      }
    }
    
    return baseStats
  }).sort(sortPlayersByPerformance) || []
  
  return playersWithStats
}

/**
 * Processa jogadores filtrando por tipo de torneio e calculando estatísticas
 * Combina as duas operações mais comuns em uma única função
 * 
 * @param players - Array de jogadores com tournament_results
 * @param tournamentIds - IDs dos torneios a serem mantidos
 * @param includePenaltySeparation - Se true, separa penalties por tipo
 * @returns Jogadores filtrados e processados
 */
export function filterAndProcessPlayers(
  players: PlayerData[],
  tournamentIds: number[],
  includePenaltySeparation = false
): ProcessedPlayer[] {
  const filtered = filterPlayersByTournamentType(players, tournamentIds)
  return processPlayersWithStats(filtered, includePenaltySeparation)
}

/**
 * Processa e ordena estatísticas de penalidades
 * Centraliza a lógica de ordenação e transformação de penaltyStats
 * 
 * @param players - Array de jogadores processados
 * @returns Estatísticas de penalidades ordenadas e formatadas
 */
export function processPenaltyStats(players: ProcessedPlayer[]) {
  return players
    .filter(p => p.penalties > 0)
    .sort((a, b) => {
      if (b.penalties !== a.penalties) return b.penalties - a.penalties
      const aPenaltyRate = a.totalTournaments > 0 ? (a.penalties / a.totalTournaments) * 100 : 0
      const bPenaltyRate = b.totalTournaments > 0 ? (b.penalties / b.totalTournaments) * 100 : 0
      if (bPenaltyRate !== aPenaltyRate) return bPenaltyRate - aPenaltyRate
      return b.totalTournaments - a.totalTournaments
    })
    .map(p => ({
      ...p,
      totalPenalties: p.penalties,
      penaltyRate: p.totalTournaments > 0 ? (p.penalties / p.totalTournaments) * 100 : 0
    }))
}
