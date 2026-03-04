import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useCart } from '../../hooks/useCart.js'
import { useTheme } from '../../context/ThemeContext.jsx'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { totalItems } = useCart()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = () => setMenuOpen(false)

  const handleLogout = () => {
    logout()
    close()
    navigate('/')
  }

  return (
    <header className={[styles.header, scrolled ? styles.scrolled : ''].filter(Boolean).join(' ')}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link to="/" className={styles.logo} onClick={close}>
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <rect width="64" height="64" rx="14" fill="var(--color-primary)" />
            <path d="M32 12 C32 12 20 24 20 36 C20 42.6 25.4 48 32 48 C38.6 48 44 42.6 44 36 C44 24 32 12 32 12Z" fill="#fff" fillOpacity="0.9"/>
            <path d="M32 20 L32 48" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M32 30 C32 30 26 26 22 28" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M32 36 C32 36 38 32 42 34" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>{theme.storeName || 'FarmCommerce'}</span>
        </Link>

        {/* Desktop nav */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          <NavLink to="/products" className={({ isActive }) => isActive ? styles.activeLink : styles.navLink}>
            Products
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? styles.activeLink : styles.navLink}>
              Dashboard
            </NavLink>
          )}
          {user && (
            <NavLink to="/orders" className={({ isActive }) => isActive ? styles.activeLink : styles.navLink}>
              Orders
            </NavLink>
          )}
        </nav>

        {/* Right actions */}
        <div className={styles.actions}>
          <Link to="/cart" className={styles.cartBtn} aria-label={`Cart, ${totalItems} items`}>
            <CartIcon />
            {totalItems > 0 && (
              <span className={styles.cartBadge}>{totalItems > 99 ? '99+' : totalItems}</span>
            )}
          </Link>

          {user ? (
            <div className={styles.userMenu}>
              <button className={styles.avatar} aria-label="Account menu" onClick={() => setMenuOpen(!menuOpen)}>
                {(user.first_name?.[0] || user.email?.[0])?.toUpperCase() || 'U'}
              </button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  <p className={styles.dropdownUser}>
                    {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email}
                  </p>
                  <hr className={styles.dropdownDivider} />
                  <Link to="/orders" className={styles.dropdownItem} onClick={close}>My Orders</Link>
                    {user.role === 'admin' && (
                      <>
                        <Link to="/admin" className={styles.dropdownItem} onClick={close}>Admin Dashboard</Link>
                        <Link to="/admin/tenants" className={styles.dropdownItem} onClick={close}>Tenants</Link>
                        <Link to="/admin/users"   className={styles.dropdownItem} onClick={close}>Users</Link>
                        <Link to="/admin/products" className={styles.dropdownItem} onClick={close}>Products</Link>
                        <Link to="/admin/orders" className={styles.dropdownItem} onClick={close}>Orders</Link>
                        <Link to="/admin/settings" className={styles.dropdownItem} onClick={close}>Settings</Link>
                      </>
                    )}
                  <hr className={styles.dropdownDivider} />
                  <button className={styles.dropdownLogout} onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={styles.loginBtn}>Sign In</Link>
          )}

          {/* Hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className={[styles.bar, menuOpen ? styles.barOpen1 : ''].filter(Boolean).join(' ')} />
            <span className={[styles.bar, menuOpen ? styles.barOpen2 : ''].filter(Boolean).join(' ')} />
            <span className={[styles.bar, menuOpen ? styles.barOpen3 : ''].filter(Boolean).join(' ')} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu} aria-label="Mobile navigation">
          <NavLink to="/products" className={styles.mobileLink} onClick={close}>Products</NavLink>
          <NavLink to="/cart"     className={styles.mobileLink} onClick={close}>Cart {totalItems > 0 && `(${totalItems})`}</NavLink>
          {user && <NavLink to="/orders" className={styles.mobileLink} onClick={close}>Orders</NavLink>}
            {user?.role === 'admin' && (
              <>
                <NavLink to="/admin"            className={styles.mobileLink} onClick={close}>Dashboard</NavLink>
                <NavLink to="/admin/tenants"    className={styles.mobileLink} onClick={close}>Tenants</NavLink>
                <NavLink to="/admin/users"      className={styles.mobileLink} onClick={close}>Users</NavLink>
                <NavLink to="/admin/products"   className={styles.mobileLink} onClick={close}>Admin Products</NavLink>
                <NavLink to="/admin/categories" className={styles.mobileLink} onClick={close}>Categories</NavLink>
                <NavLink to="/admin/orders"     className={styles.mobileLink} onClick={close}>Admin Orders</NavLink>
                <NavLink to="/admin/settings"   className={styles.mobileLink} onClick={close}>Settings</NavLink>
              </>
            )}
          {user ? (
            <button className={styles.mobileLogout} onClick={handleLogout}>Sign Out</button>
          ) : (
            <>
              <NavLink to="/login"    className={styles.mobileLink} onClick={close}>Sign In</NavLink>
              <NavLink to="/register" className={styles.mobileLink} onClick={close}>Register</NavLink>
            </>
          )}
        </div>
      )}
    </header>
  )
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}
