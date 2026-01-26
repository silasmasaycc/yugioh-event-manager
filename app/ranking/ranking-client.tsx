'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { PageLayout } from '@/components/layout/page-layout'
import { BestPlayersRanking } from './best-players-ranking'
import { PenaltyRanking } from './penalty-ranking'
import { Info, Trophy, Award, Download, Loader2, List, ArrowRight } from 'lucide-react'
import { MEDAL_ICONS } from '@/lib/constants'
import { exportRankingAsImage, exportTierListAsImage } from '@/lib/export-utils'

interface RankingClientProps {
  players: any[]
  penaltyStats: any[]
  tierSlots: { S: number; A: number; B: number }
  avgPoints: number
  isBeginnerRanking?: boolean
}

export function RankingClient({ players, penaltyStats, isBeginnerRanking = false }: RankingClientProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingTiers, setIsExportingTiers] = useState(false)

  // Calcular estatísticas gerais
  const stats = useMemo(() => {
    // Média do top 10
    const top10Players = players.slice(0, 10)
    const top10Average = top10Players.length > 0
      ? Math.ceil(top10Players.reduce((sum, p) => sum + p.points, 0) / top10Players.length)
      : 0
    
    // Total de jogadores ativos (participaram de pelo menos 1 torneio)
    const activePlayers = players.filter(p => p.totalTournaments > 0).length

    return {
      total: activePlayers,
      top10Average
    }
  }, [players])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Preparar dados para exportação
      const exportData = {
        players: players.map((p, index) => ({
          name: p.name,
          points: p.points,
          tier: p.tier,
          position: index + 1,
          totalTops: p.totalTops
        })),
        penaltyStats: penaltyStats.map(p => ({
          name: p.name,
          totalPenalties: p.totalPenalties,
          penaltyRate: p.penaltyRate,
          totalTournaments: p.totalTournaments
        })),
        totalPlayers: stats.total,
        top10Average: stats.top10Average
      }
      
      await exportRankingAsImage(exportData, 'ranking-completo')
    } catch (error) {
      console.error('Erro ao exportar:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportTiers = async () => {
    setIsExportingTiers(true)
    try {
      const exportData = {
        players: players.map((p, index) => ({
          name: p.name,
          points: p.points,
          tier: p.tier,
          position: index + 1,
          totalTops: p.totalTops
        })),
        totalPlayers: stats.total,
        top10Average: stats.top10Average
      }
      
      await exportTierListAsImage(exportData, 'tier-list')
    } catch (error) {
      console.error('Erro ao exportar tier list:', error)
    } finally {
      setIsExportingTiers(false)
    }
  }

  return (
    <PageLayout activeRoute="/ranking">      
      <div className="mb-8">
        <div className="flex flex-col gap-4">
          {/* Header com título e botão de alternar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="inline-flex items-center gap-3 mb-3">
                <span className="text-4xl">{isBeginnerRanking ? '🆕' : '🏆'}</span>
                <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent pb-1">
                  {isBeginnerRanking ? 'Ranking de Novatos' : 'Ranking Veteranos'}
                </h1>
              </div>
              <p className="text-base text-gray-600 dark:text-gray-300">
                {isBeginnerRanking 
                  ? 'Classificações dos torneios para jogadores iniciantes'
                  : 'Classificações e estatísticas dos jogadores veteranos'
                }
              </p>
            </div>
            
            {/* Botão de alternar ranking - destaque */}
            <Link href={isBeginnerRanking ? '/ranking' : '/ranking/beginners'} className="shrink-0">
              <Button 
                size="lg"
                className={`gap-2 w-full sm:w-auto ${
                  isBeginnerRanking 
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700' 
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                }`}
              >
                {isBeginnerRanking ? '🏆 Ver Ranking Veteranos' : '🆕 Ver Ranking Novatos'}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Botões de exportação */}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              onClick={handleExportTiers}
              disabled={isExportingTiers}
              variant="outline"
              className="gap-2"
              size="default"
            >
              {isExportingTiers ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <List className="h-4 w-4" />
                  Exportar Tiers
                </>
              )}
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="outline"
              className="gap-2"
              size="default"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exportar Ranking
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="best" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="best">🏆 Ranking Geral</TabsTrigger>
          <TabsTrigger value="penalties">⚠️ Double Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="best" className="space-y-6">
          {/* Caixa de Legenda - Critérios de Ranking */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Info className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xl font-bold">Como funciona o Ranking</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Sistema de Pontos */}
                <div>
                  <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Sistema de Pontos
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded bg-yellow-50 dark:bg-yellow-950/20">
                      <span className="font-medium">{MEDAL_ICONS[1]} 1º lugar</span>
                      <span className="font-bold text-lg">4 pts</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-gray-50 dark:bg-gray-800/50">
                      <span className="font-medium">{MEDAL_ICONS[2]} 2º lugar</span>
                      <span className="font-bold text-lg">3 pts</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-orange-50 dark:bg-orange-950/20">
                      <span className="font-medium">{MEDAL_ICONS[3]} 3º lugar</span>
                      <span className="font-bold text-lg">2 pts</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-cyan-50 dark:bg-cyan-950/20">
                      <span className="font-medium">{MEDAL_ICONS[4]} 4º lugar</span>
                      <span className="font-bold text-lg">2 pts</span>
                    </div>
                  </div>
                </div>

                {/* Critérios de Desempate */}
                <div>
                  <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Critérios de Desempate
                  </h4>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm font-bold text-purple-700 dark:text-purple-300">1</span>
                      <span className="text-sm leading-relaxed">Pontuação total</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm font-bold text-purple-700 dark:text-purple-300">2</span>
                      <span className="text-sm leading-relaxed">Quantidade de TOPs (1º ao 4º)</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm font-bold text-purple-700 dark:text-purple-300">3</span>
                      <span className="text-sm leading-relaxed">Porcentagem de aproveitamento</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm font-bold text-purple-700 dark:text-purple-300">4</span>
                      <span className="text-sm leading-relaxed">Qualidade das colocações</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm font-bold text-purple-700 dark:text-purple-300">5</span>
                      <span className="text-sm leading-relaxed">Menor quantidade de Double Loss</span>
                    </div>
                    <div className="pt-2 border-t dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Para jogadores sem TOPs:</p>
                      <div className="space-y-2">
                        <div className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">6</span>
                          <span className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">Participações</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">7</span>
                          <span className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">Ordem alfabética</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Jogadores */}
          <BestPlayersRanking players={players} />
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
          <PenaltyRanking penaltyStats={penaltyStats} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
