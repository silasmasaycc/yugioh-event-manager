'use client'

import { useMemo, useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Scatter } from 'recharts'
import { FilterBadge } from './filter-badge'

interface PlayerStats {
  name: string
  participations: number
  tops: number
  topPercentage: number
}

interface PerformanceChartProps {
  data: PlayerStats[]
  colors: string[]
  isFiltered?: boolean
  filteredCount?: number
  totalCount?: number
}

// Função para determinar a cor baseada no desempenho
const getPerformanceColor = (percentage: number): string => {
  if (percentage >= 70) return '#10b981' // Verde (excelente)
  if (percentage >= 50) return '#f59e0b' // Amarelo/Laranja (bom)
  return '#ef4444' // Vermelho (regular)
}

export function PerformanceChart({ data, colors, isFiltered = false, filteredCount, totalCount }: PerformanceChartProps) {
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
          <CardTitle>{isFiltered && '🔍 '}📊 Taxa de Desempenho</CardTitle>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>📊 Taxa de Desempenho</CardTitle>
            <p className="text-sm text-muted-foreground">Percentual de TOPs em relação às participações (mínimo 1 TOP)</p>
          </div>
          <FilterBadge isFiltered={isFiltered} filteredCount={filteredCount} totalCount={totalCount} />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart 
            data={filteredData} 
            layout="vertical"
            margin={{ top: 5, right: 80, left: 20, bottom: 5 }}
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
                    <div className="bg-white p-3 border-2 border-gray-200 rounded-lg shadow-xl">
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
            
            {/* Linha horizontal (cabo do pirulito) */}
            <Bar 
              dataKey="topPercentage" 
              fill="transparent"
              isAnimationActive={false}
              barSize={2}
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`line-${index}`} 
                  fill={getPerformanceColor(entry.topPercentage)}
                  style={{ opacity: 0.3 }}
                />
              ))}
            </Bar>

            {/* Ponto no final (cabeça do pirulito) */}
            <Scatter
              dataKey="topPercentage"
              fill="#8884d8"
              shape={(props: any) => {
                const { cx, cy, payload } = props
                const color = getPerformanceColor(payload.topPercentage)
                const radius = 8
                
                return (
                  <g>
                    {/* Círculo principal */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={color}
                      stroke="#fff"
                      strokeWidth={2}
                      style={{ 
                        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))',
                        cursor: 'pointer'
                      }}
                    />
                    {/* Label com porcentagem */}
                    <text
                      x={cx + radius + 8}
                      y={cy + 1}
                      fill="#374151"
                      fontSize="12"
                      fontWeight="600"
                      dominantBaseline="middle"
                    >
                      {payload.topPercentage.toFixed(1)}%
                    </text>
                    <text
                      x={cx + radius + 8}
                      y={cy + 14}
                      fill="#6b7280"
                      fontSize="10"
                      dominantBaseline="middle"
                    >
                      ({payload.tops}/{payload.participations})
                    </text>
                  </g>
                )
              }}
            />
          </ComposedChart>
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
            💡 <span className="font-semibold">Dica:</span> Este gráfico no estilo "lollipop" (pirulito) mostra a eficiência de cada jogador. 
            O ponto colorido representa a porcentagem de TOPs conquistados em relação ao total de participações. 
            Cores ajudam a identificar rapidamente o nível de desempenho: verde (excelente), laranja (bom), vermelho (regular).
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
