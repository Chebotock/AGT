import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

export default function Waiting() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const status = await api.get<any>('/auth/team/me')
        if (status.team?.gameStatus === 'ACTIVE') {
          navigate('/agt/game')
        }
      } catch {
        navigate('/agt')
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-agt-bg flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <div className="text-5xl font-extrabold text-agt-blue tracking-widest">AGT</div>
        <div className="text-sm font-bold text-agt-red tracking-[0.2em] mt-1">PROJECT 911</div>
      </div>
      <div className="card p-8 text-center max-w-sm w-full">
        <div className="text-4xl mb-4">⏳</div>
        <div className="text-agt-text font-semibold mb-2">Ожидаем старта</div>
        <div className="text-agt-muted text-sm">
          Игра ещё не началась. Страница обновится автоматически когда организатор запустит игру.
        </div>
      </div>
    </div>
  )
}
