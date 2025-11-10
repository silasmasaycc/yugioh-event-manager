'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Server Actions para operações CRUD com revalidação automática de cache
 */

// ============= PLAYERS =============

export async function createPlayer(data: { name: string; image_url?: string }) {
  const supabase = await createClient()
  
  const { data: player, error } = await supabase
    .from('players')
    .insert([{ name: data.name, image_url: data.image_url }])
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidar páginas que mostram jogadores
  revalidatePath('/')
  revalidatePath('/players')
  revalidatePath('/ranking')

  return { success: true, data: player }
}

export async function updatePlayer(id: number, data: { name: string; image_url?: string }) {
  const supabase = await createClient()
  
  const { data: player, error } = await supabase
    .from('players')
    .update({ name: data.name, image_url: data.image_url })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidar páginas que mostram jogadores
  revalidatePath('/')
  revalidatePath('/players')
  revalidatePath('/ranking')
  revalidatePath('/tournaments')

  return { success: true, data: player }
}

export async function deletePlayer(id: number) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidar páginas que mostram jogadores
  revalidatePath('/')
  revalidatePath('/players')
  revalidatePath('/ranking')
  revalidatePath('/tournaments')

  return { success: true }
}

// ============= TOURNAMENTS =============

export async function createTournament(data: {
  name: string
  date: string
  player_count: number
  results: Array<{ player_id: number; placement: number | null }>
}) {
  const supabase = await createClient()
  
  // Criar torneio
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .insert([{
      name: data.name,
      date: data.date,
      player_count: data.player_count
    }])
    .select()
    .single()

  if (tournamentError) {
    return { success: false, error: tournamentError.message }
  }

  // Criar resultados
  if (data.results.length > 0) {
    const resultsToInsert = data.results.map(result => ({
      tournament_id: tournament.id,
      player_id: result.player_id,
      placement: result.placement
    }))

    const { error: resultsError } = await supabase
      .from('tournament_results')
      .insert(resultsToInsert)

    if (resultsError) {
      // Rollback: deletar torneio se falhar ao criar resultados
      await supabase.from('tournaments').delete().eq('id', tournament.id)
      return { success: false, error: resultsError.message }
    }
  }

  // Revalidar todas as páginas que mostram torneios
  revalidatePath('/')
  revalidatePath('/tournaments')
  revalidatePath('/ranking')
  revalidatePath('/players')
  revalidatePath('/stats')

  return { success: true, data: tournament }
}

export async function updateTournament(
  id: number,
  data: {
    name: string
    date: string
    player_count: number
    results: Array<{ player_id: number; placement: number | null }>
  }
) {
  const supabase = await createClient()
  
  // Atualizar torneio
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .update({
      name: data.name,
      date: data.date,
      player_count: data.player_count
    })
    .eq('id', id)
    .select()
    .single()

  if (tournamentError) {
    return { success: false, error: tournamentError.message }
  }

  // Deletar resultados antigos
  await supabase.from('tournament_results').delete().eq('tournament_id', id)

  // Criar novos resultados
  if (data.results.length > 0) {
    const resultsToInsert = data.results.map(result => ({
      tournament_id: id,
      player_id: result.player_id,
      placement: result.placement
    }))

    const { error: resultsError } = await supabase
      .from('tournament_results')
      .insert(resultsToInsert)

    if (resultsError) {
      return { success: false, error: resultsError.message }
    }
  }

  // Revalidar todas as páginas que mostram torneios
  revalidatePath('/')
  revalidatePath('/tournaments')
  revalidatePath('/ranking')
  revalidatePath('/players')
  revalidatePath('/stats')

  return { success: true, data: tournament }
}

export async function deleteTournament(id: number) {
  const supabase = await createClient()
  
  // Deletar resultados primeiro (foreign key constraint)
  await supabase.from('tournament_results').delete().eq('tournament_id', id)
  
  // Deletar torneio
  const { error } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidar todas as páginas que mostram torneios
  revalidatePath('/')
  revalidatePath('/tournaments')
  revalidatePath('/ranking')
  revalidatePath('/players')
  revalidatePath('/stats')

  return { success: true }
}

// ============= UTILITY =============

export async function revalidateAllPages() {
  revalidatePath('/')
  revalidatePath('/players')
  revalidatePath('/tournaments')
  revalidatePath('/ranking')
  revalidatePath('/stats')
  
  return { success: true }
}
