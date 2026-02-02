'use client'

import { useState, useMemo } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X, Trophy } from 'lucide-react'
import { DeckCard, type DeckCardData } from '@/components/decks'

interface DecksClientProps {
  decks: DeckCardData[]
}

export function DecksClient({ decks }: DecksClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('usage')

  // Filtrar e ordenar decks
  const filteredAndSortedDecks = useMemo(() => {
    let filtered = decks

    // Filtro por nome
    if (searchTerm) {
      filtered = filtered.filter(deck =>
        deck.deckName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Ordenação
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.deckName.localeCompare(b.deckName)
        case 'usage':
          // Primeiro, separar por tipo (principal vs suporte)
          // Decks principais (primaryUses > 0) vêm primeiro
          const aIsPrimary = (a.primaryUses ?? 0) > 0
          const bIsPrimary = (b.primaryUses ?? 0) > 0
          
          if (aIsPrimary && !bIsPrimary) return -1
          if (!aIsPrimary && bIsPrimary) return 1
          
          // Dentro do mesmo tipo, ordenar por TOPs
          return b.topFourCount - a.topFourCount
        default:
          return 0
      }
    })

    return sorted
  }, [decks, searchTerm, sortBy])

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalDecks = decks.length
    const totalTopFours = decks.reduce((sum, d) => sum + d.topFourCount, 0)

    return {
      totalDecks,
      totalTopFours
    }
  }, [decks])

  const hasActiveFilters = searchTerm || sortBy !== 'usage'

  const clearFilters = () => {
    setSearchTerm('')
    setSortBy('usage')
  }

  return (
    <PageLayout activeRoute="/decks">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">🃏 Decks</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Todos os decks cadastrados no sistema
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🃏</div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Decks</p>
                <p className="text-2xl font-bold">{stats.totalDecks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de TOPs</p>
                <p className="text-2xl font-bold">{stats.totalTopFours}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filtros</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-auto"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buscar por nome */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nome do deck..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Ordenar por */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome (A-Z)</SelectItem>
                <SelectItem value="usage">Mais Usado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Mostrando {filteredAndSortedDecks.length} de {decks.length} decks
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Decks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredAndSortedDecks.map((deck) => (
          <DeckCard 
            key={deck.deckId} 
            deck={deck}
            showBadges={true}
          />
        ))}
      </div>

      {filteredAndSortedDecks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Nenhum deck encontrado
          </p>
          {hasActiveFilters && (
            <Button onClick={clearFilters} className="mt-4">
              Limpar filtros
            </Button>
          )}
        </div>
      )}
    </PageLayout>
  )
}
