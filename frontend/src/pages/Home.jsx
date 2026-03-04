import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client.js'
import ProductGrid from '../components/Product/ProductGrid.jsx'
import Button from '../components/UI/Button.jsx'
import styles from './Home.module.css'

export default function Home() {
  const [featured, setFeatured]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [productsRes, catsRes] = await Promise.all([
          client.get('/api/products?page=1&page_size=8'),
          client.get('/api/categories')
        ])
        setFeatured(productsRes.data.items || [])
        setCategories((catsRes.data.results || catsRes.data || []).slice(0, 6))
      } catch {
        /* leave empty – graceful degradation */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className={`page-enter ${styles.page}`}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroContent}>
            <span className={styles.heroPill}>🌾 Farm-to-Market Platform</span>
            <h1 className={styles.heroTitle}>
              Sell Your <span className={styles.highlight}>Farm</span> Fresh Products
            </h1>
            <p className={styles.heroSub}>
              The easiest way for farmers to sell vegetables, fruits, grains, and more directly to customers. Upload photos, set your prices, and start earning today.
            </p>
            <div className={styles.heroCta}>
              <Button size="lg" as={Link} to="/products">
                <Link to="/products" className={styles.ctaLink}>Browse Products</Link>
              </Button>
              <Link to="/register" className={styles.ctaSecondary}>Start Selling →</Link>
            </div>
          </div>
          <div className={styles.heroIllustration} aria-hidden="true">
            <div className={styles.heroCard}>
              <div className={styles.heroCardImg} />
              <div className={styles.heroCardBody}>
                <div className={styles.heroCardLine} style={{ width: '75%' }} />
                <div className={styles.heroCardLine} style={{ width: '50%', opacity: 0.5 }} />
                <div className={styles.heroCardPrice}>₹149 / kg</div>
              </div>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>5k+</span>
              <span className={styles.heroStatLabel}>Farmers</span>
            </div>
            <div className={[styles.heroStat, styles.heroStatRight].join(' ')}>
              <span className={styles.heroStatNum}>98%</span>
              <span className={styles.heroStatLabel}>Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      {(categories.length > 0 || !loading) && (
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Shop by Category</h2>
              <Link to="/products" className={styles.seeAll}>View All →</Link>
            </div>
            {categories.length > 0 ? (
              <div className={styles.categoryGrid}>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/products?category=${cat.id}`}
                    className={styles.categoryCard}
                  >
                    <span className={styles.categoryEmoji} aria-hidden="true">
                      {cat.emoji || '🌿'}
                    </span>
                    <span className={styles.categoryName}>{cat.name}</span>
                    {cat.product_count !== undefined && (
                      <span className={styles.categoryCount}>{cat.product_count} items</span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.categoryGrid}>
                {[
                  { name: 'Vegetables', emoji: '🥦' },
                  { name: 'Fruits',     emoji: '🍎' },
                  { name: 'Grains',     emoji: '🌾' },
                  { name: 'Dairy',      emoji: '🥛' },
                  { name: 'Herbs',      emoji: '🌿' },
                  { name: 'Livestock',  emoji: '🐄' },
                ].map(({ name, emoji }) => (
                  <Link key={name} to={`/products?q=${encodeURIComponent(name)}`} className={styles.categoryCard}>
                    <span className={styles.categoryEmoji} aria-hidden="true">{emoji}</span>
                    <span className={styles.categoryName}>{name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Featured Products ── */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Fresh from the Farm</h2>
            <Link to="/products" className={styles.seeAll}>See All →</Link>
          </div>
          <ProductGrid products={featured} loading={loading} emptyMessage="No products yet. Be the first farmer to list!" />
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className={styles.ctaBanner}>
        <div className={`container ${styles.ctaBannerInner}`}>
          <div>
            <h2 className={styles.ctaBannerTitle}>Ready to sell your harvest?</h2>
            <p className={styles.ctaBannerSub}>
              Register as a farmer, upload photos of your produce, and reach customers directly.
            </p>
          </div>
          <Link to="/register" className={styles.ctaBannerBtn}>Get Started Free →</Link>
        </div>
      </section>
    </div>
  )
}
