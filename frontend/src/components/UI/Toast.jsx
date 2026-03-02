import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import styles from './Toast.module.css'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)))
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 320)
  }, [])

  const show = useCallback(
    (message, { variant = 'info', duration = 4000 } = {}) => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, variant, exiting: false }])
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss]
  )

  const success = useCallback((msg, opts) => show(msg, { variant: 'success', ...opts }), [show])
  const error   = useCallback((msg, opts) => show(msg, { variant: 'error',   ...opts }), [show])
  const info    = useCallback((msg, opts) => show(msg, { variant: 'info',    ...opts }), [show])
  const warning = useCallback((msg, opts) => show(msg, { variant: 'warning', ...opts }), [show])

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning, dismiss }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }) {
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }

  return (
    <div
      className={[
        styles.toast,
        styles[toast.variant],
        toast.exiting ? styles.exit : styles.enter
      ].join(' ')}
      role="alert"
    >
      <span className={styles.icon}>{icons[toast.variant]}</span>
      <span className={styles.msg}>{toast.message}</span>
      <button className={styles.close} onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        ✕
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
