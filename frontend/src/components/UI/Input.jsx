import styles from './Input.module.css'

export default function Input({
  label,
  error,
  hint,
  id,
  type = 'text',
  fullWidth = true,
  className = '',
  ...rest
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '_')

  return (
    <div className={[styles.wrapper, fullWidth ? styles.fullWidth : '', className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={[styles.input, error ? styles.inputError : ''].filter(Boolean).join(' ')}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}_error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${inputId}_error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
    </div>
  )
}
