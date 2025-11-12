import type { PlayerStats, PenaltyPlayerStats, PlayerWithResults, TournamentResult, Penalty } from '@/lib/types'
import { TOP_POSITIONS, FIRST_PLACE, SECOND_PLACE, THIRD_PLACE, FOURTH_PLACE } from '@/lib/constants'

/**
 * Verifica se um resultado de torneio é um TOP (1º ao 4º lugar)
 */
const isTopPlacement = (result: TournamentResult): boolean => {
  return result.placement !== null && result.placement <= TOP_POSITIONS
}

/**
 * Filtra resultados por colocação específica
 */
const filterByPlacement = (results: TournamentResult[], placement: number): TournamentResult[] => {
  return results.filter(result => result.placement === placement)
}

/**
 * Conta quantas penalidades um jogador possui
 */
const countPlayerPenalties = (playerId: number, penalties: Penalty[]): number => {
  return penalties.filter(penalty => penalty.player_id === playerId).length
}

/**
 * Calcula a porcentagem de aproveitamento (TOPs / Total de torneios)
 */
const calculateTopPercentage = (totalTops: number, totalTournaments: number): number => {
  if (totalTournaments === 0) return 0
  return (totalTops / totalTournaments) * 100
}

/**
 * Calcula estatísticas completas de um jogador baseado em seus resultados
 * 
 * @param player - Dados do jogador com resultados de torneios
 * @param penalties - Lista de penalidades para calcular total do jogador
 * @returns Estatísticas calculadas do jogador incluindo penalidades
 */
export function calculatePlayerStats(
  player: PlayerWithResults,
  penalties: Penalty[] = []
): PlayerStats & { penalties: number } {
  const results = Array.isArray(player.tournament_results) ? player.tournament_results : []
  
  const totalTournaments = results.length
  const totalTops = results.filter(isTopPlacement).length
  const topPercentage = calculateTopPercentage(totalTops, totalTournaments)
  const penaltyCount = countPlayerPenalties(player.id, penalties)

  return {
    id: player.id,
    name: player.name,
    image_url: player.image_url,
    totalTournaments,
    totalTops,
    topPercentage,
    firstPlace: filterByPlacement(results, FIRST_PLACE).length,
    secondPlace: filterByPlacement(results, SECOND_PLACE).length,
    thirdPlace: filterByPlacement(results, THIRD_PLACE).length,
    fourthPlace: filterByPlacement(results, FOURTH_PLACE).length,
    penalties: penaltyCount
  }
}

/**
 * Ordena jogadores por performance usando critérios hierárquicos
 * 
 * Ordem de prioridade:
 * 1. Número de 1º lugares
 * 2. Número de 2º lugares
 * 3. Número de 3º lugares
 * 4. Número de 4º lugares
 * 5. Total de TOPs
 * 6. Porcentagem de aproveitamento
 * 
 * @param playerA - Primeiro jogador para comparação
 * @param playerB - Segundo jogador para comparação
 * @returns Número negativo se A > B, positivo se B > A, 0 se iguais
 */
export function sortPlayersByPerformance(playerA: PlayerStats, playerB: PlayerStats): number {
  if (playerB.firstPlace !== playerA.firstPlace) {
    return playerB.firstPlace - playerA.firstPlace
  }
  
  if (playerB.secondPlace !== playerA.secondPlace) {
    return playerB.secondPlace - playerA.secondPlace
  }
  
  if (playerB.thirdPlace !== playerA.thirdPlace) {
    return playerB.thirdPlace - playerA.thirdPlace
  }
  
  if (playerB.fourthPlace !== playerA.fourthPlace) {
    return playerB.fourthPlace - playerA.fourthPlace
  }
  
  if (playerB.totalTops !== playerA.totalTops) {
    return playerB.totalTops - playerA.totalTops
  }
  
  return playerB.topPercentage - playerA.topPercentage
}

/**
 * Calcula a taxa de penalidades de um jogador
 * 
 * @param totalPenalties - Número total de penalidades recebidas
 * @param totalTournaments - Número total de torneios participados
 * @returns Porcentagem de penalidades (0-100)
 */
export function calculatePenaltyRate(totalPenalties: number, totalTournaments: number): number {
  if (totalTournaments === 0) return 0
  return (totalPenalties / totalTournaments) * 100
}
