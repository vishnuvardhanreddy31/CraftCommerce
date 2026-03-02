import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client.js'
import { useCart } from '../hooks/useCart.js'
import { useTheme } from '../context/ThemeContext.jsx'
import { useToast } from '../components/UI/Toast.jsx'
import Button from '../components/UI/Button.jsx'
import Input from '../components/UI/Input.jsx'
import styles from './Checkout.module.css'

const INITIAL_SHIPPING = {
  full_name: '', address_line1: '', address_line2: '',
  city: '', state: '', postal_code: '', country: 'US', phone: ''
}

const INITIAL_PAYMENT = {
  card_number: '', expiry: '', cvv: '', cardholder: ''
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart()
  const { theme } = useTheme()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()

  const [shipping, setShipping] = useState(INITIAL_SHIPPING)
  const [payment,  setPayment]  = useState(INITIAL_PAYMENT)
  const [errors,   setErrors]   = useState({})
  const [placing,  setPlacing]  = useState(false)
  const [step,     setStep]     = useState(1) // 1=shipping 2=payment

  const currency = theme.currency || 'USD'
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
  const tax = totalPrice * (theme.taxRate || 0)
  const total = totalPrice + tax

  const setS = (k) => (e) => setShipping((p) => ({ ...p, [k]: e.target.value }))
  const setP = (k) => (e) => {
    let v = e.target.value
    if (k === 'card_number') v = v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
    if (k === 'expiry') {
      v = v.replace(/\D/g, '').slice(0, 4)
      if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2)
    }
    if (k === 'cvv') v = v.replace(/\D/g, '').slice(0, 4)
    setPayment((p) => ({ ...p, [k]: v }))
  }

  const validateShipping = () => {
    const e = {}
    if (!shipping.full_name.trim())    e.full_name    = 'Full name is required'
    if (!shipping.address_line1.trim())e.address_line1= 'Address is required'
    if (!shipping.city.trim())         e.city         = 'City is required'
    if (!shipping.postal_code.trim())  e.postal_code  = 'Postal code is required'
    if (!shipping.country.trim())      e.country      = 'Country is required'
    return e
  }

  const validatePayment = () => {
    const e = {}
    if (payment.card_number.replace(/\s/g,'').length < 16) e.card_number = 'Enter a valid 16-digit card number'
    if (!/^\d{2}\/\d{2}$/.test(payment.expiry))            e.expiry      = 'Enter expiry as MM/YY'
    if (payment.cvv.length < 3)                             e.cvv         = 'CVV must be 3–4 digits'
    if (!payment.cardholder.trim())                         e.cardholder  = 'Cardholder name is required'
    return e
  }

  const handleNext = () => {
    const errs = validateShipping()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStep(2)
  }

  const handlePlace = async () => {
    const errs = validatePayment()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setPlacing(true)
    try {
      const payload = {
        shipping_address: shipping,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, price: i.price })),
        total_amount: total
        // payment info is mock – never send real card data
      }
      const { data } = await client.post('/api/orders', payload)
      await clearCart()
      success('Order placed successfully! 🎉')
      navigate(`/orders`)
    } catch (err) {
      toastError(err.response?.data?.detail || 'Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className={`page-enter ${styles.empty}`}>
        <h2>Your cart is empty</h2>
        <a href="/products" className={styles.link}>Browse Products →</a>
      </div>
    )
  }

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className="container">
        <h1 className={styles.title}>Checkout</h1>

        {/* ── Step indicator ── */}
        <div className={styles.steps}>
          <div className={[styles.step, step >= 1 ? styles.stepActive : ''].join(' ')}>
            <span className={styles.stepNum}>1</span>
            <span>Shipping</span>
          </div>
          <div className={styles.stepLine} />
          <div className={[styles.step, step >= 2 ? styles.stepActive : ''].join(' ')}>
            <span className={styles.stepNum}>2</span>
            <span>Payment</span>
          </div>
        </div>

        <div className={styles.layout}>
          {/* ── Forms ── */}
          <div className={styles.forms}>
            {step === 1 && (
              <section className={styles.formCard}>
                <h2 className={styles.formTitle}>Shipping Address</h2>
                <div className={styles.formGrid}>
                  <Input label="Full Name" value={shipping.full_name} onChange={setS('full_name')} error={errors.full_name} />
                  <Input label="Phone" type="tel" value={shipping.phone} onChange={setS('phone')} error={errors.phone} />
                  <div style={{ gridColumn: '1/-1' }}>
                    <Input label="Address Line 1" value={shipping.address_line1} onChange={setS('address_line1')} error={errors.address_line1} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <Input label="Address Line 2 (optional)" value={shipping.address_line2} onChange={setS('address_line2')} />
                  </div>
                  <Input label="City"        value={shipping.city}        onChange={setS('city')}        error={errors.city} />
                  <Input label="State / Province" value={shipping.state}  onChange={setS('state')} />
                  <Input label="Postal Code" value={shipping.postal_code} onChange={setS('postal_code')} error={errors.postal_code} />
                  <Input label="Country"     value={shipping.country}     onChange={setS('country')}     error={errors.country} />
                </div>
                <Button size="lg" onClick={handleNext} style={{ marginTop: '1rem' }}>
                  Continue to Payment →
                </Button>
              </section>
            )}

            {step === 2 && (
              <section className={styles.formCard}>
                <div className={styles.formTitleRow}>
                  <h2 className={styles.formTitle}>Payment Details</h2>
                  <span className={styles.mockBadge}>🔒 Demo – no real charge</span>
                </div>
                <div className={styles.formGrid}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <Input label="Cardholder Name" value={payment.cardholder} onChange={setP('cardholder')} error={errors.cardholder} placeholder="Jane Doe" />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <Input label="Card Number" value={payment.card_number} onChange={setP('card_number')} error={errors.card_number} placeholder="4242 4242 4242 4242" />
                  </div>
                  <Input label="Expiry (MM/YY)" value={payment.expiry} onChange={setP('expiry')} error={errors.expiry} placeholder="12/27" />
                  <Input label="CVV" type="password" value={payment.cvv} onChange={setP('cvv')} error={errors.cvv} placeholder="•••" />
                </div>
                <div className={styles.payActions}>
                  <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
                  <Button size="lg" loading={placing} onClick={handlePlace}>
                    Place Order · {fmt(total)}
                  </Button>
                </div>
              </section>
            )}
          </div>

          {/* ── Order Summary ── */}
          <aside className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>
            <div className={styles.summaryItems}>
              {items.map((item) => (
                <div key={item.product_id} className={styles.summaryItem}>
                  <span className={styles.summaryItemName}>{item.name} <span className={styles.summaryQty}>× {item.quantity}</span></span>
                  <span className={styles.summaryItemTotal}>{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}><span>Subtotal</span><span>{fmt(totalPrice)}</span></div>
              <div className={styles.summaryRow}><span>Shipping</span><span className={styles.free}>Free</span></div>
              {tax > 0 && <div className={styles.summaryRow}><span>Tax</span><span>{fmt(tax)}</span></div>}
              <div className={[styles.summaryRow, styles.summaryTotal].join(' ')}>
                <span>Total</span><span>{fmt(total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
