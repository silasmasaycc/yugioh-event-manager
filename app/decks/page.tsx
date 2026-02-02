import { createClient } from '@/lib/supabase/server'
import { DecksClient } from './decks-client'
import { ERROR_MESSAGES } from '@/lib/constants/messages'
import { logger } from '@/lib/utils/logger'

export const revalidate = 3600 // 1 hora

export default async function DecksPage() {
  const supabase = await createClient()

  // Buscar todos os decks com suas estatísticas
  const { data: decks, error: decksError } = await supabase
    .from('decks')
    .select('id, name, image_url')
    .order('name', { ascending: true })

  // Buscar resultados de torneios para calcular estatísticas
  const { data: results, error: resultsError } = await supabase
    .from('tournament_results')
    .select(`
      deck_id,
      deck_id_secondary,
      placement,
      tournament:tournaments!inner (
        tournament_type
      )
    `)
    .in('placement', [1, 2, 3, 4])

  if (decksError || resultsError) {
    logger.error(ERROR_MESSAGES.LOAD_TOURNAMENTS_ERROR, decksError || resultsError)
    return (
      <div className="text-center py-12">
        <p className="text-xl text-red-600">Erro ao carregar decks</p>
      </div>
    )
  }

  // Calcular estatísticas para cada deck
  const deckStats = new Map<number, {
    deckId: number
    deckName: string
    deckImageUrl: string | null
    totalUses: number
    wins: number
    topFourCount: number
    winRate: number
    primaryUses: number
    secondaryUses: number
    veteranUses: number
    beginnerUses: number
    placements: { 1: number; 2: number; 3: number; 4: number }
  }>()

  results?.forEach((result: any) => {
    const tournamentType = result.tournament?.tournament_type

    // Processar deck principal
    if (result.deck_id) {
      if (!deckStats.has(result.deck_id)) {
        const deck = decks?.find(d => d.id === result.deck_id)
        if (deck) {
          deckStats.set(result.deck_id, {
            deckId: result.deck_id,
            deckName: deck.name,
            deckImageUrl: deck.image_url,
            totalUses: 0,
            wins: 0,
            topFourCount: 0,
            winRate: 0,
            primaryUses: 0,
            secondaryUses: 0,
            veteranUses: 0,
            beginnerUses: 0,
            placements: { 1: 0, 2: 0, 3: 0, 4: 0 }
          })
        }
      }
      const stats = deckStats.get(result.deck_id)
      if (stats) {
        stats.topFourCount++
        stats.primaryUses++
        if (result.placement === 1) stats.wins++
        stats.placements[result.placement as 1 | 2 | 3 | 4]++
        if (tournamentType === 'beginner') {
          stats.beginnerUses++
        } else {
          stats.veteranUses++
        }
      }
    }

    // Processar deck secundário
    if (result.deck_id_secondary) {
      if (!deckStats.has(result.deck_id_secondary)) {
        const deck = decks?.find(d => d.id === result.deck_id_secondary)
        if (deck) {
          deckStats.set(result.deck_id_secondary, {
            deckId: result.deck_id_secondary,
            deckName: deck.name,
            deckImageUrl: deck.image_url,
            totalUses: 0,
            wins: 0,
            topFourCount: 0,
            winRate: 0,
            primaryUses: 0,
            secondaryUses: 0,
            veteranUses: 0,
            beginnerUses: 0,
            placements: { 1: 0, 2: 0, 3: 0, 4: 0 }
          })
        }
      }
      const stats = deckStats.get(result.deck_id_secondary)
      if (stats) {
        stats.totalUses++
        stats.topFourCount++
        stats.secondaryUses++
        stats.placements[result.placement as 1 | 2 | 3 | 4]++
        if (tournamentType === 'beginner') {
          stats.beginnerUses++
        } else {
          stats.veteranUses++
        }
      }
    }
  })

  // Calcular win rate e converter para array
  const decksWithStats = Array.from(deckStats.values()).map(deck => ({
    ...deck,
    winRate: deck.topFourCount > 0 ? (deck.wins / deck.topFourCount) * 100 : 0
  }))

  // Adicionar decks sem estatísticas
  const decksWithoutStats = decks?.filter(deck => !deckStats.has(deck.id)).map(deck => ({
    deckId: deck.id,
    deckName: deck.name,
    deckImageUrl: deck.image_url,
    totalUses: 0,
    wins: 0,
    topFourCount: 0,
    winRate: 0,
    primaryUses: 0,
    secondaryUses: 0,
    veteranUses: 0,
    beginnerUses: 0,
    placements: { 1: 0, 2: 0, 3: 0, 4: 0 }
  })) || []

  const allDecks = [...decksWithStats, ...decksWithoutStats]

  return <DecksClient decks={allDecks} />
}
