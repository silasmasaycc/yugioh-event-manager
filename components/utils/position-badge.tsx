import { Medal } from 'lucide-react'
import { MEDAL_COLORS } from '@/lib/constants'

interface PositionBadgeProps {
  position: number
  variant?: 'medal' | 'number'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PositionBadge({ 
  position, 
  variant = 'medal', 
  size = 'md',
  className = '' 
}: PositionBadgeProps) {
  const medalColor = MEDAL_COLORS[position as keyof typeof MEDAL_COLORS] || 'text-gray-300'
  
  const sizeClasses = {
    sm: 'text-2xl min-w-[2rem]',
    md: 'text-4xl min-w-[3rem]',
    lg: 'text-5xl min-w-[4rem]'
  }

  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  if (variant === 'medal' && position <= 3) {
    return (
      <div className={`${medalColor} ${sizeClasses[size]} shrink-0 text-center ${className}`}>
        <Medal className={`${iconSizes[size]} mx-auto`} />
      </div>
    )
  }

  return (
    <div className={`font-bold ${medalColor} ${sizeClasses[size]} shrink-0 text-center ${className}`}>
      #{position}
    </div>
  )
}
