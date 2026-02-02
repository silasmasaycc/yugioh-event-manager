import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { DeckImage } from './deck-image'
import { DeckPlacementMetrics } from './deck-placement-metrics'
import { DeckBadges } from './deck-badges'

export interface DeckCardData {
  deckId: number
  deckName: string
  deckImageUrl?: string | null
  topFourCount: number
  placements: { 1: number; 2: number; 3: number; 4: number }
  primaryUses?: number
  secondaryUses?: number
  veteranUses?: number
  beginnerUses?: number
  totalUses?: number
}

interface DeckCardProps {
  deck: DeckCardData
  showBadges?: boolean
}

/**
 * Componente de card reutilizável para exibição de decks
 * Segue o padrão de design horizontal com imagem, nome, métricas e badges
 * 
 * @param deck - Dados do deck a ser exibido
 * @param showBadges - Se deve mostrar os badges de estatísticas (padrão: true)
 */
export function DeckCard({ deck, showBadges = true }: DeckCardProps) {
  return (
    <Link href={`/decks/${deck.deckId}`}>
      <Card className="group hover:shadow-lg transition-shadow border-purple-200 dark:border-purple-800">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center gap-3 md:gap-4">
            <DeckImage 
              imageUrl={deck.deckImageUrl} 
              deckName={deck.deckName}
              size="md"
            />

            {/* Nome e Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate text-sm sm:text-base">
                {deck.deckName}
              </h3>
              <div className="flex flex-wrap gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <span>
                  {deck.topFourCount} TOP{deck.topFourCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Métricas de Colocação */}
            {deck.topFourCount > 0 && (
              <DeckPlacementMetrics 
                placements={deck.placements}
                showOnlyIfExists={true}
              />
            )}
          </div>

          {/* Badges de Estatísticas */}
          {showBadges && (
            <DeckBadges
              primaryUses={deck.primaryUses}
              secondaryUses={deck.secondaryUses}
              veteranUses={deck.veteranUses}
              beginnerUses={deck.beginnerUses}
            />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
