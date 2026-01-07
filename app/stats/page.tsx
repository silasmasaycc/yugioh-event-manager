'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { PageLayout } from '@/components/layout/page-layout'
import { PlayerProfileChart, PerformanceChart, TopsEvolutionChart, StreaksChart, ImprovementChart } from '@/components/stats'
import { ERROR_MESSAGES } from '@/lib/constants/messages'
import { logger } from '@/lib/utils/logger'
import { generateColors, formatDateLong } from '@/lib/utils'
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
  firstPlace?: number
  secondPlace?: number
  thirdPlace?: number
  fourthPlace?: number
  points?: number
  currentStreak?: number
  bestStreak?: number
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
  const [appliedStartDate, setAppliedStartDate] = useState('')
  const [appliedEndDate, setAppliedEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostParticipations, setMostParticipations] = useState<PlayerStats[]>([])
  const [topsEvolutionData, setTopsEvolutionData] = useState<{ tournaments: any[], results: TournamentResult[], topPlayers: string[] }>({ tournaments: [], results: [], topPlayers: [] })
  const [bestPerformance, setBestPerformance] = useState<PlayerStats[]>([])
  const [placementDistribution, setPlacementDistribution] = useState<PlacementDistribution[]>([])
  const [totalTournaments, setTotalTournaments] = useState(0)
  const [filteredTournaments, setFilteredTournaments] = useState(0)

  const supabase = createClient()

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      // Buscar total de torneios (sem filtro)
      const { count: total } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
      
      setTotalTournaments(total || 0)

      let tournamentQuery = supabase.from('tournaments').select('id, date')
      
      if (appliedStartDate) {
        tournamentQuery = tournamentQuery.gte('date', appliedStartDate)
      }
      if (appliedEndDate) {
        tournamentQuery = tournamentQuery.lte('date', appliedEndDate)
      }

      const { data: tournaments } = await tournamentQuery

      if (!tournaments || tournaments.length === 0) {
        setMostParticipations([])
        setTopsEvolutionData({ tournaments: [], results: [], topPlayers: [] })
        setBestPerformance([])
        setPlacementDistribution([])
        setFilteredTournaments(0)
        setLoading(false)
        return
      }

      setFilteredTournaments(tournaments.length)

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

        // Contar colocações
        const firstPlace = playerResults.filter((result: any) => result.placement === FIRST_PLACE).length
        const secondPlace = playerResults.filter((result: any) => result.placement === SECOND_PLACE).length
        const thirdPlace = playerResults.filter((result: any) => result.placement === THIRD_PLACE).length
        const fourthPlace = playerResults.filter((result: any) => result.placement === FOURTH_PLACE).length

        // Calcular pontos
        const points = firstPlace * 4 + secondPlace * 3 + thirdPlace * 2 + fourthPlace * 2

        // Calcular streaks
        const sortedResults = playerResults
          .filter((result: any) => result.placement !== null && result.placement <= TOP_POSITIONS)
          .sort((a: any, b: any) => {
            const dateA = tournaments.find(t => t.id === a.tournament_id)?.date || ''
            const dateB = tournaments.find(t => t.id === b.tournament_id)?.date || ''
            return dateA.localeCompare(dateB)
          })

        let currentStreak = 0
        let bestStreak = 0
        let tempStreak = 0

        sortedResults.forEach(() => {
          tempStreak++
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak
          }
        })

        // Para streak atual, verificar os últimos torneios
        const recentResults = playerResults
          .sort((a: any, b: any) => {
            const dateA = tournaments.find(t => t.id === a.tournament_id)?.date || ''
            const dateB = tournaments.find(t => t.id === b.tournament_id)?.date || ''
            return dateB.localeCompare(dateA)
          })

        for (const result of recentResults) {
          if (result.placement !== null && result.placement <= TOP_POSITIONS) {
            currentStreak++
          } else {
            break
          }
        }

        if (participations > 0) {
          playerStatsMap.set(player.id, {
            name: player.name,
            participations,
            tops,
            topPercentage,
            firstPlace,
            secondPlace,
            thirdPlace,
            fourthPlace,
            points,
            currentStreak,
            bestStreak
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
  }, [supabase, appliedStartDate, appliedEndDate])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleFilter = () => {
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
  }

  const handleClearFilter = () => {
    setStartDate('')
    setEndDate('')
    setAppliedStartDate('')
    setAppliedEndDate('')
  }

  const isFiltered = appliedStartDate !== '' || appliedEndDate !== ''

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
              <Button 
                onClick={handleClearFilter} 
                variant="outline"
                className={isFiltered ? 'border-orange-500 text-orange-600 hover:bg-orange-50' : ''}
              >
                Limpar
              </Button>
            </div>
          </div>
          
          {/* Badge de status do filtro */}
          {!loading && (
            <div className="mt-4 flex items-center justify-center gap-3">
              {isFiltered ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-xl">🔍</span>
                  <div className="text-sm">
                    <span className="font-semibold text-blue-800">
                      Período: {appliedStartDate ? formatDateLong(appliedStartDate) : '...'} → {appliedEndDate ? formatDateLong(appliedEndDate) : '...'}
                    </span>
                    <span className="text-blue-600 ml-2">
                      ({filteredTournaments} {filteredTournaments === 1 ? 'torneio' : 'torneios'} de {totalTournaments} total)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-xl">📊</span>
                  <span className="text-sm font-semibold text-gray-700">
                    Mostrando todos os torneios ({totalTournaments} {totalTournaments === 1 ? 'torneio' : 'torneios'})
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">Carregando estatísticas...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <PlayerProfileChart 
            data={bestPerformance.map(p => ({
              name: p.name,
              participations: p.participations,
              tops: p.tops,
              topPercentage: p.topPercentage,
              firstPlace: p.firstPlace ?? 0,
              secondPlace: p.secondPlace ?? 0,
              thirdPlace: p.thirdPlace ?? 0,
              fourthPlace: p.fourthPlace ?? 0,
              points: p.points ?? 0,
              currentStreak: p.currentStreak ?? 0,
              bestStreak: p.bestStreak ?? 0
            }))} 
            colors={generateColors(bestPerformance.map(p => p.name))} 
            isFiltered={isFiltered}
            filteredCount={filteredTournaments}
            totalCount={totalTournaments}
          />
          <StreaksChart 
            tournaments={topsEvolutionData.tournaments}
            results={topsEvolutionData.results}
            topPlayers={topsEvolutionData.topPlayers}
            colors={generateColors(topsEvolutionData.topPlayers)}
            isFiltered={isFiltered}
            filteredCount={filteredTournaments}
            totalCount={totalTournaments}
          />
          <ImprovementChart 
            tournaments={topsEvolutionData.tournaments}
            results={topsEvolutionData.results}
            topPlayers={topsEvolutionData.topPlayers}
            colors={generateColors(topsEvolutionData.topPlayers)}
            isFiltered={isFiltered}
            filteredCount={filteredTournaments}
            totalCount={totalTournaments}
          />
          <TopsEvolutionChart 
            tournaments={topsEvolutionData.tournaments}
            results={topsEvolutionData.results}
            topPlayers={topsEvolutionData.topPlayers}
            colors={generateColors(topsEvolutionData.topPlayers)}
            isFiltered={isFiltered}
            filteredCount={filteredTournaments}
            totalCount={totalTournaments}
          />
          <PerformanceChart 
            data={bestPerformance} 
            colors={generateColors(bestPerformance.map(p => p.name))} 
            isFiltered={isFiltered}
            filteredCount={filteredTournaments}
            totalCount={totalTournaments}
          />
        </div>
      )}
    </PageLayout>
  )
}
