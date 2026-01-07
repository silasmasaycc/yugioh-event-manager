'use client'

import { useMemo, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { FilterBadge } from './filter-badge'

// Paleta de cores distintas e vibrantes para melhor visualização
const DISTINCT_COLORS = [
  '#f97316', // Laranja
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#ef4444', // Vermelho
  '#8b5cf6', // Roxo
]

interface PlayerProfileStats {
  name: string
  participations: number
  tops: number
  topPercentage: number
  firstPlace: number
  secondPlace: number
  thirdPlace: number
  fourthPlace: number
  points: number
  currentStreak: number
  bestStreak: number
}

interface PlayerProfileChartProps {
  data: PlayerProfileStats[]
  colors: string[]
  isFiltered?: boolean
  filteredCount?: number
  totalCount?: number
}

// Calcula métricas normalizadas de 0-100 para cada jogador
const calculatePlayerProfile = (player: PlayerProfileStats, allPlayers: PlayerProfileStats[], totalTournaments: number) => {
  // Normalizar valores para 0-100
  const maxStreak = Math.max(...allPlayers.map(p => p.bestStreak || 0))
  
  // Calcular consistência baseada em taxa de performance e streak
  const streakScore = maxStreak > 0 ? ((player.bestStreak || 0) / maxStreak * 100) : 0
  const consistency = ((player.topPercentage + streakScore) / 2)
  
  // Calcular pico de performance (peso maior para 1º lugar)
  const totalPlacements = (player.tops || 0)
  const peakPerformance = totalPlacements > 0 ? (
    ((player.firstPlace || 0) * 4 + (player.secondPlace || 0) * 3 + (player.thirdPlace || 0) * 2 + (player.fourthPlace || 0) * 2) / 
    totalPlacements / 4 * 100
  ) : 0
  
  // Calcular pontuação relativa ao potencial máximo do jogador
  // Máximo possível = número de PARTICIPAÇÕES × 4 pontos
  const maxPossiblePoints = player.participations * 4
  const actualPoints = (player.points || 0)
  const scorePercentage = maxPossiblePoints > 0 ? (actualPoints / maxPossiblePoints) * 100 : 0
  
  return {
    'Taxa de Performance': Math.round(player.topPercentage),
    'Consistência': Math.round(consistency),
    'Experiência': Math.round(totalTournaments > 0 ? (player.participations / totalTournaments) * 100 : 0),
    'Pico': Math.round(peakPerformance),
    'Pontuação': Math.round(scorePercentage)
  }
}

export function PlayerProfileChart({ data, colors, isFiltered = false, filteredCount, totalCount }: PlayerProfileChartProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    new Set(data.slice(0, 3).map(p => p.name))
  )

  const togglePlayer = useCallback((playerName: string) => {
    setSelectedPlayers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(playerName)) {
        newSet.delete(playerName)
      } else {
        newSet.add(playerName)
      }
      return newSet
    })
  }, [])

  const chartData = useMemo(() => {
    // Criar estrutura de dados para o radar chart
    const metrics = ['Taxa de Performance', 'Consistência', 'Experiência', 'Pico', 'Pontuação']
    const tournamentsCount = isFiltered ? (filteredCount || 0) : (totalCount || 0)
    
    return metrics.map(metric => {
      const dataPoint: any = { metric }
      
      data.forEach(player => {
        if (selectedPlayers.has(player.name)) {
          const profile = calculatePlayerProfile(player, data, tournamentsCount)
          dataPoint[player.name] = profile[metric as keyof typeof profile]
        }
      })
      
      return dataPoint
    })
  }, [data, selectedPlayers, isFiltered, filteredCount, totalCount])

  const selectedPlayersList = useMemo(() => 
    data.filter(p => selectedPlayers.has(p.name)),
    [data, selectedPlayers]
  )

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isFiltered && '🔍 '}🎭 Perfil dos Jogadores</CardTitle>
          <p className="text-sm text-muted-foreground">Comparação multidimensional de desempenho (mínimo 1 TOP)</p>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">Nenhum dado disponível para o período selecionado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>🎭 Perfil dos Jogadores</CardTitle>
            <p className="text-sm text-muted-foreground">Comparação multidimensional de desempenho (mínimo 1 TOP)</p>
          </div>
          <FilterBadge isFiltered={isFiltered} filteredCount={filteredCount} totalCount={totalCount} />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={450}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border-2 border-gray-200 rounded-lg shadow-xl">
                      <p className="font-semibold text-sm mb-2">{payload[0].payload.metric}</p>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="font-medium">{entry.name}:</span>
                          <span className="font-bold">{entry.value}/100</span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            {selectedPlayersList.map((player, index) => {
              const playerIndex = data.findIndex(p => p.name === player.name)
              const colorIndex = playerIndex % DISTINCT_COLORS.length
              return (
                <Radar
                  key={player.name}
                  name={player.name}
                  dataKey={player.name}
                  stroke={DISTINCT_COLORS[colorIndex]}
                  fill={DISTINCT_COLORS[colorIndex]}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              )
            })}
            <Legend />
          </RadarChart>
        </ResponsiveContainer>

        {/* Descrição das métricas */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-base mb-4 text-gray-800 dark:text-gray-200">📊 Entendendo as Métricas (0-100):</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Coluna 1 */}
            <div className="space-y-4">
              {/* Taxa de Performance */}
              <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <strong className="text-purple-600 dark:text-purple-400 text-sm">Taxa de Performance</strong>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-5 leading-relaxed">
                  <strong>O que é:</strong> Percentual de aproveitamento direto - quantos % dos torneios você consegue TOP.<br/>
                  <strong>Cálculo:</strong> (Número de TOPs ÷ Total de Participações) × 100<br/>
                  <strong>Exemplo:</strong> 3 TOPs em 10 torneios = 30%
                </p>
              </div>

              {/* Consistência */}
              <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <strong className="text-blue-600 dark:text-blue-400 text-sm">Consistência</strong>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-5 leading-relaxed">
                  <strong>O que é:</strong> Mede a regularidade dos resultados, não apenas a taxa de performance.<br/>
                  <strong>Cálculo:</strong> (Taxa de Performance + Melhor Sequência Normalizada) ÷ 2<br/>
                  <strong>Interpreta:</strong> Alto = TOPs regulares • Baixo = resultados esporádicos
                </p>
              </div>

              {/* Experiência */}
              <div className="pb-3 border-b border-gray-200 dark:border-gray-700 md:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <strong className="text-green-600 dark:text-green-400 text-sm">Experiência</strong>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-5 leading-relaxed">
                  <strong>O que é:</strong> Percentual de presença nos torneios realizados.<br/>
                  <strong>Cálculo:</strong> (Suas Participações ÷ Total de Torneios) × 100<br/>
                  <strong>Exemplo:</strong> 8 participações de 20 torneios = (8÷20) × 100 = 40%<br/>
                  <strong>Interpreta:</strong> 100% = Presente em todos • 0-30% = Presença baixa
                </p>
              </div>
            </div>

            {/* Coluna 2 */}
            <div className="space-y-4">
              {/* Pico */}
              <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <strong className="text-orange-600 dark:text-orange-400 text-sm">Pico de Performance</strong>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-5 leading-relaxed">
                  <strong>O que é:</strong> Qualidade média das suas colocações, valorizando mais os 1º lugares.<br/>
                  <strong>Cálculo:</strong> [(1º×4 + 2º×3 + 3º×2 + 4º×2) ÷ Total TOPs ÷ 4] × 100<br/>
                  <strong>Exemplo:</strong> 2× 1º lugar + 1× 3º = (8+0+2+0) ÷ 3 ÷ 4 = 67%<br/>
                  <strong>Interpreta:</strong> Alto = Campeão frequente • Baixo = Apenas completa TOP4
                </p>
              </div>

              {/* Pontuação */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <strong className="text-red-600 dark:text-red-400 text-sm">Pontuação Total</strong>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-5 leading-relaxed">
                  <strong>O que é:</strong> Aproveitamento geral dos torneios em relação ao máximo possível.<br/>
                  <strong>Cálculo:</strong> (Pontos Conquistados ÷ (Participações × 4)) × 100<br/>
                  <strong>Exemplo:</strong> 6 participações, 6 pontos = (6 ÷ (6 × 4)) × 100 = (6 ÷ 24) × 100 = 25%<br/>
                  <strong>Interpreta:</strong> Mede o desempenho geral considerando todos os torneios, não só TOPs
                </p>
              </div>
            </div>
          </div>

          {/* Perfis Típicos */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-950/30 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
            <strong className="text-blue-700 dark:text-blue-300 text-xs block mb-2">💡 Perfis Típicos de Jogadores:</strong>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-700 dark:text-gray-300">
              <div>
                <strong className="text-yellow-600 dark:text-yellow-400">🌟 Novato Promissor:</strong> Alta taxa + Baixa experiência + Alto pico
              </div>
              <div>
                <strong className="text-purple-600 dark:text-purple-400">👑 Veterano Dominante:</strong> Todas métricas altas (pentágono grande e equilibrado)
              </div>
              <div>
                <strong className="text-gray-600 dark:text-gray-400">📚 Frequentador Casual:</strong> Alta experiência + Baixas taxa e pico
              </div>
              <div>
                <strong className="text-orange-600 dark:text-orange-400">🎲 Imprevisível:</strong> Alto pico + Baixa consistência (TOPs esporádicos)
              </div>
            </div>
          </div>
        </div>

        {/* Seletor de jogadores */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Selecione os jogadores para comparar (máximo recomendado: 5):
          </p>
          <div className="flex flex-wrap gap-2">
            {data.map((player, index) => {
              const isSelected = selectedPlayers.has(player.name)
              const colorIndex = index % DISTINCT_COLORS.length
              const color = DISTINCT_COLORS[colorIndex]
              return (
                <button
                  key={index}
                  onClick={() => togglePlayer(player.name)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-purple-300'
                  }`}
                  style={isSelected ? { 
                    borderColor: color,
                    backgroundColor: `${color}20`
                  } : {}}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ 
                        backgroundColor: isSelected ? color : '#d1d5db'
                      }}
                    />
                    {player.name}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Insights */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
            💡 <span className="font-semibold">Dica:</span> O gráfico radar revela diferentes "perfis" de jogadores. 
            Um pentágono equilibrado indica jogador completo. Pontas pronunciadas mostram especializações: 
            alta experiência com baixo pico = "veterano casual", alta taxa com baixa experiência = "talento nato", etc.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
