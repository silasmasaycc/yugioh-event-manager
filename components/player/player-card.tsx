import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Award, TrendingUp, AlertTriangle } from 'lucide-react'
import type { PlayerStats } from '@/lib/types'
import { PlayerAvatar } from '@/components/player/player-avatar'

interface PlayerCardProps {
  player: PlayerStats & { penalties?: number }
  showPenalties?: boolean
}

export function PlayerCard({ player, showPenalties = true }: PlayerCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] duration-200">
      <CardContent className="p-5">
        {/* Cabeçalho: Avatar + Nome */}
        <div className="flex items-center gap-4 mb-4">
          <PlayerAvatar 
            imageUrl={player.image_url}
            playerName={player.name}
            size="lg"
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold truncate">{player.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {player.totalTournaments} {player.totalTournaments === 1 ? 'torneio' : 'torneios'}
            </p>
          </div>
        </div>

        {/* Estatísticas principais */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">TOPs</span>
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {player.totalTops}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Taxa</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {player.topPercentage.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Penalidades (se houver) */}
        {showPenalties && player.penalties !== undefined && player.penalties > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Double Loss
                </span>
              </div>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {player.penalties}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
