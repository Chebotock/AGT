import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { formatInTimezone } from '../../utils/timezones'

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export default function Waiting() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [teamName, setTeamName] = useState('')
  const [gameTitle, setGameTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)
  const [timezone, setTimezone] = useState('Europe/Moscow')
  const [countdown, setCountdown] = useState(0)
  const [dots, setDots] = useState('.')

  useEffect(() => {
    async function loadInfo() {
      try {
        const me = await api.get<any>('/auth/team/me')
        if (!me.team) { navigate('/agt'); return }
        setNickname(me.captain.nickname)
        setTeamName(me.team.name)
        setGameTitle(me.team.gameTitle)
        if (me.team.gameStatus === 'ACTIVE') { navigate('/agt/game'); return }
        if (me.team.gameStatus === 'FINISHED') { navigate('/agt/results'); return }

        // Получить детали игры для scheduledAt
        const gameDetails = await api.get<any>(`/game-info/${me.team.gameId}`)
        if (gameDetails.scheduledAt) {
          setScheduledAt(gameDetails.scheduledAt)
          setTimezone(gameDetails.timezone || 'Europe/Moscow')
        }
      } catch { navigate('/agt') }
    }
    loadInfo()
  }, [navigate])

  // Обратный отсчёт
  useEffect(() => {
    if (!scheduledAt) return
    const t = setInterval(() => {
      const diff = Math.floor((new Date(scheduledAt).getTime() - Date.now()) / 1000)
      setCountdown(Math.max(0, diff))
    }, 1000)
    return () => clearInterval(t)
  }, [scheduledAt])

  // Опрос статуса каждые 5 сек
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const me = await api.get<any>('/auth/team/me')
        if (me.team?.gameStatus === 'ACTIVE') navigate('/agt/game')
        if (me.team?.gameStatus === 'FINISHED') navigate('/agt/results')
      } catch { navigate('/agt') }
    }, 5000)
    return () => clearInterval(timer)
  }, [navigate])

  // Анимация точек
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 600)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-agt-bg flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <div className="text-sm font-bold text-agt-blue tracking-[0.2em] mb-1">PROJECT 911</div>
        <div className="text-5xl font-extrabold text-agt-red tracking-widest">AGT</div>
      </div>

      <div className="card p-8 text-center max-w-sm w-full">
        {scheduledAt && countdown > 0 ? (
          <>
            <div className="text-agt-muted text-xs uppercase tracking-wider mb-2">До старта</div>
            <div className="font-mono text-4xl font-bold text-agt-orange mb-4">
              {formatCountdown(countdown)}
            </div>
            <div className="text-xs text-agt-muted mb-6">
              Старт: {formatInTimezone(scheduledAt, timezone)}
            </div>
          </>
        ) : (
          <>
            <div className="relative mb-6">
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-agt-border
                              flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-t-agt-blue border-agt-element
                                animate-spin" />
              </div>
            </div>
            <div className="text-agt-text font-semibold text-lg mb-1">
              Ожидаем старта{dots}
            </div>
          </>
        )}

        {gameTitle && (
          <div className="text-agt-blue font-medium mb-4">{gameTitle}</div>
        )}

        <div className="text-agt-muted text-sm mb-6">
          Страница обновится автоматически когда организатор запустит игру
        </div>

        {(nickname || teamName) && (
          <div className="bg-agt-element rounded-lg px-4 py-3 text-sm">
            <div className="text-agt-muted text-xs mb-1">Вы авторизованы как</div>
            <div className="text-agt-text font-semibold">{nickname}</div>
            {teamName && (
              <div className="text-agt-muted text-xs mt-1">команда «{teamName}»</div>
            )}
          </div>
        )}
      </div>

      <button onClick={() => navigate('/agt')}
        className="text-xs text-agt-muted hover:text-agt-text mt-6">
        ← Выйти
      </button>
    </div>
  )
}
