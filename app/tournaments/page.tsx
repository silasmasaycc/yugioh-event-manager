import { createClient } from '@/lib/supabase/server'
import { TournamentsClient } from './tournaments-client'
import { ERROR_MESSAGES } from '@/lib/constants/messages'
import { logger } from '@/lib/utils/logger'

export const revalidate = 3600 // 1 hora

export default async function TournamentsPage() {
  const supabase = await createClient()

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      tournament_results (
        placement,
        deck_id,
        deck_id_secondary,
        player:players (
          id,
          name,
          image_url
        ),
        deck:decks!tournament_results_deck_id_fkey (
          id,
          name,
          image_url
        ),
        deck_secondary:decks!tournament_results_deck_id_secondary_fkey (
          id,
          name,
          image_url
        )
      )
    `)
    .order('date', { ascending: false })

  if (error) {
    logger.error(ERROR_MESSAGES.LOAD_TOURNAMENTS_ERROR, error)
    return (
      <div className="text-center py-12">
        <p className="text-xl text-red-600">{ERROR_MESSAGES.LOAD_TOURNAMENTS_ERROR}</p>
      </div>
    )
  }

  return <TournamentsClient tournaments={tournaments || []} />
}
