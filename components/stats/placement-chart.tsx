'use client'

import { useMemo, useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface PlacementDistribution {
  name: string
  '1º Lugar': number
  '2º Lugar': number
  '3º Lugar': number
  '4º Lugar': number
}

interface PlacementChartProps {
  data: PlacementDistribution[]
  colors: string[]
}

export function PlacementChart({ data, colors }: PlacementChartProps) {
  const [hiddenPlayers, setHiddenPlayers] = useState<Set<string>>(new Set())

  const filteredData = useMemo(() =>
    data.filter(player => !hiddenPlayers.has(player.name)),
    [data, hiddenPlayers]
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

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎯 Distribuição de Colocações</CardTitle>
          <p className="text-sm text-muted-foreground">Perfil de colocações de cada jogador (análise radar)</p>
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
        <CardTitle>🎯 Distribuição de Colocações</CardTitle>
        <p className="text-sm text-muted-foreground">Perfil de colocações de cada jogador (análise radar)</p>
      </CardHeader>
      <CardContent>
        {/* Grid de Radares Individuais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {filteredData.map((player, index) => {
            const radarData = [
              { placement: '1º', value: player['1º Lugar'], fullMark: Math.max(player['1º Lugar'], player['2º Lugar'], player['3º Lugar'], player['4º Lugar']) + 2 },
              { placement: '2º', value: player['2º Lugar'], fullMark: Math.max(player['1º Lugar'], player['2º Lugar'], player['3º Lugar'], player['4º Lugar']) + 2 },
              { placement: '3º', value: player['3º Lugar'], fullMark: Math.max(player['1º Lugar'], player['2º Lugar'], player['3º Lugar'], player['4º Lugar']) + 2 },
              { placement: '4º', value: player['4º Lugar'], fullMark: Math.max(player['1º Lugar'], player['2º Lugar'], player['3º Lugar'], player['4º Lugar']) + 2 }
            ]
            const total = player['1º Lugar'] + player['2º Lugar'] + player['3º Lugar'] + player['4º Lugar']
            
            return (
              <div key={index} className="border rounded-lg p-4 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-center mb-2 text-sm truncate" title={player.name}>
                  {player.name}
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis 
                      dataKey="placement" 
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 'dataMax']}
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                    />
                    <Radar 
                      name={player.name}
                      dataKey="value" 
                      stroke={colors[index % colors.length]}
                      fill={colors[index % colors.length]}
                      fillOpacity={0.6}
                      strokeWidth={2}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-2 border rounded shadow-lg text-xs">
                              <p className="font-semibold">{data.placement} Lugar</p>
                              <p className="text-gray-600">{data.value} vez(es)</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                  <p className="text-xs text-gray-600 font-medium">
                    Total: {total} TOP{total !== 1 ? 'S' : ''}
                  </p>
                  <div className="flex justify-center gap-1 mt-1 text-xs">
                    {player['1º Lugar'] > 0 && <span>🥇{player['1º Lugar']}</span>}
                    {player['2º Lugar'] > 0 && <span>🥈{player['2º Lugar']}</span>}
                    {player['3º Lugar'] > 0 && <span>🥉{player['3º Lugar']}</span>}
                    {player['4º Lugar'] > 0 && <span>4️⃣{player['4º Lugar']}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Botões de Toggle */}
        <div className="flex flex-wrap gap-3 justify-center mt-4 pt-4 border-t">
          {data.map((player, index) => {
            const isHidden = hiddenPlayers.has(player.name)
            const total = player['1º Lugar'] + player['2º Lugar'] + player['3º Lugar'] + player['4º Lugar']
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
                <span className="text-sm font-medium">
                  {player.name}: {total} TOPs
                </span>
              </button>
            )
          })}
        </div>

        {/* Insights */}
        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs text-purple-800 leading-relaxed">
            💡 <span className="font-semibold">Dica:</span> Cada radar mostra a distribuição das colocações do jogador. 
            Os 4 eixos representam 1º, 2º, 3º e 4º lugar. Quanto maior a área do radar, mais TOPs o jogador conquistou. 
            Radares alongados em uma direção indicam concentração em colocações específicas.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
