import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Users, BarChart3, Calendar, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'

export default async function HomePage() {
  const supabase = await createClient()

  // Get latest stats
  const [
    { count: totalPlayers },
    { count: totalTournaments },
    { data: latestTournaments }
  ] = await Promise.all([
    supabase.from('players').select('*', { count: 'exact', head: true }),
    supabase.from('tournaments').select('*', { count: 'exact', head: true }),
    supabase
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
      .limit(5)
  ])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header activeRoute="/" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Gerencie Seus Torneios de Yu-Gi-Oh!
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Sistema completo para gerenciar eventos, acompanhar estatísticas de jogadores e visualizar rankings em tempo real.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/ranking">
            <Button size="lg">Ver Ranking</Button>
          </Link>
          <Link href="/stats">
            <Button size="lg" variant="outline">Ver Estatísticas</Button>
          </Link>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Jogadores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPlayers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Torneios</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTournaments || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Estatísticas</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link href="/stats">
                <Button variant="link" className="p-0">Ver Detalhes</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Latest Tournaments */}
      <section className="container mx-auto px-4 py-12">
        <h3 className="text-3xl font-bold mb-6">Últimos Torneios</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {latestTournaments?.map((tournament: any) => {
            const topResults = (tournament.tournament_results || [])
              .filter((r: any) => r.placement !== null && r.placement >= 1 && r.placement <= 4)
              .sort((a: any, b: any) => a.placement - b.placement)
              .slice(0, 4)

            return (
              <Card key={tournament.id}>
                <CardHeader>
                  <div className="mb-4">
                    <CardTitle>{tournament.name}</CardTitle>
                    <CardDescription className="flex flex-col gap-2 mt-2">
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
                          const medals: { [key: number]: string } = {
                            1: '🥇',
                            2: '🥈',
                            3: '🥉',
                            4: '4️⃣'
                          }
                          const medal = medals[result.placement] || '🏆'
                          
                          return (
                            <div
                              key={`${result.tournament_id}-${result.placement}`}
                              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <span className="text-2xl flex-shrink-0">{medal}</span>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {result.player?.image_url ? (
                                  <div className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                                    <Image
                                      src={result.player.image_url}
                                      alt={result.player.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-xs font-bold text-purple-600 flex-shrink-0">
                                    {result.player?.name?.charAt(0).toUpperCase()}
                                  </div>
                                )}
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
      </section>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 text-center text-gray-600 dark:text-gray-400">
        <p>© 2024 Yu-Gi-Oh! Event Manager. Desenvolvido com Next.js e Supabase.</p>
      </footer>
    </div>
  )
}
