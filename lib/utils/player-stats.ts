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
 * Calcula pontuação total de um jogador baseado em suas colocações
 * 
 * Sistema de pontos equilibrado:
 * - 1º lugar: 4 pontos (vitória valorizada)
 * - 2º lugar: 3 pontos (vice importante)
 * - 3º lugar: 2 pontos (pódio)
 * - 4º lugar: 2 pontos (TOP 4)
 * 
 * Exemplos de comparação:
 * - 1 primeiro (4pts) vs 2 segundos (6pts) → consistência ganha
 * - 1 primeiro (4pts) = 2 terceiros (4pts) → empate, decide por total de TOPs
 * - 2 primeiros (8pts) vs 3 segundos (9pts) → volume vence
 * 
 * @param player - Estatísticas do jogador
 * @returns Pontuação total calculada
 */
export function calculatePlayerScore(player: PlayerStats): number {
  const POINTS = {
    first: 4,    // Campeão
    second: 3,   // Vice-campeão
    third: 2,    // Terceiro e quarto lugar
    fourth: 2    // Terceiro e quarto lugar
  }

  return (
    player.firstPlace * POINTS.first +
    player.secondPlace * POINTS.second +
    player.thirdPlace * POINTS.third +
    player.fourthPlace * POINTS.fourth
  )
}

/**
 * Ordena jogadores por performance usando critérios de desempate equilibrados
 * 
 * Critérios aplicados em ordem:
 * 1. Sistema de Pontos (1º=4pts, 2º=3pts, 3º/4º=2pts)
 * 2. Quantidade de TOPs (colocações de destaque)
 * 3. Porcentagem de desempenho do jogador
 * 4. Qualidade das colocações (1º lugar > 2º lugar > 3º lugar > 4º lugar)
 * 5. Número de participações (para jogadores sem TOPs)
 * 6. Nome (ordem alfabética - desempate final)
 * 
 * Para jogadores SEM TOPs:
 * - São ordenados por número de participações (maior = mais dedicado)
 * - Em caso de empate, ordem alfabética
 * 
 * @param playerA - Primeiro jogador para comparação
 * @param playerB - Segundo jogador para comparação
 * @returns Número negativo se A > B, positivo se B > A, 0 se iguais
 */
export function sortPlayersByPerformance(playerA: PlayerStats, playerB: PlayerStats): number {
  // Critério 1: Sistema de Pontos
  const scoreA = calculatePlayerScore(playerA)
  const scoreB = calculatePlayerScore(playerB)
  
  if (scoreB !== scoreA) {
    return scoreB - scoreA
  }

  // Critério 2: Quantidade de TOPs (colocações de destaque)
  if (playerB.totalTops !== playerA.totalTops) {
    return playerB.totalTops - playerA.totalTops
  }
  
  // Critério 3: Porcentagem de desempenho (maior % = melhor)
  if (playerA.topPercentage !== playerB.topPercentage) {
    return playerB.topPercentage - playerA.topPercentage
  }

  // Critério 4: Qualidade das colocações (1º > 2º > 3º > 4º)
  // Compara primeiro lugares
  if (playerB.firstPlace !== playerA.firstPlace) {
    return playerB.firstPlace - playerA.firstPlace
  }
  
  // Compara segundos lugares
  if (playerB.secondPlace !== playerA.secondPlace) {
    return playerB.secondPlace - playerA.secondPlace
  }
  
  // Compara terceiros lugares
  if (playerB.thirdPlace !== playerA.thirdPlace) {
    return playerB.thirdPlace - playerA.thirdPlace
  }
  
  // Compara quartos lugares
  if (playerB.fourthPlace !== playerA.fourthPlace) {
    return playerB.fourthPlace - playerA.fourthPlace
  }

  // Critério 5: Número de participações (para jogadores sem TOPs ou empate)
  // Jogadores com mais participações mostram mais dedicação
  if (playerB.totalTournaments !== playerA.totalTournaments) {
    return playerB.totalTournaments - playerA.totalTournaments
  }

  // Critério 6: Ordem alfabética (desempate final)
  return playerA.name.localeCompare(playerB.name)
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
