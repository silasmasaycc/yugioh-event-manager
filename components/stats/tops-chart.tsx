'use client'

import { useMemo, useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { formatDateShort } from '@/lib/utils'
import { FilterBadge } from './filter-badge'

interface TournamentResult {
  date: string
  tournamentId: number
  playerId: number
  playerName: string
  placement: number | null
}

interface PlayerTrendData {
  name: string
  color: string
  data: { date: string; points: number; total: number }[]
}

interface PointsEvolutionChartProps {
  tournaments: { id: number; date: string }[]
  results: TournamentResult[]
  topPlayers: string[]
  colors: string[]
  isFiltered?: boolean
  filteredCount?: number
  totalCount?: number
}

// Função para calcular pontos por colocação
const getPointsByPlacement = (placement: number | null): number => {
  if (placement === null) return 0
  if (placement === 1) return 4
  if (placement === 2) return 3
  if (placement === 3 || placement === 4) return 2
  return 0
}

export function TopsEvolutionChart({ tournaments, results, topPlayers, colors, isFiltered = false, filteredCount, totalCount }: PointsEvolutionChartProps) {
  const [hiddenPlayers, setHiddenPlayers] = useState<Set<string>>(new Set())

  // Calcular pontos totais por jogador
  const totalPointsData = useMemo(() => {
    if (!tournaments || !results || tournaments.length === 0) return []

    // Calcular pontos totais para cada jogador
    const playerPointsMap = new Map<string, number>()

    topPlayers.forEach(playerName => {
      const playerResults = results.filter(r => r.playerName === playerName)
      const totalPoints = playerResults.reduce((sum, result) => {
        return sum + getPointsByPlacement(result.placement)
      }, 0)
      
      if (totalPoints > 0) {
        playerPointsMap.set(playerName, totalPoints)
      }
    })

    // Converter para array e ordenar por pontos (maior para menor)
    return Array.from(playerPointsMap.entries())
      .map(([name, points]) => ({ name, points }))
      .sort((a, b) => b.points - a.points)
  }, [tournaments, results, topPlayers])

  const filteredData = useMemo(() => 
    totalPointsData.filter(player => !hiddenPlayers.has(player.name)),
    [totalPointsData, hiddenPlayers]
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

  // Função para obter cor de cada barra
  const getPlayerColor = useCallback((playerName: string) => {
    const playerIndex = topPlayers.indexOf(playerName)
    return colors[playerIndex % colors.length]
  }, [topPlayers, colors])

  if (totalPointsData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isFiltered && '🔍 '}📊 Comparação de Pontuação Total</CardTitle>
          <p className="text-sm text-muted-foreground">Compare os pontos acumulados de todos os jogadores</p>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>📊 Comparação de Pontuação Total</CardTitle>
            <p className="text-sm text-muted-foreground">Compare os pontos acumulados de todos os jogadores em todos os torneios</p>
          </div>
          <FilterBadge isFiltered={isFiltered} filteredCount={filteredCount} totalCount={totalCount} />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={filteredData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              label={{ value: 'Pontos Totais', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 border-2 border-gray-200 rounded-lg shadow-xl">
                      <p className="font-bold text-base mb-2">{data.name}</p>
                      <p className="text-sm">
                        <span className="font-semibold">Total:</span>{' '}
                        <span className="font-bold text-lg" style={{ color: payload[0].color }}>
                          {data.points}
                        </span>{' '}
                        ponto{data.points !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar 
              dataKey="points" 
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={getPlayerColor(entry.name)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legenda/Botões de toggle */}
        <div className="flex flex-wrap gap-3 justify-center mt-6 pt-4 border-t">
          {totalPointsData.map((player) => {
            const isHidden = hiddenPlayers.has(player.name)
            
            return (
              <button
                key={player.name}
                onClick={() => togglePlayer(player.name)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-100 ${
                  isHidden ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getPlayerColor(player.name) }}
                />
                <span className="text-sm font-medium">
                  {player.name}: {player.points} ponto{player.points !== 1 ? 's' : ''}
                </span>
              </button>
            )
          })}
        </div>

        {/* Insights */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            💡 <span className="font-semibold">Sistema de Pontos:</span> 1º lugar = 4pts, 2º lugar = 3pts, 3º/4º lugar = 2pts cada. 
            As barras mostram a pontuação total acumulada em todos os torneios registrados.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
