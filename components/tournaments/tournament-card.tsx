'use client'

import { useState } from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Users, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { TOP_POSITIONS, MEDAL_ICONS } from '@/lib/constants'
import { PlayerAvatar } from '@/components/player/player-avatar'
import Image from 'next/image'

interface TournamentCardProps {
  tournament: {
    id: number
    name: string
    date: string
    player_count: number
    location?: string
    tournament_type?: string
    tournament_results: Array<{
      placement: number | null
      deck_id?: number | null
      deck_id_secondary?: number | null
      player: {
        id: number
        name: string
        image_url?: string
      } | null
      deck?: {
        id: number
        name: string
        image_url?: string
      } | null
      deck_secondary?: {
        id: number
        name: string
        image_url?: string
      } | null
    }>
  }
  actions?: React.ReactNode // Botões de ação opcionais (editar/excluir)
}

export function TournamentCard({ tournament, actions }: TournamentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Ordenar resultados por placement e pegar top 4
  const topResults = (tournament.tournament_results || [])
    .filter((result) => result.placement !== null && result.placement >= 1 && result.placement <= TOP_POSITIONS)
    .sort((resultA, resultB) => resultA.placement! - resultB.placement!)
    .slice(0, TOP_POSITIONS)

  // Jogadores que não ficaram no top 4
  const otherPlayers = (tournament.tournament_results || [])
    .filter((result) => !result.placement || result.placement > TOP_POSITIONS)
    .sort((a, b) => (a.player?.name || '').localeCompare(b.player?.name || ''))

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <CardTitle className="text-2xl">{tournament.name}</CardTitle>
            <div className="flex items-center gap-2">
              {/* Badge de tipo de torneio */}
              {tournament.tournament_type === 'beginner' ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800 whitespace-nowrap">
                  <span>🆕</span>
                  <span className="hidden sm:inline">Novatos</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                  <span>🏆</span>
                  <span className="hidden sm:inline">Veteranos</span>
                </div>
              )}
              {/* Botões de ação (se fornecidos) */}
              {actions}
            </div>
          </div>
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
            <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">🏆 Top 4</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topResults.map((result) => {
                const medal = MEDAL_ICONS[result.placement as 1 | 2 | 3 | 4] || '🏆'
                const hasDecks = result.deck || result.deck_secondary
                
                return (
                  <div
                    key={`${tournament.id}-${result.placement}`}
                    className="relative flex items-center gap-3 p-4 pr-28 min-h-[80px] rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:shadow-md transition-all border border-gray-200 dark:border-gray-600"
                  >
                    {/* Floating Deck Badges */}
                    {hasDecks && (
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {result.deck && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 shadow-sm">
                            {result.deck.image_url ? (
                              <div className="relative h-5 w-5 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={result.deck.image_url}
                                  alt={result.deck.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <span className="text-xs">🃏</span>
                            )}
                            <span className="text-[10px] font-medium text-gray-700 dark:text-gray-200 max-w-[60px] truncate">
                              {result.deck.name}
                            </span>
                          </div>
                        )}
                        {result.deck_secondary && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 shadow-sm">
                            {result.deck_secondary.image_url ? (
                              <div className="relative h-5 w-5 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={result.deck_secondary.image_url}
                                  alt={result.deck_secondary.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <span className="text-xs">🃏</span>
                            )}
                            <span className="text-[10px] font-medium text-gray-700 dark:text-gray-200 max-w-[60px] truncate">
                              {result.deck_secondary.name}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Player Info */}
                    <PlayerAvatar
                      imageUrl={result.player?.image_url}
                      playerName={result.player?.name || 'N/A'}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate dark:text-white">
                        {result.player?.name || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="text-base">{medal}</span>
                        <span>{result.placement}º lugar</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {otherPlayers.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span>👥 Demais Participantes ({otherPlayers.length})</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
              <div className="flex flex-wrap gap-2 mt-3">
                {otherPlayers.map((result, index) => (
                  <div
                    key={`${tournament.id}-${result.player?.id || index}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                  >
                    <PlayerAvatar
                      imageUrl={result.player?.image_url}
                      playerName={result.player?.name || 'N/A'}
                      size="xs"
                    />
                    <span className="font-medium">{result.player?.name || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardHeader>
    </Card>
  )
}
