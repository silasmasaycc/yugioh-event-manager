import { ReactNode } from 'react'
import { Header } from './header'

interface PageLayoutProps {
  children: ReactNode
  activeRoute?: string
  maxWidth?: 'default' | 'lg' | 'xl' | '2xl' | '5xl' | '6xl'
}

export function PageLayout({ children, activeRoute, maxWidth = 'default' }: PageLayoutProps) {
  const maxWidthClass = {
    default: '',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
  }[maxWidth]

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header activeRoute={activeRoute} />
      <main className={`container mx-auto px-4 py-8 ${maxWidthClass}`}>
        {children}
      </main>
    </div>
  )
}
