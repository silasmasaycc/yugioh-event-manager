'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Edit, Trash2 } from 'lucide-react'

interface Deck {
  id: number
  name: string
  image_url?: string
}

interface AdminDeckCardProps {
  deck: Deck
  isAdmin: boolean
  onEdit: (deck: Deck) => void
  onDelete: (deckId: number) => void
}

export function AdminDeckCard({ 
  deck, 
  isAdmin,
  onEdit, 
  onDelete
}: AdminDeckCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        {/* Cabeçalho: Avatar + Nome + Botões de ação */}
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
            {deck.image_url ? (
              <Image
                src={deck.image_url}
                alt={deck.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400">
                {deck.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold truncate">{deck.name}</h3>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(deck)}
                title="Editar deck"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(deck.id)}
                title="Excluir deck"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
