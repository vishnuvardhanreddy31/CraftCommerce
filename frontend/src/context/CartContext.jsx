import { createContext, useState, useEffect, useCallback, useContext } from 'react'
import client from '../api/client.js'
import { AuthContext } from './AuthContext.jsx'

export const CartContext = createContext(null)

const LOCAL_KEY = 'cc_cart'

const mapCartItems = (items) => items.map((item) => ({
  product_id: item.product_id,
  name: item.name,
  sku: item.sku,
  quantity: item.quantity,
  price: item.unit_price ?? item.price,
  image: item.image_url || item.image
}))

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
          setItems(mapCartItems(data.items || []))
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

  const addItem = useCallback(async (product, quantity = 1) => {
    if (user) {
      const { data } = await client.post('/api/cart/items', { product_id: product.id, quantity })
      setItems(mapCartItems(data.items || []))
      return
    }
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
              image: product.images?.[0] || product.image,
              quantity
            }
          ]
      return next
    })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const removeItem = useCallback(async (productId) => {
    if (user) {
      const { data } = await client.delete(`/api/cart/items/${productId}`)
      setItems(mapCartItems(data.items || []))
      return
    }
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateQuantity = useCallback(async (productId, quantity) => {
    if (quantity < 1) { removeItem(productId); return }
    if (user) {
      const { data } = await client.put(`/api/cart/items/${productId}`, { quantity })
      setItems(mapCartItems(data.items || []))
      return
    }
    setItems((prev) =>
      prev.map((i) => i.product_id === productId ? { ...i, quantity } : i)
    )
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
