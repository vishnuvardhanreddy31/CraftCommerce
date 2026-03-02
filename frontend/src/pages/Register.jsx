import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../components/UI/Toast.jsx'
import Button from '../components/UI/Button.jsx'
import Input from '../components/UI/Input.jsx'
import Card from '../components/UI/Card.jsx'
import styles from './Auth.module.css'

export default function Register() {
  const { register } = useAuth()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm_password: '', tenant_id: ''
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim())             e.name             = 'Name is required'
    if (!form.email.trim())            e.email            = 'Email is required'
    if (form.password.length < 8)      e.password         = 'Password must be at least 8 characters'
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const payload = {
        name:      form.name,
        email:     form.email,
        password:  form.password,
        tenant_id: form.tenant_id || import.meta.env.VITE_TENANT_ID || 'default'
      }
      const user = await register(payload)
      success(`Account created! Welcome, ${user.name}!`)
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.email?.[0] || 'Registration failed.'
      toastError(detail)
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
            <path d="M16 20h32M16 32h24M16 44h16" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <h1 className={styles.title}>Create account</h1>
          <p className={styles.sub}>Start selling with CraftCommerce today</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            label="Full Name"
            autoComplete="name"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
            placeholder="Jane Doe"
          />
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
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            placeholder="At least 8 characters"
          />
          <Input
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            value={form.confirm_password}
            onChange={set('confirm_password')}
            error={errors.confirm_password}
            placeholder="Re-enter your password"
          />
          <Input
            label="Tenant / Store ID (optional)"
            value={form.tenant_id}
            onChange={set('tenant_id')}
            placeholder="e.g. my-store (leave blank for default)"
            hint="Use a unique ID to create or join a store."
          />
          <Button type="submit" size="lg" fullWidth loading={loading}>
            Create Account
          </Button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.footerLink}>Sign in →</Link>
        </p>
      </Card>
    </div>
  )
}
