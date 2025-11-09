import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Medal } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { PlayerStats } from '@/lib/types'

export default async function RankingPage() {
  const supabase = await createClient()

  // Get all players with their tournament results
  const { data: players } = await supabase
    .from('players')
    .select(`
      id,
      name,
      image_url,
      tournament_results(placement, tournament_id)
    `)

  // Calculate statistics for each player
  const playerStats: PlayerStats[] = (players || []).map(player => {
    const results = Array.isArray(player.tournament_results) ? player.tournament_results : []
    const totalTournaments = results.length
    const totalTops = results.filter((r: any) => r.placement <= 4).length
    const topPercentage = totalTournaments > 0 ? (totalTops / totalTournaments) * 100 : 0

    return {
      id: player.id,
      name: player.name,
      image_url: player.image_url,
      totalTournaments,
      totalTops,
      topPercentage,
      firstPlace: results.filter((r: any) => r.placement === 1).length,
      secondPlace: results.filter((r: any) => r.placement === 2).length,
      thirdPlace: results.filter((r: any) => r.placement === 3).length,
      fourthPlace: results.filter((r: any) => r.placement === 4).length,
    }
  })

  // Sort by top percentage and then by total tournaments
  playerStats.sort((a, b) => {
    if (b.topPercentage !== a.topPercentage) {
      return b.topPercentage - a.topPercentage
    }
    return b.totalTournaments - a.totalTournaments
  })

  const getMedalColor = (position: number) => {
    if (position === 0) return 'text-yellow-500'
    if (position === 1) return 'text-gray-400'
    if (position === 2) return 'text-amber-600'
    return 'text-gray-300'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <header className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-purple-600" />
              <Link href="/">
                <h1 className="text-2xl font-bold cursor-pointer hover:text-purple-600">Yu-Gi-Oh! Event Manager</h1>
              </Link>
            </div>
            <nav className="flex gap-4">
              <Link href="/players">
                <Button variant="ghost">Jogadores</Button>
              </Link>
              <Link href="/tournaments">
                <Button variant="ghost">Torneios</Button>
              </Link>
              <Link href="/ranking">
                <Button variant="default">Ranking</Button>
              </Link>
              <Link href="/stats">
                <Button variant="ghost">Estatísticas</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Login Admin</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Ranking de Jogadores</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Classificação baseada em performance nos torneios
          </p>
        </div>

        <div className="space-y-4">
          {playerStats.map((player, index) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className={`text-4xl font-bold ${getMedalColor(index)} min-w-[3rem] text-center`}>
                    {index < 3 ? <Medal className="h-12 w-12 mx-auto" /> : `#${index + 1}`}
                  </div>

                  <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
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

                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{player.name}</h3>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{player.totalTournaments} torneios</span>
                      <span>{player.totalTops} TOPs</span>
                      <span className="font-semibold text-purple-600">
                        {player.topPercentage.toFixed(1)}% de aproveitamento
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-yellow-500">{player.firstPlace}</div>
                      <div className="text-xs text-muted-foreground">1º lugar</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-400">{player.secondPlace}</div>
                      <div className="text-xs text-muted-foreground">2º lugar</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-amber-600">{player.thirdPlace}</div>
                      <div className="text-xs text-muted-foreground">3º lugar</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{player.fourthPlace}</div>
                      <div className="text-xs text-muted-foreground">4º lugar</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {playerStats.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Nenhum jogador com resultados ainda.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
