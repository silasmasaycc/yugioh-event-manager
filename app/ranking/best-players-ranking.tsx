'use client'

import { Card, CardContent } from '@/components/ui/card'
import { PositionBadge } from '@/components/utils/position-badge'
import { PlayerAvatar } from '@/components/player/player-avatar'

import { MEDAL_ICONS } from '@/lib/constants'

interface BestPlayersRankingProps {
  players: any[]
}

export function BestPlayersRanking({ players }: BestPlayersRankingProps) {
  const getTierBadgeColor = (tier: string | null) => {
    switch (tier) {
      case 'S': return 'bg-red-500 text-white border-red-600'
      case 'A': return 'bg-yellow-500 text-white border-yellow-600'
      case 'B': return 'bg-green-500 text-white border-green-600'
      case 'C': return 'bg-blue-500 text-white border-blue-600'
      case 'D': return 'bg-gray-500 text-white border-gray-600'
      default: return 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
    }
  }

  const getTierBorderColor = (tier: string | null) => {
    switch (tier) {
      case 'S': return 'border-l-4 border-l-red-500'
      case 'A': return 'border-l-4 border-l-yellow-500'
      case 'B': return 'border-l-4 border-l-green-500'
      case 'C': return 'border-l-4 border-l-blue-500'
      case 'D': return 'border-l-4 border-l-gray-500'
      default: return ''
    }
  }

  const getTierPositionInTier = (player: any) => {
    if (!player.tier) return null
    const playersInSameTier = players.filter(p => p.tier === player.tier)
    const positionInTier = playersInSameTier.findIndex(p => p.id === player.id) + 1
    return `${positionInTier}º no Tier ${player.tier}`
  }

  const getTrend = (player: any) => {
    // Pegar os tournament_results e ordenar por data do torneio
    const allResults = player.tournament_results || []
    
    // Só calcular tendência se tiver pelo menos 3 torneios
    if (allResults.length < 3) return null
    
    // Ordenar por data do torneio (mais recente primeiro) e pegar os últimos 3
    const sortedResults = [...allResults].sort((a: any, b: any) => {
      const dateA = a.tournaments?.date || ''
      const dateB = b.tournaments?.date || ''
      return dateB.localeCompare(dateA)
    })
    
    const last3Results = sortedResults.slice(0, 3)
    
    // Calcular quantos foram TOPs (1º ao 4º lugar)
    const topsInLast3 = last3Results.filter((r: any) => {
      const placement = Number(r.placement)
      return placement >= 1 && placement <= 4
    }).length
    
    // 3 TOPs = 100%, 2 TOPs = 66.67%, 1 TOP = 33.33%, 0 TOPs = 0%
    if (topsInLast3 >= 2) { // 2 ou 3 TOPs em 3 torneios
      return { icon: '🔥', text: 'Em alta', color: 'text-green-600 dark:text-green-400' }
    } else if (topsInLast3 === 1) { // 1 TOP em 3 torneios
      return { icon: '➡️', text: 'Estável', color: 'text-gray-600 dark:text-gray-400' }
    } else { // 0 TOPs em 3 torneios
      return { icon: '⚠️', text: 'Em baixa', color: 'text-orange-600 dark:text-orange-400' }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {players.map((player, index) => {
        const trend = getTrend(player)
        const tierPosition = getTierPositionInTier(player)

        return (
          <Card 
            key={player.id} 
            className={`hover:shadow-lg transition-shadow ${getTierBorderColor(player.tier)}`}
          >
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                {/* Posição */}
                <div className="shrink-0">
                  <PositionBadge 
                    position={index + 1} 
                    variant="medal" 
                    size="sm"
                  />
                </div>

                {/* Avatar com Badge de Tier */}
                <div className="relative shrink-0">
                  <PlayerAvatar
                    imageUrl={player.image_url}
                    playerName={player.name}
                    size="md"
                  />
                  {player.tier && (
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${getTierBadgeColor(player.tier)} flex items-center justify-center text-xs font-bold shadow-lg border-2`}>
                      {player.tier}
                    </div>
                  )}
                </div>

                {/* Nome e Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate text-sm sm:text-base">{player.name}</h3>
                  <div className="flex flex-wrap gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <span>{player.totalTournaments} torneio{player.totalTournaments !== 1 ? 's' : ''}</span>
                    {tierPosition && (
                      <span className="text-purple-600 dark:text-purple-400 font-semibold hidden sm:inline">• {tierPosition}</span>
                    )}
                  </div>
                </div>

                {/* Métricas Compactas */}
                <div className="flex gap-1.5 sm:gap-2 md:gap-3 shrink-0">
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-1.5 sm:px-2 py-1 text-center min-w-[2.5rem] sm:min-w-[3rem]">
                    <div className="text-base sm:text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400">
                      {player.points}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400">pts</div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-1.5 sm:px-2 py-1 text-center min-w-[2.5rem] sm:min-w-[3rem]">
                    <div className="text-base sm:text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">
                      {player.totalTops}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400">TOPs</div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg px-1.5 sm:px-2 py-1 text-center min-w-[2.5rem] sm:min-w-[3rem]">
                    <div className="text-base sm:text-lg md:text-xl font-bold text-green-600 dark:text-green-400">
                      {player.topPercentage.toFixed(0)}%
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400">taxa</div>
                  </div>
                </div>
              </div>

              {/* Detalhamento (linha inferior compacta) */}
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    {MEDAL_ICONS[1]} <strong className="text-yellow-600">{player.firstPlace}</strong>
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {MEDAL_ICONS[2]} <strong className="text-gray-500">{player.secondPlace}</strong>
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {MEDAL_ICONS[3]} <strong className="text-amber-600">{player.thirdPlace}</strong>
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {MEDAL_ICONS[4]} <strong>{player.fourthPlace}</strong>
                  </span>
                </div>
                
                {trend && (
                  <div className={`flex items-center gap-1 font-semibold text-xs ${trend.color}`}>
                    <span>{trend.icon}</span>
                    <span>{trend.text}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {players.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Nenhum jogador com resultados ainda.
          </p>
        </div>
      )}
    </div>
  )
}
