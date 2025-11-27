import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Trash2, Calendar, Users, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { TournamentWithResults } from '@/lib/types'
import { PlayerAvatar } from '@/components/player/player-avatar'
import { MEDAL_ICONS } from '@/lib/constants'

interface TournamentListProps {
  tournaments: TournamentWithResults[]
  isAdmin: boolean
  onEdit: (tournament: TournamentWithResults) => void
  onDelete: (id: number) => void
}

export function TournamentList({ tournaments, isAdmin, onEdit, onDelete }: TournamentListProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {tournaments.map((tournament) => {
        const topResults = (tournament.tournament_results || [])
          .filter((r) => r.placement !== null && r.placement >= 1 && r.placement <= 4)
          .sort((a, b) => (a.placement || 0) - (b.placement || 0))
          .slice(0, 4)

        return (
          <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{tournament.name}</CardTitle>
                  <CardDescription className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs">{formatDate(tournament.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span className="text-xs">{tournament.player_count} jogadores</span>
                    </div>
                    {tournament.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="text-xs">{tournament.location}</span>
                      </div>
                    )}
                  </CardDescription>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(tournament)}
                    disabled={!isAdmin}
                    className="h-8 w-8"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(tournament.id)}
                    disabled={!isAdmin}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {topResults.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-xs font-semibold mb-2 text-gray-700">TOP 4</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {topResults.map((result) => {
                      const medal = MEDAL_ICONS[result.placement as 1 | 2 | 3 | 4] || '🏆'
                      
                      return (
                        <div
                          key={`${result.tournament_id}-${result.placement}`}
                          className="flex items-center gap-2 p-1.5 rounded bg-gray-50 text-xs"
                        >
                          <span className="text-base">{medal}</span>
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <PlayerAvatar
                              imageUrl={result.player?.image_url}
                              playerName={result.player?.name || 'N/A'}
                              size="xs"
                            />
                            <span className="truncate font-medium">{result.player?.name || 'N/A'}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}
