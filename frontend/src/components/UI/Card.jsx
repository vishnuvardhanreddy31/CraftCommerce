import styles from './Card.module.css'

export default function Card({
  children,
  padding = 'md',
  shadow = 'md',
  hover = false,
  className = '',
  style,
  onClick,
  ...rest
}) {
  const cls = [
    styles.card,
    styles[`pad_${padding}`],
    styles[`shadow_${shadow}`],
    hover ? styles.hover : '',
    onClick ? styles.clickable : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls} style={style} onClick={onClick} {...rest}>
      {children}
    </div>
  )
}
