'use client'

import { Card, CardContent } from '@/components/ui/card'
import { PlayerAvatar } from '@/components/player/player-avatar'

interface PenaltyRankingProps {
  penaltyStats: any[]
}

export function PenaltyRanking({ penaltyStats }: PenaltyRankingProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {penaltyStats.map((player, index) => (
        <Card key={player.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Posição */}
              <div className="text-3xl font-bold text-red-600 min-w-[2.5rem] shrink-0 text-center">
                #{index + 1}
              </div>

              {/* Avatar */}
              <PlayerAvatar
                imageUrl={player.image_url}
                playerName={player.name}
                size="md"
              />

              {/* Nome e Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{player.name}</h3>
                <div className="text-xs text-muted-foreground">
                  {player.totalTournaments} torneio{player.totalTournaments > 1 ? 's' : ''}
                </div>
              </div>

              {/* Estatísticas de Penalidades */}
              <div className="flex gap-2 sm:gap-3">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 text-center min-w-[4.5rem]">
                  <div className="text-2xl sm:text-3xl font-bold text-red-600">
                    {player.totalPenalties}
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400 uppercase tracking-wide">Double Loss</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-2 text-center min-w-[4rem]">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                    {player.penaltyRate.toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400 uppercase tracking-wide">Taxa</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

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
