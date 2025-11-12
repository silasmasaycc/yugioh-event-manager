import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PlayerStats, PenaltyPlayerStats } from '@/lib/types'
import { sortPlayersByPerformance, calculatePenaltyRate } from '@/lib/utils/player-stats'

export function usePlayerStats() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPlayerStats()
  }, [])

  const loadPlayerStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const { data: players, error: playersError } = await supabase
        .from('players')
        .select(`
          id,
          name,
          image_url,
          tournament_results(placement, tournament_id)
        `)

      if (playersError) throw playersError

      const stats: PlayerStats[] = (players || []).map(player => {
        const results = Array.isArray(player.tournament_results) ? player.tournament_results : []
        const totalTournaments = results.length
        const totalTops = results.filter((r: any) => r.placement !== null && r.placement <= 4).length
        const topPercentage = totalTournaments > 0 ? (totalTops / totalTournaments) * 100 : 0

        return {
          id: player.id,
          name: player.name,
          image_url: player.image_url,
          totalTournaments,
          totalTops,
          topPercentage,
          firstPlace: results.filter((r: any) => r.placement === 1).length,
          secondPlace: results.filter((r: any) => r.placement === 2).length,
          thirdPlace: results.filter((r: any) => r.placement === 3).length,
          fourthPlace: results.filter((r: any) => r.placement === 4).length,
        }
      })

      // Usar função utilitária para ordenação
      stats.sort(sortPlayersByPerformance)

      setPlayerStats(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  return { playerStats, loading, error, refetch: loadPlayerStats }
}

export function usePenaltyStats() {
  const [penaltyStats, setPenaltyStats] = useState<PenaltyPlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPenaltyStats()
  }, [])

  const loadPenaltyStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const [{ data: players }, { data: penalties }] = await Promise.all([
        supabase.from('players').select(`
          id,
          name,
          image_url,
          tournament_results(placement, tournament_id)
        `),
        supabase.from('penalties').select('player_id')
      ])

      const penaltyMap = new Map<number, number>()
      penalties?.forEach((p: any) => {
        penaltyMap.set(p.player_id, (penaltyMap.get(p.player_id) || 0) + 1)
      })

      const stats: PenaltyPlayerStats[] = (players || [])
        .map(player => {
          const results = Array.isArray(player.tournament_results) ? player.tournament_results : []
          const totalTournaments = results.length
          const totalPenalties = penaltyMap.get(player.id) || 0
          const penaltyRate = calculatePenaltyRate(totalPenalties, totalTournaments)

          return {
            id: player.id,
            name: player.name,
            image_url: player.image_url,
            totalPenalties,
            totalTournaments,
            penaltyRate
          }
        })
        .filter(p => p.totalPenalties > 0)
        .sort((a, b) => {
          if (b.totalPenalties !== a.totalPenalties) return b.totalPenalties - a.totalPenalties
          return b.penaltyRate - a.penaltyRate
        })

      setPenaltyStats(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar penalidades')
    } finally {
      setLoading(false)
    }
  }

  return { penaltyStats, loading, error, refetch: loadPenaltyStats }
}
