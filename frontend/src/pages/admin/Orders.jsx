import React, { useState, useEffect, useCallback } from 'react'
import client from '../../api/client.js'
import { useToast } from '../../components/UI/Toast.jsx'
import Badge from '../../components/UI/Badge.jsx'
import Spinner from '../../components/UI/Spinner.jsx'
import styles from './AdminTable.module.css'

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_VARIANT = {
  pending: 'warning', processing: 'info', shipped: 'purple',
  delivered: 'success', cancelled: 'error'
}

export default function AdminOrders() {
  const { success, error: toastError } = useToast()
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [page,     setPage]     = useState(1)
  const [total,    setTotal]    = useState(0)
  const pageSize = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await client.get(`/api/orders?page=${page}&page_size=${pageSize}`)
      setOrders(data.items || [])
      setTotal(data.total || 0)
    } catch { toastError('Failed to load orders') }
    finally { setLoading(false) }
  }, [page]) // eslint-disable-line

  useEffect(() => { load() }, [load])

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId)
    try {
      await client.put(`/api/orders/${orderId}/status`, { status })
      success('Status updated')
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o))
    } catch { toastError('Update failed') }
    finally { setUpdating(null) }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Orders</h1>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{total} total</span>
        </div>

        {loading ? <Spinner centered /> : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <React.Fragment key={o.id}>
                      <tr>
                        <td style={{ fontWeight: 600 }}>#{o.order_number || o.id}</td>
                        <td>{o.customer_name || o.user_email || '—'}</td>
                        <td className={styles.price}>${Number(o.total || 0).toFixed(2)}</td>
                        <td>
                          <select
                            className={styles.statusSelect}
                            value={o.status || 'pending'}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                            disabled={updating === o.id}
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className={styles.muted}>
                          {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <button
                            className={styles.editBtn}
                            onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                          >
                            {expanded === o.id ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      {expanded === o.id && (
                        <tr key={`${o.id}-detail`}>
                          <td colSpan={6} style={{ padding: '0.75rem 1.5rem', background: 'var(--color-surface-2)' }}>
                            <strong>Items:</strong>{' '}
                            {o.items?.map((i, idx) => (
                              <span key={idx} style={{ marginRight: '1rem' }}>
                                {i.name || `#${i.product_id}`} ×{i.quantity} @ ${i.unit_price}
                              </span>
                            )) || '—'}
                            {o.shipping_address && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <strong>Ship to:</strong>{' '}
                                {[o.shipping_address.full_name, o.shipping_address.address_line1,
                                  o.shipping_address.city, o.shipping_address.country].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <p className={styles.empty}>No orders found.</p>}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <button className={styles.editBtn} disabled={page <= 1} onClick={() => setPage((p) => p-1)}>← Prev</button>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>{page} / {totalPages}</span>
                <button className={styles.editBtn} disabled={page >= totalPages} onClick={() => setPage((p) => p+1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
