'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageLayout } from '@/components/layout/page-layout'
import { usePlayerStats, usePenaltyStats } from '@/lib/hooks/use-player-stats'
import { PositionBadge } from '@/components/utils/position-badge'
import { RankingSkeleton, PenaltySkeleton } from '@/components/loading'
import { PlayerAvatar } from '@/components/player/player-avatar'

export default function RankingPage() {
  const { playerStats, loading: loadingPlayers } = usePlayerStats()
  const { penaltyStats, loading: loadingPenalties } = usePenaltyStats()

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
          {loadingPlayers ? (
            <RankingSkeleton count={5} />
          ) : (
            <>
              {playerStats.map((player, index) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {/* Linha 1: Medalha + Foto + Nome */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <PositionBadge 
                      position={index + 1} 
                      variant="medal" 
                      size="md"
                    />

                    <PlayerAvatar
                      imageUrl={player.image_url}
                      playerName={player.name}
                      size="lg"
                    />

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
            </>
          )}
        </TabsContent>

        <TabsContent value="penalties" className="space-y-4">
          {loadingPenalties ? (
            <PenaltySkeleton count={3} />
          ) : (
            <>
              {penaltyStats.map((player, index) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow border-red-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {/* Linha 1: Posição + Foto + Nome */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="text-4xl font-bold text-red-600 min-w-[3rem] shrink-0 text-center">
                      #{index + 1}
                    </div>

                    <PlayerAvatar
                      imageUrl={player.image_url}
                      playerName={player.name}
                      size="lg"
                    />

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
            </>
          )}
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
