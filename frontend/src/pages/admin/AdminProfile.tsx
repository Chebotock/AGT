import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

export default function AdminProfile() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [createdAt, setCreatedAt] = useState('')

  // Email form
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [passError, setPassError] = useState('')
  const [passLoading, setPassLoading] = useState(false)

  useEffect(() => {
    api.get<any>('/profile').then(data => {
      setEmail(data.email)
      setRole(data.role)
      setCreatedAt(new Date(data.createdAt).toLocaleDateString('ru-RU'))
    }).catch(() => navigate('/agt/adm'))
  }, [navigate])

  async function changeEmail() {
    setEmailError(''); setEmailMsg('')
    if (!newEmail || !emailPassword) return setEmailError('Заполните все поля')
    setEmailLoading(true)
    try {
      await api.put('/profile/email', { newEmail, password: emailPassword })
      setEmail(newEmail)
      setNewEmail(''); setEmailPassword('')
      setEmailMsg('Email успешно изменён')
    } catch (e: any) {
      setEmailError(e?.error || 'Ошибка')
    } finally { setEmailLoading(false) }
  }

  async function changePassword() {
    setPassError(''); setPassMsg('')
    if (!currentPassword || !newPassword || !confirmPassword)
      return setPassError('Заполните все поля')
    if (newPassword !== confirmPassword)
      return setPassError('Пароли не совпадают')
    if (newPassword.length < 8)
      return setPassError('Минимум 8 символов')
    setPassLoading(true)
    try {
      await api.put('/profile/password', { currentPassword, newPassword })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setPassMsg('Пароль успешно изменён')
    } catch (e: any) {
      setPassError(e?.error || 'Ошибка')
    } finally { setPassLoading(false) }
  }

  return (
    <div className="min-h-screen bg-agt-bg">
      {/* Хедер */}
      <div className="bg-agt-surface border-b border-agt-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/agt/adm/dashboard')}
          className="text-agt-muted hover:text-agt-text text-sm">← Назад</button>
        <div className="flex-1">
          <div className="font-bold text-agt-text text-sm">Профиль</div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Инфо */}
        <div className="card p-4">
          <div className="text-xs text-agt-muted uppercase tracking-wider mb-3">Аккаунт</div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-agt-muted">Email</span>
              <span className="text-agt-text font-medium">{email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-agt-muted">Роль</span>
              <span className="text-agt-blue font-medium">{role}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-agt-muted">Зарегистрирован</span>
              <span className="text-agt-text">{createdAt}</span>
            </div>
          </div>
        </div>

        {/* Смена email */}
        <div className="card p-4">
          <div className="text-xs text-agt-muted uppercase tracking-wider mb-3">Сменить Email</div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-agt-muted mb-1.5">Новый Email</label>
              <input className="input" type="email" placeholder="new@email.com"
                value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-agt-muted mb-1.5">Текущий пароль</label>
              <input className="input" type="password" placeholder="••••••••"
                value={emailPassword} onChange={e => setEmailPassword(e.target.value)} />
            </div>
            {emailError && <div className="text-agt-red text-sm">{emailError}</div>}
            {emailMsg && <div className="text-agt-green text-sm">✓ {emailMsg}</div>}
            <button className="btn-primary text-sm" onClick={changeEmail} disabled={emailLoading}>
              {emailLoading ? 'Сохраняем...' : 'Изменить Email'}
            </button>
          </div>
        </div>

        {/* Смена пароля */}
        <div className="card p-4">
          <div className="text-xs text-agt-muted uppercase tracking-wider mb-3">Сменить пароль</div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-agt-muted mb-1.5">Текущий пароль</label>
              <input className="input" type="password" placeholder="••••••••"
                value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-agt-muted mb-1.5">Новый пароль</label>
              <input className="input" type="password" placeholder="Минимум 8 символов"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-agt-muted mb-1.5">Повторите пароль</label>
              <input className="input" type="password" placeholder="••••••••"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && changePassword()} />
            </div>
            {passError && <div className="text-agt-red text-sm">{passError}</div>}
            {passMsg && <div className="text-agt-green text-sm">✓ {passMsg}</div>}
            <button className="btn-primary text-sm" onClick={changePassword} disabled={passLoading}>
              {passLoading ? 'Сохраняем...' : 'Изменить пароль'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
