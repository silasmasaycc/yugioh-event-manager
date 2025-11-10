'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { PageLayout } from '@/components/layout/page-layout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#d4af37', '#3b82f6', '#c0c0c0', '#cd7f32', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899']
const PLACEMENT_COLORS = {
  '1º Lugar': '#d4af37',  // Ouro
  '2º Lugar': '#c0c0c0',  // Prata
  '3º Lugar': '#cd7f32',  // Bronze
  '4º Lugar': '#3b82f6'   // Azul
}

interface PlayerStats {
  name: string
  participations: number
  tops: number
  topPercentage: number
}

interface PlacementDistribution {
  name: string
  '1º Lugar': number
  '2º Lugar': number
  '3º Lugar': number
  '4º Lugar': number
}

export default function StatsPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [topPlayers, setTopPlayers] = useState<PlayerStats[]>([])
  const [topPlayersWithTops, setTopPlayersWithTops] = useState<PlayerStats[]>([])
  const [bestPerformance, setBestPerformance] = useState<PlayerStats[]>([])
  const [placementDistribution, setPlacementDistribution] = useState<PlacementDistribution[]>([])
  
  // Estados para controlar visibilidade de jogadores nos gráficos
  const [hiddenPlayers1, setHiddenPlayers1] = useState<Set<string>>(new Set())
  const [hiddenPlayers2, setHiddenPlayers2] = useState<Set<string>>(new Set())
  const [hiddenPlayers3, setHiddenPlayers3] = useState<Set<string>>(new Set())
  const [hiddenPlayers4, setHiddenPlayers4] = useState<Set<string>>(new Set())

  const supabase = createClient()

  useEffect(() => {
    loadStats()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      let tournamentQuery = supabase.from('tournaments').select('id, date')
      
      if (startDate) {
        tournamentQuery = tournamentQuery.gte('date', startDate)
      }
      if (endDate) {
        tournamentQuery = tournamentQuery.lte('date', endDate)
      }

      const { data: tournaments } = await tournamentQuery

      if (!tournaments || tournaments.length === 0) {
        setTopPlayers([])
        setTopPlayersWithTops([])
        setBestPerformance([])
        setPlacementDistribution([])
        setLoading(false)
        return
      }

      const tournamentIds = tournaments.map(t => t.id)

      const { data: results } = await supabase
        .from('tournament_results')
        .select(`
          placement,
          tournament_id,
          player:players(id, name)
        `)
        .in('tournament_id', tournamentIds)

      const { data: players } = await supabase.from('players').select('id, name')

      if (!players || !results) {
        setPlacementDistribution([])
        setLoading(false)
        return
      }

      // Calcular estatísticas por jogador
      const playerStatsMap = new Map<number, PlayerStats>()

      players.forEach(player => {
        const playerResults = results.filter((r: any) => r.player?.id === player.id)
        const participations = playerResults.length
        const tops = playerResults.filter((r: any) => r.placement !== null && r.placement <= 4).length
        const topPercentage = participations > 0 ? (tops / participations) * 100 : 0

        if (participations > 0) {
          playerStatsMap.set(player.id, {
            name: player.name,
            participations,
            tops,
            topPercentage
          })
        }
      })

      const allPlayerStats = Array.from(playerStatsMap.values())

      // Top 10 jogadores que mais jogaram
      const topByParticipation = [...allPlayerStats]
        .sort((a, b) => b.participations - a.participations)
        .slice(0, 10)
      
      setTopPlayers(topByParticipation)

      // Top 10 jogadores com mais TOPs
      const topByTops = [...allPlayerStats]
        .sort((a, b) => b.tops - a.tops)
        .slice(0, 10)
      
      setTopPlayersWithTops(topByTops)

      // Top 8 jogadores com melhor % de TOPs (mínimo 2 participações e pelo menos 1 TOP)
      const topByPercentage = [...allPlayerStats]
        .filter(p => p.participations >= 2 && p.tops > 0)
        .sort((a, b) => b.topPercentage - a.topPercentage)
        .slice(0, 8)
      
      setBestPerformance(topByPercentage)

      // Distribuição de Colocações (Top 10 jogadores com mais TOPs)
      const placementMap = new Map<number, PlacementDistribution>()
      
      topByTops.forEach(player => {
        const playerData = players.find(p => p.name === player.name)
        if (playerData) {
          const playerResults = results.filter((r: any) => r.player?.id === playerData.id)
          
          placementMap.set(playerData.id, {
            name: player.name,
            '1º Lugar': playerResults.filter((r: any) => r.placement === 1).length,
            '2º Lugar': playerResults.filter((r: any) => r.placement === 2).length,
            '3º Lugar': playerResults.filter((r: any) => r.placement === 3).length,
            '4º Lugar': playerResults.filter((r: any) => r.placement === 4).length,
          })
        }
      })

      setPlacementDistribution(Array.from(placementMap.values()))

    } catch (error) {
      console.error('Error loading stats:', error)
    }
    setLoading(false)
  }

  const handleFilter = () => {
    loadStats()
  }

  const handleClearFilter = () => {
    setStartDate('')
    setEndDate('')
    setTimeout(() => loadStats(), 0)
  }

  // Funções para toggle de visibilidade
  const togglePlayer1 = (playerName: string) => {
    setHiddenPlayers1(prev => {
      const newSet = new Set(prev)
      if (newSet.has(playerName)) {
        newSet.delete(playerName)
      } else {
        newSet.add(playerName)
      }
      return newSet
    })
  }

  const togglePlayer2 = (playerName: string) => {
    setHiddenPlayers2(prev => {
      const newSet = new Set(prev)
      if (newSet.has(playerName)) {
        newSet.delete(playerName)
      } else {
        newSet.add(playerName)
      }
      return newSet
    })
  }

  const togglePlayer3 = (playerName: string) => {
    setHiddenPlayers3(prev => {
      const newSet = new Set(prev)
      if (newSet.has(playerName)) {
        newSet.delete(playerName)
      } else {
        newSet.add(playerName)
      }
      return newSet
    })
  }

  const togglePlayer4 = (playerName: string) => {
    setHiddenPlayers4(prev => {
      const newSet = new Set(prev)
      if (newSet.has(playerName)) {
        newSet.delete(playerName)
      } else {
        newSet.add(playerName)
      }
      return newSet
    })
  }

  // Componente customizado de legenda
  const CustomLegend = ({ payload, toggleFn, hiddenSet }: any) => {
    return (
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {payload.map((entry: any, index: number) => {
          const isHidden = hiddenSet.has(entry.value)
          return (
            <button
              key={`legend-${index}`}
              onClick={() => toggleFn(entry.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-100 ${
                isHidden ? 'opacity-40' : 'opacity-100'
              }`}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium">{entry.value}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // Componente customizado de barra com hover effect
  const CustomBar = (props: any) => {
    const { fill, x, y, width, height } = props
    const [isHovered, setIsHovered] = useState(false)

    return (
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          rx={8}
          style={{
            filter: isHovered ? 'brightness(1.2) drop-shadow(0 0 8px #d4af37)' : 'none',
            transition: 'all 200ms ease-in-out'
          }}
        />
      </g>
    )
  }

  return (
    <PageLayout activeRoute="/stats">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">Estatísticas</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Análise de desempenho e participação dos jogadores
        </p>
      </div>

      {/* Filtros */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filtros por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleFilter} className="flex-1">
                Aplicar Filtro
              </Button>
              <Button onClick={handleClearFilter} variant="outline">
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">Carregando estatísticas...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Gráfico 1: Melhor Desempenho (% de TOPs) */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Top 8 - Melhor Taxa de Desempenho</CardTitle>
              <p className="text-sm text-muted-foreground">Percentual de TOPs em relação às participações (mínimo 2 torneios e 1 TOP)</p>
            </CardHeader>
            <CardContent>
              {bestPerformance.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={bestPerformance.filter(p => !hiddenPlayers1.has(p.name))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, topPercentage }) => `${name}: ${topPercentage.toFixed(1)}%`}
                        outerRadius={120}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="topPercentage"
                        animationDuration={200}
                        animationEasing="ease-in-out"
                      >
                        {bestPerformance.filter(p => !hiddenPlayers1.has(p.name)).map((entry, index) => {
                          const originalIndex = bestPerformance.indexOf(entry)
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[originalIndex % COLORS.length]}
                              style={{ 
                                transition: 'all 200ms ease-in-out',
                                cursor: 'pointer'
                              }}
                            />
                          )
                        })}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white p-3 border rounded shadow-lg transition-all duration-200 ease-in-out">
                                <p className="font-semibold">{data.name}</p>
                                <p className="text-sm text-purple-600">{data.topPercentage.toFixed(1)}% de aproveitamento</p>
                                <p className="text-xs text-gray-500">{data.tops} TOPs em {data.participations} torneios</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 justify-center mt-4">
                    {bestPerformance.map((player, index) => {
                      const isHidden = hiddenPlayers1.has(player.name)
                      return (
                        <button
                          key={index}
                          onClick={() => togglePlayer1(player.name)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-100 ${
                            isHidden ? 'opacity-40' : 'opacity-100'
                          }`}
                        >
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium">
                            {player.name}: {player.topPercentage.toFixed(1)}%
                            <span className="text-gray-500 text-xs ml-1">
                              ({player.tops}/{player.participations})
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum dado disponível para o período selecionado</p>
              )}
            </CardContent>
          </Card>

          {/* Gráfico 2: Top Jogadores com Mais TOPs */}
          <Card>
            <CardHeader>
              <CardTitle>🥇 Top 10 - Jogadores com Mais TOPs (1º ao 4º)</CardTitle>
              <p className="text-sm text-muted-foreground">Quantidade de vezes que ficaram entre os 4 primeiros</p>
            </CardHeader>
            <CardContent>
              {topPlayersWithTops.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topPlayersWithTops.filter(p => !hiddenPlayers2.has(p.name))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white p-3 border rounded shadow-lg transition-all duration-200 ease-in-out">
                                <p className="font-semibold">{data.name}</p>
                                <p className="text-sm text-blue-600">{data.tops} TOPs</p>
                                <p className="text-xs text-gray-500">{data.participations} participações</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="tops" fill="#3b82f6" radius={[8, 8, 0, 0]} shape={<CustomBar />} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 justify-center mt-4">
                    {topPlayersWithTops.map((player, index) => {
                      const isHidden = hiddenPlayers2.has(player.name)
                      return (
                        <button
                          key={index}
                          onClick={() => togglePlayer2(player.name)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-100 ${
                            isHidden ? 'opacity-40' : 'opacity-100'
                          }`}
                        >
                          <div 
                            className="w-3 h-3 rounded-full bg-blue-500" 
                          />
                          <span className="text-sm font-medium">
                            {player.name}: {player.tops} TOPs
                            <span className="text-gray-500 text-xs ml-1">
                              ({player.participations} participações)
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum dado disponível para o período selecionado</p>
              )}
            </CardContent>
          </Card>

          {/* Gráfico 3: Distribuição de Colocações */}
          <Card>
            <CardHeader>
              <CardTitle>🎯 Distribuição de Colocações - Top 10</CardTitle>
              <p className="text-sm text-muted-foreground">Detalhamento das posições alcançadas por cada jogador</p>
            </CardHeader>
            <CardContent>
              {placementDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={placementDistribution.filter(p => !hiddenPlayers4.has(p.name))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            const total = data['1º Lugar'] + data['2º Lugar'] + data['3º Lugar'] + data['4º Lugar']
                            return (
                              <div className="bg-white p-3 border rounded shadow-lg transition-all duration-200 ease-in-out">
                                <p className="font-semibold mb-2">{data.name}</p>
                                <p className="text-xs">🥇 1º Lugar: {data['1º Lugar']}</p>
                                <p className="text-xs">🥈 2º Lugar: {data['2º Lugar']}</p>
                                <p className="text-xs">🥉 3º Lugar: {data['3º Lugar']}</p>
                                <p className="text-xs">4️⃣ 4º Lugar: {data['4º Lugar']}</p>
                                <p className="text-xs font-semibold mt-1">Total: {total} TOPs</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="1º Lugar" stackId="a" fill={PLACEMENT_COLORS['1º Lugar']} radius={[0, 0, 0, 0]} shape={<CustomBar />} />
                      <Bar dataKey="2º Lugar" stackId="a" fill={PLACEMENT_COLORS['2º Lugar']} radius={[0, 0, 0, 0]} shape={<CustomBar />} />
                      <Bar dataKey="3º Lugar" stackId="a" fill={PLACEMENT_COLORS['3º Lugar']} radius={[0, 0, 0, 0]} shape={<CustomBar />} />
                      <Bar dataKey="4º Lugar" stackId="a" fill={PLACEMENT_COLORS['4º Lugar']} radius={[8, 8, 0, 0]} shape={<CustomBar />} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 justify-center mt-4">
                    {placementDistribution.map((player, index) => {
                      const isHidden = hiddenPlayers4.has(player.name)
                      const total = player['1º Lugar'] + player['2º Lugar'] + player['3º Lugar'] + player['4º Lugar']
                      return (
                        <button
                          key={index}
                          onClick={() => togglePlayer4(player.name)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-100 ${
                            isHidden ? 'opacity-40' : 'opacity-100'
                          }`}
                        >
                          <div className="flex gap-0.5">
                            <div className="w-2 h-3 rounded-sm" style={{ backgroundColor: PLACEMENT_COLORS['1º Lugar'] }} />
                            <div className="w-2 h-3 rounded-sm" style={{ backgroundColor: PLACEMENT_COLORS['2º Lugar'] }} />
                            <div className="w-2 h-3 rounded-sm" style={{ backgroundColor: PLACEMENT_COLORS['3º Lugar'] }} />
                            <div className="w-2 h-3 rounded-sm" style={{ backgroundColor: PLACEMENT_COLORS['4º Lugar'] }} />
                          </div>
                          <span className="text-sm font-medium">
                            {player.name}: {total} TOPs
                            <span className="text-gray-500 text-xs ml-1">
                              (🥇{player['1º Lugar']} 🥈{player['2º Lugar']} 🥉{player['3º Lugar']} 4️⃣{player['4º Lugar']})
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum dado disponível para o período selecionado</p>
              )}
            </CardContent>
          </Card>

          {/* Gráfico 4: Top Jogadores que Mais Jogaram */}
          <Card>
            <CardHeader>
              <CardTitle>🏆 Top 10 - Jogadores que Mais Participaram</CardTitle>
              <p className="text-sm text-muted-foreground">Número total de participações em torneios</p>
            </CardHeader>
            <CardContent>
              {topPlayers.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topPlayers.filter(p => !hiddenPlayers3.has(p.name))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border rounded shadow-lg transition-all duration-200 ease-in-out">
                                <p className="font-semibold">{payload[0].payload.name}</p>
                                <p className="text-sm text-purple-600">
                                  {payload[0].value} participações
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="participations" fill="#8b5cf6" radius={[8, 8, 0, 0]} shape={<CustomBar />} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 justify-center mt-4">
                    {topPlayers.map((player, index) => {
                      const isHidden = hiddenPlayers3.has(player.name)
                      return (
                        <button
                          key={index}
                          onClick={() => togglePlayer3(player.name)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-100 ${
                            isHidden ? 'opacity-40' : 'opacity-100'
                          }`}
                        >
                          <div 
                            className="w-3 h-3 rounded-full bg-purple-500" 
                          />
                          <span className="text-sm font-medium">
                            {player.name}: {player.participations} participações
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum dado disponível para o período selecionado</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  )
}
