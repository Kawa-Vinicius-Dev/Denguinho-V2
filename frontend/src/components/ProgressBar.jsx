export function ProgressBar({ value, label, onDark = false }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value || 0)))
  return (
    <div
      className={`progress-track${onDark ? ' on-dark' : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${safeValue}%` }} />
    </div>
  )
}
