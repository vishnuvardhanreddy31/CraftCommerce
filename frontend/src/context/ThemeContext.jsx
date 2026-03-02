import { createContext, useState, useEffect, useContext } from 'react'
import client from '../api/client.js'

export const ThemeContext = createContext(null)

const DEFAULT_THEME = {
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  fontFamily: 'Inter, system-ui, sans-serif',
  storeName: 'CraftCommerce',
  logoUrl: null,
  currency: 'USD',
  taxRate: 0
}

function applyTheme(theme) {
  const root = document.documentElement
  if (theme.primaryColor) {
    root.style.setProperty('--color-primary', theme.primaryColor)
    // derive a darker hover variant (simple darkening via opacity overlay trick)
    root.style.setProperty('--color-primary-hover', theme.primaryColor + 'dd')
  }
  if (theme.secondaryColor) {
    root.style.setProperty('--color-secondary', theme.secondaryColor)
  }
  if (theme.fontFamily) {
    root.style.setProperty('--font-sans', theme.fontFamily)
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const [themeLoading, setThemeLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await client.get('/api/tenant/config')
        const merged = { ...DEFAULT_THEME, ...data }
        setTheme(merged)
        applyTheme(merged)
      } catch {
        applyTheme(DEFAULT_THEME)
      } finally {
        setThemeLoading(false)
      }
    }
    load()
  }, [])

  const updateTheme = async (updates) => {
    const next = { ...theme, ...updates }
    setTheme(next)
    applyTheme(next)
    await client.put('/api/tenant/config', next)
  }

  return (
    <ThemeContext.Provider value={{ theme, themeLoading, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
