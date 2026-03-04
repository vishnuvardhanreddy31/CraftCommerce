import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client.js'
import { useToast } from '../../components/UI/Toast.jsx'
import Badge from '../../components/UI/Badge.jsx'
import Spinner from '../../components/UI/Spinner.jsx'
import Input from '../../components/UI/Input.jsx'
import styles from './AdminTable.module.css'

const ROLE_VARIANT = { admin: 'error', vendor: 'purple', customer: 'info' }
const ROLES = ['admin', 'vendor', 'customer']

export default function AdminUsers() {
  const { success, error: toastError } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/api/admin/users?limit=500')
      setUsers(data || [])
    } catch (err) {
      console.error('Failed to load users:', err)
      toastError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [toastError])

  useEffect(() => { load() }, [load])

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId)
    try {
      await client.patch(`/api/admin/users/${userId}/role`, { role: newRole })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
      success('Role updated')
    } catch (err) {
      toastError(err.response?.data?.detail || 'Failed to update role')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = users.filter((u) => {
    const term = search.toLowerCase()
    return (
      u.email?.toLowerCase().includes(term) ||
      u.first_name?.toLowerCase().includes(term) ||
      u.last_name?.toLowerCase().includes(term)
    )
  })

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Users</h1>
        </div>

        <div className={styles.toolbar}>
          <Input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth={false}
          />
        </div>

        {loading ? <Spinner centered /> : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <p className={styles.productName}>
                        {u.first_name} {u.last_name}
                      </p>
                      <p className={styles.muted}>{u.id}</p>
                    </td>
                    <td>{u.email}</td>
                    <td className={styles.muted}>{u.phone || '—'}</td>
                    <td>
                      <Badge variant={u.is_active ? 'success' : 'default'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Badge variant={ROLE_VARIANT[u.role] || 'default'}>{u.role}</Badge>
                        <select
                          className={styles.select}
                          value={u.role}
                          disabled={updating === u.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          aria-label={`Change role for ${u.email}`}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className={styles.empty}>No users found.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
