import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Users, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { PageLayout } from '@/components/layout/page-layout'
import { REVALIDATE_TIME, TOP_POSITIONS, MEDAL_EMOJIS } from '@/lib/constants'
import { ERROR_MESSAGES, LABELS } from '@/lib/constants/messages'
import { PlayerAvatar } from '@/components/player/player-avatar'
import { logger } from '@/lib/utils/logger'

export const revalidate = REVALIDATE_TIME

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
          {tournaments?.map((tournament) => {
            // Ordenar resultados por placement e pegar top 4
            const topResults = (tournament.tournament_results || [])
              .filter((result: any) => result.placement !== null && result.placement >= 1 && result.placement <= TOP_POSITIONS)
              .sort((resultA: any, resultB: any) => resultA.placement - resultB.placement)
              .slice(0, TOP_POSITIONS)

            return (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div>
                    <CardTitle className="text-2xl mb-2">{tournament.name}</CardTitle>
                    <CardDescription className="flex flex-col gap-2">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(tournament.date)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {tournament.player_count} jogadores
                      </span>
                      {tournament.location && (
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {tournament.location}
                        </span>
                      )}
                    </CardDescription>
                  </div>

                  {topResults.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-3 text-gray-700">Classificação Final</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {topResults.map((result: any) => {
                          const medal = MEDAL_EMOJIS[result.placement as keyof typeof MEDAL_EMOJIS] || '🏆'
                          
                          return (
                            <div
                              key={`${result.tournament_id}-${result.placement}`}
                              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <span className="text-2xl flex-shrink-0">{medal}</span>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <PlayerAvatar
                                  imageUrl={result.player?.image_url}
                                  playerName={result.player?.name || 'N/A'}
                                  size="sm"
                                />
                                <span className="text-sm font-medium truncate">{result.player?.name || 'N/A'}</span>
                              </div>
                              <span className="text-xs text-gray-500 flex-shrink-0">{result.placement}º</span>
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
