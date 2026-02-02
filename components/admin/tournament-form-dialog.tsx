'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTournament, updateTournament } from '@/app/admin/actions'
import { toast } from 'sonner'
import { MEDAL_ICONS } from '@/lib/constants'
import { Search } from 'lucide-react'

interface Player {
  id: number
  name: string
}

interface Deck {
  id: number
  name: string
  image_url?: string
}

interface TournamentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTournament: any | null
  players: Player[]
  decks: Deck[]
  onSuccess: () => void
  isAdmin: boolean
}

export function TournamentFormDialog({ 
  open, 
  onOpenChange, 
  editingTournament, 
  players,
  decks,
  onSuccess, 
  isAdmin 
}: TournamentFormDialogProps) {
  const [tournamentName, setTournamentName] = useState('')
  const [tournamentDate, setTournamentDate] = useState('')
  const [tournamentPlayerCount, setTournamentPlayerCount] = useState('')
  const [tournamentType, setTournamentType] = useState('regular')
  const [firstPlace, setFirstPlace] = useState('')
  const [secondPlace, setSecondPlace] = useState('')
  const [thirdPlace, setThirdPlace] = useState('')
  const [fourthPlace, setFourthPlace] = useState('')
  const [firstDeck, setFirstDeck] = useState('none')
  const [secondDeck, setSecondDeck] = useState('none')
  const [thirdDeck, setThirdDeck] = useState('none')
  const [fourthDeck, setFourthDeck] = useState('none')
  const [firstDeckSecondary, setFirstDeckSecondary] = useState('none')
  const [secondDeckSecondary, setSecondDeckSecondary] = useState('none')
  const [thirdDeckSecondary, setThirdDeckSecondary] = useState('none')
  const [fourthDeckSecondary, setFourthDeckSecondary] = useState('none')
  const [otherParticipants, setOtherParticipants] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Filter states
  const [playerSearchFirst, setPlayerSearchFirst] = useState('')
  const [playerSearchSecond, setPlayerSearchSecond] = useState('')
  const [playerSearchThird, setPlayerSearchThird] = useState('')
  const [playerSearchFourth, setPlayerSearchFourth] = useState('')
  const [deckSearch, setDeckSearch] = useState('')
  const [participantSearch, setParticipantSearch] = useState('')

  // Update form values when editingTournament changes
  useEffect(() => {
    if (editingTournament) {
      setTournamentName(editingTournament.name)
      setTournamentDate(editingTournament.date)
      setTournamentPlayerCount(editingTournament.player_count.toString())
      setTournamentType(editingTournament.tournament_type || 'regular')
      
      // Load existing results
      const results = editingTournament.tournament_results || []
      const first = results.find((r: any) => r.placement === 1)
      const second = results.find((r: any) => r.placement === 2)
      const third = results.find((r: any) => r.placement === 3)
      const fourth = results.find((r: any) => r.placement === 4)
      
      setFirstPlace(first?.player?.id?.toString() || '')
      setSecondPlace(second?.player?.id?.toString() || '')
      setThirdPlace(third?.player?.id?.toString() || '')
      setFourthPlace(fourth?.player?.id?.toString() || '')
      
      // Load decks for each position
      setFirstDeck(first?.deck_id?.toString() || 'none')
      setSecondDeck(second?.deck_id?.toString() || 'none')
      setThirdDeck(third?.deck_id?.toString() || 'none')
      setFourthDeck(fourth?.deck_id?.toString() || 'none')
      
      setFirstDeckSecondary(first?.deck_id_secondary?.toString() || 'none')
      setSecondDeckSecondary(second?.deck_id_secondary?.toString() || 'none')
      setThirdDeckSecondary(third?.deck_id_secondary?.toString() || 'none')
      setFourthDeckSecondary(fourth?.deck_id_secondary?.toString() || 'none')
      
      // Load other participants (without placement)
      const others = results
        .filter((r: any) => r.placement === null)
        .map((r: any) => r.player?.id?.toString())
        .filter(Boolean)
      
      setOtherParticipants(others)
    } else {
      resetForm()
    }
  }, [editingTournament, open])

  const resetForm = () => {
    setTournamentName('')
    setTournamentDate('')
    setTournamentPlayerCount('')
    setTournamentType('regular')
    setFirstPlace('')
    setSecondPlace('')
    setThirdPlace('')
    setFourthPlace('')
    setFirstDeck('none')
    setSecondDeck('none')
    setThirdDeck('none')
    setFourthDeck('none')
    setFirstDeckSecondary('none')
    setSecondDeckSecondary('none')
    setThirdDeckSecondary('none')
    setFourthDeckSecondary('none')
    setOtherParticipants([])
    setPlayerSearchFirst('')
    setPlayerSearchSecond('')
    setPlayerSearchThird('')
    setPlayerSearchFourth('')
    setDeckSearch('')
    setParticipantSearch('')
  }

  // Filter functions
  const filterPlayersBySearch = (searchTerm: string) => {
    if (!searchTerm) return players
    return players.filter(player => 
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filterDecksBySearch = (searchTerm: string) => {
    if (!searchTerm) return decks
    return decks.filter(deck => 
      deck.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Preparar resultados
      const results = []
      if (firstPlace) results.push({ 
        player_id: parseInt(firstPlace), 
        placement: 1,
        deck_id: firstDeck && firstDeck !== 'none' ? parseInt(firstDeck) : null,
        deck_id_secondary: firstDeckSecondary && firstDeckSecondary !== 'none' ? parseInt(firstDeckSecondary) : null
      })
      if (secondPlace) results.push({ 
        player_id: parseInt(secondPlace), 
        placement: 2,
        deck_id: secondDeck && secondDeck !== 'none' ? parseInt(secondDeck) : null,
        deck_id_secondary: secondDeckSecondary && secondDeckSecondary !== 'none' ? parseInt(secondDeckSecondary) : null
      })
      if (thirdPlace) results.push({ 
        player_id: parseInt(thirdPlace), 
        placement: 3,
        deck_id: thirdDeck && thirdDeck !== 'none' ? parseInt(thirdDeck) : null,
        deck_id_secondary: thirdDeckSecondary && thirdDeckSecondary !== 'none' ? parseInt(thirdDeckSecondary) : null
      })
      if (fourthPlace) results.push({ 
        player_id: parseInt(fourthPlace), 
        placement: 4,
        deck_id: fourthDeck && fourthDeck !== 'none' ? parseInt(fourthDeck) : null,
        deck_id_secondary: fourthDeckSecondary && fourthDeckSecondary !== 'none' ? parseInt(fourthDeckSecondary) : null
      })
      
      // Add other participants without placement (didn't finish in TOP 4)
      otherParticipants.forEach(playerId => {
        if (playerId && playerId !== firstPlace && playerId !== secondPlace && playerId !== thirdPlace && playerId !== fourthPlace) {
          results.push({ player_id: parseInt(playerId), placement: null })
        }
      })

      const tournamentData = {
        name: tournamentName,
        date: tournamentDate,
        player_count: parseInt(tournamentPlayerCount),
        tournament_type: tournamentType,
        results
      }

      if (editingTournament) {
        // Update
        if (!isAdmin) {
          toast.error('Apenas administradores podem editar torneios')
          return
        }

        const result = await updateTournament(editingTournament.id, tournamentData)

        if (!result.success) {
          throw new Error(result.error)
        }

        toast.success('Torneio atualizado com sucesso!')
      } else {
        // Create
        const result = await createTournament(tournamentData)

        if (!result.success) {
          throw new Error(result.error)
        }

        toast.success('Torneio criado com sucesso!')
      }

      handleClose()
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar torneio')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleParticipantToggle = (playerId: string, checked: boolean) => {
    if (checked) {
      setOtherParticipants([...otherParticipants, playerId])
    } else {
      setOtherParticipants(otherParticipants.filter(id => id !== playerId))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTournament ? 'Editar' : 'Novo'} Torneio</DialogTitle>
          <DialogDescription>
            {editingTournament ? 'Edite as informações do torneio' : 'Adicione um novo torneio ao sistema'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tournamentName">Nome do Torneio</Label>
            <Input
              id="tournamentName"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tournamentDate">Data</Label>
              <Input
                id="tournamentDate"
                type="date"
                value={tournamentDate}
                onChange={(e) => setTournamentDate(e.target.value)}
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tournamentPlayerCount">Nº de Jogadores</Label>
              <Input
                id="tournamentPlayerCount"
                type="number"
                min="4"
                value={tournamentPlayerCount}
                onChange={(e) => setTournamentPlayerCount(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tournamentType">Tipo de Torneio</Label>
            <Select value={tournamentType} onValueChange={setTournamentType} disabled={isSubmitting}>
              <SelectTrigger id="tournamentType">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">🏆 Veteranos (Ranking Principal)</SelectItem>
                <SelectItem value="beginner">🆕 Novatos (Iniciantes)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {tournamentType === 'beginner' 
                ? 'Torneios de novatos não afetam o ranking principal' 
                : 'Torneios de veteranos contam para o ranking principal'
              }
            </p>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">Classificação Final</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="firstPlace">{MEDAL_ICONS[1]} 1º Lugar</Label>
                <Select value={firstPlace} onValueChange={setFirstPlace} disabled={isSubmitting}>
                  <SelectTrigger id="firstPlace">
                    <SelectValue placeholder="Selecione o jogador" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 z-10" />
                        <Input
                          placeholder="Buscar jogador..."
                          value={playerSearchFirst}
                          onChange={(e) => setPlayerSearchFirst(e.target.value)}
                          className="h-8 pl-7 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    {filterPlayersBySearch(playerSearchFirst).map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={firstDeck} onValueChange={(value) => setFirstDeck(value === 'none' ? '' : value)} disabled={isSubmitting || !firstPlace}>
                    <SelectTrigger>
                      <SelectValue placeholder="Deck 1 (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 z-10" />
                          <Input
                            placeholder="Buscar deck..."
                            value={deckSearch}
                            onChange={(e) => setDeckSearch(e.target.value)}
                            className="h-8 pl-7 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {filterDecksBySearch(deckSearch).map((deck) => (
                        <SelectItem key={deck.id} value={deck.id.toString()}>
                          {deck.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={firstDeckSecondary} onValueChange={(value) => setFirstDeckSecondary(value === 'none' ? '' : value)} disabled={isSubmitting || !firstPlace}>
                    <SelectTrigger>
                      <SelectValue placeholder="Deck 2 (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 z-10" />
                          <Input
                            placeholder="Buscar deck..."
                            value={deckSearch}
                            onChange={(e) => setDeckSearch(e.target.value)}
                            className="h-8 pl-7 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {filterDecksBySearch(deckSearch).map((deck) => (
                        <SelectItem key={deck.id} value={deck.id.toString()}>
                          {deck.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondPlace">{MEDAL_ICONS[2]} 2º Lugar</Label>
                <Select value={secondPlace} onValueChange={setSecondPlace} disabled={isSubmitting}>
                  <SelectTrigger id="secondPlace">
                    <SelectValue placeholder="Selecione o jogador" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 z-10" />
                        <Input
                          placeholder="Buscar jogador..."
                          value={playerSearchSecond}
                          onChange={(e) => setPlayerSearchSecond(e.target.value)}
                          className="h-8 pl-7 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    {filterPlayersBySearch(playerSearchSecond).map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={secondDeck} onValueChange={(value) => setSecondDeck(value === 'none' ? '' : value)} disabled={isSubmitting || !secondPlace}>
                    <SelectTrigger>
                      <SelectValue placeholder="Deck 1 (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 z-10" />
                          <Input
                            placeholder="Buscar deck..."
                            value={deckSearch}
                            onChange={(e) => setDeckSearch(e.target.value)}
                            className="h-8 pl-7 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {filterDecksBySearch(deckSearch).map((deck) => (
                        <SelectItem key={deck.id} value={deck.id.toString()}>
                          {deck.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={secondDeckSecondary} onValueChange={(value) => setSecondDeckSecondary(value === 'none' ? '' : value)} disabled={isSubmitting || !secondPlace}>
                    <SelectTrigger>
                      <SelectValue placeholder="Deck 2 (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 z-10" />
                          <Input
                            placeholder="Buscar deck..."
                            value={deckSearch}
                            onChange={(e) => setDeckSearch(e.target.value)}
                            className="h-8 pl-7 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {filterDecksBySearch(deckSearch).map((deck) => (
                        <SelectItem key={deck.id} value={deck.id.toString()}>
                          {deck.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thirdPlace">{MEDAL_ICONS[3]} 3º Lugar</Label>
                <Select value={thirdPlace} onValueChange={setThirdPlace} disabled={isSubmitting}>
                  <SelectTrigger id="thirdPlace">
                    <SelectValue placeholder="Selecione o jogador" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 z-10" />
                        <Input
                          placeholder="Buscar jogador..."
                          value={playerSearchThird}
                          onChange={(e) => setPlayerSearchThird(e.target.value)}
                          className="h-8 pl-7 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    {filterPlayersBySearch(playerSearchThird).map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={thirdDeck} onValueChange={(value) => setThirdDeck(value === 'none' ? '' : value)} disabled={isSubmitting || !thirdPlace}>
                    <SelectTrigger>
                      <SelectValue placeholder="Deck 1 (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 z-10" />
                          <Input
                            placeholder="Buscar deck..."
                            value={deckSearch}
                            onChange={(e) => setDeckSearch(e.target.value)}
                            className="h-8 pl-7 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {filterDecksBySearch(deckSearch).map((deck) => (
                        <SelectItem key={deck.id} value={deck.id.toString()}>
                          {deck.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={thirdDeckSecondary} onValueChange={(value) => setThirdDeckSecondary(value === 'none' ? '' : value)} disabled={isSubmitting || !thirdPlace}>
                    <SelectTrigger>
                      <SelectValue placeholder="Deck 2 (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 z-10" />
                          <Input
                            placeholder="Buscar deck..."
                            value={deckSearch}
                            onChange={(e) => setDeckSearch(e.target.value)}
                            className="h-8 pl-7 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {filterDecksBySearch(deckSearch).map((deck) => (
                        <SelectItem key={deck.id} value={deck.id.toString()}>
                          {deck.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fourthPlace">{MEDAL_ICONS[4]} 4º Lugar</Label>
                <Select value={fourthPlace} onValueChange={setFourthPlace} disabled={isSubmitting}>
                  <SelectTrigger id="fourthPlace">
                    <SelectValue placeholder="Selecione o jogador" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 z-10" />
                        <Input
                          placeholder="Buscar jogador..."
                          value={playerSearchFourth}
                          onChange={(e) => setPlayerSearchFourth(e.target.value)}
                          className="h-8 pl-7 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    {filterPlayersBySearch(playerSearchFourth).map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={fourthDeck} onValueChange={(value) => setFourthDeck(value === 'none' ? '' : value)} disabled={isSubmitting || !fourthPlace}>
                    <SelectTrigger>
                      <SelectValue placeholder="Deck 1 (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 z-10" />
                          <Input
                            placeholder="Buscar deck..."
                            value={deckSearch}
                            onChange={(e) => setDeckSearch(e.target.value)}
                            className="h-8 pl-7 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {filterDecksBySearch(deckSearch).map((deck) => (
                        <SelectItem key={deck.id} value={deck.id.toString()}>
                          {deck.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={fourthDeckSecondary} onValueChange={(value) => setFourthDeckSecondary(value === 'none' ? '' : value)} disabled={isSubmitting || !fourthPlace}>
                    <SelectTrigger>
                      <SelectValue placeholder="Deck 2 (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 z-10" />
                          <Input
                            placeholder="Buscar deck..."
                            value={deckSearch}
                            onChange={(e) => setDeckSearch(e.target.value)}
                            className="h-8 pl-7 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {filterDecksBySearch(deckSearch).map((deck) => (
                        <SelectItem key={deck.id} value={deck.id.toString()}>
                          {deck.name}
                        </SelectItem>
                      ))}  
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">Outros Participantes (não ficaram no TOP 4)</h3>
            <div className="space-y-2">
              <Label>Selecione os demais jogadores que participaram</Label>
              <div className="mb-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar participante..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {players
                  .filter(p => 
                    p.id.toString() !== firstPlace && 
                    p.id.toString() !== secondPlace && 
                    p.id.toString() !== thirdPlace && 
                    p.id.toString() !== fourthPlace &&
                    p.name.toLowerCase().includes(participantSearch.toLowerCase())
                  )
                  .map((player) => (
                    <label key={player.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={otherParticipants.includes(player.id.toString())}
                        onChange={(e) => handleParticipantToggle(player.id.toString(), e.target.checked)}
                        className="rounded"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm">{player.name}</span>
                    </label>
                  ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {otherParticipants.length} jogador(es) selecionado(s)
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
