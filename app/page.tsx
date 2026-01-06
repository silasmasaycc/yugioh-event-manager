import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Users, BarChart3, TrendingUp, Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { calculatePlayerStats, sortPlayersByPerformance } from '@/lib/utils/player-stats'
import { PlayerAvatar } from '@/components/player/player-avatar'
import { TournamentCard } from '@/components/tournaments/tournament-card'

export const revalidate = 3600 // 1 hora

export default async function HomePage() {
  const supabase = await createClient()

  // Get latest stats and top players
  const [
    { count: totalPlayers },
    { count: totalTournaments },
    { data: latestTournaments },
    { data: allPlayers }
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
      .limit(2),
    supabase
      .from('players')
      .select(`
        *,
        tournament_results(placement, tournament_id),
        penalties(player_id)
      `)
  ])

  // Calculate all players with points and stats
  const playersWithStats = allPlayers
    ?.map(player => {
      const stats = calculatePlayerStats(player, player.penalties || [])
      const points = (stats.firstPlace * 4) + (stats.secondPlace * 3) + (stats.thirdPlace * 2) + (stats.fourthPlace * 2)
      return { ...stats, points }
    })
    .sort(sortPlayersByPerformance) || []

  // Classify players into tiers based on performance
  const getTier = (player: any, index: number, total: number, avgPoints: number) => {
    // Only players with at least 1 tournament can have a tier
    if (player.totalTournaments < 1) return null
    
    // Calculate percentile position
    const percentile = (index / total) * 100
    
    // S Tier: Elite - Top 10% with exceptional performance (≥51% TOP rate) and above average points
    if (percentile < 10 && player.topPercentage >= 51 && player.points >= avgPoints) {
      return 'S'
    }
    
    // A Tier: Advanced - Top 30% with good performance (≥40% TOP rate) and points near/above average
    if (percentile < 30 && player.topPercentage >= 40 && player.points >= avgPoints * 0.7) {
      return 'A'
    }
    
    // B Tier: Competitive - Top 60% with ≥50% of average points
    if (percentile < 60 && player.points >= avgPoints * 0.5) {
      return 'B'
    }
    
    // C Tier: Emerging - Top 85% with active participation and ≥30% of average points
    if (percentile < 85 && player.points >= avgPoints * 0.3) {
      return 'C'
    }
    
    // D Tier: Development - Remaining active players
    return 'D'
  }

  // Calculate average points of top 10 players (more competitive benchmark)
  const top10Players = playersWithStats.slice(0, 10).filter(p => p.points > 0)
  const avgPoints = top10Players.length > 0 
    ? Math.ceil(top10Players.reduce((sum, p) => sum + p.points, 0) / top10Players.length)
    : 0

  // Calculate tier slot counts based on eligible players (exclusive percentages)
  const eligiblePlayersCount = playersWithStats.filter(p => p.totalTournaments >= 1).length
  const tierSlots = {
    S: Math.max(1, Math.floor(eligiblePlayersCount * 0.10)), // Top 10% (exclusive) - rounded down
    A: Math.max(1, Math.floor(eligiblePlayersCount * 0.20)), // Next 20% (10% to 30%) - rounded down
    B: Math.max(1, Math.floor(eligiblePlayersCount * 0.30))  // Next 30% (30% to 60%) - rounded down
  }

  // Classify players into tiers (only those with 1+ tournament)
  const tiersList = playersWithStats
    .map((player, index) => ({
      ...player,
      tier: getTier(player, index, playersWithStats.length, avgPoints)
    }))
    .filter(player => player.tier !== null) // Remove players without tier

  const tierGroups = {
    S: tiersList.filter(p => p.tier === 'S'),
    A: tiersList.filter(p => p.tier === 'A'),
    B: tiersList.filter(p => p.tier === 'B'),
    C: tiersList.filter(p => p.tier === 'C'),
    D: tiersList.filter(p => p.tier === 'D')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header activeRoute="/" />

      {/* Stats Cards */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total de Jogadores</CardTitle>
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalPlayers || 0}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Cadastrados no sistema</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Total de Torneios</CardTitle>
              <Trophy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{totalTournaments || 0}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Eventos realizados</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Análise Completa</CardTitle>
              <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <Link href="/stats">
                <Button variant="link" className="p-0 h-auto text-green-700 dark:text-green-300 text-base font-semibold hover:text-green-600">
                  Ver Estatísticas →
                </Button>
              </Link>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">Gráficos e insights</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Player Tier Rankings */}
      {playersWithStats.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="inline-block mb-3 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 rounded-full border-2 border-purple-300 dark:border-purple-700">
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                📊 {tiersList.length} {tiersList.length === 1 ? 'jogador ranqueado' : 'jogadores ranqueados'} em 5 tiers
              </p>
            </div>
            <h3 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <Award className="h-8 w-8 text-yellow-500" />
              Classificação por Tiers
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Jogadores classificados por nível de desempenho
            </p>
          </div>

          {/* Tier Explanation */}
          <Card className="mb-6 max-w-6xl mx-auto bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Como funciona a classificação por Tiers?
              </h4>
              
              <div className="mb-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-purple-200 dark:border-purple-700">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Sistema Dinâmico de Rankings:</strong> Os jogadores são classificados por desempenho relativo, 
                  taxa de TOPs e pontuação comparada à média geral. Apenas jogadores com pelo menos 1 torneio são ranqueados.
                </p>

                {/* Média Geral */}
                <div className="mb-3 p-3 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 rounded-lg border-2 border-purple-400 dark:border-purple-500">
                  <div className="text-center">
                    <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">Média Geral de Pontuação</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{avgPoints} <span className="text-sm">pontos</span></p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Calculada dos 10 melhores jogadores do ranking e arredondada para cima</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  📋 Para detalhes sobre <strong>sistema de pontuação</strong> e <strong>critérios de ordenação</strong>, visite a{' '}
                  <Link href="/ranking" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">
                    página de Ranking
                  </Link>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 p-3 rounded-lg border-2 border-red-300 dark:border-red-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">S</div>
                    <span className="font-bold text-red-700 dark:text-red-400">Elite</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                    <p>🎯 Até {tierSlots.S} {tierSlots.S === 1 ? 'vaga' : 'vagas'}</p>
                    <p>🏆 ≥51% TOPs</p>
                    <p>📈 ≥{avgPoints} pts</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 p-3 rounded-lg border-2 border-yellow-300 dark:border-yellow-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">A</div>
                    <span className="font-bold text-yellow-700 dark:text-yellow-400">Forte</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                    <p>🎯 Até {tierSlots.A} {tierSlots.A === 1 ? 'vaga' : 'vagas'}</p>
                    <p>🏆 ≥40% TOPs</p>
                    <p>📈 ≥{Math.ceil(avgPoints * 0.7)} pts</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-3 rounded-lg border-2 border-green-300 dark:border-green-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">B</div>
                    <span className="font-bold text-green-700 dark:text-green-400">Sólido</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                    <p>🎯 Até {tierSlots.B} {tierSlots.B === 1 ? 'vaga' : 'vagas'}</p>
                    <p>📈 ≥{Math.ceil(avgPoints * 0.5)} pts</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 p-3 rounded-lg border-2 border-blue-300 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">C</div>
                    <span className="font-bold text-blue-700 dark:text-blue-400">Emergente</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                    <p>� Jogadores emergentes</p>
                    <p>📈 ≥{Math.ceil(avgPoints * 0.3)} pts</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-500 to-slate-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">D</div>
                    <span className="font-bold text-gray-700 dark:text-gray-400">Promessa</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                    <p>👤 Jogadores ativos</p>
                    <p>🌟 Com potencial</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 max-w-6xl mx-auto">
            {/* S Tier */}
            {tierGroups.S.length > 0 && (
              <Card className="border-2 border-red-500 dark:border-red-600 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      S
                    </div>
                    <div>
                      <div className="text-xl font-bold text-red-700 dark:text-red-400">Tier S - Elite</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">🏆 Os melhores jogadores da comunidade</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <div className="mx-6 mb-4 p-3 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 rounded">
                  <div className="text-sm text-red-900 dark:text-red-200 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-semibold">🎯 Vagas: {tierGroups.S.length}/{tierSlots.S} {tierGroups.S.length >= tierSlots.S ? 'ocupadas' : 'disponíveis'}</span>
                    <span>•</span>
                    <span>🏆 ≥51% de TOPs</span>
                    <span>•</span>
                    <span>📈 ≥{avgPoints} pontos</span>
                  </div>
                </div>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {tierGroups.S.map((player, index) => {
                      const nextTierThreshold = Math.ceil(avgPoints * 0.7) // Tier A threshold
                      const pointsToA = Math.max(0, nextTierThreshold - player.points)
                      return (
                      <Card key={player.id} className="hover:shadow-lg transition-all border-red-200 dark:border-red-800">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative">
                              <PlayerAvatar
                                imageUrl={player.image_url}
                                playerName={player.name}
                                size="md"
                              />
                              <div className="absolute -top-1 -left-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold truncate">{player.name}</div>
                              <div className="text-xs text-gray-500">{player.points} pontos • {player.topPercentage.toFixed(0)}% TOPs</div>
                              {pointsToA > 0 && pointsToA <= 3 && tierGroups.S.length >= tierSlots.S && (
                                <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-1">
                                  ⚠️ A {pointsToA} pt{pointsToA > 1 ? 's' : ''} do Tier A
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            {player.firstPlace > 0 && <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded px-2 py-1">🏆 {player.firstPlace}</div>}
                            {player.secondPlace > 0 && <div className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">🌟 {player.secondPlace}</div>}
                            {player.thirdPlace > 0 && <div className="bg-orange-100 dark:bg-orange-900/30 rounded px-2 py-1">🔶 {player.thirdPlace}</div>}
                            {player.fourthPlace > 0 && <div className="bg-blue-100 dark:bg-blue-900/30 rounded px-2 py-1">🔷 {player.fourthPlace}</div>}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* A Tier */}
            {tierGroups.A.length > 0 && (
              <Card className="border-2 border-yellow-500 dark:border-yellow-600 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      A
                    </div>
                    <div>
                      <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400">Tier A - Forte</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">⭐ Jogadores experientes e consistentes</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <div className="mx-6 mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 rounded">
                  <div className="text-sm text-yellow-900 dark:text-yellow-200 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-semibold">🎯 Vagas: {tierGroups.A.length}/{tierSlots.A} {tierGroups.A.length >= tierSlots.A ? 'ocupadas' : 'disponíveis'}</span>
                    <span>•</span>
                    <span>🏆 ≥40% de TOPs</span>
                    <span>•</span>
                    <span>📈 ≥{Math.ceil(avgPoints * 0.7)} pontos</span>
                  </div>
                </div>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {tierGroups.A.map((player, index) => {
                      const upperTierThreshold = avgPoints // Tier S threshold
                      const lowerTierThreshold = Math.ceil(avgPoints * 0.5) // Tier B threshold
                      const pointsToS = Math.max(0, upperTierThreshold - player.points)
                      const pointsToB = Math.max(0, player.points - lowerTierThreshold)
                      return (
                      <Card key={player.id} className="hover:shadow-lg transition-all border-yellow-200 dark:border-yellow-800">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative">
                              <PlayerAvatar
                                imageUrl={player.image_url}
                                playerName={player.name}
                                size="md"
                              />
                              <div className="absolute -top-1 -left-1 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold truncate">{player.name}</div>
                              <div className="text-xs text-gray-500">{player.points} pontos • {player.topPercentage.toFixed(0)}% TOPs</div>
                              {pointsToS > 0 && pointsToS <= 3 && (
                                <div className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                                  🔥 A {pointsToS} pt{pointsToS > 1 ? 's' : ''} do Tier S
                                </div>
                              )}
                              {pointsToB > 0 && pointsToB <= 3 && tierGroups.A.length >= tierSlots.A && (
                                <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-1">
                                  ⚠️ A {pointsToB} pt{pointsToB > 1 ? 's' : ''} do Tier B
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            {player.firstPlace > 0 && <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded px-2 py-1">🏆 {player.firstPlace}</div>}
                            {player.secondPlace > 0 && <div className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">🌟 {player.secondPlace}</div>}
                            {player.thirdPlace > 0 && <div className="bg-orange-100 dark:bg-orange-900/30 rounded px-2 py-1">🔶 {player.thirdPlace}</div>}
                            {player.fourthPlace > 0 && <div className="bg-blue-100 dark:bg-blue-900/30 rounded px-2 py-1">🔷 {player.fourthPlace}</div>}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* B Tier */}
            {tierGroups.B.length > 0 && (
              <Card className="border-2 border-green-500 dark:border-green-600 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      B
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-700 dark:text-green-400">Tier B - Sólido</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">👍 Jogadores competitivos em evolução</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <div className="mx-6 mb-4 p-3 bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 rounded">
                  <div className="text-sm text-green-900 dark:text-green-200 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-semibold">🎯 Vagas: {tierGroups.B.length}/{tierSlots.B} {tierGroups.B.length >= tierSlots.B ? 'ocupadas' : 'disponíveis'}</span>
                    <span>•</span>
                    <span>📈 ≥{Math.ceil(avgPoints * 0.5)} pontos</span>
                  </div>
                </div>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {tierGroups.B.map((player, index) => {
                      const upperTierThreshold = Math.ceil(avgPoints * 0.7) // Tier A threshold
                      const lowerTierThreshold = Math.ceil(avgPoints * 0.3) // Tier C threshold
                      const pointsToA = Math.max(0, upperTierThreshold - player.points)
                      const pointsToC = Math.max(0, player.points - lowerTierThreshold)
                      return (
                      <Card key={player.id} className="hover:shadow-lg transition-all border-green-200 dark:border-green-800">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative">
                              <PlayerAvatar
                                imageUrl={player.image_url}
                                playerName={player.name}
                                size="md"
                              />
                              <div className="absolute -top-1 -left-1 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold truncate">{player.name}</div>
                              <div className="text-xs text-gray-500">{player.points} pontos • {player.topPercentage.toFixed(0)}% TOPs</div>
                              {pointsToA > 0 && pointsToA <= 3 && (
                                <div className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                                  🔥 A {pointsToA} pt{pointsToA > 1 ? 's' : ''} do Tier A
                                </div>
                              )}
                              {pointsToC > 0 && pointsToC <= 3 && tierGroups.B.length >= tierSlots.B && (
                                <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-1">
                                  ⚠️ A {pointsToC} pt{pointsToC > 1 ? 's' : ''} do Tier C
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            {player.firstPlace > 0 && <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded px-2 py-1">🏆 {player.firstPlace}</div>}
                            {player.secondPlace > 0 && <div className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">🌟 {player.secondPlace}</div>}
                            {player.thirdPlace > 0 && <div className="bg-orange-100 dark:bg-orange-900/30 rounded px-2 py-1">🔶 {player.thirdPlace}</div>}
                            {player.fourthPlace > 0 && <div className="bg-blue-100 dark:bg-blue-900/30 rounded px-2 py-1">🔷 {player.fourthPlace}</div>}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* C Tier */}
            {tierGroups.C.length > 0 && (
              <Card className="border-2 border-blue-400 dark:border-blue-600 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      C
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-400">Tier C - Emergente</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">🌱 Jogadores emergentes em ascensão</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <div className="mx-6 mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded">
                  <div className="text-sm text-blue-900 dark:text-blue-200 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-semibold">🌱 Sem limite de vagas</span>
                    <span>•</span>
                    <span>📈 ≥{Math.ceil(avgPoints * 0.3)} pontos</span>
                  </div>
                </div>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {tierGroups.C.map((player, index) => {
                      const upperTierThreshold = Math.ceil(avgPoints * 0.5) // Tier B threshold
                      const pointsToB = Math.max(0, upperTierThreshold - player.points)
                      return (
                      <Card key={player.id} className="hover:shadow-lg transition-all border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative">
                              <PlayerAvatar
                                imageUrl={player.image_url}
                                playerName={player.name}
                                size="md"
                              />
                              <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold truncate">{player.name}</div>
                              <div className="text-xs text-gray-500">{player.points} pontos • {player.topPercentage.toFixed(0)}% TOPs</div>
                              {pointsToB > 0 && pointsToB <= 3 && (
                                <div className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                                  🔥 A {pointsToB} pt{pointsToB > 1 ? 's' : ''} do Tier B
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            {player.firstPlace > 0 && <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded px-2 py-1">🏆 {player.firstPlace}</div>}
                            {player.secondPlace > 0 && <div className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">🌟 {player.secondPlace}</div>}
                            {player.thirdPlace > 0 && <div className="bg-orange-100 dark:bg-orange-900/30 rounded px-2 py-1">🔶 {player.thirdPlace}</div>}
                            {player.fourthPlace > 0 && <div className="bg-blue-100 dark:bg-blue-900/30 rounded px-2 py-1">🔷 {player.fourthPlace}</div>}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* D Tier */}
            {tierGroups.D.length > 0 && (
              <Card className="border-2 border-gray-400 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-500 to-slate-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      D
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-700 dark:text-gray-400">Tier D - Promessa</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">👤 Jogadores com potencial em crescimento</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <div className="mx-6 mb-4 p-3 bg-gray-100 dark:bg-gray-800/50 border-l-4 border-gray-500 rounded">
                  <div className="text-sm text-gray-900 dark:text-gray-200 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-semibold">👤 Sem limite de vagas</span>
                    <span>•</span>
                    <span>🌟 Pelo menos 1 torneio</span>
                  </div>
                </div>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {tierGroups.D.map((player, index) => {
                      const upperTierThreshold = Math.ceil(avgPoints * 0.3) // Tier C threshold
                      const pointsToC = Math.max(0, upperTierThreshold - player.points)
                      return (
                      <Card key={player.id} className="hover:shadow-lg transition-all border-gray-200 dark:border-gray-800">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative">
                              <PlayerAvatar
                                imageUrl={player.image_url}
                                playerName={player.name}
                                size="md"
                              />
                              <div className="absolute -top-1 -left-1 w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold truncate">{player.name}</div>
                              <div className="text-xs text-gray-500">{player.points} pontos • {player.topPercentage.toFixed(0)}% TOPs</div>
                              {pointsToC > 0 && pointsToC <= 3 && (
                                <div className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                                  🔥 A {pointsToC} pt{pointsToC > 1 ? 's' : ''} do Tier C
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            {player.firstPlace > 0 && <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded px-2 py-1">🏆 {player.firstPlace}</div>}
                            {player.secondPlace > 0 && <div className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">🌟 {player.secondPlace}</div>}
                            {player.thirdPlace > 0 && <div className="bg-orange-100 dark:bg-orange-900/30 rounded px-2 py-1">🔶 {player.thirdPlace}</div>}
                            {player.fourthPlace > 0 && <div className="bg-blue-100 dark:bg-blue-900/30 rounded px-2 py-1">🔷 {player.fourthPlace}</div>}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Latest Tournaments */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-3xl font-bold mb-2">Últimos Torneios</h3>
            <p className="text-gray-600 dark:text-gray-300">Resultados dos 2 eventos mais recentes</p>
          </div>
          <Link href="/tournaments">
            <Button variant="outline" className="gap-2">
              Ver Todos
              <TrendingUp className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {latestTournaments?.map((tournament: any) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>

        {(!latestTournaments || latestTournaments.length === 0) && (
          <Card className="text-center py-12">
            <CardContent>
              <Trophy className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Nenhum torneio cadastrado ainda
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Cadastre o primeiro torneio na área administrativa
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Quick Actions */}
      <section className="container mx-auto px-4 py-12">
        <Card className="bg-gradient-to-br from-purple-100 via-blue-100 to-cyan-100 dark:from-purple-950/50 dark:via-blue-950/50 dark:to-cyan-950/50 border-purple-200 dark:border-purple-800">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Explore Mais Recursos</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Descubra todas as funcionalidades do sistema
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/players" className="block">
                <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <Users className="h-10 w-10 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-bold mb-1">Jogadores</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Lista completa de participantes
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/tournaments" className="block">
                <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <Trophy className="h-10 w-10 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
                    <h4 className="font-bold mb-1">Torneios</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Histórico de eventos
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/ranking" className="block">
                <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <Award className="h-10 w-10 mx-auto mb-3 text-yellow-600 dark:text-yellow-400" />
                    <h4 className="font-bold mb-1">Rankings</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Classificação oficial
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/stats" className="block">
                <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <BarChart3 className="h-10 w-10 mx-auto mb-3 text-green-600 dark:text-green-400" />
                    <h4 className="font-bold mb-1">Estatísticas</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Análises e gráficos
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 text-center text-gray-600 dark:text-gray-400">
        <p>© 2025 Yu-Gi-Oh! Event Manager. Desenvolvido por Silas Cunha.</p>
      </footer>
    </div>
  )
}
