import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart.js'
import { useToast } from '../UI/Toast.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import styles from './ProductCard.module.css'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const { success } = useToast()
  const { theme } = useTheme()

  const handleAdd = async (e) => {
    e.preventDefault()
    await addItem(product, 1)
    success(`"${product.name}" added to cart`)
  }

  const currency = theme.currency || 'USD'
  const price = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(product.price)

  const isOutOfStock = product.stock !== undefined && product.stock <= 0

  return (
    <Link to={`/products/${product.id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        {product.image ? (
          <img src={product.image} alt={product.name} className={styles.image} loading="lazy" />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        {isOutOfStock && <span className={styles.outOfStockBadge}>Out of Stock</span>}
        {product.badge && <span className={styles.badge}>{product.badge}</span>}
      </div>

      <div className={styles.body}>
        {product.category && (
          <p className={styles.category}>{product.category}</p>
        )}
        <h3 className={styles.name}>{product.name}</h3>
        {product.description && (
          <p className={styles.description}>{product.description}</p>
        )}

        <div className={styles.footer}>
          <span className={styles.price}>{price}</span>
          <button
            className={styles.addBtn}
            onClick={handleAdd}
            disabled={isOutOfStock}
            aria-label={`Add ${product.name} to cart`}
          >
            {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  )
}
