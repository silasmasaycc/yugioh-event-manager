'use client'

import { useMemo, useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts'

interface TournamentResult {
  date: string
  tournamentId: number
  playerId: number
  playerName: string
  placement: number | null
}

interface StreakData {
  name: string
  currentStreak: number
  maxStreak: number
  currentDrought: number
  maxDrought: number
  totalTops: number
  x: number // maxStreak
  y: number // currentStreak
  z: number // totalTops (tamanho da bolha)
}

interface StreaksChartProps {
  tournaments: { id: number; date: string }[]
  results: TournamentResult[]
  topPlayers: string[]
  colors: string[]
}

export function StreaksChart({ tournaments, results, topPlayers, colors }: StreaksChartProps) {
  const [hiddenPlayers, setHiddenPlayers] = useState<Set<string>>(new Set())

  // Calcular streaks para cada jogador
  const streaksData = useMemo(() => {
    if (!tournaments || !results || tournaments.length === 0) return []

    const sortedTournaments = [...tournaments].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return topPlayers.map(playerName => {
      let currentStreak = 0
      let maxStreak = 0
      let currentDrought = 0
      let maxDrought = 0
      let tempStreak = 0
      let tempDrought = 0
      let totalTops = 0

      sortedTournaments.forEach(tournament => {
        const playerResult = results.find(
          r => r.tournamentId === tournament.id && r.playerName === playerName
        )

        const hasTop = playerResult && playerResult.placement !== null && playerResult.placement <= 4
        const participated = !!playerResult

        if (participated) {
          if (hasTop) {
            // TOP conseguido
            totalTops++
            tempStreak++
            tempDrought = 0
            if (tempStreak > maxStreak) maxStreak = tempStreak
          } else {
            // Participou mas não conseguiu TOP
            tempDrought++
            tempStreak = 0
            if (tempDrought > maxDrought) maxDrought = tempDrought
          }
        }
      })

      // Streak/drought atual é o último valor
      currentStreak = tempStreak
      currentDrought = tempDrought

      return {
        name: playerName,
        currentStreak,
        maxStreak,
        currentDrought,
        maxDrought,
        totalTops,
        x: maxStreak,
        y: currentStreak,
        z: totalTops
      }
    }).sort((a, b) => b.maxStreak - a.maxStreak)
  }, [tournaments, results, topPlayers])

  // Agrupar jogadores com mesmas coordenadas e dispersá-los em círculo
  const processedData = useMemo(() => {
    const filtered = streaksData.filter(player => !hiddenPlayers.has(player.name))
    
    // Agrupar por coordenadas (x, y)
    const groups = new Map<string, typeof filtered>()
    
    filtered.forEach(player => {
      const key = `${player.x},${player.y}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(player)
    })
    
    // Dispersar jogadores sobrepostos em círculo
    const result = filtered.map(player => {
      const key = `${player.x},${player.y}`
      const group = groups.get(key)!
      
      if (group.length === 1) {
        // Sem sobreposição, retorna posição original
        return {
          ...player,
          displayX: player.x,
          displayY: player.y,
          originalX: player.x,
          originalY: player.y,
          isGrouped: false
        }
      }
      
      // Múltiplos jogadores na mesma posição - dispersar em círculo
      const index = group.indexOf(player)
      const totalInGroup = group.length
      const radius = 0.3 // raio do círculo de dispersão
      const angle = (2 * Math.PI * index) / totalInGroup
      
      return {
        ...player,
        displayX: player.x + radius * Math.cos(angle),
        displayY: player.y + radius * Math.sin(angle),
        originalX: player.x,
        originalY: player.y,
        isGrouped: true,
        groupSize: totalInGroup
      }
    })
    
    return result
  }, [streaksData, hiddenPlayers])

  const filteredData = processedData

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

  // Função para calcular cor baseada na seca (azul claro = pouca seca, azul escuro = muita seca)
  const getDroughtColor = useCallback((drought: number) => {
    if (drought === 0) return '#bfdbfe' // blue-200 (sem seca)
    if (drought <= 2) return '#93c5fd' // blue-300 (seca leve)
    if (drought <= 4) return '#60a5fa' // blue-400 (seca moderada)
    if (drought <= 6) return '#3b82f6' // blue-500 (seca considerável)
    return '#1e40af' // blue-800 (seca intensa - gelo profundo ❄️)
  }, [])

  if (streaksData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔥 Análise de Streaks</CardTitle>
          <p className="text-sm text-muted-foreground">Sequências de TOPs consecutivos e períodos sem TOP</p>
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
        <CardTitle>🔥 Análise de Streaks</CardTitle>
        <p className="text-sm text-muted-foreground">
          Relação entre streak máxima, streak atual e desempenho geral
        </p>
        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 leading-relaxed">
            💡 <span className="font-semibold">Como ler:</span> Cada bolha representa um jogador. 
            <strong className="text-orange-600"> Eixo X (🔥)</strong>: maior sequência de TOPs consecutivos. 
            <strong className="text-orange-600"> Eixo Y (⚡)</strong>: sequência atual de TOPs. 
            <strong> Tamanho</strong>: total de TOPs conquistados. 
            <strong className="text-blue-600"> Cor (❄️)</strong>: maior seca (azul claro = pouca seca, azul escuro = muito gelo). 
            Bolhas agrupadas com borda roxa indicam jogadores com mesmos valores dispersos em círculo.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="displayX" 
              name="Maior Streak"
              label={{ 
                value: '🔥 Maior Sequência de TOPs Consecutivos', 
                position: 'insideBottom', 
                offset: -10,
                style: { fontSize: 12, fontWeight: 600 }
              }}
              domain={[0, 'auto']}
            />
            <YAxis 
              type="number" 
              dataKey="displayY" 
              name="Streak Atual"
              label={{ 
                value: '⚡ Sequência Atual de TOPs', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 12, fontWeight: 600 }
              }}
              domain={[0, 'auto']}
            />
            <ZAxis 
              type="number" 
              dataKey="z" 
              range={[100, 1000]} 
              name="Total de TOPs"
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as StreakData & { 
                    displayX: number
                    displayY: number
                    originalX: number
                    originalY: number
                    isGrouped: boolean
                    groupSize?: number
                  }
                  return (
                    <div className="bg-white p-4 border-2 border-gray-200 rounded-lg shadow-xl">
                      <p className="font-bold text-base mb-3 text-gray-800">{data.name}</p>
                      
                      {data.isGrouped && (
                        <div className="mb-2 p-2 bg-purple-50 rounded border border-purple-200">
                          <p className="text-xs text-purple-700">
                            👥 <strong>{data.groupSize}</strong> jogador{data.groupSize! > 1 ? 'es' : ''} com mesmos valores
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                          <span className="text-2xl">🔥</span>
                          <div>
                            <p className="text-xs text-orange-700 font-semibold">MAIOR STREAK</p>
                            <p className="text-lg font-bold text-orange-600">
                              {data.maxStreak} torneio{data.maxStreak !== 1 ? 's' : ''} consecutivo{data.maxStreak !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        
                        <div className={`flex items-center gap-2 p-2 rounded ${
                          data.currentStreak > 0 ? 'bg-orange-100' : 'bg-gray-50'
                        }`}>
                          <span className="text-2xl">{data.currentStreak > 0 ? '⚡' : '💤'}</span>
                          <div>
                            <p className="text-xs font-semibold" style={{ 
                              color: data.currentStreak > 0 ? '#c2410c' : '#6b7280'
                            }}>
                              {data.currentStreak > 0 ? 'STREAK ATIVO!' : 'Sem streak ativo'}
                            </p>
                            <p className="text-sm font-bold" style={{
                              color: data.currentStreak > 0 ? '#ea580c' : '#9ca3af'
                            }}>
                              {data.currentStreak > 0 
                                ? `${data.currentStreak} TOP${data.currentStreak !== 1 ? 'S' : ''} seguido${data.currentStreak !== 1 ? 's' : ''}`
                                : 'Nenhum TOP na última participação'
                              }
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                          <span className="text-2xl">❄️</span>
                          <div>
                            <p className="text-xs text-blue-700 font-semibold">MAIOR SECA (GELO)</p>
                            <p className="text-sm font-bold text-blue-600">
                              {data.maxDrought} torneio{data.maxDrought !== 1 ? 's' : ''} sem TOP
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded border-t-2 border-purple-200 mt-2">
                          <span className="text-2xl">🏆</span>
                          <div>
                            <p className="text-xs text-purple-700 font-semibold">TOTAL DE TOPs</p>
                            <p className="text-lg font-bold text-purple-600">{data.totalTops}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            
            {/* Linhas pontilhadas conectando posições dispersas ao ponto original */}
            {filteredData
              .filter(d => d.isGrouped)
              .map((point, idx) => (
                <line
                  key={`connector-${idx}`}
                  x1={`${((point.originalX / Math.max(...filteredData.map(d => d.displayX || 0))) * 100)}%`}
                  y1={`${100 - ((point.originalY / Math.max(...filteredData.map(d => d.displayY || 0))) * 100)}%`}
                  x2={`${((point.displayX / Math.max(...filteredData.map(d => d.displayX || 0))) * 100)}%`}
                  y2={`${100 - ((point.displayY / Math.max(...filteredData.map(d => d.displayY || 0))) * 100)}%`}
                  stroke="#9333ea"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  opacity={0.4}
                />
              ))
            }
            
            <Scatter 
              data={filteredData} 
              fill="#8884d8"
              animationDuration={800}
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={getDroughtColor(entry.maxDrought)}
                  stroke={entry.currentStreak > 0 ? '#f97316' : entry.isGrouped ? '#9333ea' : '#64748b'}
                  strokeWidth={entry.currentStreak > 0 ? 3 : entry.isGrouped ? 2 : 1}
                  style={{ 
                    cursor: 'pointer',
                    opacity: 0.85
                  }}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legenda */}
        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Cor da Bolha (Seca Máxima):</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: '#bfdbfe' }} />
                <span className="text-xs text-gray-600">0 torneios (sem gelo)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: '#93c5fd' }} />
                <span className="text-xs text-gray-600">1-2 torneios (gelo leve ❄️)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: '#60a5fa' }} />
                <span className="text-xs text-gray-600">3-4 torneios (gelo moderado ❄️)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: '#3b82f6' }} />
                <span className="text-xs text-gray-600">5-6 torneios (muito gelo ❄️❄️)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: '#1e40af' }} />
                <span className="text-xs text-gray-600">7+ torneios (era do gelo ❄️❄️❄️)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-3 border-t">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Borda da Bolha:</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-400 border-[3px] border-orange-500" />
                <span className="text-xs text-gray-600">Streak ativo 🔥 (borda laranja grossa)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-400 border-2 border-purple-600" />
                <span className="text-xs text-gray-600">Agrupado 👥 (borda roxa, disperso em círculo)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-400 border border-slate-500" />
                <span className="text-xs text-gray-600">Sem streak ativo (borda cinza fina)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-3 border-t">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Tamanho da Bolha:</p>
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xs text-gray-600">Proporcional ao total de TOPs conquistados 🏆</span>
            </div>
          </div>
        </div>

        {/* Botões de toggle */}
        <div className="flex flex-wrap gap-3 justify-center mt-6 pt-4 border-t">
          {streaksData.map((player, index) => {
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
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm font-medium text-gray-700">{player.name}</span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
