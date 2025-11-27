'use client'

import { useMemo, useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatDateShort } from '@/lib/utils'

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
}

// Função para calcular pontos por colocação
const getPointsByPlacement = (placement: number | null): number => {
  if (placement === null) return 0
  if (placement === 1) return 4
  if (placement === 2) return 3
  if (placement === 3 || placement === 4) return 2
  return 0
}

export function TopsEvolutionChart({ tournaments, results, topPlayers, colors }: PointsEvolutionChartProps) {
  const [hiddenPlayers, setHiddenPlayers] = useState<Set<string>>(new Set())

  // Processar dados para evolução temporal de pontos (últimos 30 dias)
  const evolutionData = useMemo(() => {
    if (!tournaments || !results || tournaments.length === 0) return []

    // Calcular data limite (30 dias atrás)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Filtrar torneios dos últimos 30 dias
    const recentTournaments = tournaments
      .filter(tournament => {
        const tournamentDate = new Date(tournament.date + 'T00:00:00')
        return tournamentDate >= thirtyDaysAgo && tournamentDate <= now
      })
      .sort((a, b) => 
        new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime()
      )

    if (recentTournaments.length === 0) return []

    // Criar mapa acumulativo de pontos por jogador
    const playerPointsMap = new Map<string, number[]>()

    recentTournaments.forEach((tournament) => {
      const tournamentResults = results.filter(r => r.tournamentId === tournament.id)
      
      topPlayers.forEach(playerName => {
        if (!playerPointsMap.has(playerName)) {
          playerPointsMap.set(playerName, [])
        }

        const playerData = playerPointsMap.get(playerName)!
        const previousPoints = playerData.length > 0 ? playerData[playerData.length - 1] : 0
        
        const playerResult = tournamentResults.find(r => r.playerName === playerName)
        const points = getPointsByPlacement(playerResult?.placement ?? null)
        
        playerData.push(previousPoints + points)
      })
    })

    // Transformar em formato para o gráfico
    return recentTournaments.map((tournament, index) => {
      const dataPoint: any = {
        date: formatDateShort(tournament.date),
        fullDate: tournament.date
      }

      topPlayers.forEach(playerName => {
        const playerData = playerPointsMap.get(playerName)
        if (playerData && playerData[index] !== undefined) {
          dataPoint[playerName] = playerData[index]
        }
      })

      return dataPoint
    })
  }, [tournaments, results, topPlayers])

  // Filtrar jogadores com 0 pontos no período
  const playersWithPoints = useMemo(() => {
    if (evolutionData.length === 0) return topPlayers
    
    const lastDataPoint = evolutionData[evolutionData.length - 1]
    return topPlayers.filter(playerName => {
      const finalPoints = lastDataPoint[playerName] || 0
      return finalPoints > 0
    })
  }, [evolutionData, topPlayers])

  const filteredPlayers = useMemo(() => 
    playersWithPoints.filter(player => !hiddenPlayers.has(player)),
    [playersWithPoints, hiddenPlayers]
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

  if (evolutionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Evolução da Pontuação 📅 (Últimos 30 Dias)</CardTitle>
          <p className="text-sm text-muted-foreground">Acompanhe o crescimento acumulado de pontos dos melhores jogadores</p>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">Nenhum torneio nos últimos 30 dias</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Evolução da Pontuação 📅 (Últimos 30 Dias)</CardTitle>
        <p className="text-sm text-muted-foreground">Acompanhe o crescimento acumulado de pontos dos melhores jogadores</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={evolutionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              label={{ value: 'Pontos Acumulados', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border rounded shadow-lg">
                      <p className="font-semibold text-sm mb-2">📅 {label}</p>
                      {payload
                        .sort((a, b) => (b.value as number) - (a.value as number))
                        .map((entry, index) => (
                          <p key={index} className="text-xs" style={{ color: entry.color }}>
                            <span className="font-semibold">{entry.name}:</span> {entry.value} ponto{(entry.value as number) !== 1 ? 's' : ''}
                          </p>
                        ))}
                    </div>
                  )
                }
                return null
              }}
            />
            {filteredPlayers.map((playerName, index) => (
              <Line
                key={playerName}
                type="monotone"
                dataKey={playerName}
                stroke={colors[topPlayers.indexOf(playerName) % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={1000}
                animationEasing="ease-in-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Legenda/Botões de toggle */}
        <div className="flex flex-wrap gap-3 justify-center mt-6 pt-4 border-t">
          {playersWithPoints.map((playerName) => {
            const isHidden = hiddenPlayers.has(playerName)
            const finalPoints = evolutionData.length > 0 ? evolutionData[evolutionData.length - 1][playerName] : 0
            const colorIndex = topPlayers.indexOf(playerName)
            
            return (
              <button
                key={playerName}
                onClick={() => togglePlayer(playerName)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-100 ${
                  isHidden ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: colors[colorIndex % colors.length] }}
                />
                <span className="text-sm font-medium">
                  {playerName}: {finalPoints} ponto{finalPoints !== 1 ? 's' : ''}
                </span>
              </button>
            )
          })}
        </div>

        {/* Insights */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            💡 <span className="font-semibold">Sistema de Pontos:</span> 1º lugar = 4pts, 2º lugar = 3pts, 3º/4º lugar = 2pts cada. 
            Linhas mais inclinadas indicam maior acúmulo de pontos no período.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
