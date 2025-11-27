'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageLayout } from '@/components/layout/page-layout'
import { usePlayerStats, usePenaltyStats } from '@/lib/hooks/use-player-stats'
import { PositionBadge } from '@/components/utils/position-badge'
import { RankingSkeleton, PenaltySkeleton } from '@/components/loading'
import { PlayerAvatar } from '@/components/player/player-avatar'
import { calculatePlayerScore } from '@/lib/utils/player-stats'
import { Info, Trophy, Award, TrendingUp } from 'lucide-react'
import { MEDAL_ICONS } from '@/lib/constants'

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
          <TabsTrigger value="penalties">⚠️ Double Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="best" className="space-y-6">
          {/* Caixa de Legenda - Critérios de Ranking */}
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <Info className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2">
                    📊 Como funciona o Ranking
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    Os jogadores são classificados usando critérios objetivos e justos:
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Sistema de Pontos */}
                <div className="bg-white/70 dark:bg-gray-900/70 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    1️⃣ Sistema de Pontos
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{MEDAL_ICONS[1]} 1º lugar:</span>
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">4 pontos</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">{MEDAL_ICONS[2]} 2º lugar:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">3 pontos</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600 dark:text-orange-400 font-semibold">{MEDAL_ICONS[3]} 3º lugar:</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">2 pontos</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{MEDAL_ICONS[4]} 4º lugar:</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">2 pontos</span>
                    </div>
                  </div>
                </div>

                {/* Critérios de Desempate */}
                <div className="bg-white/70 dark:bg-gray-900/70 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Critérios de Desempate
                  </h4>
                  <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
                    <li><strong>Pontuação total</strong> (soma dos pontos)</li>
                    <li><strong>Quantidade de TOPs</strong> (1º ao 4º)</li>
                    <li><strong>Porcentagem</strong> (aproveitamento)</li>
                  </ol>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 mb-1 font-semibold">Para jogadores sem TOPs:</p>
                  <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside" start={4}>
                    <li><strong>Participações</strong> (dedicação)</li>
                    <li><strong>Ordem alfabética</strong></li>
                  </ol>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-300 dark:border-blue-700">
                <p className="text-sm text-blue-900 dark:text-blue-200 flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Dica:</strong> Um jogador com múltiplos TOPs pode superar outro com menos TOPs mas melhor colocação, 
                    promovendo consistência e participação regular.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Jogadores */}
          {loadingPlayers ? (
            <RankingSkeleton count={5} />
          ) : (
            <>
              {playerStats.map((player, index) => {
                const playerScore = calculatePlayerScore(player)
                return (
            <Card key={player.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {/* Medalha + Avatar + Nome */}
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
                      <div className="text-xs text-muted-foreground">
                        {player.totalTournaments} {player.totalTournaments === 1 ? 'torneio' : 'torneios'}
                      </div>
                    </div>
                  </div>

                  {/* Métricas Principais */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full sm:w-auto">
                    {/* Pontuação */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {playerScore}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pontos</div>
                    </div>

                    {/* TOPs */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {player.totalTops}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">TOPs</div>
                    </div>

                    {/* Porcentagem */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                        {player.topPercentage.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Taxa</div>
                    </div>
                  </div>
                </div>

                {/* Detalhamento de Posições (colapsável em mobile) */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex gap-4">
                      <span className="text-gray-600 dark:text-gray-400">
                        {MEDAL_ICONS[1]} <strong className="text-yellow-600">{player.firstPlace}</strong>
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {MEDAL_ICONS[2]} <strong className="text-gray-500">{player.secondPlace}</strong>
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {MEDAL_ICONS[3]} <strong className="text-amber-600">{player.thirdPlace}</strong>
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {MEDAL_ICONS[4]} <strong>{player.fourthPlace}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
                )
              })}

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

        <TabsContent value="penalties" className="space-y-6">
          {/* Caixa de Legenda - Double Loss */}
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-2 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <Info className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
                    ⚠️ Sistema de Double Loss
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    Jogadores recebem Double Loss quando não completam partidas no tempo regulamentar.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* O que é Double Loss */}
                <div className="bg-white/70 dark:bg-gray-900/70 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <h4 className="font-bold text-red-800 dark:text-red-300 mb-3">
                    📋 O que é Double Loss?
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Penalidade aplicada quando uma partida não é concluída no tempo de <strong>50 minutos</strong>. 
                    Ambos os jogadores recebem derrota automática.
                  </p>
                </div>

                {/* Critérios de Ranqueamento */}
                <div className="bg-white/70 dark:bg-gray-900/70 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <h4 className="font-bold text-red-800 dark:text-red-300 mb-3">
                    🎯 Ordem de Classificação
                  </h4>
                  <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
                    <li><strong>Maior número de Double Loss</strong></li>
                    <li><strong>Taxa de Double Loss</strong> (%)</li>
                    <li><strong>Menos participações</strong></li>
                  </ol>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700">
                <p className="text-sm text-yellow-900 dark:text-yellow-200">
                  <strong>⏱️ Importante:</strong> Gerencie bem o tempo das partidas para evitar Double Loss. 
                  Esta penalidade prejudica o desempenho geral no ranking.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Penalizados */}
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
                    Nenhum jogador com Double Loss registrado.
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
