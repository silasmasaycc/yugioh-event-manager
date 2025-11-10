'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Medal, AlertTriangle } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PlayerStats } from '@/lib/types'

interface PenaltyPlayerStats {
  id: number
  name: string
  image_url: string | null
  totalPenalties: number
  totalTournaments: number
  penaltyRate: number
}

export default function RankingPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [penaltyStats, setPenaltyStats] = useState<PenaltyPlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Get all players with their tournament results
    const { data: players } = await supabase
      .from('players')
      .select(`
        id,
        name,
        image_url,
        tournament_results(placement, tournament_id)
      `)

    // Get penalties
    const { data: penalties } = await supabase
      .from('penalties')
      .select('player_id')

    // Calculate statistics for each player
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

    // Sort by performance
    stats.sort((a, b) => {
      if (b.firstPlace !== a.firstPlace) return b.firstPlace - a.firstPlace
      if (b.secondPlace !== a.secondPlace) return b.secondPlace - a.secondPlace
      if (b.thirdPlace !== a.thirdPlace) return b.thirdPlace - a.thirdPlace
      if (b.fourthPlace !== a.fourthPlace) return b.fourthPlace - a.fourthPlace
      if (b.totalTops !== a.totalTops) return b.totalTops - a.totalTops
      return b.totalTournaments - a.totalTournaments
    })

    // Calculate penalty statistics
    const penaltyMap = new Map<number, number>()
    penalties?.forEach((p: any) => {
      penaltyMap.set(p.player_id, (penaltyMap.get(p.player_id) || 0) + 1)
    })

    const penaltyStatsArray: PenaltyPlayerStats[] = (players || [])
      .map(player => {
        const results = Array.isArray(player.tournament_results) ? player.tournament_results : []
        const totalTournaments = results.length
        const totalPenalties = penaltyMap.get(player.id) || 0
        const penaltyRate = totalTournaments > 0 ? (totalPenalties / totalTournaments) * 100 : 0

        return {
          id: player.id,
          name: player.name,
          image_url: player.image_url,
          totalPenalties,
          totalTournaments,
          penaltyRate
        }
      })
      .filter(p => p.totalPenalties > 0) // Only players with penalties
      .sort((a, b) => {
        if (b.totalPenalties !== a.totalPenalties) return b.totalPenalties - a.totalPenalties
        return b.penaltyRate - a.penaltyRate
      })

    setPlayerStats(stats)
    setPenaltyStats(penaltyStatsArray)
    setLoading(false)
  }

  const getMedalColor = (position: number) => {
    if (position === 0) return 'text-yellow-500'
    if (position === 1) return 'text-gray-400'
    if (position === 2) return 'text-amber-600'
    return 'text-gray-300'
  }

  return (
    <PageLayout activeRoute="/ranking">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">Rankings</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Classificações e estatísticas dos jogadores
        </p>
      </div>

      <Tabs defaultValue="best" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="best">🏆 Melhores</TabsTrigger>
          <TabsTrigger value="penalties">⚠️ Penalizados</TabsTrigger>
        </TabsList>

        <TabsContent value="best" className="space-y-4">
          {playerStats.map((player, index) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {/* Linha 1: Medalha + Foto + Nome */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className={`text-4xl font-bold ${getMedalColor(index)} min-w-[3rem] shrink-0 text-center`}>
                      {index < 3 ? <Medal className="h-12 w-12 mx-auto" /> : `#${index + 1}`}
                    </div>

                    <div className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
                      {player.image_url ? (
                        <Image
                          src={player.image_url}
                          alt={player.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-purple-600">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold mb-1 truncate">{player.name}</h3>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span>{player.totalTournaments} torneios</span>
                        <span>{player.totalTops} TOPs</span>
                        <span className="font-semibold text-purple-600">
                          {player.topPercentage.toFixed(1)}% aproveitamento
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grid de Medalhas */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center w-full sm:w-auto sm:ml-auto">
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-yellow-500">{player.firstPlace}</div>
                      <div className="text-xs text-muted-foreground">1º</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-400">{player.secondPlace}</div>
                      <div className="text-xs text-muted-foreground">2º</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-amber-600">{player.thirdPlace}</div>
                      <div className="text-xs text-muted-foreground">3º</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold">{player.fourthPlace}</div>
                      <div className="text-xs text-muted-foreground">4º</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {playerStats.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Nenhum jogador com resultados ainda.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="penalties" className="space-y-4">
          {penaltyStats.map((player, index) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow border-red-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {/* Linha 1: Posição + Foto + Nome */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="text-4xl font-bold text-red-600 min-w-[3rem] shrink-0 text-center">
                      {index < 3 ? <AlertTriangle className="h-12 w-12 mx-auto" /> : `#${index + 1}`}
                    </div>

                    <div className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900">
                      {player.image_url ? (
                        <Image
                          src={player.image_url}
                          alt={player.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-red-600">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold mb-1 truncate">{player.name}</h3>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span>{player.totalTournaments} torneios</span>
                        <span className="font-semibold text-red-600">
                          {player.totalPenalties} Double Loss{player.totalPenalties > 1 ? 'es' : ''}
                        </span>
                        <span className="text-red-500">
                          {player.penaltyRate.toFixed(1)}% penalização
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas de Penalidades */}
                  <div className="grid grid-cols-2 gap-4 sm:gap-8 text-center w-full sm:w-auto sm:ml-auto">
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-red-600">⚠️</div>
                      <div className="text-xl sm:text-2xl font-bold text-red-600 mt-1">{player.totalPenalties}</div>
                      <div className="text-xs text-muted-foreground">Double Loss</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-500">📊</div>
                      <div className="text-xl sm:text-2xl font-bold text-red-500 mt-1">{player.penaltyRate.toFixed(0)}%</div>
                      <div className="text-xs text-muted-foreground">Taxa</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {penaltyStats.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Nenhum jogador com penalidades registradas.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
