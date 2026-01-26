import { useState, useMemo } from 'react'
import type { PlayerWithStatsAndTier } from '@/lib/types'

interface PlayerStats {
  total: number
  active: number
  avgPoints: number
  tierCounts: {
    S: number
    A: number
    B: number
    C: number
    D: number
  }
}

interface UsePlayerFiltersReturn {
  searchTerm: string
  setSearchTerm: (value: string) => void
  tierFilter: string
  setTierFilter: (value: string) => void
  sortBy: string
  setSortBy: (value: string) => void
  filteredPlayers: PlayerWithStatsAndTier[]
  stats: PlayerStats
  hasActiveFilters: boolean
  clearFilters: () => void
}

/**
 * Hook para gerenciar filtros, ordenação e estatísticas de jogadores
 * Centraliza toda a lógica de filtragem e cálculos que era duplicada
 * 
 * @param players - Array de jogadores com estatísticas e tier
 * @returns Objeto com estados, funções e dados processados
 */
export function usePlayerFilters(players: PlayerWithStatsAndTier[]): UsePlayerFiltersReturn {
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('points')

  // Calcular estatísticas
  const stats = useMemo(() => {
    const activePlayers = players.filter(p => p.totalTournaments > 0)
    const playersWithPoints = players.filter(p => p.points > 0)
    const averagePoints = playersWithPoints.length > 0
      ? Math.ceil(playersWithPoints.reduce((sum, p) => sum + p.points, 0) / playersWithPoints.length)
      : 0
    
    const tierCounts = {
      S: players.filter(p => p.tier === 'S').length,
      A: players.filter(p => p.tier === 'A').length,
      B: players.filter(p => p.tier === 'B').length,
      C: players.filter(p => p.tier === 'C').length,
      D: players.filter(p => p.tier === 'D').length,
    }

    return {
      total: players.length,
      active: activePlayers.length,
      avgPoints: averagePoints,
      tierCounts
    }
  }, [players])

  // Filtrar e ordenar jogadores
  const filteredPlayers = useMemo(() => {
    let filtered = players

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro de tier
    if (tierFilter !== 'all') {
      if (tierFilter === 'none') {
        filtered = filtered.filter(p => p.tier === null)
      } else {
        filtered = filtered.filter(p => p.tier === tierFilter)
      }
    }

    // Ordenação
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return b.points - a.points
        case 'tops':
          return b.totalTops - a.totalTops
        case 'name':
          return a.name.localeCompare(b.name)
        case 'participation':
          return b.totalTournaments - a.totalTournaments
        default:
          return 0
      }
    })

    return filtered
  }, [players, searchTerm, tierFilter, sortBy])

  const hasActiveFilters = !!(searchTerm || tierFilter !== 'all' || sortBy !== 'points')

  const clearFilters = () => {
    setSearchTerm('')
    setTierFilter('all')
    setSortBy('points')
  }

  return {
    searchTerm,
    setSearchTerm,
    tierFilter,
    setTierFilter,
    sortBy,
    setSortBy,
    filteredPlayers,
    stats,
    hasActiveFilters,
    clearFilters
  }
}
