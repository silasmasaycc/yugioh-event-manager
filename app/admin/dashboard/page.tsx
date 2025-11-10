'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trophy, LogOut, Plus, Edit, Trash2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth, useUserRole } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { role, isAdmin, loading: roleLoading } = useUserRole()
  const [activeTab, setActiveTab] = useState<'players' | 'tournaments'>('tournaments')
  const [players, setPlayers] = useState<any[]>([])
  const [tournaments, setTournaments] = useState<any[]>([])
  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [showTournamentForm, setShowTournamentForm] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<any>(null)
  const [editingTournament, setEditingTournament] = useState<any>(null)

  // Player form
  const [playerName, setPlayerName] = useState('')
  const [playerImageUrl, setPlayerImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  // Tournament form
  const [tournamentName, setTournamentName] = useState('')
  const [tournamentDate, setTournamentDate] = useState('')
  const [tournamentPlayerCount, setTournamentPlayerCount] = useState('')
  const [firstPlace, setFirstPlace] = useState('')
  const [secondPlace, setSecondPlace] = useState('')
  const [thirdPlace, setThirdPlace] = useState('')
  const [fourthPlace, setFourthPlace] = useState('')
  const [otherParticipants, setOtherParticipants] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    const [{ data: playersData }, { data: tournamentsData }] = await Promise.all([
      supabase.from('players').select('*').order('name'),
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
    ])
    
    setPlayers(playersData || [])
    setTournaments(tournamentsData || [])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('player-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('player-images').getPublicUrl(filePath)
      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let imageUrl = playerImageUrl

      if (imageFile) {
        const uploadedUrl = await handleImageUpload(imageFile)
        if (uploadedUrl) imageUrl = uploadedUrl
      }

      if (editingPlayer) {
        // Update
        if (!isAdmin) {
          toast.error('Apenas administradores podem editar jogadores')
          return
        }

        const { error } = await supabase
          .from('players')
          .update({ name: playerName, image_url: imageUrl || null })
          .eq('id', editingPlayer.id)

        if (error) throw error
        toast.success('Jogador atualizado com sucesso!')
      } else {
        // Create
        const { error } = await supabase
          .from('players')
          .insert({ name: playerName, image_url: imageUrl || null })

        if (error) throw error
        toast.success('Jogador criado com sucesso!')
      }

      resetPlayerForm()
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar jogador')
    }
  }

  const handleDeletePlayer = async (id: number) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir jogadores')
      return
    }

    if (!confirm('Tem certeza que deseja excluir este jogador?')) return

    try {
      const { error } = await supabase.from('players').delete().eq('id', id)
      if (error) throw error
      toast.success('Jogador excluído com sucesso!')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir jogador')
    }
  }

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const tournamentData = {
        name: tournamentName,
        date: tournamentDate,
        player_count: parseInt(tournamentPlayerCount)
      }

      if (editingTournament) {
        // Update
        if (!isAdmin) {
          toast.error('Apenas administradores podem editar torneios')
          return
        }

        const { error } = await supabase
          .from('tournaments')
          .update(tournamentData)
          .eq('id', editingTournament.id)

        if (error) throw error

        // Delete existing results and insert new ones
        await supabase.from('tournament_results').delete().eq('tournament_id', editingTournament.id)

        const results = []
        if (firstPlace) results.push({ tournament_id: editingTournament.id, player_id: parseInt(firstPlace), placement: 1 })
        if (secondPlace) results.push({ tournament_id: editingTournament.id, player_id: parseInt(secondPlace), placement: 2 })
        if (thirdPlace) results.push({ tournament_id: editingTournament.id, player_id: parseInt(thirdPlace), placement: 3 })
        if (fourthPlace) results.push({ tournament_id: editingTournament.id, player_id: parseInt(fourthPlace), placement: 4 })
        
        // Add other participants without placement (didn't finish in TOP 4)
        otherParticipants.forEach(playerId => {
          if (playerId && playerId !== firstPlace && playerId !== secondPlace && playerId !== thirdPlace && playerId !== fourthPlace) {
            results.push({ tournament_id: editingTournament.id, player_id: parseInt(playerId), placement: null })
          }
        })

        if (results.length > 0) {
          const { error: resultsError } = await supabase.from('tournament_results').insert(results)
          if (resultsError) throw resultsError
        }

        toast.success('Torneio atualizado com sucesso!')
      } else {
        // Create
        const { data: newTournament, error } = await supabase
          .from('tournaments')
          .insert(tournamentData)
          .select()
          .single()

        if (error) throw error

        // Insert results
        const results = []
        if (firstPlace) results.push({ tournament_id: newTournament.id, player_id: parseInt(firstPlace), placement: 1 })
        if (secondPlace) results.push({ tournament_id: newTournament.id, player_id: parseInt(secondPlace), placement: 2 })
        if (thirdPlace) results.push({ tournament_id: newTournament.id, player_id: parseInt(thirdPlace), placement: 3 })
        if (fourthPlace) results.push({ tournament_id: newTournament.id, player_id: parseInt(fourthPlace), placement: 4 })
        
        // Add other participants without placement (didn't finish in TOP 4)
        otherParticipants.forEach(playerId => {
          if (playerId && playerId !== firstPlace && playerId !== secondPlace && playerId !== thirdPlace && playerId !== fourthPlace) {
            results.push({ tournament_id: newTournament.id, player_id: parseInt(playerId), placement: null })
          }
        })

        if (results.length > 0) {
          const { error: resultsError } = await supabase.from('tournament_results').insert(results)
          if (resultsError) throw resultsError
        }

        toast.success('Torneio criado com sucesso!')
      }

      resetTournamentForm()
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar torneio')
    }
  }

  const handleDeleteTournament = async (id: number) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir torneios')
      return
    }

    if (!confirm('Tem certeza que deseja excluir este torneio?')) return

    try {
      const { error } = await supabase.from('tournaments').delete().eq('id', id)
      if (error) throw error
      toast.success('Torneio excluído com sucesso!')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir torneio')
    }
  }

  const resetPlayerForm = () => {
    setShowPlayerForm(false)
    setEditingPlayer(null)
    setPlayerName('')
    setPlayerImageUrl('')
    setImageFile(null)
  }

  const resetTournamentForm = () => {
    setShowTournamentForm(false)
    setEditingTournament(null)
    setTournamentName('')
    setTournamentDate('')
    setTournamentPlayerCount('')
    setFirstPlace('')
    setSecondPlace('')
    setThirdPlace('')
    setFourthPlace('')
    setOtherParticipants([])
  }

  const startEditPlayer = (player: any) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar jogadores')
      return
    }
    setEditingPlayer(player)
    setPlayerName(player.name)
    setPlayerImageUrl(player.image_url || '')
    setShowPlayerForm(true)
  }

  const startEditTournament = (tournament: any) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar torneios')
      return
    }
    setEditingTournament(tournament)
    setTournamentName(tournament.name)
    setTournamentDate(tournament.date)
    setTournamentPlayerCount(tournament.player_count.toString())
    
    // Load existing results
    const results = tournament.tournament_results || []
    setFirstPlace(results.find((r: any) => r.placement === 1)?.player?.id?.toString() || '')
    setSecondPlace(results.find((r: any) => r.placement === 2)?.player?.id?.toString() || '')
    setThirdPlace(results.find((r: any) => r.placement === 3)?.player?.id?.toString() || '')
    setFourthPlace(results.find((r: any) => r.placement === 4)?.player?.id?.toString() || '')
    
    // Load other participants (placement is NULL or doesn't exist in TOP 4)
    const otherParticipantIds = results
      .filter((r: any) => r.placement === null || r.placement > 4)
      .map((r: any) => r.player?.id?.toString())
      .filter(Boolean)
    setOtherParticipants(otherParticipantIds)
    
    setShowTournamentForm(true)
  }

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <header className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-sm text-muted-foreground">
                ({isAdmin ? 'Admin' : 'Sub-Admin'})
              </span>
              <Link href="/">
                <Button variant="ghost">Ver Site</Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setActiveTab('tournaments')}
              className={`px-4 py-2 font-medium ${activeTab === 'tournaments' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Torneios
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`px-4 py-2 font-medium ${activeTab === 'players' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Jogadores
            </button>
          </div>
        </div>

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Jogadores</h2>
              <Button onClick={() => setShowPlayerForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Jogador
              </Button>
            </div>

            <Dialog open={showPlayerForm} onOpenChange={setShowPlayerForm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPlayer ? 'Editar' : 'Novo'} Jogador</DialogTitle>
                  <DialogDescription>
                    {editingPlayer ? 'Edite as informações do jogador' : 'Adicione um novo jogador ao sistema'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSavePlayer} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="playerName">Nome</Label>
                    <Input
                      id="playerName"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="playerImage">Imagem (Arquivo ou URL)</Label>
                    <Input
                      id="playerImageFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="mb-2"
                    />
                    <Input
                      id="playerImageUrl"
                      type="url"
                      placeholder="Ou insira a URL da imagem"
                      value={playerImageUrl}
                      onChange={(e) => setPlayerImageUrl(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Salvar</Button>
                    <Button type="button" variant="outline" onClick={resetPlayerForm}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => (
                <Card key={player.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100">
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
                        <h3 className="font-bold">{player.name}</h3>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditPlayer(player)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePlayer(player.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Torneios</h2>
              <Button onClick={() => setShowTournamentForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Torneio
              </Button>
            </div>

            <Dialog open={showTournamentForm} onOpenChange={setShowTournamentForm}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTournament ? 'Editar' : 'Novo'} Torneio</DialogTitle>
                  <DialogDescription>
                    {editingTournament ? 'Edite as informações do torneio' : 'Adicione um novo torneio ao sistema'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveTournament} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tournamentName">Nome do Torneio</Label>
                    <Input
                      id="tournamentName"
                      value={tournamentName}
                      onChange={(e) => setTournamentName(e.target.value)}
                      required
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
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold mb-3">Classificação Final</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="firstPlace">🥇 1º Lugar</Label>
                        <Select value={firstPlace} onValueChange={setFirstPlace}>
                          <SelectTrigger id="firstPlace">
                            <SelectValue placeholder="Selecione o jogador" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((player) => (
                              <SelectItem key={player.id} value={player.id.toString()}>
                                {player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondPlace">🥈 2º Lugar</Label>
                        <Select value={secondPlace} onValueChange={setSecondPlace}>
                          <SelectTrigger id="secondPlace">
                            <SelectValue placeholder="Selecione o jogador" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((player) => (
                              <SelectItem key={player.id} value={player.id.toString()}>
                                {player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="thirdPlace">🥉 3º Lugar</Label>
                        <Select value={thirdPlace} onValueChange={setThirdPlace}>
                          <SelectTrigger id="thirdPlace">
                            <SelectValue placeholder="Selecione o jogador" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((player) => (
                              <SelectItem key={player.id} value={player.id.toString()}>
                                {player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fourthPlace">4️⃣ 4º Lugar</Label>
                        <Select value={fourthPlace} onValueChange={setFourthPlace}>
                          <SelectTrigger id="fourthPlace">
                            <SelectValue placeholder="Selecione o jogador" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((player) => (
                              <SelectItem key={player.id} value={player.id.toString()}>
                                {player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold mb-3">Outros Participantes (não ficaram no TOP 4)</h3>
                    <div className="space-y-2">
                      <Label>Selecione os demais jogadores que participaram</Label>
                      <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                        {players
                          .filter(p => 
                            p.id.toString() !== firstPlace && 
                            p.id.toString() !== secondPlace && 
                            p.id.toString() !== thirdPlace && 
                            p.id.toString() !== fourthPlace
                          )
                          .map((player) => (
                            <label key={player.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={otherParticipants.includes(player.id.toString())}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setOtherParticipants([...otherParticipants, player.id.toString()])
                                  } else {
                                    setOtherParticipants(otherParticipants.filter(id => id !== player.id.toString()))
                                  }
                                }}
                                className="rounded"
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
                    <Button type="submit">Salvar</Button>
                    <Button type="button" variant="outline" onClick={resetTournamentForm}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <div className="space-y-4">
              {tournaments.map((tournament) => {
                // Ordenar resultados por placement e pegar top 4
                const topResults = (tournament.tournament_results || [])
                  .sort((a: any, b: any) => a.placement - b.placement)
                  .slice(0, 4)

                return (
                  <Card key={tournament.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle>{tournament.name}</CardTitle>
                          <CardDescription>
                            {new Date(tournament.date).toLocaleDateString('pt-BR')} • {tournament.player_count} jogadores
                            {tournament.location && ` • ${tournament.location}`}
                          </CardDescription>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditTournament(tournament)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteTournament(tournament.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
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
          </div>
        )}
      </main>
    </div>
  )
}
