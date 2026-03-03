import { useState, useEffect } from 'react'
import client from '../api/client.js'
import { useTheme } from '../context/ThemeContext.jsx'
import Badge from '../components/UI/Badge.jsx'
import Spinner from '../components/UI/Spinner.jsx'
import styles from './OrderHistory.module.css'

const STATUS_VARIANT = {
  pending:    'warning',
  processing: 'info',
  shipped:    'purple',
  delivered:  'success',
  cancelled:  'error'
}

export default function OrderHistory() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const { theme } = useTheme()

  const currency = theme.currency || 'USD'
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

  useEffect(() => {
    client.get('/api/orders')
      .then(({ data }) => setOrders(data.items || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner centered size="lg" />

  if (orders.length === 0) {
    return (
      <div className={`page-enter ${styles.empty}`}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="13" y2="16" />
        </svg>
        <h2>No orders yet</h2>
        <p>When you place orders, they'll show up here.</p>
        <a href="/products" className={styles.link}>Start Shopping →</a>
      </div>
    )
  }

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className="container">
        <h1 className={styles.title}>Order History</h1>
        <div className={styles.list}>
          {orders.map((order) => (
            <div key={order.id} className={styles.order}>
              <div
                className={styles.orderHeader}
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setExpanded(expanded === order.id ? null : order.id)}
                aria-expanded={expanded === order.id}
              >
                <div className={styles.orderMeta}>
                  <span className={styles.orderId}>Order #{order.id}</span>
                  <span className={styles.orderDate}>
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })
                      : '—'}
                  </span>
                </div>
                <div className={styles.orderRight}>
                  <Badge variant={STATUS_VARIANT[order.status] || 'default'}>
                    {order.status || 'pending'}
                  </Badge>
                   <span className={styles.orderTotal}>{fmt(order.total)}</span>
                  <span className={styles.chevron} style={{ transform: expanded === order.id ? 'rotate(180deg)' : '' }}>
                    ▾
                  </span>
                </div>
              </div>

              {expanded === order.id && (
                <div className={styles.orderBody}>
                  {/* Items */}
                  {order.items?.length > 0 && (
                    <div className={styles.items}>
                      <h3 className={styles.itemsTitle}>Items</h3>
                      {order.items.map((item, i) => (
                        <div key={i} className={styles.item}>
                          <span className={styles.itemName}>{item.name || `Product #${item.product_id}`}</span>
                          <span className={styles.itemQty}>× {item.quantity}</span>
                           <span className={styles.itemPrice}>{fmt(item.total_price ?? item.unit_price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Shipping */}
                  {order.shipping_address && (
                    <div className={styles.shipping}>
                      <h3 className={styles.itemsTitle}>Shipping to</h3>
                      <address className={styles.address}>
                        {order.shipping_address.full_name && <p>{order.shipping_address.full_name}</p>}
                        <p>{order.shipping_address.address_line1}</p>
                        {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                        <p>
                          {[order.shipping_address.city, order.shipping_address.state, order.shipping_address.postal_code]
                            .filter(Boolean).join(', ')}
                        </p>
                        <p>{order.shipping_address.country}</p>
                      </address>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
