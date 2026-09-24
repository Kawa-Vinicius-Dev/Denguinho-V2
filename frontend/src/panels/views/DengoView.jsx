import { useState } from 'react'
import { MessageCircleHeart, Send } from 'lucide-react'
import { dengoRequestOptions } from '../../lib/dengos'

export function DengoView({ app }) {
  const [selected, setSelected] = useState('')
  const [custom, setCustom] = useState('')
  const [busy, setBusy] = useState(false)
  const message = custom.trim() || selected

  const send = async () => {
    if (!message) return
    setBusy(true)
    try {
      await app.actions.sendDengo({ kind: 'REQUEST', message })
      if (app.preferences.vibration && 'vibrate' in navigator) navigator.vibrate(45)
      app.notify(`Pedido enviado para ${app.partnerName}. A resposta aparece nas notificações.`)
      app.closePanel()
    } catch (requestError) {
      app.notify(requestError.message, { tone: 'error' })
      setBusy(false)
    }
  }

  return (
    <>
      <p>Escolha um jeitinho de chamar {app.partnerName}.</p>
      <div className="choice-grid" role="group" aria-label="Tipo de dengo">
        {dengoRequestOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={!custom.trim() && selected === option ? 'selected' : ''}
            aria-pressed={!custom.trim() && selected === option}
            onClick={() => {
              setSelected(option)
              setCustom('')
            }}
          >
            <MessageCircleHeart size={19} />
            {option}
          </button>
        ))}
      </div>
      <label className="dengo-custom">
        Ou escreva do seu jeito
        <input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder="Ex.: Tô com saudade de você"
          maxLength={80}
        />
      </label>
      <button className="button primary wide" disabled={!message || busy} onClick={send}>
        <Send size={17} />
        {busy ? 'Enviando…' : 'Avisar meu dengo'}
      </button>
    </>
  )
}
