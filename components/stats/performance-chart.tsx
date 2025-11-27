'use client'

import { useMemo, useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'

interface PlayerStats {
  name: string
  participations: number
  tops: number
  topPercentage: number
}

interface PerformanceChartProps {
  data: PlayerStats[]
  colors: string[]
}

// Função para determinar a cor baseada no desempenho
const getPerformanceColor = (percentage: number): string => {
  if (percentage >= 70) return '#10b981' // Verde (excelente)
  if (percentage >= 50) return '#f59e0b' // Amarelo/Laranja (bom)
  return '#ef4444' // Vermelho (regular)
}

export function PerformanceChart({ data, colors }: PerformanceChartProps) {
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
          <CardTitle>📊 Taxa de Desempenho</CardTitle>
          <p className="text-sm text-muted-foreground">Percentual de TOPs em relação às participações (mínimo 1 TOP)</p>
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
        <CardTitle>📊 Taxa de Desempenho</CardTitle>
        <p className="text-sm text-muted-foreground">Percentual de TOPs em relação às participações (mínimo 1 TOP)</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={filteredData} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
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
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 border rounded shadow-lg">
                      <p className="font-semibold text-sm mb-1">{data.name}</p>
                      <p className="text-lg font-bold" style={{ color: getPerformanceColor(data.topPercentage) }}>
                        {data.topPercentage.toFixed(1)}% de aproveitamento
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {data.tops} TOP{data.tops !== 1 ? 'S' : ''} em {data.participations} torneio{data.participations !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {data.topPercentage >= 70 && '🏆 Excelente desempenho!'}
                        {data.topPercentage >= 50 && data.topPercentage < 70 && '👍 Bom desempenho'}
                        {data.topPercentage < 50 && '📈 Pode melhorar'}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar 
              dataKey="topPercentage" 
              radius={[0, 8, 8, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getPerformanceColor(entry.topPercentage)}
                  style={{ 
                    transition: 'all 300ms ease-in-out',
                    cursor: 'pointer',
                    opacity: 0.9
                  }}
                />
              ))}
              <LabelList 
                dataKey="topPercentage" 
                position="right"
                content={(props: any) => {
                  const { x, y, width, value, index } = props
                  if (index === undefined || !filteredData[index]) return null
                  
                  const player = filteredData[index]
                  return (
                    <text
                      x={x + width + 5}
                      y={y + 10}
                      fill="#374151"
                      fontSize="12"
                      fontWeight="600"
                    >
                      {value.toFixed(1)}% ({player.tops}/{player.participations})
                    </text>
                  )
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Legenda de cores */}
        <div className="flex justify-center gap-6 mt-6 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
            <span className="text-gray-600">≥ 70% - Excelente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
            <span className="text-gray-600">50-69% - Bom</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-gray-600">&lt; 50% - Regular</span>
          </div>
        </div>

        {/* Botões de toggle */}
        <div className="flex flex-wrap gap-3 justify-center mt-4 pt-4 border-t">
          {data.map((player, index) => {
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
                  style={{ backgroundColor: getPerformanceColor(player.topPercentage) }}
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

        {/* Insights */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 leading-relaxed">
            💡 <span className="font-semibold">Dica:</span> Este gráfico mostra a eficiência de cada jogador. 
            A porcentagem indica quantos TOPs foram conquistados em relação ao total de participações. 
            Cores ajudam a identificar rapidamente o nível de desempenho: verde (excelente), laranja (bom), vermelho (regular).
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
