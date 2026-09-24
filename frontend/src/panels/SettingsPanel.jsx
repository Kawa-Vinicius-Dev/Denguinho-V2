import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  Check,
  ImagePlus,
  Medal,
  MessageCircleHeart,
  Moon,
  Move,
  Pencil,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import { api } from '../api'
import { Dialog } from '../components/Dialog'
import { PreferenceToggle } from '../components/PreferenceToggle'
import { startOfDay, toDateInputValue } from '../lib/dates'
import { acceptedImageTypes, validateImage } from '../lib/images'

const fallbackJourneyImage = '/journey-fallback.png'

function clamp(value) {
  return Math.round(Math.min(100, Math.max(0, value)))
}

function CropAxis({ label, startLabel, endLabel, value, onChange }) {
  return (
    <div className="crop-axis">
      <button type="button" onClick={() => onChange(clamp(value - 5))}>
        {startLabel}
      </button>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
      <output>{value}%</output>
      <button type="button" onClick={() => onChange(clamp(value + 5))}>
        {endLabel}
      </button>
    </div>
  )
}

export function SettingsPanel({
  couple,
  onClose,
  onUpdated,
  currentImage,
  theme,
  onThemeChange,
  preferences,
  onPreferenceChange,
  notify,
}) {
  const [activeTab, setActiveTab] = useState('journey')
  const [objective, setObjective] = useState(couple.currentObjective)
  const [relationshipStartedOn, setRelationshipStartedOn] = useState(couple.relationshipStartedOn || '')
  const [photoPosition, setPhotoPosition] = useState({
    x: couple.photoPositionX ?? 50,
    y: couple.photoPositionY ?? 50,
  })
  const [selected, setSelected] = useState(null)
  const [selectedPreview, setSelectedPreview] = useState(null)
  const [cropEditing, setCropEditing] = useState(false)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const dragRef = useRef(null)
  const [today] = useState(() => startOfDay())
  const preview = selectedPreview || currentImage || fallbackJourneyImage

  useEffect(() => {
    return () => {
      if (selectedPreview) URL.revokeObjectURL(selectedPreview)
    }
  }, [selectedPreview])

  const selectPhoto = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setMessage('')
    if (!file) return
    const problem = validateImage(file)
    if (problem) {
      setMessage(problem)
      return
    }
    setSelected(file)
    setSelectedPreview(URL.createObjectURL(file))
    setPhotoPosition({ x: 50, y: 50 })
    setCropEditing(true)
  }

  const startDrag = (event) => {
    if (!cropEditing) return
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, rect, start: photoPosition }
  }

  const drag = (event) => {
    const current = dragRef.current
    if (!current) return
    // Arrastar a foto para a direita mostra mais do lado esquerdo dela.
    setPhotoPosition({
      x: clamp(current.start.x - ((event.clientX - current.x) / current.rect.width) * 100),
      y: clamp(current.start.y - ((event.clientY - current.y) / current.rect.height) * 100),
    })
  }

  const endDrag = () => {
    dragRef.current = null
  }

  const save = async () => {
    setBusy('save')
    setMessage('')
    try {
      let updated = await api.updateCouple({
        currentObjective: objective.trim(),
        relationshipStartedOn,
        photoPositionX: photoPosition.x,
        photoPositionY: photoPosition.y,
      })
      if (selected) updated = await api.uploadPhoto(selected)
      onUpdated(updated, { photoChanged: Boolean(selected) })
      setSelected(null)
      setCropEditing(false)
      notify('Mudanças salvas.')
      onClose()
    } catch (requestError) {
      setMessage(requestError.message)
    } finally {
      setBusy('')
    }
  }

  const remove = async () => {
    setBusy('remove')
    setMessage('')
    try {
      const updated = await api.removePhoto()
      setSelected(null)
      setSelectedPreview(null)
      setCropEditing(false)
      onUpdated(updated, { photoChanged: true })
      notify('Foto removida. A ilustração padrão voltou a aparecer.')
    } catch (requestError) {
      setMessage(requestError.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <Dialog labelledBy="settings-title" onClose={onClose}>
      <header>
        <div>
          <p className="eyebrow">Denguinho do seu jeito</p>
          <h2 id="settings-title">Configurações</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Fechar configurações">
          <X />
        </button>
      </header>

      <div className="settings-tabs" role="tablist" aria-label="Seções das configurações">
        {[
          ['journey', 'Nossa jornada'],
          ['app', 'Aplicativo'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={activeTab === id ? 'active' : ''}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'journey' ? (
        <div className="settings-tab-panel" role="tabpanel" aria-label="Nossa jornada">
          <div className="photo-editor crop-editor">
            <div
              className={`crop-preview${cropEditing ? ' is-editing' : ''}`}
              onPointerDown={startDrag}
              onPointerMove={drag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <img
                src={preview}
                alt="Prévia do enquadramento da foto na jornada"
                draggable={false}
                style={{ objectPosition: `${photoPosition.x}% ${photoPosition.y}%` }}
              />
              <span>
                {cropEditing ? (
                  <>
                    <Move size={13} /> Arraste para enquadrar
                  </>
                ) : (
                  'Prévia do cartão'
                )}
              </span>
            </div>
            <div className="photo-editor-copy">
              <div>
                <h3>Foto de destaque</h3>
                <p>Escolha a foto e ajuste o enquadramento antes de salvar.</p>
              </div>
              <div className="photo-actions">
                {!cropEditing ? (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setCropEditing(true)}
                    aria-expanded="false"
                  >
                    <Pencil size={16} />
                    Ajustar foto
                  </button>
                ) : null}
                <label className="button secondary">
                  <ImagePlus size={17} />
                  Trocar foto
                  <input type="file" accept={acceptedImageTypes.join(',')} onChange={selectPhoto} />
                </label>
                <button
                  type="button"
                  className="button ghost-danger"
                  onClick={remove}
                  disabled={Boolean(busy) || (!couple.hasCustomPhoto && !selected)}
                >
                  <Trash2 size={17} />
                  Remover
                </button>
              </div>
            </div>
            {cropEditing ? (
              <div className="crop-controls">
                <div className="crop-controls-heading">
                  <strong>Ajustar enquadramento</strong>
                  <div className="crop-controls-actions">
                    <button type="button" onClick={() => setPhotoPosition({ x: 50, y: 50 })}>
                      Centralizar
                    </button>
                    <button
                      type="button"
                      className="finish-crop-button"
                      onClick={() => setCropEditing(false)}
                    >
                      Concluir ajuste
                    </button>
                  </div>
                </div>
                <CropAxis
                  label="Posição horizontal da foto"
                  startLabel="Esquerda"
                  endLabel="Direita"
                  value={photoPosition.x}
                  onChange={(x) => setPhotoPosition((current) => ({ ...current, x }))}
                />
                <CropAxis
                  label="Posição vertical da foto"
                  startLabel="Topo"
                  endLabel="Base"
                  value={photoPosition.y}
                  onChange={(y) => setPhotoPosition((current) => ({ ...current, y }))}
                />
              </div>
            ) : null}
          </div>

          <label className="objective-field">
            Objetivo atual da dupla
            <textarea
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              maxLength={160}
              rows={3}
            />
            <span>{objective.length}/160</span>
          </label>
          <label className="relationship-field">
            Que dia você começou a namorar com teu dengo?
            <input
              type="date"
              value={relationshipStartedOn}
              max={toDateInputValue(today)}
              onChange={(event) => setRelationshipStartedOn(event.target.value)}
              required
            />
            <small>Essa data vira o “nosso dia” na agenda do casal.</small>
          </label>
          {message ? (
            <p className="panel-message" role="alert">
              {message}
            </p>
          ) : null}
          <footer>
            <button className="button secondary" onClick={onClose}>
              Agora não
            </button>
            <button
              className="button primary"
              onClick={save}
              disabled={!objective.trim() || !relationshipStartedOn || Boolean(busy)}
            >
              {busy === 'save' ? 'Salvando…' : 'Salvar mudanças'}
            </button>
          </footer>
        </div>
      ) : (
        <div className="settings-tab-panel app-preferences" role="tabpanel" aria-label="Aplicativo">
          <section className="appearance-settings" aria-labelledby="appearance-title">
            <div className="appearance-copy">
              <span className="appearance-icon">
                {theme === 'dark' ? <Moon size={19} /> : <Sun size={19} />}
              </span>
              <div>
                <h3 id="appearance-title">Aparência</h3>
                <p>Escolha como o Denguinho aparece neste aparelho.</p>
              </div>
            </div>
            <div className="theme-switcher" role="group" aria-label="Tema do aplicativo">
              {[
                ['light', Sun, 'Claro'],
                ['dark', Moon, 'Escuro'],
              ].map(([value, Icon, label]) => (
                <button
                  key={value}
                  type="button"
                  className={theme === value ? 'active' : ''}
                  aria-pressed={theme === value}
                  onClick={() => onThemeChange(value)}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="preference-group" aria-labelledby="home-preferences-title">
            <div className="preference-group-heading">
              <div>
                <h3 id="home-preferences-title">Tela inicial</h3>
                <p>Escolha o que aparece quando você abre o Denguinho.</p>
              </div>
            </div>
            <PreferenceToggle
              icon={Medal}
              title="Mostrar placar"
              description="Exibe a pontuação individual e do casal no início."
              checked={preferences.showScore}
              onChange={(checked) => onPreferenceChange('showScore', checked)}
            />
            <PreferenceToggle
              icon={Sparkles}
              title="Lembretes gentis"
              description="Mantém as mensagens de pausa e cuidado."
              checked={preferences.showKindReminder}
              onChange={(checked) => onPreferenceChange('showKindReminder', checked)}
            />
          </section>

          <section className="preference-group" aria-labelledby="notification-preferences-title">
            <div className="preference-group-heading">
              <div>
                <h3 id="notification-preferences-title">Notificações e interação</h3>
                <p>Controle quanto conteúdo aparece e como o celular responde.</p>
              </div>
            </div>
            <PreferenceToggle
              icon={Bell}
              title="Mostrar prévia do dengo"
              description="Exibe o conteúdo recebido dentro das notificações."
              checked={preferences.notificationPreview}
              onChange={(checked) => onPreferenceChange('notificationPreview', checked)}
            />
            <PreferenceToggle
              icon={MessageCircleHeart}
              title="Vibrar ao enviar um dengo"
              description="Usa uma vibração curta quando o aparelho permitir."
              checked={preferences.vibration}
              onChange={(checked) => onPreferenceChange('vibration', checked)}
            />
          </section>

          <section className="preference-group" aria-labelledby="accessibility-preferences-title">
            <div className="preference-group-heading">
              <div>
                <h3 id="accessibility-preferences-title">Acessibilidade</h3>
                <p>Ajustes para deixar o aplicativo mais confortável.</p>
              </div>
            </div>
            <PreferenceToggle
              icon={Settings}
              title="Reduzir animações"
              description="Diminui transições e movimentos na interface."
              checked={preferences.reducedMotion}
              onChange={(checked) => onPreferenceChange('reducedMotion', checked)}
            />
          </section>

          <p className="preferences-saved-note">
            <Check size={16} />
            Preferências salvas automaticamente neste aparelho.
          </p>
        </div>
      )}
    </Dialog>
  )
}
