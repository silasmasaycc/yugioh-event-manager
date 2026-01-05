import { createClient } from '@/lib/supabase/server'
import { PageLayout } from '@/components/layout/page-layout'
import { ERROR_MESSAGES, LABELS } from '@/lib/constants/messages'
import { logger } from '@/lib/utils/logger'
import { TournamentCard } from '@/components/tournaments/tournament-card'

export const revalidate = 3600 // 1 hora

export default async function TournamentsPage() {
  const supabase = await createClient()

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      tournament_results (
        placement,
        player:players (
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
      <PageLayout activeRoute="/tournaments">
        <div className="text-center py-12">
          <p className="text-xl text-red-600">{ERROR_MESSAGES.LOAD_TOURNAMENTS_ERROR}</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout activeRoute="/tournaments">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">{LABELS.TOURNAMENTS}</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Histórico completo de torneios realizados
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tournaments?.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>

      {(!tournaments || tournaments.length === 0) && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {LABELS.NO_TOURNAMENTS}
          </p>
        </div>
      )}
    </PageLayout>
  )
}
