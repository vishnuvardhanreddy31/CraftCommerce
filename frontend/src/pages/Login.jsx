import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../components/UI/Toast.jsx'
import Button from '../components/UI/Button.jsx'
import Input from '../components/UI/Input.jsx'
import Card from '../components/UI/Card.jsx'
import styles from './Auth.module.css'

export default function Login() {
  const { login } = useAuth()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()

  const [form,    setForm]    = useState({ email: '', password: '', tenant_id: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.email.trim())    e.email    = 'Email is required'
    if (!form.password.trim()) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const tenantId = form.tenant_id.trim() || import.meta.env.VITE_TENANT_ID || 'default'
      localStorage.setItem('cc_tenant_id', tenantId)
      const user = await login(form.email, form.password)
      success(`Welcome back, ${user.first_name || user.email}!`)
      navigate(user.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      toastError(err.response?.data?.detail || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`page-enter ${styles.page}`}>
      <Card padding="lg" shadow="lg" className={styles.card}>
        <div className={styles.header}>
          <svg width="40" height="40" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <rect width="64" height="64" rx="14" fill="var(--color-primary)" />
            <path d="M32 12 C32 12 20 24 20 36 C20 42.6 25.4 48 32 48 C38.6 48 44 42.6 44 36 C44 24 32 12 32 12Z" fill="#fff" fillOpacity="0.9"/>
            <path d="M32 20 L32 48" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.sub}>Sign in to your FarmCommerce account</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            placeholder="••••••••"
          />
          <Input
            label="Tenant / Store ID (optional)"
            value={form.tenant_id}
            onChange={set('tenant_id')}
            placeholder="e.g. 64a0000000000000000000a1"
            hint="Required when using demo or multi-tenant accounts."
          />
          <Button type="submit" size="lg" fullWidth loading={loading}>
            Sign In
          </Button>
        </form>

        <p className={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.footerLink}>Create one →</Link>
        </p>
      </Card>
    </div>
  )
}
