import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

type Tab = 'captain' | 'register'

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('captain')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/team/login', { email, password })
      // Проверить статус и редиректнуть
      const status = await api.get<any>('/auth/team/me')
      if (status.team?.gameStatus === 'ACTIVE') {
        navigate('/agt/game')
      } else {
        navigate('/agt/lobby')
      }
    } catch (e: any) {
      setError(e?.error || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/team/register', { email, password, nickname })
      navigate('/agt/lobby')
    } catch (e: any) {
      setError(e?.error || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-agt-bg flex flex-col items-center justify-center px-4">

      {/* Логотип */}
      <div className="text-center mb-10">
        <div className="text-5xl font-extrabold text-agt-blue tracking-widest">AGT</div>
        <div className="text-sm font-bold text-agt-red tracking-[0.2em] mt-1">PROJECT 911</div>
      </div>

      {/* Карточка */}
      <div className="card w-full max-w-sm p-6">

        {/* Вкладки */}
        <div className="flex border-b border-agt-border mb-6">
          <button
            onClick={() => { setTab('captain'); setError('') }}
            className={`flex-1 pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'captain'
                ? 'border-agt-blue text-agt-blue'
                : 'border-transparent text-agt-muted hover:text-agt-text'
            }`}
          >
            Войти
          </button>
          <button
            onClick={() => { setTab('register'); setError('') }}
            className={`flex-1 pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'register'
                ? 'border-agt-blue text-agt-blue'
                : 'border-transparent text-agt-muted hover:text-agt-text'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Форма входа */}
        {tab === 'captain' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-agt-muted uppercase tracking-wider mb-1.5">Email</label>
              <input className="input" type="email" placeholder="captain@email.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-agt-muted uppercase tracking-wider mb-1.5">Пароль</label>
              <input className="input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <div className="text-agt-red text-sm">{error}</div>}
            <button className="btn-primary w-full mt-2" onClick={handleLogin} disabled={loading}>
              {loading ? 'Входим...' : 'Войти'}
            </button>
          </div>
        )}

        {/* Форма регистрации */}
        {tab === 'register' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-agt-muted uppercase tracking-wider mb-1.5">Никнейм</label>
              <input className="input" type="text" placeholder="Ночные Волки"
                value={nickname} onChange={e => setNickname(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-agt-muted uppercase tracking-wider mb-1.5">Email</label>
              <input className="input" type="email" placeholder="captain@email.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-agt-muted uppercase tracking-wider mb-1.5">Пароль</label>
              <input className="input" type="password" placeholder="Минимум 6 символов"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <div className="text-agt-red text-sm">{error}</div>}
            <button className="btn-primary w-full mt-2" onClick={handleRegister} disabled={loading}>
              {loading ? 'Регистрируем...' : 'Создать аккаунт'}
            </button>
          </div>
        )}
      </div>

      <p className="text-agt-muted text-xs mt-6">
        Организатор?{' '}
        <a href="/agt/adm" className="text-agt-blue hover:text-agt-orange">
          Войти в панель
        </a>
      </p>
    </div>
  )
}
