import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/player/player-avatar';
import { MEDAL_ICONS } from '@/lib/constants';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DeckDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const { id } = await params;
  const deckId = parseInt(id);

  if (isNaN(deckId)) {
    notFound();
  }

  // Fetch deck information
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .single();

  if (deckError || !deck) {
    notFound();
  }

  // Fetch all tournament results with this deck
  const { data: results, error: resultsError } = await supabase
    .from('tournament_results')
    .select(`
      *,
      player:players!tournament_results_player_id_fkey(id, name, image_url),
      tournament:tournaments!tournament_results_tournament_id_fkey(id, date, tournament_type),
      deck:decks!tournament_results_deck_id_fkey(id, name, image_url),
      deck_secondary:decks!tournament_results_deck_id_secondary_fkey(id, name, image_url)
    `)
    .or(`deck_id.eq.${deckId},deck_id_secondary.eq.${deckId}`);

  // Ordenar por data do torneio (mais recentes primeiro)
  const tournamentResults = (results || []).sort((a: any, b: any) => {
    const dateA = new Date(a.tournament?.date || 0).getTime();
    const dateB = new Date(b.tournament?.date || 0).getTime();
    return dateB - dateA;
  });

  // Calculate statistics
  const totalUses = tournamentResults.length;
  const placements = {
    first: tournamentResults.filter(r => r.placement === 1).length,
    second: tournamentResults.filter(r => r.placement === 2).length,
    third: tournamentResults.filter(r => r.placement === 3).length,
    fourth: tournamentResults.filter(r => r.placement === 4).length,
  };

  const winRate = totalUses > 0 ? (placements.first / totalUses) * 100 : 0;

  // Calculate usage types
  const primaryUses = tournamentResults.filter(r => r.deck_id === deckId).length;
  const secondaryUses = tournamentResults.filter(r => r.deck_id_secondary === deckId).length;
  const veteranUses = tournamentResults.filter(r => r.tournament?.tournament_type !== 'beginner').length;
  const beginnerUses = tournamentResults.filter(r => r.tournament?.tournament_type === 'beginner').length;

  // Get unique players who used this deck and their combos
  const playersMap = new Map();
  tournamentResults.forEach(result => {
    if (result.player && !playersMap.has(result.player.id)) {
      playersMap.set(result.player.id, {
        ...result.player,
        uses: 0,
        combos: new Set<string>(), // Armazenar combos únicos
        placements: [] as number[] // Armazenar colocações
      });
    }
    if (result.player) {
      const playerStats = playersMap.get(result.player.id);
      playerStats.uses++;
      playerStats.placements.push(result.placement);
      
      // Adicionar combo usado
      if (result.deck_id === deckId && result.deck_secondary) {
        // Deck atual é principal + secundário
        playerStats.combos.add(`${deck.name} + ${result.deck_secondary.name}`);
      } else if (result.deck_id_secondary === deckId && result.deck) {
        // Deck atual é secundário de outro principal
        playerStats.combos.add(`${result.deck.name} + ${deck.name}`);
      } else if (result.deck_id === deckId && !result.deck_secondary) {
        // Deck usado sozinho (sem secundário)
        playerStats.combos.add(`${deck.name}`);
      }
    }
  });

  const playersList = Array.from(playersMap.values())
    .map(player => ({
      ...player,
      combos: Array.from(player.combos) // Converter Set para Array
    }))
    .sort((a, b) => b.uses - a.uses);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-blue-950 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/decks">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Decks
            </Button>
          </Link>

          <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                {/* Deck Image */}
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-4 border-blue-300 dark:border-blue-700 shadow-lg">
                  {deck.image_url ? (
                    <Image
                      src={deck.image_url}
                      alt={deck.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-6xl font-bold text-white">
                        {deck.name[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Deck Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-bold mb-2 text-blue-900 dark:text-blue-100">
                    {deck.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Análise completa de desempenho e estatísticas
                  </p>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-300 dark:border-blue-700">
                      <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div className="text-left">
                        <p className="text-xs text-blue-700 dark:text-blue-400">Total de TOPs</p>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-200">{totalUses}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200 dark:border-yellow-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                🥇 1º Lugar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{placements.first}</div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                {totalUses > 0 ? ((placements.first / totalUses) * 100).toFixed(1) : 0}% dos TOPs
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                🥈 2º Lugar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">{placements.second}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {totalUses > 0 ? ((placements.second / totalUses) * 100).toFixed(1) : 0}% dos TOPs
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100 flex items-center gap-2">
                🥉 3º Lugar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{placements.third}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {totalUses > 0 ? ((placements.third / totalUses) * 100).toFixed(1) : 0}% dos TOPs
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                🏅 4º Lugar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{placements.fourth}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {totalUses > 0 ? ((placements.fourth / totalUses) * 100).toFixed(1) : 0}% dos TOPs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                🎯 Tipo de Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Engine Principal</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{primaryUses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Engine Secundária</span>
                  </div>
                  <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{secondaryUses}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                🏆 Tipo de Torneio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Veteranos</span>
                  </div>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{veteranUses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🆕</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Novatos</span>
                  </div>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{beginnerUses}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Players Who Used This Deck */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Jogadores que usaram este deck
            </CardTitle>
          </CardHeader>
          <CardContent>
            {playersList.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nenhum jogador usou este deck ainda
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                {playersList.map((player, index) => {
                  // Contar quantas vezes cada colocação aparece
                  const placementCounts = player.placements.reduce((acc: Record<number, number>, placement: number) => {
                    acc[placement] = (acc[placement] || 0) + 1;
                    return acc;
                  }, {});

                  return (
                    <Card 
                      key={player.id}
                      className="hover:shadow-lg transition-shadow border-purple-200 dark:border-purple-800"
                    >
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center gap-3 mb-3">
                          {/* Posição */}
                          <div className="shrink-0">
                            <div className="text-2xl font-bold text-gray-400 dark:text-gray-600 min-w-[2rem] text-center">
                              #{index + 1}
                            </div>
                          </div>

                          {/* Avatar */}
                          <div className="shrink-0">
                            <PlayerAvatar
                              playerName={player.name}
                              imageUrl={player.image_url}
                              size="md"
                            />
                          </div>

                          {/* Nome e Info */}
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={`/players?id=${player.id}`}
                              className="font-bold text-sm sm:text-base hover:text-purple-600 dark:hover:text-purple-400 transition-colors block truncate"
                            >
                              {player.name}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              {player.uses} Top{player.uses !== 1 ? 's' : ''}
                            </div>
                          </div>

                          {/* Colocações */}
                          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                            {Object.entries(placementCounts)
                              .sort(([a], [b]) => Number(a) - Number(b))
                              .map(([placement, count]) => {
                                const colors = {
                                  1: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
                                  2: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400',
                                  3: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
                                  4: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                };
                                
                                return (
                                  <div 
                                    key={placement} 
                                    className={`rounded-lg px-2 py-1 text-center min-w-[2.5rem] ${colors[Number(placement) as keyof typeof colors]}`}
                                  >
                                    <div className="text-lg leading-none">
                                      {MEDAL_ICONS[Number(placement) as keyof typeof MEDAL_ICONS] || `#${placement}`}
                                    </div>
                                    <div className="text-[10px] font-bold mt-0.5">
                                      x{Number(count)}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                        
                        {/* Combos usados pelo jogador */}
                        {player.combos && player.combos.length > 0 && (
                          <div className="pt-3 border-t border-purple-100 dark:border-purple-900">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Combos utilizados:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {player.combos.map((combo: string, idx: number) => (
                                <div 
                                  key={idx} 
                                  className="text-xs px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                >
                                  {combo}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tournament History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Histórico de Torneios ({tournamentResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tournamentResults.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Este deck ainda não foi usado em torneios
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                {tournamentResults.map((result) => {
                  const colors = {
                    1: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
                    2: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
                    3: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
                    4: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  };

                  return (
                    <Link
                      key={result.id}
                      href={`/tournaments?id=${result.tournament?.id}`}
                      className={`block rounded-lg p-3 hover:shadow-lg transition-all border ${colors[result.placement as keyof typeof colors] || 'border-gray-200 dark:border-gray-700'}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Ícone da Colocação */}
                        <div className="shrink-0">
                          <div className="text-3xl">
                            {MEDAL_ICONS[result.placement as keyof typeof MEDAL_ICONS] || `#${result.placement}`}
                          </div>
                        </div>

                        {/* Avatar e Info do Jogador */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <PlayerAvatar
                              playerName={result.player?.name || 'Desconhecido'}
                              imageUrl={result.player?.image_url}
                              size="sm"
                            />
                            <p className="font-bold text-sm truncate">
                              {result.player?.name || 'Desconhecido'}
                            </p>
                          </div>
                          
                          {/* Combo usado */}
                          {(result.deck_id === deckId && result.deck_secondary) ? (
                            <div className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 inline-block">
                              {deck.name} + {result.deck_secondary.name}
                            </div>
                          ) : (result.deck_id_secondary === deckId && result.deck) ? (
                            <div className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 inline-block">
                              {result.deck.name} + {deck.name}
                            </div>
                          ) : (
                            <div className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 inline-block">
                              {deck.name}
                            </div>
                          )}
                        </div>

                        {/* Data e Tipo */}
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {new Date(result.tournament?.date || '').toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit' 
                            })}
                          </p>
                          <div className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
                            result.tournament?.tournament_type === 'regular' 
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          }`}>
                            {result.tournament?.tournament_type === 'regular' ? '🏆 Veteranos' : '🆕 Novatos'}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
