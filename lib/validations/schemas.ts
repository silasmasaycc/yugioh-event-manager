import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

export type LoginInput = z.infer<typeof loginSchema>

// Player schemas
export const playerSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres').max(100, 'O nome deve ter no máximo 100 caracteres'),
  image_url: z.string().url('URL inválida').optional().or(z.literal('')),
})

export const updatePlayerSchema = playerSchema.extend({
  id: z.number(),
})

export type PlayerInput = z.infer<typeof playerSchema>
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>

// Tournament schemas
export const tournamentSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres').max(200, 'O nome deve ter no máximo 200 caracteres'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Data inválida'),
  player_count: z.number().min(4, 'O torneio deve ter no mínimo 4 jogadores'),
})

export const updateTournamentSchema = tournamentSchema.extend({
  id: z.number(),
})

export type TournamentInput = z.infer<typeof tournamentSchema>
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>

// Tournament result schemas
export const tournamentResultSchema = z.object({
  player_id: z.number(),
  tournament_id: z.number(),
  placement: z.number().min(1).max(4, 'Placement deve estar entre 1 e 4'),
})

export const top4Schema = z.object({
  tournament_id: z.number(),
  first: z.number(),
  second: z.number(),
  third: z.number(),
  fourth: z.number(),
}).refine(
  (data) => {
    const ids = [data.first, data.second, data.third, data.fourth]
    return new Set(ids).size === ids.length
  },
  { message: 'Os jogadores devem ser diferentes' }
)

export type TournamentResultInput = z.infer<typeof tournamentResultSchema>
export type Top4Input = z.infer<typeof top4Schema>

// Filter schemas
export const dateFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  playerId: z.number().optional(),
})

export type DateFilterInput = z.infer<typeof dateFilterSchema>
