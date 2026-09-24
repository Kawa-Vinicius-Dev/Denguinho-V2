import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// O botão fica fora do <label> para não entrar no nome acessível do campo.
export function PasswordField({ label, className = '', ...inputProps }) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  return (
    <div className={`password-field ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      <span className="password-input">
        <input id={id} type={visible ? 'text' : 'password'} {...inputProps} />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? 'Esconder o que foi digitado' : 'Mostrar o que foi digitado'}
          aria-pressed={visible}
          aria-controls={id}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </div>
  )
}
