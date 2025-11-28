'use client'

import { useMemo, useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { FilterBadge } from './filter-badge'

interface TournamentResult {
  date: string
  tournamentId: number
  playerId: number
  playerName: string
  placement: number | null
}

interface ImprovementData {
  name: string
  initialPerformance: number
  recentPerformance: number
  improvement: number
  trend: 'improving' | 'stable' | 'declining'
}

interface ImprovementChartProps {
  tournaments: { id: number; date: string }[]
  results: TournamentResult[]
  topPlayers: string[]
  colors: string[]
  isFiltered?: boolean
  filteredCount?: number
  totalCount?: number
}

export function ImprovementChart({ tournaments, results, topPlayers, colors, isFiltered = false, filteredCount, totalCount }: ImprovementChartProps) {
  const [hiddenPlayers, setHiddenPlayers] = useState<Set<string>>(new Set())

  // Calcular taxa de melhoria
  const improvementData = useMemo(() => {
    if (!tournaments || !results || tournaments.length < 3) return []

    const sortedTournaments = [...tournaments].sort((a, b) => 
      new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime()
    )

    return topPlayers.map(playerName => {
      // Filtrar apenas torneios que o jogador participou
      const playerTournaments = sortedTournaments.filter(tournament =>
        results.some(r => r.tournamentId === tournament.id && r.playerName === playerName)
      )

      // Verificar se o jogador tem pelo menos 2 participações
      if (playerTournaments.length < 2) {
        return null
      }

      // Dividir torneios do jogador em dois períodos
      const totalTournaments = playerTournaments.length
      
      // Calcular tamanho dos períodos
      // Para números ímpares, o período recente terá 1 torneio a mais
      // Exemplos:
      // 2 torneios: inicial=1, recente=1
      // 3 torneios: inicial=1, recente=2
      // 5 torneios: inicial=2, recente=3
      // 7 torneios: inicial=3, recente=4
      // 8 torneios: inicial=4, recente=4
      const initialPeriodSize = Math.floor(totalTournaments / 2)
      const recentPeriodSize = Math.ceil(totalTournaments / 2)
      
      const initialPeriod = playerTournaments.slice(0, initialPeriodSize)
      const recentPeriod = playerTournaments.slice(-recentPeriodSize)

      // Calcular performance no período inicial (apenas torneios do jogador)
      const initialResults = results.filter(r => 
        initialPeriod.some(t => t.id === r.tournamentId) && 
        r.playerName === playerName
      )
      const initialTops = initialResults.filter(r => r.placement !== null && r.placement <= 4).length
      const initialParticipations = initialResults.length
      const initialPerformance = initialParticipations > 0 
        ? (initialTops / initialParticipations) * 100 
        : 0

      // Calcular performance no período recente (apenas torneios do jogador)
      const recentResults = results.filter(r => 
        recentPeriod.some(t => t.id === r.tournamentId) && 
        r.playerName === playerName
      )
      const recentTops = recentResults.filter(r => r.placement !== null && r.placement <= 4).length
      const recentParticipations = recentResults.length
      const recentPerformance = recentParticipations > 0 
        ? (recentTops / recentParticipations) * 100 
        : 0

      // Calcular melhoria
      const improvement = recentPerformance - initialPerformance

      // Determinar tendência
      let trend: 'improving' | 'stable' | 'declining'
      if (improvement > 10) trend = 'improving'
      else if (improvement < -10) trend = 'declining'
      else trend = 'stable'

      return {
        name: playerName,
        initialPerformance: Math.round(initialPerformance * 10) / 10,
        recentPerformance: Math.round(recentPerformance * 10) / 10,
        improvement: Math.round(improvement * 10) / 10,
        trend,
        // Dados adicionais para tooltip
        initialData: { tops: initialTops, participations: initialParticipations },
        recentData: { tops: recentTops, participations: recentParticipations },
        totalParticipations: playerTournaments.length
      }
    })
    .filter((data): data is NonNullable<typeof data> => 
      data !== null // Incluir todos os jogadores com dados válidos
    )
    .sort((a, b) => b.improvement - a.improvement)
  }, [tournaments, results, topPlayers])

  const filteredData = useMemo(() =>
    improvementData.filter(player => !hiddenPlayers.has(player.name)),
    [improvementData, hiddenPlayers]
  )

  const togglePlayer = useCallback((playerName: string) => {
    setHiddenPlayers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(playerName)) {
        newSet.delete(playerName)
      } else {
        newSet.add(playerName)
      }
      return newSet
    })
  }, [])

  const getColorByTrend = (trend: string): string => {
    if (trend === 'improving') return '#10b981' // Verde
    if (trend === 'declining') return '#ef4444' // Vermelho
    return '#f59e0b' // Amarelo (estável)
  }

  if (improvementData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isFiltered && '🔍 '}📈 Taxa de Melhoria</CardTitle>
          <p className="text-sm text-muted-foreground">Evolução do desempenho: período inicial vs período recente</p>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            Dados insuficientes. Cada jogador precisa ter participado de pelo menos 2 torneios.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>📈 Taxa de Melhoria</CardTitle>
            <p className="text-sm text-muted-foreground">
              Compara a primeira metade dos torneios com a segunda metade (mínimo: 2 torneios)
            </p>
          </div>
          <FilterBadge isFiltered={isFiltered} filteredCount={filteredCount} totalCount={totalCount} />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={filteredData} 
            layout="vertical"
            margin={{ top: 5, right: 80, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number"
              domain={[-100, 100]}
              tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ImprovementData & { 
                    initialData: { tops: number, participations: number },
                    recentData: { tops: number, participations: number },
                    totalParticipations: number
                  }
                  
                  return (
                    <div className="bg-white p-4 border rounded shadow-lg">
                      <p className="font-semibold text-sm mb-1">{data.name}</p>
                      <p className="text-xs text-gray-500 mb-3">
                        Total: {data.totalParticipations} torneio{data.totalParticipations !== 1 ? 's' : ''}
                      </p>
                      
                      <div className="space-y-3">
                        {/* Período Inicial */}
                        <div className="pb-2 border-b">
                          <p className="text-xs text-gray-500 mb-1">📅 Período Inicial</p>
                          <p className="text-lg font-bold text-gray-700">{data.initialPerformance}%</p>
                          <p className="text-xs text-gray-600">
                            {data.initialData.tops} TOP{data.initialData.tops !== 1 ? 'S' : ''} em {data.initialData.participations} torneio{data.initialData.participations !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Período Recente */}
                        <div className="pb-2 border-b">
                          <p className="text-xs text-gray-500 mb-1">⚡ Período Recente</p>
                          <p className="text-lg font-bold text-blue-600">{data.recentPerformance}%</p>
                          <p className="text-xs text-gray-600">
                            {data.recentData.tops} TOP{data.recentData.tops !== 1 ? 'S' : ''} em {data.recentData.participations} torneio{data.recentData.participations !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Melhoria */}
                        <div className="p-2 rounded" style={{ 
                          backgroundColor: data.trend === 'improving' ? '#d1fae5' : 
                                         data.trend === 'declining' ? '#fee2e2' : '#fef3c7'
                        }}>
                          <p className="text-xs font-semibold mb-1">
                            {data.trend === 'improving' && '📈 Melhorando!'}
                            {data.trend === 'declining' && '📉 Em queda'}
                            {data.trend === 'stable' && '➡️ Estável'}
                          </p>
                          <p className="text-2xl font-bold" style={{ 
                            color: getColorByTrend(data.trend)
                          }}>
                            {data.improvement > 0 ? '+' : ''}{data.improvement}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar 
              dataKey="improvement" 
              radius={[0, 8, 8, 0]}
              animationDuration={1000}
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={getColorByTrend(entry.trend)}
                  style={{ 
                    transition: 'all 300ms ease-in-out',
                    cursor: 'pointer',
                    opacity: 0.9
                  }}
                />
              ))}
              <LabelList 
                dataKey="improvement"
                position="right"
                content={(props: any) => {
                  const { x, y, width, value, index } = props
                  if (index === undefined || !filteredData[index]) return null
                  
                  return (
                    <text
                      x={x + width + 5}
                      y={y + 10}
                      fill="#374151"
                      fontSize="12"
                      fontWeight="600"
                    >
                      {value > 0 ? '+' : ''}{value}%
                    </text>
                  )
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legenda */}
        <div className="flex justify-center gap-6 mt-6 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
            <span className="text-gray-600">Melhorando (&gt;+10%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
            <span className="text-gray-600">Estável (-10% a +10%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-gray-600">Em queda (&lt;-10%)</span>
          </div>
        </div>

        {/* Botões de toggle */}
        <div className="flex flex-wrap gap-3 justify-center mt-4 pt-4 border-t">
          {improvementData.map((player, index) => {
            const isHidden = hiddenPlayers.has(player.name)
            return (
              <button
                key={index}
                onClick={() => togglePlayer(player.name)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-100 ${
                  isHidden ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getColorByTrend(player.trend) }}
                />
                <span className="text-sm font-medium">
                  {player.name}: {player.improvement > 0 ? '+' : ''}{player.improvement}%
                </span>
              </button>
            )
          })}
        </div>

        {/* Insights */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-800">
            📈 <span className="font-semibold">Como funciona:</span> O gráfico divide os torneios de cada jogador em duas metades (primeira metade vs segunda metade) 
            e compara a taxa de TOPs entre elas. Valores positivos (+) indicam que o jogador melhorou seu desempenho ao longo do tempo. 
            Valores negativos (-) indicam queda de performance. Requer mínimo de 2 torneios por jogador.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
