import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Trash2 } from 'lucide-react'
import type { Player, Penalty } from '@/lib/types'
import { PlayerAvatar } from '@/components/player/player-avatar'

interface PlayerListProps {
  players: Player[]
  penalties: Penalty[]
  isAdmin: boolean
  onEdit: (player: Player) => void
  onDelete: (id: number) => void
  onAddPenalty: (player: Player) => void
  onRemovePenalty: (penaltyId: string) => void
}

export function PlayerList({ 
  players, 
  penalties,
  isAdmin, 
  onEdit, 
  onDelete,
  onAddPenalty,
  onRemovePenalty
}: PlayerListProps) {
  const getPlayerPenalties = (playerId: number) => {
    return penalties.filter(p => p.player_id === playerId)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {players.map((player) => {
        const playerPenalties = getPlayerPenalties(player.id)
        
        return (
          <Card key={player.id} className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="h-32 relative bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <PlayerAvatar
                  imageUrl={player.image_url}
                  playerName={player.name}
                  size="xl"
                  className="!w-24 !h-24 !text-4xl"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-base mb-3 flex items-center justify-between">
                <span className="truncate">{player.name}</span>
                {playerPenalties.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ⚠️ {playerPenalties.length}
                  </span>
                )}
              </CardTitle>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(player)}
                  disabled={!isAdmin}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(player.id)}
                  disabled={!isAdmin}
                  className="flex-1"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Excluir
                </Button>
              </div>

              <div className="mt-3 pt-3 border-t flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAddPenalty(player)}
                  className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
                >
                  Double Loss
                </Button>
                {playerPenalties.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const penalty = playerPenalties[playerPenalties.length - 1]
                      onRemovePenalty(penalty.id)
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-600"
                  >
                    -1
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
