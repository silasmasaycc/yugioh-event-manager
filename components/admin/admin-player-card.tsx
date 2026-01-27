'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Edit, Trash2, Plus, Minus } from 'lucide-react'

interface Penalty {
  id: number
  penalty_type: string
  player?: {
    id: number
  }
}

interface Player {
  id: number
  name: string
  image_url?: string
}

interface AdminPlayerCardProps {
  player: Player
  penalties: Penalty[]
  isAdmin: boolean
  onEdit: (player: Player) => void
  onDelete: (playerId: number) => void
  onAddPenalty: (playerId: number, type: string) => void
  onRemovePenalty: (playerId: number, type: string) => void
}

export function AdminPlayerCard({ 
  player, 
  penalties, 
  isAdmin,
  onEdit, 
  onDelete,
  onAddPenalty,
  onRemovePenalty
}: AdminPlayerCardProps) {
  const playerPenalties = penalties.filter(p => p.player?.id === player.id)
  const veteranPenalties = playerPenalties.filter(p => p.penalty_type !== 'beginner')
  const beginnerPenalties = playerPenalties.filter(p => p.penalty_type === 'beginner')

  return (
    <Card>
      <CardContent className="p-4">
        {/* Cabeçalho: Avatar + Nome + Botões de ação */}
        <div className="flex items-center gap-4 mb-3">
          <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100">
            {player.image_url ? (
              <Image
                src={player.image_url}
                alt={player.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-purple-600">
                {player.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold truncate">{player.name}</h3>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(player)}
                title="Editar jogador"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(player.id)}
                title="Excluir jogador"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Seção de Double Loss (separada por tipo) */}
        {(playerPenalties.length > 0 || isAdmin) && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {/* Double Loss Veteranos */}
            {(veteranPenalties.length > 0 || isAdmin) && (
              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Veteranos
                    </span>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
                    <span className="text-sm font-bold text-red-700 dark:text-red-400">
                      {veteranPenalties.length} DL
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    {veteranPenalties.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9 gap-2 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-950/20 border-green-300 dark:border-green-800"
                        onClick={() => onRemovePenalty(player.id, 'regular')}
                      >
                        <Minus className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">Remover</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className={`${veteranPenalties.length > 0 ? 'flex-1' : 'w-full'} h-9 gap-2 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-300 dark:border-red-800`}
                      onClick={() => onAddPenalty(player.id, 'regular')}
                    >
                      <Plus className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-medium text-red-700 dark:text-red-400">Adicionar</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Double Loss Novatos */}
            {(beginnerPenalties.length > 0 || isAdmin) && (
              <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🆕</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Novatos
                    </span>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
                    <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
                      {beginnerPenalties.length} DL
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    {beginnerPenalties.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9 gap-2 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-950/20 border-green-300 dark:border-green-800"
                        onClick={() => onRemovePenalty(player.id, 'beginner')}
                      >
                        <Minus className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">Remover</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className={`${beginnerPenalties.length > 0 ? 'flex-1' : 'w-full'} h-9 gap-2 bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-950/20 border-orange-300 dark:border-orange-800`}
                      onClick={() => onAddPenalty(player.id, 'beginner')}
                    >
                      <Plus className="h-4 w-4 text-orange-600" />
                      <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Adicionar</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
