import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

export default function Lobby() {
  const [gameCode, setGameCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api.post<any>('/auth/team/join', { gameCode, teamName })
      if (result.gameStatus === 'ACTIVE') {
        navigate('/agt/game')
      } else {
        navigate('/agt/waiting')
      }
    } catch (e: any) {
      setError(e?.error || 'Неверный код игры')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-agt-bg flex flex-col items-center justify-center px-4">

      <div className="text-center mb-10">
        <div className="text-sm font-bold text-agt-blue tracking-[0.2em] mb-1">PROJECT 911</div>
        <div className="text-5xl font-extrabold text-agt-red tracking-widest">AGT</div>
      </div>

      <div className="card w-full max-w-sm p-6">
        <h2 className="text-agt-text font-semibold text-base mb-5">Войти в игру</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-agt-muted uppercase tracking-wider mb-1.5">Название команды</label>
            <input className="input" type="text" placeholder="Ночные Волки"
              value={teamName} onChange={e => setTeamName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-agt-muted uppercase tracking-wider mb-1.5">Код игры</label>
            <input className="input font-mono tracking-widest text-center" type="text"
              placeholder="911-ABC-XYZ" value={gameCode}
              onChange={e => setGameCode(e.target.value.toUpperCase())} />
          </div>
          {error && <div className="text-agt-red text-sm">{error}</div>}
          <button className="btn-primary w-full mt-2" onClick={handleJoin} disabled={loading}>
            {loading ? 'Входим...' : 'Войти в игру'}
          </button>
        </div>
      </div>
    </div>
  )
}
