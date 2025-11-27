import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  // Formatar diretamente sem criar objeto Date desnecessariamente
  if (typeof date === 'string') {
    // Formato esperado: 'YYYY-MM-DD' -> converter para 'DD/MM/YYYY'
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
  }
  
  // Se for Date, usar toLocaleDateString
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateLong(date: string | Date): string {
  // Formato longo com mês por extenso: "01 de novembro de 2025"
  const dateObj = typeof date === 'string' 
    ? new Date(date + 'T00:00:00')
    : date
  
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

export function formatDateShort(date: string | Date): string {
  // Formato curto sem ano: "01/11"
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-')
    return `${day}/${month}`
  }
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  })
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Gera uma cor consistente baseada em uma string (hash)
 * Mesma string sempre gera a mesma cor
 */
function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Gerar cores vibrantes e distintas usando HSL
  const hue = Math.abs(hash % 360)
  const saturation = 65 + (Math.abs(hash) % 15) // 65-80%
  const lightness = 45 + (Math.abs(hash >> 8) % 15) // 45-60%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Gera um array de cores para uma lista de nomes
 * Cada nome sempre terá a mesma cor (consistente)
 */
export function generateColors(names: string[]): string[] {
  return names.map(name => stringToColor(name))
}

/**
 * Obtém a cor de um jogador específico de forma consistente
 */
export function getPlayerColor(playerName: string): string {
  return stringToColor(playerName)
}
