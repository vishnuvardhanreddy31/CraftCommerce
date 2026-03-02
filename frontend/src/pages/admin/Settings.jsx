import { useState, useEffect } from 'react'
import client from '../../api/client.js'
import { useToast } from '../../components/UI/Toast.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import Button from '../../components/UI/Button.jsx'
import Input from '../../components/UI/Input.jsx'
import Card from '../../components/UI/Card.jsx'
import Spinner from '../../components/UI/Spinner.jsx'
import styles from './Settings.module.css'

export default function AdminSettings() {
  const { theme, updateTheme } = useTheme()
  const { success, error: toastError } = useToast()

  const [form, setForm] = useState({
    storeName: '', logoUrl: '', primaryColor: '', secondaryColor: '',
    fontFamily: '', currency: 'USD', taxRate: 0
  })
  const [loading, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    client.get('/api/tenant/config')
      .then(({ data }) => {
        setForm({
          storeName:      data.storeName      || '',
          logoUrl:        data.logoUrl        || '',
          primaryColor:   data.primaryColor   || '#6366f1',
          secondaryColor: data.secondaryColor || '#8b5cf6',
          fontFamily:     data.fontFamily     || '',
          currency:       data.currency       || 'USD',
          taxRate:        data.taxRate        != null ? (data.taxRate * 100).toFixed(1) : '0'
        })
      })
      .catch(() => {
        setForm({
          storeName: theme.storeName || '', logoUrl: theme.logoUrl || '',
          primaryColor: theme.primaryColor || '#6366f1',
          secondaryColor: theme.secondaryColor || '#8b5cf6',
          fontFamily: theme.fontFamily || '', currency: theme.currency || 'USD',
          taxRate: theme.taxRate != null ? (theme.taxRate * 100).toFixed(1) : '0'
        })
      })
      .finally(() => setFetching(false))
  }, []) // eslint-disable-line

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        taxRate: parseFloat(form.taxRate) / 100 || 0
      }
      await updateTheme(payload)
      success('Settings saved successfully!')
    } catch (err) {
      toastError(err.response?.data?.detail || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (fetching) return <Spinner centered size="lg" />

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className="container">
        <h1 className={styles.title}>Store Settings</h1>
        <form onSubmit={handleSave} className={styles.grid}>

          {/* ── Branding ── */}
          <Card padding="lg" shadow="md">
            <h2 className={styles.sectionTitle}>Branding</h2>
            <div className={styles.fields}>
              <Input label="Store Name" value={form.storeName} onChange={set('storeName')} placeholder="CraftCommerce" />
              <Input label="Logo URL" type="url" value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://…" hint="Link to your logo image" />
            </div>
          </Card>

          {/* ── Theme ── */}
          <Card padding="lg" shadow="md">
            <h2 className={styles.sectionTitle}>Theme</h2>
            <div className={styles.fields}>
              <div className={styles.colorRow}>
                <label className={styles.colorLabel}>
                  Primary Color
                  <div className={styles.colorInput}>
                    <input type="color" value={form.primaryColor} onChange={set('primaryColor')} className={styles.colorPicker} />
                    <input type="text"  value={form.primaryColor} onChange={set('primaryColor')} className={styles.colorText} maxLength={7} />
                  </div>
                </label>
                <label className={styles.colorLabel}>
                  Secondary Color
                  <div className={styles.colorInput}>
                    <input type="color" value={form.secondaryColor} onChange={set('secondaryColor')} className={styles.colorPicker} />
                    <input type="text"  value={form.secondaryColor} onChange={set('secondaryColor')} className={styles.colorText} maxLength={7} />
                  </div>
                </label>
              </div>
              <div>
                <label className={styles.selectLabel}>Font Family</label>
                <select className={styles.select} value={form.fontFamily} onChange={set('fontFamily')}>
                  <option value="Inter, system-ui, sans-serif">Inter (Default)</option>
                  <option value="'DM Sans', sans-serif">DM Sans</option>
                  <option value="'Nunito', sans-serif">Nunito</option>
                  <option value="'Poppins', sans-serif">Poppins</option>
                  <option value="Georgia, serif">Georgia (Serif)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* ── Commerce ── */}
          <Card padding="lg" shadow="md">
            <h2 className={styles.sectionTitle}>Commerce</h2>
            <div className={styles.fields}>
              <div>
                <label className={styles.selectLabel}>Currency</label>
                <select className={styles.select} value={form.currency} onChange={set('currency')}>
                  {['USD','EUR','GBP','CAD','AUD','JPY','CHF','INR'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Tax Rate (%)"
                type="number" min="0" max="100" step="0.1"
                value={form.taxRate}
                onChange={set('taxRate')}
                hint="e.g. 8.5 for 8.5% sales tax"
              />
            </div>
          </Card>

          {/* ── Save ── */}
          <div className={styles.saveRow}>
            <Button type="submit" size="lg" loading={loading}>
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
