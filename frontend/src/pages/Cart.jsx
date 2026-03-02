import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart.js'
import { useTheme } from '../context/ThemeContext.jsx'
import Button from '../components/UI/Button.jsx'
import styles from './Cart.module.css'

export default function Cart() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart()
  const { theme } = useTheme()

  const currency = theme.currency || 'USD'
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

  if (items.length === 0) {
    return (
      <div className={`page-enter ${styles.empty}`}>
        <div className={styles.emptyIcon} aria-hidden="true">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <h2 className={styles.emptyTitle}>Your cart is empty</h2>
        <p className={styles.emptySub}>Add some products and come back!</p>
        <Link to="/products">
          <Button size="lg">Browse Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className="container">
        <h1 className={styles.title}>Shopping Cart</h1>
        <div className={styles.layout}>
          {/* ── Items ── */}
          <div className={styles.items}>
            {items.map((item) => (
              <div key={item.product_id} className={styles.item}>
                <div className={styles.itemImg}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} loading="lazy" />
                  ) : (
                    <div className={styles.imgFallback} aria-hidden="true">📦</div>
                  )}
                </div>
                <div className={styles.itemInfo}>
                  <Link to={`/products/${item.product_id}`} className={styles.itemName}>
                    {item.name}
                  </Link>
                  <p className={styles.itemPrice}>{fmt(item.price)} each</p>
                </div>
                <div className={styles.itemControls}>
                  <div className={styles.qtyControl}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      aria-label="Decrease"
                    >−</button>
                    <span className={styles.qty}>{item.quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      aria-label="Increase"
                    >+</button>
                  </div>
                  <p className={styles.lineTotal}>{fmt(item.price * item.quantity)}</p>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.product_id)}
                    aria-label={`Remove ${item.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            <button className={styles.clearBtn} onClick={clearCart}>
              Clear Cart
            </button>
          </div>

          {/* ── Summary ── */}
          <aside className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>
            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{fmt(totalPrice)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span className={styles.freeShipping}>Free</span>
              </div>
              {theme.taxRate > 0 && (
                <div className={styles.summaryRow}>
                  <span>Tax ({(theme.taxRate * 100).toFixed(0)}%)</span>
                  <span>{fmt(totalPrice * theme.taxRate)}</span>
                </div>
              )}
              <div className={[styles.summaryRow, styles.summaryTotal].join(' ')}>
                <span>Total</span>
                <span>{fmt(totalPrice * (1 + (theme.taxRate || 0)))}</span>
              </div>
            </div>
            <Link to="/checkout">
              <Button size="lg" fullWidth>Proceed to Checkout</Button>
            </Link>
            <Link to="/products" className={styles.continueLink}>← Continue Shopping</Link>
          </aside>
        </div>
      </div>
    </div>
  )
}
