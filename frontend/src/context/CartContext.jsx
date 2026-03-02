import { createContext, useState, useEffect, useCallback, useContext } from 'react'
import client from '../api/client.js'
import { AuthContext } from './AuthContext.jsx'

export const CartContext = createContext(null)

const LOCAL_KEY = 'cc_cart'

const readLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const { user } = useContext(AuthContext)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  /* Load cart – from backend when logged in, else localStorage */
  useEffect(() => {
    const load = async () => {
      if (user) {
        setLoading(true)
        try {
          const { data } = await client.get('/api/cart')
          setItems(data.items || [])
        } catch {
          setItems(readLocal())
        } finally {
          setLoading(false)
        }
      } else {
        setItems(readLocal())
      }
    }
    load()
  }, [user])

  /* Keep localStorage in sync */
  useEffect(() => {
    if (!user) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(items))
    }
  }, [items, user])

  const syncBackend = async (nextItems) => {
    if (!user) return
    try {
      await client.put('/api/cart', { items: nextItems })
    } catch {
      /* silent – local state is source of truth in error cases */
    }
  }

  const addItem = useCallback(async (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id)
      const next = existing
        ? prev.map((i) =>
            i.product_id === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        : [
            ...prev,
            {
              product_id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              quantity
            }
          ]
      syncBackend(next)
      return next
    })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const removeItem = useCallback(async (productId) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.product_id !== productId)
      syncBackend(next)
      return next
    })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateQuantity = useCallback(async (productId, quantity) => {
    if (quantity < 1) { removeItem(productId); return }
    setItems((prev) => {
      const next = prev.map((i) =>
        i.product_id === productId ? { ...i, quantity } : i
      )
      syncBackend(next)
      return next
    })
  }, [user, removeItem]) // eslint-disable-line react-hooks/exhaustive-deps

  const clearCart = useCallback(async () => {
    setItems([])
    if (user) {
      try { await client.delete('/api/cart') } catch { /* silent */ }
    } else {
      localStorage.removeItem(LOCAL_KEY)
    }
  }, [user])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, loading, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}
