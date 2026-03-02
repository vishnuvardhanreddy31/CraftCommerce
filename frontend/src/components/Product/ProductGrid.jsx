import ProductCard from './ProductCard.jsx'
import Spinner from '../UI/Spinner.jsx'
import styles from './ProductGrid.module.css'

export default function ProductGrid({ products, loading, emptyMessage = 'No products found.' }) {
  if (loading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={styles.skeleton}>
            <div className={`skeleton ${styles.skeletonImg}`} />
            <div className={styles.skeletonBody}>
              <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '60%' }} />
              <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '90%' }} />
              <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '40%', marginTop: '0.5rem' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className={styles.empty}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
