import { createContext, useState, useEffect, useCallback } from 'react'
import client from '../api/client.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cc_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('cc_token') || null)
  const [loading, setLoading] = useState(true)

  /* Verify token on mount */
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return }
      try {
        const { data } = await client.get('/api/auth/me')
        setUser(data)
        localStorage.setItem('cc_user', JSON.stringify(data))
      } catch {
        logout()
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const persistAuth = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('cc_user', JSON.stringify(userData))
    localStorage.setItem('cc_token', authToken)
  }

  const login = useCallback(async (email, password) => {
    const { data } = await client.post('/api/auth/login', { email, password })
    persistAuth(data.user, data.token)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await client.post('/api/auth/register', payload)
    persistAuth(data.user, data.token)
    return data.user
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('cc_token')
    localStorage.removeItem('cc_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}
