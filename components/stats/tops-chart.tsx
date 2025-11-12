'use client'

import { useMemo, useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

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
  data: { date: string; tops: number; total: number }[]
}

interface TopsEvolutionChartProps {
  tournaments: { id: number; date: string }[]
  results: TournamentResult[]
  topPlayers: string[]
  colors: string[]
}

export function TopsEvolutionChart({ tournaments, results, topPlayers, colors }: TopsEvolutionChartProps) {
  const [hiddenPlayers, setHiddenPlayers] = useState<Set<string>>(new Set())

  // Processar dados para evolução temporal
  const evolutionData = useMemo(() => {
    if (!tournaments || !results || tournaments.length === 0) return []

    // Ordenar torneios por data
    const sortedTournaments = [...tournaments].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Criar mapa acumulativo de TOPs por jogador
    const playerTopsMap = new Map<string, number[]>()

    sortedTournaments.forEach((tournament) => {
      const tournamentResults = results.filter(r => r.tournamentId === tournament.id)
      
      topPlayers.forEach(playerName => {
        if (!playerTopsMap.has(playerName)) {
          playerTopsMap.set(playerName, [])
        }

        const playerData = playerTopsMap.get(playerName)!
        const previousTops = playerData.length > 0 ? playerData[playerData.length - 1] : 0
        
        const playerResult = tournamentResults.find(r => r.playerName === playerName)
        const hasTop = playerResult && playerResult.placement !== null && playerResult.placement <= 4
        
        playerData.push(previousTops + (hasTop ? 1 : 0))
      })
    })

    // Transformar em formato para o gráfico
    return sortedTournaments.map((tournament, index) => {
      const dataPoint: any = {
        date: new Date(tournament.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        fullDate: tournament.date
      }

      topPlayers.forEach(playerName => {
        const playerData = playerTopsMap.get(playerName)
        if (playerData && playerData[index] !== undefined) {
          dataPoint[playerName] = playerData[index]
        }
      })

      return dataPoint
    })
  }, [tournaments, results, topPlayers])

  const filteredPlayers = useMemo(() => 
    topPlayers.filter(player => !hiddenPlayers.has(player)),
    [topPlayers, hiddenPlayers]
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
          <CardTitle>📈 Evolução dos TOPs ao Longo do Tempo</CardTitle>
          <p className="text-sm text-muted-foreground">Acompanhe o crescimento acumulado de TOPs dos melhores jogadores</p>
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
        <CardTitle>📈 Evolução dos TOPs ao Longo do Tempo</CardTitle>
        <p className="text-sm text-muted-foreground">Acompanhe o crescimento acumulado de TOPs dos melhores jogadores</p>
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
              label={{ value: 'TOPs Acumulados', angle: -90, position: 'insideLeft' }}
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
                            <span className="font-semibold">{entry.name}:</span> {entry.value} TOP{(entry.value as number) !== 1 ? 'S' : ''}
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
          {topPlayers.map((playerName, index) => {
            const isHidden = hiddenPlayers.has(playerName)
            const finalTops = evolutionData.length > 0 ? evolutionData[evolutionData.length - 1][playerName] : 0
            
            return (
              <button
                key={index}
                onClick={() => togglePlayer(playerName)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-100 ${
                  isHidden ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm font-medium">
                  {playerName}: {finalTops} TOP{finalTops !== 1 ? 'S' : ''}
                </span>
              </button>
            )
          })}
        </div>

        {/* Insights */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            💡 <span className="font-semibold">Dica:</span> Este gráfico mostra o crescimento acumulado de TOPs. 
            Linhas mais inclinadas indicam períodos de maior sucesso. Linhas planas mostram períodos sem TOPs.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
