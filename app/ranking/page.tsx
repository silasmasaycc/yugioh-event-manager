import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Medal } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
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
    const totalTops = results.filter((r: any) => r.placement !== null && r.placement <= 4).length
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

  // Sort by performance: prioritize 1st places, then 2nd, then 3rd, then 4th, then total TOPs
  playerStats.sort((a, b) => {
    // Primeiro critério: número de 1º lugares
    if (b.firstPlace !== a.firstPlace) {
      return b.firstPlace - a.firstPlace
    }
    // Segundo critério: número de 2º lugares
    if (b.secondPlace !== a.secondPlace) {
      return b.secondPlace - a.secondPlace
    }
    // Terceiro critério: número de 3º lugares
    if (b.thirdPlace !== a.thirdPlace) {
      return b.thirdPlace - a.thirdPlace
    }
    // Quarto critério: número de 4º lugares
    if (b.fourthPlace !== a.fourthPlace) {
      return b.fourthPlace - a.fourthPlace
    }
    // Quinto critério: total de TOPs
    if (b.totalTops !== a.totalTops) {
      return b.totalTops - a.totalTops
    }
    // Último critério: total de participações
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
      <Header activeRoute="/ranking" />

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
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {/* Linha 1: Medalha + Foto + Nome */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className={`text-4xl font-bold ${getMedalColor(index)} min-w-[3rem] shrink-0 text-center`}>
                      {index < 3 ? <Medal className="h-12 w-12 mx-auto" /> : `#${index + 1}`}
                    </div>

                    <div className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
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

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold mb-1 truncate">{player.name}</h3>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span>{player.totalTournaments} torneios</span>
                        <span>{player.totalTops} TOPs</span>
                        <span className="font-semibold text-purple-600">
                          {player.topPercentage.toFixed(1)}% aproveitamento
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grid de Medalhas */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center w-full sm:w-auto sm:ml-auto">
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-yellow-500">{player.firstPlace}</div>
                      <div className="text-xs text-muted-foreground">1º</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-400">{player.secondPlace}</div>
                      <div className="text-xs text-muted-foreground">2º</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-amber-600">{player.thirdPlace}</div>
                      <div className="text-xs text-muted-foreground">3º</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold">{player.fourthPlace}</div>
                      <div className="text-xs text-muted-foreground">4º</div>
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
