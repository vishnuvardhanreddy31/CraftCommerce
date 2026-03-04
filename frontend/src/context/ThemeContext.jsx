import { createContext, useState, useEffect, useContext } from 'react'
import client from '../api/client.js'

export const ThemeContext = createContext(null)

const DEFAULT_THEME = {
  primaryColor: '#16a34a',
  secondaryColor: '#ca8a04',
  fontFamily: 'Inter, system-ui, sans-serif',
  storeName: 'FarmCommerce',
  logoUrl: null,
  currency: 'USD',
  taxRate: 0
}

const getTenantId = () =>
  localStorage.getItem('cc_tenant_id') || import.meta.env.VITE_TENANT_ID || 'default'

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
        const tenantId = getTenantId()
        const { data } = await client.get(`/api/tenants/${tenantId}`)
        const themeConfig = data.theme_config || {}
        const taxConfig = data.tax_config || {}
        const merged = {
          ...DEFAULT_THEME,
          storeName: data.store_name || DEFAULT_THEME.storeName,
          logoUrl: data.logo || DEFAULT_THEME.logoUrl,
          currency: data.currency || DEFAULT_THEME.currency,
          taxRate: taxConfig.enabled ? (taxConfig.rate || 0) / 100 : 0,
          primaryColor: themeConfig.primaryColor || DEFAULT_THEME.primaryColor,
          secondaryColor: themeConfig.secondaryColor || DEFAULT_THEME.secondaryColor,
          fontFamily: themeConfig.fontFamily || DEFAULT_THEME.fontFamily
        }
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
    const tenantId = getTenantId()
    const taxRate = Number.isFinite(next.taxRate) ? next.taxRate : 0
    await client.put(`/api/tenants/${tenantId}`, {
      store_name: next.storeName,
      logo: next.logoUrl,
      currency: next.currency,
      tax_config: {
        enabled: taxRate > 0,
        rate: taxRate * 100,
        inclusive: false
      },
      theme_config: {
        primaryColor: next.primaryColor,
        secondaryColor: next.secondaryColor,
        fontFamily: next.fontFamily
      }
    })
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
