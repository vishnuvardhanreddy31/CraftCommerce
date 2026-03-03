import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import client from '../api/client.js'
import ProductGrid from '../components/Product/ProductGrid.jsx'
import Input from '../components/UI/Input.jsx'
import styles from './ProductListing.module.css'

const SORT_OPTIONS = [
  { value: '',          label: 'Best Match' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc',label: 'Price: High to Low' },
  { value: '-created_at',label: 'Newest First' }
]

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [catLoading, setCatLoading] = useState(true)

  const page     = parseInt(searchParams.get('page')     || '1', 10)
  const q        = searchParams.get('q')        || ''
  const category = searchParams.get('category') || ''
  const sort     = searchParams.get('sort')     || ''
  const pageSize = 12

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  )

  const sortConfig = useMemo(() => ({
    price_asc: { sort_by: 'price', sort_order: 1 },
    price_desc: { sort_by: 'price', sort_order: -1 },
    '-created_at': { sort_by: '_id', sort_order: -1 }
  }), [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q)        params.set('search',   q)
      const selectedCategory = categories.find((c) => c.id === category || c.slug === category)
      if (selectedCategory) params.set('category_id', selectedCategory.id)
      const sortPayload = sortConfig[sort] || { sort_by: 'name', sort_order: 1 }
      params.set('sort_by', sortPayload.sort_by)
      params.set('sort_order', String(sortPayload.sort_order))
      params.set('page',  String(page))
      params.set('page_size', String(pageSize))

      const { data } = await client.get(`/api/products?${params}`)
      const items = data.items || []
      setProducts(items.map((item) => ({
        ...item,
        category_name: categoryMap.get(item.category_id) || item.category_name
      })))
      setTotal(data.total || items.length)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [q, category, sort, page, pageSize, categories, categoryMap, sortConfig])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    client.get('/api/categories')
      .then(({ data }) => setCategories(data.results || data || []))
      .catch(() => {})
      .finally(() => setCatLoading(false))
  }, [])

  const set = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) { next.set(key, value) } else { next.delete(key) }
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className="container">
        {/* ── Header ── */}
        <div className={styles.header}>
          <h1 className={styles.title}>Products</h1>
          {total > 0 && <p className={styles.count}>{total} items</p>}
        </div>

        {/* ── Filters Bar ── */}
        <div className={styles.filtersBar}>
          <div className={styles.searchWrapper}>
            <Input
              placeholder="Search products…"
              value={q}
              onChange={(e) => set('q', e.target.value)}
              fullWidth={false}
            />
          </div>

          <select
            className={styles.select}
            value={category}
            onChange={(e) => set('category', e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className={styles.select}
            value={sort}
            onChange={(e) => set('sort', e.target.value)}
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* ── Grid ── */}
        <ProductGrid products={products} loading={loading} />

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => set('page', String(page - 1))}
            >
              ← Prev
            </button>
            <span className={styles.pageInfo}>{page} / {totalPages}</span>
            <button
              className={styles.pageBtn}
              disabled={page >= totalPages}
              onClick={() => set('page', String(page + 1))}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
