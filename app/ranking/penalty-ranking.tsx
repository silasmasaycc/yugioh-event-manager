'use client'

import { Card, CardContent } from '@/components/ui/card'
import { PlayerAvatar } from '@/components/player/player-avatar'

interface PenaltyRankingProps {
  penaltyStats: any[]
}

export function PenaltyRanking({ penaltyStats }: PenaltyRankingProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {penaltyStats.map((player, index) => {
        const medals = ['🥇', '🥈', '🥉']
        const position = index < 3 ? medals[index] : `#${index + 1}`
        
        return (
        <Card key={player.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
          <CardContent className="p-2 sm:p-3 md:p-4">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              {/* Posição */}
              <div className="text-2xl sm:text-3xl font-bold text-red-600 min-w-[2rem] sm:min-w-[2.5rem] shrink-0 text-center">
                {position}
              </div>

              {/* Avatar */}
              <div className="shrink-0">
                <PlayerAvatar
                  imageUrl={player.image_url}
                  playerName={player.name}
                  size="md"
                />
              </div>

              {/* Nome e Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate text-sm sm:text-base">{player.name}</h3>
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  {player.totalTournaments} torneio{player.totalTournaments > 1 ? 's' : ''}
                </div>
              </div>

              {/* Estatísticas de Penalidades */}
              <div className="flex gap-1.5 sm:gap-2 md:gap-3 shrink-0">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-center min-w-[3.5rem] sm:min-w-[4.5rem]">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600">
                    {player.totalPenalties}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400 uppercase tracking-wide">Double Loss</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-center min-w-[3rem] sm:min-w-[4rem]">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">
                    {player.penaltyRate.toFixed(0)}%
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400 uppercase tracking-wide">Taxa</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )})}

      {penaltyStats.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Nenhum jogador com Double Loss registrado.
          </p>
        </div>
      )}
    </div>
  )
}
