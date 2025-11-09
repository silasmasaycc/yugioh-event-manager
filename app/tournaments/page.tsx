import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, MapPin, Users, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { PageLayout } from '@/components/layout/page-layout'

export default async function TournamentsPage() {
  const supabase = await createClient()

  const { data: tournaments } = await supabase
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

  return (
    <PageLayout activeRoute="/tournaments">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">Torneios</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Histórico completo de torneios realizados
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tournaments?.map((tournament) => {
            // Ordenar resultados por placement e pegar top 4
            const topResults = (tournament.tournament_results || [])
              .sort((a: any, b: any) => a.placement - b.placement)
              .slice(0, 4)

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
                          const medals = ['🥇', '🥈', '🥉', '4️⃣']
                          return (
                            <div
                              key={result.placement}
                              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <span className="text-2xl">{medals[result.placement - 1]}</span>
                              <div className="flex items-center gap-2 flex-1">
                                {result.player?.image_url ? (
                                  <div className="relative h-8 w-8 rounded-full overflow-hidden">
                                    <Image
                                      src={result.player.image_url}
                                      alt={result.player.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-xs font-bold text-purple-600">
                                    {result.player?.name?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-sm font-medium">{result.player?.name || 'N/A'}</span>
                              </div>
                              <span className="text-xs text-gray-500">{result.placement}º lugar</span>
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
            Nenhum torneio cadastrado ainda.
          </p>
        </div>
      )}
    </PageLayout>
  )
}
