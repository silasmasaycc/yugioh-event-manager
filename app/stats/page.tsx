'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { PageLayout } from '@/components/layout/page-layout'
import { PerformanceChart, TopsEvolutionChart, PlacementChart, StreaksChart, ImprovementChart } from '@/components/stats'
import { ERROR_MESSAGES } from '@/lib/constants/messages'
import { logger } from '@/lib/utils/logger'
import { generateColors } from '@/lib/utils'
import { 
  TOP_POSITIONS, 
  FIRST_PLACE,
  SECOND_PLACE,
  THIRD_PLACE,
  FOURTH_PLACE
} from '@/lib/constants'

interface PlayerStats {
  name: string
  participations: number
  tops: number
  topPercentage: number
}

interface PlacementDistribution {
  name: string
  '1º Lugar': number
  '2º Lugar': number
  '3º Lugar': number
  '4º Lugar': number
}

interface TournamentResult {
  date: string
  tournamentId: number
  playerId: number
  playerName: string
  placement: number | null
}

export default function StatsPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostParticipations, setMostParticipations] = useState<PlayerStats[]>([])
  const [topsEvolutionData, setTopsEvolutionData] = useState<{ tournaments: any[], results: TournamentResult[], topPlayers: string[] }>({ tournaments: [], results: [], topPlayers: [] })
  const [bestPerformance, setBestPerformance] = useState<PlayerStats[]>([])
  const [placementDistribution, setPlacementDistribution] = useState<PlacementDistribution[]>([])

  const supabase = createClient()

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      let tournamentQuery = supabase.from('tournaments').select('id, date')
      
      if (startDate) {
        tournamentQuery = tournamentQuery.gte('date', startDate)
      }
      if (endDate) {
        tournamentQuery = tournamentQuery.lte('date', endDate)
      }

      const { data: tournaments } = await tournamentQuery

      if (!tournaments || tournaments.length === 0) {
        setMostParticipations([])
        setTopsEvolutionData({ tournaments: [], results: [], topPlayers: [] })
        setBestPerformance([])
        setPlacementDistribution([])
        setLoading(false)
        return
      }

      const tournamentIds = tournaments.map(t => t.id)

      const { data: results } = await supabase
        .from('tournament_results')
        .select(`
          placement,
          tournament_id,
          player:players(id, name)
        `)
        .in('tournament_id', tournamentIds)

      const { data: players } = await supabase.from('players').select('id, name')

      if (!players || !results) {
        setPlacementDistribution([])
        setLoading(false)
        return
      }

      // Calcular estatísticas por jogador
      const playerStatsMap = new Map<number, PlayerStats>()

      players.forEach(player => {
        const playerResults = results.filter((result: any) => result.player?.id === player.id)
        const participations = playerResults.length
        const tops = playerResults.filter((result: any) => result.placement !== null && result.placement <= TOP_POSITIONS).length
        const topPercentage = participations > 0 ? (tops / participations) * 100 : 0

        if (participations > 0) {
          playerStatsMap.set(player.id, {
            name: player.name,
            participations,
            tops,
            topPercentage
          })
        }
      })

      const allPlayerStats = Array.from(playerStatsMap.values())

      // Top jogadores que mais jogaram (para gráfico de participações)
      const topByParticipation = [...allPlayerStats]
        .sort((playerA, playerB) => playerB.participations - playerA.participations)
      
      setMostParticipations(topByParticipation)

      // Top jogadores com mais TOPs (para gráfico de evolução temporal)
      const topByTops = [...allPlayerStats]
        .sort((playerA, playerB) => playerB.tops - playerA.tops)
      
      // Preparar dados para evolução temporal
      const tournamentResults: TournamentResult[] = results.map((result: any) => ({
        date: tournaments.find(t => t.id === result.tournament_id)?.date || '',
        tournamentId: result.tournament_id,
        playerId: result.player?.id || 0,
        playerName: result.player?.name || '',
        placement: result.placement
      }))

      setTopsEvolutionData({
        tournaments: tournaments.map(t => ({ id: t.id, date: t.date })),
        results: tournamentResults,
        topPlayers: topByTops.map(p => p.name)
      })

      // Top jogadores com melhor % de TOPs (mínimo 1 TOP)
      const topByPercentage = [...allPlayerStats]
        .filter(player => player.tops > 0)
        .sort((playerA, playerB) => playerB.topPercentage - playerA.topPercentage)
      
      setBestPerformance(topByPercentage)

      // Distribuição de Colocações (apenas jogadores com TOPs)
      const placementMap = new Map<number, PlacementDistribution>()
      
      topByTops
        .filter(player => player.tops > 0) // Filtrar apenas jogadores com TOPs
        .forEach(player => {
          const playerData = players.find(currentPlayer => currentPlayer.name === player.name)
          if (playerData) {
            const playerResults = results.filter((result: any) => result.player?.id === playerData.id)
            
            placementMap.set(playerData.id, {
              name: player.name,
              '1º Lugar': playerResults.filter((result: any) => result.placement === FIRST_PLACE).length,
              '2º Lugar': playerResults.filter((result: any) => result.placement === SECOND_PLACE).length,
              '3º Lugar': playerResults.filter((result: any) => result.placement === THIRD_PLACE).length,
              '4º Lugar': playerResults.filter((result: any) => result.placement === FOURTH_PLACE).length,
            })
          }
        })

      setPlacementDistribution(Array.from(placementMap.values()))

    } catch (error) {
      logger.error(ERROR_MESSAGES.LOAD_STATS_ERROR, error)
    }
    setLoading(false)
  }, [supabase, startDate, endDate])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleFilter = () => {
    loadStats()
  }

  const handleClearFilter = () => {
    setStartDate('')
    setEndDate('')
    setTimeout(() => loadStats(), 0)
  }

  return (
    <PageLayout activeRoute="/stats">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">Estatísticas</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Análise de desempenho e participação dos jogadores
        </p>
      </div>

      {/* Filtros */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filtros por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleFilter} className="flex-1">
                Aplicar Filtro
              </Button>
              <Button onClick={handleClearFilter} variant="outline">
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">Carregando estatísticas...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <StreaksChart 
            tournaments={topsEvolutionData.tournaments}
            results={topsEvolutionData.results}
            topPlayers={topsEvolutionData.topPlayers}
            colors={generateColors(topsEvolutionData.topPlayers)}
          />
          <ImprovementChart 
            tournaments={topsEvolutionData.tournaments}
            results={topsEvolutionData.results}
            topPlayers={topsEvolutionData.topPlayers}
            colors={generateColors(topsEvolutionData.topPlayers)}
          />
          <TopsEvolutionChart 
            tournaments={topsEvolutionData.tournaments}
            results={topsEvolutionData.results}
            topPlayers={topsEvolutionData.topPlayers}
            colors={generateColors(topsEvolutionData.topPlayers)}
          />
          <PerformanceChart 
            data={bestPerformance} 
            colors={generateColors(bestPerformance.map(p => p.name))} 
          />
          <PlacementChart 
            data={placementDistribution} 
            colors={generateColors(placementDistribution.map(p => p.name))} 
          />
        </div>
      )}
    </PageLayout>
  )
}
