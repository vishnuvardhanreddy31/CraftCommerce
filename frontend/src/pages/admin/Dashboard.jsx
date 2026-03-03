import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import client from '../../api/client.js'
import Card from '../../components/UI/Card.jsx'
import Badge from '../../components/UI/Badge.jsx'
import Spinner from '../../components/UI/Spinner.jsx'
import styles from './Dashboard.module.css'

const STATUS_VARIANT = {
  pending: 'warning', processing: 'info', shipped: 'purple',
  delivered: 'success', cancelled: 'error'
}

export default function Dashboard() {
  const [stats,   setStats]   = useState(null)
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          client.get('/api/admin/dashboard'),
          client.get('/api/orders?page=1&page_size=10')
        ])
        setStats(statsRes.data)
        setOrders(ordersRes.data.items || [])
      } catch {
        /* silent – show empty state */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Spinner centered size="lg" />

  const cards = [
    { label: 'Total Orders',   value: stats?.total_orders   ?? '—', icon: '📦', color: '#6366f1' },
    { label: 'Revenue',        value: stats?.total_revenue  != null ? `$${Number(stats.total_revenue).toLocaleString()}` : '—', icon: '💰', color: '#10b981' },
    { label: 'Products',       value: stats?.total_products ?? '—', icon: '🛍️',  color: '#8b5cf6' },
    { label: 'Customers',      value: stats?.total_users    ?? '—', icon: '👥', color: '#f59e0b' }
  ]

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <div className={styles.adminLinks}>
            <Link to="/admin/products"   className={styles.adminLink}>Products</Link>
            <Link to="/admin/categories" className={styles.adminLink}>Categories</Link>
            <Link to="/admin/orders"     className={styles.adminLink}>Orders</Link>
            <Link to="/admin/settings"   className={styles.adminLink}>Settings</Link>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className={styles.statsGrid}>
          {cards.map((c) => (
            <Card key={c.label} padding="md" shadow="md" className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: c.color + '20', color: c.color }}>
                {c.icon}
              </div>
              <div>
                <p className={styles.statValue}>{c.value}</p>
                <p className={styles.statLabel}>{c.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Recent Orders ── */}
        <Card padding="none" shadow="md" className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>Recent Orders</h2>
            <Link to="/admin/orders" className={styles.viewAll}>View all →</Link>
          </div>
          {orders.length === 0 ? (
            <p className={styles.empty}>No orders yet.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className={styles.orderId}>#{o.order_number || o.id}</td>
                      <td>{o.customer_name || o.user_email || '—'}</td>
                      <td className={styles.amount}>${Number(o.total || 0).toFixed(2)}</td>
                      <td>
                        <Badge variant={STATUS_VARIANT[o.status] || 'default'}>
                          {o.status || 'pending'}
                        </Badge>
                      </td>
                      <td className={styles.date}>
                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
