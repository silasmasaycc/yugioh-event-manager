'use client'

import { DeckCard, type DeckCardData } from '@/components/decks'

interface FeaturedDecksProps {
  decks: DeckCardData[]
}

/**
 * Componente para exibir decks em destaque na página inicial
 * Utiliza o componente DeckCard reutilizável
 */
export function FeaturedDecks({ decks }: FeaturedDecksProps) {
  if (decks.length === 0) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {decks.slice(0, 4).map((deck) => (
        <DeckCard 
          key={deck.deckId} 
          deck={deck}
          showBadges={true}
        />
      ))}
    </div>
  )
}
