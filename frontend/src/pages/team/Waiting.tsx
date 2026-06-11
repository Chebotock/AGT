import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

export default function Waiting() {
  const navigate = useNavigate()
  const [teamName, setTeamName] = useState('')
  const [gameTitle, setGameTitle] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [dots, setDots] = useState('.')

  useEffect(() => {
    // Загрузить инфо о команде
    async function loadInfo() {
      try {
        const me = await api.get<any>('/auth/team/me')
        if (!me.team) { navigate('/agt'); return }
        setTeamName(me.captain.nickname)
        setGameTitle(me.team.gameTitle)
        // Если игра уже активна — сразу в игру
        if (me.team.gameStatus === 'ACTIVE') navigate('/agt/game')
        if (me.team.gameStatus === 'FINISHED') navigate('/agt/results')
      } catch {
        navigate('/agt')
      }
    }
    loadInfo()
  }, [navigate])

  // Опрос статуса каждые 5 сек
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const me = await api.get<any>('/auth/team/me')
        if (me.team?.gameStatus === 'ACTIVE') navigate('/agt/game')
        if (me.team?.gameStatus === 'FINISHED') navigate('/agt/results')
      } catch {
        navigate('/agt')
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [navigate])

  // Анимация точек
  useEffect(() => {
    const t = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
    }, 600)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-agt-bg flex flex-col items-center justify-center px-4">

      {/* Логотип */}
      <div className="text-center mb-10">
        <div className="text-5xl font-extrabold text-agt-blue tracking-widest">AGT</div>
        <div className="text-sm font-bold text-agt-red tracking-[0.2em] mt-1">PROJECT 911</div>
      </div>

      {/* Карточка */}
      <div className="card p-8 text-center max-w-sm w-full">

        {/* Анимация */}
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

        {gameTitle && (
          <div className="text-agt-blue font-medium mb-4">{gameTitle}</div>
        )}

        <div className="text-agt-muted text-sm mb-6">
          Страница обновится автоматически когда организатор запустит игру
        </div>

        {/* Инфо о команде */}
        {teamName && (
          <div className="bg-agt-element rounded-lg px-4 py-3 text-sm">
            <div className="text-agt-muted text-xs mb-1">Вы вошли как</div>
            <div className="text-agt-text font-semibold">{teamName}</div>
          </div>
        )}
      </div>

      {/* Кнопка выйти */}
      <button
        onClick={() => navigate('/agt')}
        className="text-xs text-agt-muted hover:text-agt-text mt-6">
        ← Выйти
      </button>
    </div>
  )
}
