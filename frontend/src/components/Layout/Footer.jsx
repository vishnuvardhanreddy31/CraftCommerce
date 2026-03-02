import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <svg width="22" height="22" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <rect width="64" height="64" rx="14" fill="var(--color-primary)" />
            <path d="M16 20h32M16 32h24M16 44h16" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <span className={styles.brandName}>CraftCommerce</span>
          <p className={styles.tagline}>Multi-tenant SaaS eCommerce Platform</p>
        </div>

        <nav className={styles.links} aria-label="Footer navigation">
          <div className={styles.linkGroup}>
            <h3 className={styles.groupTitle}>Shop</h3>
            <Link to="/products" className={styles.link}>All Products</Link>
            <Link to="/cart"     className={styles.link}>Cart</Link>
            <Link to="/orders"   className={styles.link}>Orders</Link>
          </div>
          <div className={styles.linkGroup}>
            <h3 className={styles.groupTitle}>Account</h3>
            <Link to="/login"    className={styles.link}>Sign In</Link>
            <Link to="/register" className={styles.link}>Register</Link>
          </div>
          <div className={styles.linkGroup}>
            <h3 className={styles.groupTitle}>Platform</h3>
            <Link to="/admin"    className={styles.link}>Admin</Link>
          </div>
        </nav>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <p className={styles.copy}>© {year} CraftCommerce. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
