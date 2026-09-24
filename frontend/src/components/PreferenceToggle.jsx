export function PreferenceToggle({ icon: Icon, title, description, checked, onChange }) {
  return (
    <button
      type="button"
      className="preference-toggle"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="preference-toggle-icon">
        <Icon size={18} />
      </span>
      <span className="preference-toggle-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="preference-switch" aria-hidden="true">
        <span />
      </span>
    </button>
  )
}
