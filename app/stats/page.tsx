'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { PageLayout } from '@/components/layout/page-layout'
import { PlayerProfileChart, PerformanceChart, TopsEvolutionChart, StreaksChart, ImprovementChart, DeckUsageChart } from '@/components/stats'
import { ERROR_MESSAGES } from '@/lib/constants/messages'
import { logger } from '@/lib/utils/logger'
import { generateColors, formatDateLong } from '@/lib/utils'
import { sortPlayersByPerformance } from '@/lib/utils/player-stats'
import { Users, PieChart } from 'lucide-react'
import { 
  TOP_POSITIONS, 
  FIRST_PLACE,
  SECOND_PLACE,
  THIRD_PLACE,
  FOURTH_PLACE
} from '@/lib/constants'
import type { PlayerStats } from '@/lib/types'

interface PlayerStatsExtended extends PlayerStats {
  participations: number
  points?: number
  currentStreak?: number
  bestStreak?: number
}

interface TournamentResultForChart {
  date: string
  tournamentId: number
  playerId: number
  playerName: string
  placement: number | null
}

interface PlacementDistribution {
  name: string
  '1º Lugar': number
  '2º Lugar': number
  '3º Lugar': number
  '4º Lugar': number
}

export default function StatsPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appliedStartDate, setAppliedStartDate] = useState('')
  const [appliedEndDate, setAppliedEndDate] = useState('')
  const [tournamentType, setTournamentType] = useState<'all' | 'regular' | 'beginner'>('regular')
  const [appliedTournamentType, setAppliedTournamentType] = useState<'all' | 'regular' | 'beginner'>('regular')
  const [loading, setLoading] = useState(true)
  const [mostParticipations, setMostParticipations] = useState<PlayerStatsExtended[]>([])
  const [topsEvolutionData, setTopsEvolutionData] = useState<{ tournaments: any[], results: TournamentResultForChart[], topPlayers: string[] }>({ tournaments: [], results: [], topPlayers: [] })
  const [bestPerformance, setBestPerformance] = useState<PlayerStatsExtended[]>([])
  const [placementDistribution, setPlacementDistribution] = useState<PlacementDistribution[]>([])
  const [totalTournaments, setTotalTournaments] = useState(0)
  const [filteredTournaments, setFilteredTournaments] = useState(0)
  const [deckUsageData, setDeckUsageData] = useState<any[]>([])
  const [deckColors, setDeckColors] = useState<Record<string, string>>({})

  const supabase = createClient()

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      // Buscar total de torneios baseado no tipo selecionado
      let totalQuery = supabase.from('tournaments').select('*', { count: 'exact', head: true })
      
      if (appliedTournamentType === 'regular') {
        totalQuery = totalQuery.neq('tournament_type', 'beginner')
      } else if (appliedTournamentType === 'beginner') {
        totalQuery = totalQuery.eq('tournament_type', 'beginner')
      }
      
      const { count: total } = await totalQuery
      setTotalTournaments(total || 0)

      let tournamentQuery = supabase.from('tournaments').select('id, date, tournament_type')
      
      // Filtrar por tipo de torneio
      if (appliedTournamentType === 'regular') {
        tournamentQuery = tournamentQuery.neq('tournament_type', 'beginner')
      } else if (appliedTournamentType === 'beginner') {
        tournamentQuery = tournamentQuery.eq('tournament_type', 'beginner')
      }
      
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
          deck_id,
          deck_id_secondary,
          player:players(id, name),
          deck:decks!tournament_results_deck_id_fkey(id, name, image_url),
          deck_secondary:decks!tournament_results_deck_id_secondary_fkey(id, name, image_url)
        `)
        .in('tournament_id', tournamentIds)

      const { data: players } = await supabase.from('players').select('id, name')

      if (!players || !results) {
        setPlacementDistribution([])
        setLoading(false)
        return
      }

      // Calcular estatísticas por jogador
      const playerStatsMap = new Map<number, PlayerStatsExtended>()

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

        // Calcular streaks de forma correta: verificar torneios consecutivos
        // Ordenar TODOS os resultados do jogador por data
        const allResultsSorted = playerResults
          .map((result: any) => ({
            ...result,
            date: tournaments.find(t => t.id === result.tournament_id)?.date || ''
          }))
          .sort((a: any, b: any) => a.date.localeCompare(b.date))

        let currentStreak = 0
        let bestStreak = 0
        let tempStreak = 0

        // Percorrer todos os torneios para encontrar sequências consecutivas
        allResultsSorted.forEach((result: any) => {
          if (result.placement !== null && result.placement <= TOP_POSITIONS) {
            tempStreak++
            if (tempStreak > bestStreak) {
              bestStreak = tempStreak
            }
          } else {
            tempStreak = 0 // Resetar ao encontrar um torneio sem TOP
          }
        })

        // Para streak atual, verificar os últimos torneios do mais recente para o mais antigo
        const recentResults = [...allResultsSorted].reverse()

        for (const result of recentResults) {
          if (result.placement !== null && result.placement <= TOP_POSITIONS) {
            currentStreak++
          } else {
            break
          }
        }

        if (participations > 0) {
          playerStatsMap.set(player.id, {
            id: player.id,
            name: player.name,
            image_url: null,
            totalTournaments: participations,
            participations,
            totalTops: tops,
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
        .sort((playerA, playerB) => playerB.totalTops - playerA.totalTops)
      
      // Preparar dados para evolução temporal
      const tournamentResults: TournamentResultForChart[] = results.map((result: any) => ({
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

      // Top jogadores com melhor % de TOPs (mínimo 1 TOP e 2 torneios)
      // Ordenados pela mesma lógica do ranking
      const topByPercentage = [...allPlayerStats]
        .filter(player => player.totalTops > 0 && player.participations >= 2)
        .sort(sortPlayersByPerformance)
      
      setBestPerformance(topByPercentage)

      // Distribuição de Colocações (apenas jogadores com TOPs)
      const placementMap = new Map<number, PlacementDistribution>()
      
      topByTops
        .filter(player => player.totalTops > 0) // Filtrar apenas jogadores com TOPs
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

      // ======= ESTATÍSTICAS DE DECKS =======
      
      // 1. Calcular uso de decks e performance
      const deckStatsMap = new Map<number, {
        deckId: number
        deckName: string
        deckImageUrl?: string
        totalUses: number
        primaryUses: number
        secondaryUses: number
        firstPlace: number
        secondPlace: number
        thirdPlace: number
        fourthPlace: number
      }>()

      results.forEach((result: any) => {
        // Processar deck principal
        if (result.deck_id && result.deck) {
          if (!deckStatsMap.has(result.deck_id)) {
            deckStatsMap.set(result.deck_id, {
              deckId: result.deck_id,
              deckName: result.deck.name,
              deckImageUrl: result.deck.image_url,
              totalUses: 0,
              primaryUses: 0,
              secondaryUses: 0,
              firstPlace: 0,
              secondPlace: 0,
              thirdPlace: 0,
              fourthPlace: 0
            })
          }

          const primaryStats = deckStatsMap.get(result.deck_id)!
          primaryStats.totalUses++
          primaryStats.primaryUses++
          
          if (result.placement === 1) primaryStats.firstPlace++
          else if (result.placement === 2) primaryStats.secondPlace++
          else if (result.placement === 3) primaryStats.thirdPlace++
          else if (result.placement === 4) primaryStats.fourthPlace++
        }

        // Processar deck secundário
        if (result.deck_id_secondary && result.deck_secondary) {
          if (!deckStatsMap.has(result.deck_id_secondary)) {
            deckStatsMap.set(result.deck_id_secondary, {
              deckId: result.deck_id_secondary,
              deckName: result.deck_secondary.name,
              deckImageUrl: result.deck_secondary.image_url,
              totalUses: 0,
              primaryUses: 0,
              secondaryUses: 0,
              firstPlace: 0,
              secondPlace: 0,
              thirdPlace: 0,
              fourthPlace: 0
            })
          }

          const secondaryStats = deckStatsMap.get(result.deck_id_secondary)!
          secondaryStats.totalUses++
          secondaryStats.secondaryUses++
          
          if (result.placement === 1) secondaryStats.firstPlace++
          else if (result.placement === 2) secondaryStats.secondPlace++
          else if (result.placement === 3) secondaryStats.thirdPlace++
          else if (result.placement === 4) secondaryStats.fourthPlace++
        }
      })

      const deckUsage = Array.from(deckStatsMap.values())
        .map(deck => ({
          ...deck,
          winRate: deck.totalUses > 0 ? (deck.firstPlace / deck.totalUses) * 100 : 0
        }))
        .sort((a, b) => b.totalUses - a.totalUses)

      setDeckUsageData(deckUsage)
      
      // Gerar cores para os decks (Top 10)
      const topDeckNames = deckUsage.slice(0, 10).map(d => d.deckName)
      const colors = generateColors(topDeckNames)
      const colorMap: Record<string, string> = {}
      topDeckNames.forEach((name, index) => {
        colorMap[name] = colors[index]
      })
      setDeckColors(colorMap)

    } catch (error) {
      logger.error(ERROR_MESSAGES.LOAD_STATS_ERROR, error)
    }
    setLoading(false)
  }, [supabase, appliedStartDate, appliedEndDate, appliedTournamentType])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleFilter = () => {
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
    setAppliedTournamentType(tournamentType)
  }

  const handleClearFilter = () => {
    setStartDate('')
    setEndDate('')
    setAppliedStartDate('')
    setAppliedEndDate('')
    setTournamentType('regular')
    setAppliedTournamentType('regular')
  }

  const isFiltered = appliedStartDate !== '' || appliedEndDate !== '' || appliedTournamentType !== 'all'

  return (
    <PageLayout activeRoute="/stats">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">📊 Gráficos e Análises</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Análise visual de desempenho e estatísticas de jogadores e decks
        </p>
      </div>

      {/* Filtros */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tournamentType">Tipo de Torneio</Label>
              <Select value={tournamentType} onValueChange={(value: any) => setTournamentType(value)}>
                <SelectTrigger id="tournamentType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">🏆 Veteranos</SelectItem>
                  <SelectItem value="beginner">🆕 Novatos</SelectItem>
                  <SelectItem value="all">📊 Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          
          {/* Indicador de tipo de torneio */}
          {appliedTournamentType !== 'all' && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {appliedTournamentType === 'regular' ? (
                  <>🏆 <strong>Visualizando:</strong> Apenas torneios de veteranos (exclui torneios de novatos)</>
                ) : (
                  <>🆕 <strong>Visualizando:</strong> Apenas torneios de novatos</>
                )}
              </p>
            </div>
          )}
          
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
        <Tabs defaultValue="players" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 p-2 h-auto bg-gray-100 dark:bg-gray-800">
            <TabsTrigger 
              value="players" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-gray-200 dark:data-[state=inactive]:hover:bg-gray-700 py-4 text-base font-semibold transition-all"
            >
              <span className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                <span>Estatísticas de Jogadores</span>
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="decks"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-gray-200 dark:data-[state=inactive]:hover:bg-gray-700 py-4 text-base font-semibold transition-all"
            >
              <span className="flex items-center gap-2">
                <PieChart className="h-6 w-6" />
                <span>Estatísticas de Decks</span>
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="space-y-8">
            <PlayerProfileChart 
              data={bestPerformance.map(p => ({
                name: p.name,
                participations: p.participations,
                tops: p.totalTops,
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
              data={bestPerformance.map(p => ({
                name: p.name,
                topPercentage: p.topPercentage,
                tops: p.totalTops,
                participations: p.participations
              }))} 
              colors={generateColors(bestPerformance.map(p => p.name))} 
              isFiltered={isFiltered}
              filteredCount={filteredTournaments}
              totalCount={totalTournaments}
            />
          </TabsContent>

          <TabsContent value="decks" className="space-y-8">
            {deckUsageData.length > 0 ? (
              <>
                <DeckUsageChart 
                  data={deckUsageData.filter(d => d.primaryUses > 0).sort((a, b) => b.primaryUses - a.primaryUses)} 
                  colors={deckColors}
                  title="🎯 Decks Principais"
                  isFiltered={isFiltered}
                  filteredCount={filteredTournaments}
                  totalCount={totalTournaments}
                />
                <DeckUsageChart 
                  data={deckUsageData.filter(d => d.secondaryUses > 0).sort((a, b) => b.secondaryUses - a.secondaryUses)} 
                  colors={deckColors}
                  title="🔧 Decks de Suporte"
                  isFiltered={isFiltered}
                  filteredCount={filteredTournaments}
                  totalCount={totalTournaments}
                />
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Nenhum dado de deck encontrado para o período selecionado.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Os decks precisam ser cadastrados nos torneios para aparecerem nas estatísticas.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </PageLayout>
  )
}
