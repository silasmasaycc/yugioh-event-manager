'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { FilterBadge } from './filter-badge'

interface DeckUsageData {
  deckId: number
  deckName: string
  deckImageUrl?: string
  totalUses: number
  primaryUses: number
  secondaryUses: number
  firstPlace: number
  secondPlace: number
  thirdPlace: number
  fourthPlace: number
  winRate: number
}

interface DeckUsageChartProps {
  data: DeckUsageData[]
  colors: Record<string, string>
  title?: string
  isFiltered?: boolean
  filteredCount?: number
  totalCount?: number
}

export function DeckUsageChart({ data, colors, title = '🥧 Distribuição de Uso (Top 10)', isFiltered = false, filteredCount, totalCount }: DeckUsageChartProps) {
  // Determinar se é gráfico de principais ou secundários baseado no título
  const isPrimary = title.includes('Principais')
  
  // Dados para o gráfico de pizza (top 10)
  const pieChartData = data.slice(0, 10).map(deck => ({
    name: deck.deckName,
    value: isPrimary ? deck.primaryUses : deck.secondaryUses
  }))

  const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#f97316', '#84cc16', '#06b6d4', '#6366f1']

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <FilterBadge isFiltered={isFiltered} filteredCount={filteredCount} totalCount={totalCount} />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
