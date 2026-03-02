import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client.js'
import { useToast } from '../../components/UI/Toast.jsx'
import Button from '../../components/UI/Button.jsx'
import Input from '../../components/UI/Input.jsx'
import Spinner from '../../components/UI/Spinner.jsx'
import styles from './AdminTable.module.css'

const EMPTY = { name: '', slug: '', description: '', emoji: '' }

export default function AdminCategories() {
  const { success, error: toastError } = useToast()
  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(true)
  const [editId,  setEditId]  = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/api/categories')
      setCats(data.results || data || [])
    } catch { toastError('Failed to load categories') }
    finally { setLoading(false) }
  }, []) // eslint-disable-line

  useEffect(() => { load() }, [load])

  const set    = (k) => (e) => setForm   ((p) => ({ ...p, [k]: e.target.value }))
  const setNew = (k) => (e) => setNewForm((p) => ({ ...p, [k]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newForm.name.trim()) return
    setSaving(true)
    try {
      await client.post('/api/categories', newForm)
      success('Category created')
      setShowNew(false); setNewForm(EMPTY); load()
    } catch (err) { toastError(err.response?.data?.detail || 'Create failed') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (id) => {
    setSaving(true)
    try {
      await client.put(`/api/categories/${id}`, form)
      success('Category updated')
      setEditId(null); load()
    } catch (err) { toastError(err.response?.data?.detail || 'Update failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await client.delete(`/api/categories/${id}`)
      success('Category deleted'); setDeleteId(null)
      setCats((p) => p.filter((c) => c.id !== id))
    } catch { toastError('Delete failed') }
  }

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Categories</h1>
          <Button onClick={() => setShowNew(!showNew)}>+ Add Category</Button>
        </div>

        {/* New form */}
        {showNew && (
          <form onSubmit={handleCreate} className={styles.inlineForm} style={{ marginBottom: '1.25rem' }}>
            <Input label="Name *"   value={newForm.name}        onChange={setNew('name')}        fullWidth={false} required />
            <Input label="Slug"     value={newForm.slug}        onChange={setNew('slug')}        fullWidth={false} placeholder="auto-generated" />
            <Input label="Emoji"    value={newForm.emoji}       onChange={setNew('emoji')}       fullWidth={false} placeholder="🛍️" style={{ width: 90 }} />
            <Input label="Description" value={newForm.description} onChange={setNew('description')} fullWidth={false} />
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', paddingBottom: '1px' }}>
              <Button type="submit" loading={saving}>Create</Button>
              <Button variant="ghost" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {loading ? <Spinner centered /> : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr><th>Emoji</th><th>Name</th><th>Slug</th><th>Products</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {cats.map((c) => (
                  <tr key={c.id}>
                    {editId === c.id ? (
                      <>
                        <td><Input value={form.emoji} onChange={set('emoji')} fullWidth={false} style={{ width: 70 }} /></td>
                        <td><Input value={form.name}  onChange={set('name')}  required /></td>
                        <td><Input value={form.slug}  onChange={set('slug')}  /></td>
                        <td>{c.product_count ?? '—'}</td>
                        <td>
                          <div className={styles.actions}>
                            <button className={styles.confirmBtn} onClick={() => handleUpdate(c.id)}>Save</button>
                            <button className={styles.cancelBtn}  onClick={() => setEditId(null)}>Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{c.emoji || '—'}</td>
                        <td className={styles.productName}>{c.name}</td>
                        <td className={styles.muted}>{c.slug || '—'}</td>
                        <td>{c.product_count ?? '—'}</td>
                        <td>
                          <div className={styles.actions}>
                            <button className={styles.editBtn} onClick={() => {
                              setEditId(c.id)
                              setForm({ name: c.name, slug: c.slug || '', description: c.description || '', emoji: c.emoji || '' })
                            }}>Edit</button>
                            {deleteId === c.id ? (
                              <>
                                <button className={styles.confirmBtn} onClick={() => handleDelete(c.id)}>Confirm</button>
                                <button className={styles.cancelBtn}  onClick={() => setDeleteId(null)}>Cancel</button>
                              </>
                            ) : (
                              <button className={styles.deleteBtn} onClick={() => setDeleteId(c.id)}>Delete</button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {cats.length === 0 && <p className={styles.empty}>No categories yet.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
