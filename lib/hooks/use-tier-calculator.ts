import { useMemo } from 'react'
import { calculateTiers } from '@/lib/utils/tier-calculator'
import type { PlayerStats } from '@/lib/types'

/**
 * Hook para calcular tiers de jogadores em client components
 * Usa a função utilitária calculateTiers com memoização
 */
export function useTierCalculator(players: (PlayerStats & { points: number; penalties: number })[]) {
  return useMemo(() => calculateTiers(players), [players])
}
