import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client.js'
import { useCart } from '../hooks/useCart.js'
import { useToast } from '../components/UI/Toast.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import Button from '../components/UI/Button.jsx'
import Badge from '../components/UI/Badge.jsx'
import Spinner from '../components/UI/Spinner.jsx'
import styles from './ProductDetail.module.css'

export default function ProductDetail() {
  const { id } = useParams()
  const { addItem } = useCart()
  const { success, error: toastError } = useToast()
  const { theme } = useTheme()

  const [product,   setProduct]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [qty,       setQty]       = useState(1)
  const [adding,    setAdding]    = useState(false)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    setLoading(true)
    client.get(`/api/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner centered size="lg" />

  if (!product) {
    return (
      <div className={`page-enter ${styles.notFound}`}>
        <h2>Product not found</h2>
        <Link to="/products" className={styles.backLink}>← Back to Products</Link>
      </div>
    )
  }

  const currency = theme.currency || 'USD'
  const price = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(product.price)
  const images = product.images?.length ? product.images : product.image ? [product.image] : []
  const categoryId = product.category_id || product.category
  const categoryLabel = product.category_name || categoryId

  const inStock = product.stock === undefined || product.stock > 0
  const maxQty  = product.stock || 99

  const handleAdd = async () => {
    setAdding(true)
    try {
      await addItem(product, qty)
      success(`Added ${qty}× "${product.name}" to cart`)
    } catch {
      toastError('Failed to add to cart')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className="container">
        {/* ── Breadcrumbs ── */}
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link to="/" className={styles.crumb}>Home</Link>
          <span className={styles.sep}>›</span>
          <Link to="/products" className={styles.crumb}>Products</Link>
          {categoryLabel && (
            <>
              <span className={styles.sep}>›</span>
              {categoryId ? (
                <Link to={`/products?category=${categoryId}`} className={styles.crumb}>
                  {categoryLabel}
                </Link>
              ) : (
                <span className={styles.crumb}>{categoryLabel}</span>
              )}
            </>
          )}
          <span className={styles.sep}>›</span>
          <span className={styles.crumbCurrent}>{product.name}</span>
        </nav>

        {/* ── Main ── */}
        <div className={styles.main}>
          {/* Gallery */}
          <div className={styles.gallery}>
            <div className={styles.mainImg}>
              {images[activeImg] ? (
                <img src={images[activeImg]} alt={product.name} className={styles.img} />
              ) : (
                <div className={styles.imgPlaceholder}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className={styles.thumbs}>
                {images.map((src, i) => (
                  <button
                    key={i}
                    className={[styles.thumb, i === activeImg ? styles.thumbActive : ''].filter(Boolean).join(' ')}
                    onClick={() => setActiveImg(i)}
                    aria-label={`Image ${i + 1}`}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className={styles.info}>
            {product.category_name && (
              <p className={styles.category}>{product.category_name}</p>
            )}
            <h1 className={styles.name}>{product.name}</h1>

            <div className={styles.badges}>
              {inStock ? (
                <Badge variant="success">In Stock{product.stock !== undefined ? ` (${product.stock})` : ''}</Badge>
              ) : (
                <Badge variant="error">Out of Stock</Badge>
              )}
              {product.sku && <Badge variant="default">SKU: {product.sku}</Badge>}
            </div>

            <p className={styles.price}>{price}</p>

            {product.description && (
              <div className={styles.description}>
                <h2 className={styles.descTitle}>Description</h2>
                <p className={styles.descText}>{product.description}</p>
              </div>
            )}

            {/* Quantity */}
            {inStock && (
              <div className={styles.qtyRow}>
                <span className={styles.qtyLabel}>Quantity</span>
                <div className={styles.qtyControl}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className={styles.qtyNum}>{qty}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <Button
                size="lg"
                fullWidth
                onClick={handleAdd}
                loading={adding}
                disabled={!inStock}
              >
                {inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Link to="/cart" className={styles.viewCart}>View Cart →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
