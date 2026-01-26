import type { PlayerStats, TierSlots, TierCalculatorResult } from '@/lib/types'

/**
 * Calcula tiers de jogadores (versão utilitária para server components)
 * Centraliza toda a lógica de cálculo de tier slots, média de pontos e classificação
 * 
 * @param players - Array de jogadores já ordenados por performance
 * @returns Objeto com tierSlots, avgPoints, playersWithTiers e tierGroups
 */
export function calculateTiers(players: (PlayerStats & { points: number; penalties: number })[]): TierCalculatorResult {
  // Calcular média geral de pontos de TODOS os jogadores que possuem TOPs
  const playersWithTops = players.filter(p => p.totalTops > 0)
  const avgPoints = playersWithTops.length > 0 
    ? Math.ceil(playersWithTops.reduce((sum, p) => sum + p.points, 0) / playersWithTops.length)
    : 0

  // Calcular limites de pontos para cada tier baseado na média
  const tierPointsLimits = {
    S: Math.ceil(avgPoints * 1.75),  // 175% da média
    A: Math.ceil(avgPoints * 1.25),  // 125% da média
    B: Math.ceil(avgPoints * 0.85),  // 85% da média
    C: Math.ceil(avgPoints * 0.55)   // 55% da média
  }

  // Calcular quantidade de vagas por tier baseado em jogadores elegíveis (1+ torneio)
  const eligiblePlayersCount = players.filter(p => p.totalTournaments >= 1).length
  const tierSlots: TierSlots = {
    S: Math.max(1, Math.floor(eligiblePlayersCount * 0.05)), // Top 5%
    A: Math.max(1, Math.floor(eligiblePlayersCount * 0.15)), // Próximos 15% (5% a 20%)
    B: Math.max(1, Math.floor(eligiblePlayersCount * 0.25))  // Próximos 25% (20% a 45%)
  }

  /**
   * Determina o tier de um jogador baseado em múltiplos critérios
   * 
   * Critérios por Tier (baseado em multiplicadores da média geral):
   * - Tier S: Top 5%, ≥55% TOPs, pontos ≥ 175% da média
   * - Tier A: Top 20%, ≥45% TOPs, pontos ≥ 125% da média
   * - Tier B: Top 45%, ≥35% TOPs, pontos ≥ 85% da média
   * - Tier C: Pontos ≥ 55% da média
   * - Tier D: Demais jogadores ativos
   */
  const getTier = (player: PlayerStats & { points: number }, index: number, total: number): string | null => {
    // Apenas jogadores com pelo menos 1 torneio podem ter tier
    if (player.totalTournaments < 1) return null
    
    // Calcular posição percentual no ranking
    const percentile = (index / total) * 100
    
    // Tier S: Elite - Top 5% com performance excepcional (≥55% TOP) e pontos ≥ 175% da média
    if (percentile < 5 && player.topPercentage >= 55 && player.points >= tierPointsLimits.S) {
      return 'S'
    }
    
    // Tier A: Avançado - Top 20% com boa performance (≥45% TOP) e pontos ≥ 125% da média
    if (percentile < 20 && player.topPercentage >= 45 && player.points >= tierPointsLimits.A) {
      return 'A'
    }
    
    // Tier B: Sólido - Top 45% com boa performance (≥35% TOP) e pontos ≥ 85% da média
    if (percentile < 45 && player.topPercentage >= 35 && player.points >= tierPointsLimits.B) {
      return 'B'
    }
    
    // Tier C: Emergente - Jogadores com pontos ≥ 55% da média
    if (player.points >= tierPointsLimits.C) {
      return 'C'
    }
    
    // Tier D: Desenvolvimento - Demais jogadores ativos
    return 'D'
  }

  // Classificar jogadores em tiers
  const playersWithTiers = players.map((player, index) => ({
    ...player,
    tier: getTier(player, index, players.length)
  }))

  // Agrupar jogadores por tier
  const tierGroups = {
    S: playersWithTiers.filter(p => p.tier === 'S'),
    A: playersWithTiers.filter(p => p.tier === 'A'),
    B: playersWithTiers.filter(p => p.tier === 'B'),
    C: playersWithTiers.filter(p => p.tier === 'C'),
    D: playersWithTiers.filter(p => p.tier === 'D')
  }

  return {
    tierSlots,
    avgPoints,
    playersWithTiers,
    tierGroups
  }
}
