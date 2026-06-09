import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/login', { email, password })
      navigate('/agt/adm/dashboard')
    } catch (e: any) {
      setError(e?.error || 'Неверный логин или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-agt-bg flex flex-col items-center justify-center px-4">

      <div className="text-center mb-10">
        <div className="text-5xl font-extrabold text-agt-blue tracking-widest">AGT</div>
        <div className="text-sm font-bold text-agt-red tracking-[0.2em] mt-1">PROJECT 911</div>
        <div className="text-agt-muted text-xs mt-3 tracking-widest uppercase">Панель организатора</div>
      </div>

      <div className="card w-full max-w-sm p-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-agt-muted uppercase tracking-wider mb-1.5">Email</label>
            <input className="input" type="email" placeholder="admin@agt.ru"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-agt-muted uppercase tracking-wider mb-1.5">Пароль</label>
            <input className="input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin(e)} />
          </div>
          {error && <div className="text-agt-red text-sm">{error}</div>}
          <button className="btn-primary w-full mt-2" onClick={handleLogin} disabled={loading}>
            {loading ? 'Входим...' : 'Войти в панель'}
          </button>
        </div>
      </div>

      <p className="text-agt-muted text-xs mt-6">
        <a href="/agt" className="text-agt-blue hover:text-agt-orange">← Назад</a>
      </p>
    </div>
  )
}
