/**
 * Mensagens do sistema centralizadas
 */

// Mensagens de Sucesso
export const SUCCESS_MESSAGES = {
  PLAYER_CREATED: 'Jogador criado com sucesso!',
  PLAYER_UPDATED: 'Jogador atualizado com sucesso!',
  PLAYER_DELETED: 'Jogador excluído com sucesso!',
  TOURNAMENT_CREATED: 'Torneio criado com sucesso!',
  TOURNAMENT_UPDATED: 'Torneio atualizado com sucesso!',
  TOURNAMENT_DELETED: 'Torneio excluído com sucesso!',
  PENALTY_ADDED: 'Penalidade adicionada com sucesso!',
  PENALTY_REMOVED: 'Penalidade removida com sucesso!',
  LOGIN_SUCCESS: 'Login realizado com sucesso!',
} as const

// Mensagens de Erro
export const ERROR_MESSAGES = {
  ADMIN_ONLY: 'Apenas administradores podem realizar esta ação',
  PLAYER_SAVE_ERROR: 'Erro ao salvar jogador',
  PLAYER_DELETE_ERROR: 'Erro ao excluir jogador',
  TOURNAMENT_SAVE_ERROR: 'Erro ao salvar torneio',
  TOURNAMENT_DELETE_ERROR: 'Erro ao excluir torneio',
  PENALTY_ADD_ERROR: 'Erro ao adicionar penalidade',
  PENALTY_REMOVE_ERROR: 'Erro ao remover penalidade',
  IMAGE_UPLOAD_ERROR: 'Erro ao fazer upload da imagem',
  LOGIN_ERROR: 'Erro ao fazer login',
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  LOAD_PLAYERS_ERROR: 'Erro ao carregar jogadores',
  LOAD_TOURNAMENTS_ERROR: 'Erro ao carregar torneios',
  LOAD_STATS_ERROR: 'Erro ao carregar estatísticas',
  GENERIC_ERROR: 'Ocorreu um erro. Tente novamente.',
} as const

// Mensagens de Confirmação
export const CONFIRMATION_MESSAGES = {
  DELETE_PLAYER: 'Tem certeza que deseja excluir este jogador?',
  DELETE_TOURNAMENT: 'Tem certeza que deseja excluir este torneio?',
  DELETE_PENALTY: 'Tem certeza que deseja remover esta penalidade?',
} as const

// Labels e Títulos
export const LABELS = {
  PLAYERS: 'Jogadores',
  TOURNAMENTS: 'Torneios',
  RANKING: 'Rankings',
  STATISTICS: 'Estatísticas',
  BEST_PLAYERS: 'Melhores Jogadores',
  MOST_PENALIZED: 'Mais Penalizados',
  DOUBLE_LOSS: 'Double Loss',
  PARTICIPATIONS: 'Participações',
  TOPS: 'TOPs',
  PERFORMANCE: 'Aproveitamento',
  FINAL_STANDINGS: 'Classificação Final',
  NO_PLAYERS: 'Nenhum jogador cadastrado ainda.',
  NO_TOURNAMENTS: 'Nenhum torneio cadastrado ainda.',
  NO_RESULTS: 'Nenhum jogador com resultados ainda.',
  NO_PENALTIES: 'Nenhum jogador com penalidades ainda.',
} as const

// Placeholders
export const PLACEHOLDERS = {
  PLAYER_NAME: 'Nome do jogador',
  TOURNAMENT_NAME: 'Nome do torneio',
  TOURNAMENT_DATE: 'Data do torneio',
  PLAYER_COUNT: 'Número de jogadores',
  LOCATION: 'Local (opcional)',
  EMAIL: 'Email',
  PASSWORD: 'Senha',
  IMAGE_URL: 'URL da imagem (opcional)',
} as const
