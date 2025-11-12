/**
 * Sistema de logging centralizado
 * Facilita debug e permite configuração de níveis de log
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogConfig {
  enabled: boolean
  level: LogLevel
  includeTimestamp: boolean
}

const config: LogConfig = {
  enabled: process.env.NODE_ENV === 'development',
  level: 'error',
  includeTimestamp: true,
}

const getTimestamp = (): string => {
  return new Date().toISOString()
}

const shouldLog = (level: LogLevel): boolean => {
  if (!config.enabled) return false
  
  const levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }
  
  return levels[level] >= levels[config.level]
}

const formatMessage = (level: LogLevel, message: string, context?: Record<string, any>): string => {
  const timestamp = config.includeTimestamp ? `[${getTimestamp()}]` : ''
  const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : ''
  return `${timestamp} [${level.toUpperCase()}] ${message}${contextStr}`
}

export const logger = {
  /**
   * Log de informação geral
   */
  info: (message: string, context?: Record<string, any>) => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, context))
    }
  },

  /**
   * Log de aviso (situações não ideais mas não críticas)
   */
  warn: (message: string, context?: Record<string, any>) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, context))
    }
  },

  /**
   * Log de erro (situações críticas que impedem funcionamento)
   */
  error: (message: string, error?: Error | unknown, context?: Record<string, any>) => {
    if (shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
      }
      console.error(formatMessage('error', message, errorContext))
    }
  },

  /**
   * Log de debug (informações detalhadas para desenvolvimento)
   */
  debug: (message: string, context?: Record<string, any>) => {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, context))
    }
  },
}
