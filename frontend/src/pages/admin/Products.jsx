import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client.js'
import { useToast } from '../../components/UI/Toast.jsx'
import Button from '../../components/UI/Button.jsx'
import Input from '../../components/UI/Input.jsx'
import Badge from '../../components/UI/Badge.jsx'
import Spinner from '../../components/UI/Spinner.jsx'
import styles from './AdminTable.module.css'

const EMPTY_FORM = {
  name: '', description: '', price: '', stock: '',
  category: '', image: '', sku: '', is_active: true
}

export default function AdminProducts() {
  const { success, error: toastError } = useToast()
  const [products,    setProducts]    = useState([])
  const [categories,  setCategories]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)
  const [deleteId,    setDeleteId]    = useState(null)
  const [search,      setSearch]      = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([
        client.get('/api/products?limit=100'),
        client.get('/api/categories')
      ])
      setProducts(pRes.data.results || pRes.data || [])
      setCategories(cRes.data.results || cRes.data || [])
    } catch {
      toastError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditProduct(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit   = (p) => {
    setEditProduct(p)
    setForm({
      name: p.name, description: p.description || '', price: p.price,
      stock: p.stock ?? '', category: p.category || '', image: p.image || '',
      sku: p.sku || '', is_active: p.is_active ?? true
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 }
      if (editProduct) {
        await client.put(`/api/products/${editProduct.id}`, payload)
        success('Product updated')
      } else {
        await client.post('/api/products', payload)
        success('Product created')
      }
      setShowModal(false)
      load()
    } catch (err) {
      toastError(err.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await client.delete(`/api/products/${id}`)
      success('Product deleted')
      setDeleteId(null)
      setProducts((p) => p.filter((x) => x.id !== id))
    } catch {
      toastError('Delete failed')
    }
  }

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Products</h1>
          <Button onClick={openCreate}>+ Add Product</Button>
        </div>

        <div className={styles.toolbar}>
          <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} fullWidth={false} />
        </div>

        {loading ? <Spinner centered /> : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.productCell}>
                        {p.image && <img src={p.image} alt="" className={styles.thumb} loading="lazy" />}
                        <div>
                          <p className={styles.productName}>{p.name}</p>
                          {p.category_name && <p className={styles.productCat}>{p.category_name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className={styles.muted}>{p.sku || '—'}</td>
                    <td className={styles.price}>${Number(p.price).toFixed(2)}</td>
                    <td>{p.stock ?? '—'}</td>
                    <td>
                      <Badge variant={p.is_active !== false ? 'success' : 'default'}>
                        {p.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.editBtn} onClick={() => openEdit(p)}>Edit</button>
                        {deleteId === p.id ? (
                          <>
                            <button className={styles.confirmBtn} onClick={() => handleDelete(p.id)}>Confirm</button>
                            <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className={styles.deleteBtn} onClick={() => setDeleteId(p.id)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className={styles.empty}>No products found.</p>}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className={styles.modalForm}>
              <Input label="Name *" value={form.name} onChange={set('name')} required />
              <Input label="SKU"    value={form.sku}  onChange={set('sku')} />
              <div className={styles.row2}>
                <Input label="Price *" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required />
                <Input label="Stock"   type="number" min="0"             value={form.stock} onChange={set('stock')} />
              </div>
              <div>
                <label className={styles.selectLabel}>Category</label>
                <select className={styles.select} value={form.category} onChange={set('category')}>
                  <option value="">— None —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Input label="Image URL" type="url" value={form.image} onChange={set('image')} placeholder="https://…" />
              <div>
                <label className={styles.selectLabel}>Description</label>
                <textarea
                  className={styles.textarea}
                  value={form.description}
                  onChange={set('description')}
                  rows={3}
                  placeholder="Product description…"
                />
              </div>
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={form.is_active} onChange={set('is_active')} />
                <span>Active (visible to customers)</span>
              </label>
              <div className={styles.modalActions}>
                <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" loading={saving}>{editProduct ? 'Save Changes' : 'Create Product'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
