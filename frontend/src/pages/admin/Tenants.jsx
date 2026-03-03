import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client.js'
import { useToast } from '../../components/UI/Toast.jsx'
import Button from '../../components/UI/Button.jsx'
import Input from '../../components/UI/Input.jsx'
import Badge from '../../components/UI/Badge.jsx'
import Spinner from '../../components/UI/Spinner.jsx'
import { TENANT_CURRENCIES, TENANT_TIMEZONES } from '../../constants/tenantOptions.js'
import styles from './AdminTable.module.css'

const EMPTY_FORM = {
  store_name: '',
  slug: '',
  owner_email: '',
  currency: 'USD',
  timezone: 'UTC'
}


export default function AdminTenants() {
  const { success, error: toastError } = useToast()
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/api/tenants')
      setTenants(data || [])
    } catch (err) {
      console.error('Failed to load tenants:', err)
      toastError('Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }, [toastError])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.store_name.trim() || !form.slug.trim() || !form.owner_email.trim()) return
    setSaving(true)
    try {
      const payload = {
        store_name: form.store_name.trim(),
        slug: form.slug.trim(),
        owner_email: form.owner_email.trim(),
        currency: form.currency,
        timezone: form.timezone
      }
      await client.post('/api/tenants', payload)
      success('Tenant created')
      setShowModal(false)
      load()
    } catch (err) {
      toastError(err.response?.data?.detail || 'Tenant creation failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await client.delete(`/api/tenants/${id}`)
      success('Tenant deactivated')
      setDeleteId(null)
      load()
    } catch (err) {
      console.error('Failed to deactivate tenant:', err)
      toastError('Failed to deactivate tenant')
    }
  }

  const filtered = tenants.filter((t) => {
    const name = t.store_name || ''
    const slug = t.slug || ''
    const owner = t.owner_email || ''
    const term = search.toLowerCase()
    return (
      name.toLowerCase().includes(term) ||
      slug.toLowerCase().includes(term) ||
      owner.toLowerCase().includes(term)
    )
  })

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Tenants</h1>
          <Button onClick={openCreate}>+ Add Tenant</Button>
        </div>

        <div className={styles.toolbar}>
          <Input placeholder="Search tenants…" value={search} onChange={(e) => setSearch(e.target.value)} fullWidth={false} />
        </div>

        {loading ? <Spinner centered /> : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Slug</th>
                  <th>Owner</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div>
                        <p className={styles.productName}>{t.store_name}</p>
                        <p className={styles.muted}>{t.id}</p>
                      </div>
                    </td>
                    <td className={styles.muted}>{t.slug}</td>
                    <td>{t.owner_email}</td>
                    <td>{t.currency}</td>
                    <td>
                      <Badge variant={t.is_active ? 'success' : 'default'}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {deleteId === t.id ? (
                          <>
                            <button className={styles.confirmBtn} onClick={() => handleDelete(t.id)}>Confirm</button>
                            <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className={styles.deleteBtn} onClick={() => setDeleteId(t.id)}>Deactivate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className={styles.empty}>No tenants found.</p>}
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add Tenant</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className={styles.modalForm}>
              <Input label="Store Name *" value={form.store_name} onChange={set('store_name')} required />
              <Input label="Store Slug *" value={form.slug} onChange={set('slug')} placeholder="artisan-crafts" required />
              <Input label="Owner Email *" type="email" value={form.owner_email} onChange={set('owner_email')} required />
              <div className={styles.row2}>
                <div>
                  <label className={styles.selectLabel}>Currency</label>
                  <select className={styles.select} value={form.currency} onChange={set('currency')}>
                    {TENANT_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={styles.selectLabel}>Timezone</label>
                  <select className={styles.select} value={form.timezone} onChange={set('timezone')}>
                    {TENANT_TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.modalActions}>
                <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" loading={saving}>Create Tenant</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
