import { useEffect, useState } from 'react'
import { ChevronRight, ImagePlus, KeyRound, Trash2, UserRound, X } from 'lucide-react'
import { api } from '../api'
import { Avatar } from '../components/Avatar'
import { Dialog } from '../components/Dialog'
import { PasswordField } from '../components/PasswordField'
import { acceptedImageTypes, validateImage } from '../lib/images'

const emptyPasswords = { currentPassword: '', newPassword: '', confirmation: '' }

function PasswordSection({ notify }) {
  const [open, setOpen] = useState(false)
  const [passwords, setPasswords] = useState(emptyPasswords)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const field = (name) => (event) =>
    setPasswords((current) => ({ ...current, [name]: event.target.value }))

  const close = () => {
    setOpen(false)
    setPasswords(emptyPasswords)
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (passwords.newPassword !== passwords.confirmation) {
      setError('A confirmação não é igual à nova senha.')
      return
    }
    if (passwords.newPassword === passwords.currentPassword) {
      setError('Escolha uma senha diferente da atual.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      close()
      notify('Senha alterada. Use a nova senha no próximo login.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="account-section security-section">
      <div className="account-section-heading">
        <KeyRound size={19} />
        <div>
          <h3>Senha</h3>
          <p>Troque sua senha quando quiser. Você continua conectado neste aparelho.</p>
        </div>
      </div>
      {open ? (
        <form className="security-form account-fields" onSubmit={submit}>
          <PasswordField
            label="Senha atual"
            value={passwords.currentPassword}
            onChange={field('currentPassword')}
            autoComplete="current-password"
            maxLength={72}
            required
          />
          <PasswordField
            label="Nova senha"
            value={passwords.newPassword}
            onChange={field('newPassword')}
            autoComplete="new-password"
            placeholder="No mínimo 8 caracteres"
            minLength={8}
            maxLength={72}
            required
          />
          <PasswordField
            label="Confirme a nova senha"
            value={passwords.confirmation}
            onChange={field('confirmation')}
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="security-form-actions">
            <button type="button" className="button secondary" onClick={close}>
              Cancelar
            </button>
            <button className="button primary" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="security-entry-button" onClick={() => setOpen(true)}>
          <span>Alterar senha</span>
          <ChevronRight size={18} />
        </button>
      )}
    </section>
  )
}

export function AccountPanel({ user, avatarUrl, onClose, onUpdated, notify }) {
  const [name, setName] = useState(user.name)
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [localPreview, setLocalPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const preview = localPreview || avatarUrl

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  const chooseAvatar = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setError('')
    if (!file) return
    const problem = validateImage(file)
    if (problem) {
      setError(problem)
      return
    }
    setSelectedAvatar(file)
    setLocalPreview(URL.createObjectURL(file))
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      let updated = user
      if (name.trim() !== user.name) updated = await api.updateProfile(name.trim())
      if (selectedAvatar) updated = await api.uploadAvatar(selectedAvatar)
      onUpdated(updated, { avatarChanged: Boolean(selectedAvatar) })
      setSelectedAvatar(null)
      setLocalPreview(null)
      notify('Perfil atualizado.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const removeAvatar = async () => {
    setBusy(true)
    setError('')
    try {
      if (user.hasAvatar) onUpdated(await api.removeAvatar(), { avatarChanged: true })
      setSelectedAvatar(null)
      setLocalPreview(null)
      notify('Foto de perfil removida.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const unchanged = name.trim() === user.name && !selectedAvatar

  return (
    <Dialog labelledBy="account-title" className="account-panel" onClose={onClose}>
      <header>
        <div>
          <p className="eyebrow">Seu perfil</p>
          <h2 id="account-title">Minha conta</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Fechar minha conta">
          <X />
        </button>
      </header>

      <div className="account-content">
        <form className="account-section" onSubmit={saveProfile}>
          <div className="account-section-heading">
            <UserRound size={19} />
            <div>
              <h3>Informações pessoais</h3>
              <p>É assim que seu nome e sua foto aparecem para o seu dengo.</p>
            </div>
          </div>

          <div className="avatar-editor">
            <Avatar name={name} imageUrl={preview} className="account-avatar" />
            <div>
              <strong>Foto de perfil</strong>
              <p>JPG, PNG ou WebP. Até 5 MB.</p>
              <div className="photo-actions">
                <label className="button secondary">
                  <ImagePlus size={16} />
                  Trocar foto
                  <input type="file" accept={acceptedImageTypes.join(',')} onChange={chooseAvatar} />
                </label>
                <button
                  type="button"
                  className="button ghost-danger"
                  onClick={removeAvatar}
                  disabled={busy || (!preview && !user.hasAvatar)}
                >
                  <Trash2 size={16} />
                  Remover
                </button>
              </div>
            </div>
          </div>

          <div className="account-fields">
            <label>
              Seu nome
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={80}
                required
              />
            </label>
            <label>
              E-mail
              <input value={user.email} readOnly aria-readonly="true" />
              <small>O e-mail continua sendo usado para entrar.</small>
            </label>
          </div>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="button primary account-submit" disabled={busy || !name.trim() || unchanged}>
            {busy ? 'Salvando…' : 'Salvar perfil'}
          </button>
        </form>

        <PasswordSection notify={notify} />
      </div>
    </Dialog>
  )
}
