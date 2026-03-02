import styles from './Spinner.module.css'

export default function Spinner({ size = 'md', centered = false }) {
  return (
    <div className={[styles.wrapper, centered ? styles.centered : ''].filter(Boolean).join(' ')}>
      <div className={[styles.spinner, styles[size]].join(' ')} role="status" aria-label="Loading">
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  )
}
