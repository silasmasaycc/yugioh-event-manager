import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Award, TrendingUp, AlertTriangle, Star } from 'lucide-react'
import type { PlayerStats } from '@/lib/types'
import { PlayerAvatar } from '@/components/player/player-avatar'
import { MEDAL_ICONS } from '@/lib/constants'

interface PlayerCardProps {
  player: PlayerStats & { 
    penalties?: number
    veteranPenalties?: number
    beginnerPenalties?: number
  }
  showPenalties?: boolean
}

export function PlayerCard({ player, showPenalties = true }: PlayerCardProps) {
  // Calcular pontuação total baseado no sistema de pontos
  const totalPoints = (player.firstPlace * 4) + (player.secondPlace * 3) + 
                     (player.thirdPlace * 2) + (player.fourthPlace * 2)


  console.log('Rendering PlayerCard for:', player, 'Total Points:', totalPoints)

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

        {/* Estatísticas principais - 3 colunas */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1 justify-center">
              <Star className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Pontos</span>
            </div>
            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400 text-center">
              {totalPoints}
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1 justify-center">
              <Award className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">TOPs</span>
            </div>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400 text-center">
              {player.totalTops}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1 justify-center">
              <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Taxa</span>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400 text-center">
              {player.topPercentage.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Detalhamento de colocações */}
        {player.totalTops > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Colocações:</span>
                <div className="flex gap-2">
                  {player.firstPlace > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 rounded font-semibold">
                      {MEDAL_ICONS[1]} {player.firstPlace}
                    </span>
                  )}
                  {player.secondPlace > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded font-semibold">
                      {MEDAL_ICONS[2]} {player.secondPlace}
                    </span>
                  )}
                  {player.thirdPlace > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded font-semibold">
                      {MEDAL_ICONS[3]} {player.thirdPlace}
                    </span>
                  )}
                  {player.fourthPlace > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded font-semibold">
                      {MEDAL_ICONS[4]} {player.fourthPlace}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Penalidades (se houver) */}
        {showPenalties && player.penalties !== undefined && player.penalties > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Double Loss
                </span>
              </div>
              <div className="flex items-center gap-3">
                {player.veteranPenalties !== undefined && player.veteranPenalties > 0 && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {player.veteranPenalties}
                    </div>
                  </div>
                )}
                {player.beginnerPenalties !== undefined && player.beginnerPenalties > 0 && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {player.beginnerPenalties}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
