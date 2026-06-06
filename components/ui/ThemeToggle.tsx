'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="w-9 h-9 flex items-center justify-center rounded-xl text-sage-500 dark:text-sage-400 hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors duration-150"
    >
      {theme === 'dark'
        ? <Sun className="w-4.5 h-4.5" />
        : <Moon className="w-4.5 h-4.5" />}
    </button>
  )
}
