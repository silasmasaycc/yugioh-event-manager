import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Award, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageLayout } from '@/components/layout/page-layout'

export default async function PlayersPage() {
  const supabase = await createClient()

  const { data: players } = await supabase
    .from('players')
    .select(`
      *,
      tournament_results(
        placement,
        tournament_id
      )
    `)
    .order('name')

  // Calcular estatísticas para cada jogador
  const playersWithStats = players?.map(player => {
    const results = player.tournament_results || []
    const participations = results.length
    const tops = results.filter((r: any) => r.placement <= 4).length
    const topPercentage = participations > 0 ? (tops / participations) * 100 : 0

    return {
      ...player,
      participations,
      tops,
      topPercentage
    }
  }).sort((a, b) => b.tops - a.tops) // Ordenar por número de TOPs

  return (
    <PageLayout activeRoute="/players">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">Jogadores</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Lista completa de jogadores cadastrados no sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {playersWithStats?.map((player) => (
            <Card key={player.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="h-48 relative bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
                  {player.image_url ? (
                    <Image
                      src={player.image_url}
                      alt={player.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-purple-600">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg mb-3">{player.name}</CardTitle>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Trophy className="h-4 w-4" />
                      Participações
                    </span>
                    <span className="font-semibold">{player.participations}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Award className="h-4 w-4" />
                      TOPs (1º-4º)
                    </span>
                    <span className="font-semibold text-purple-600">{player.tops}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <TrendingUp className="h-4 w-4" />
                      Taxa de TOPs
                    </span>
                    <span className="font-semibold text-blue-600">
                      {player.topPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      {(!playersWithStats || playersWithStats.length === 0) && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Nenhum jogador cadastrado ainda.
          </p>
        </div>
      )}
    </PageLayout>
  )
}
