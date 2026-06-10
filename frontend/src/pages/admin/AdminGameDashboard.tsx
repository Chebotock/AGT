import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'

interface TeamData {
  id: string; name: string; captain: string
  solved: number; total: number
  currentProblemNum: number | null
  wrongAnswers: number; tipsUsed: number
  totalPenalty: number; cleanSeconds: number; totalSeconds: number
  finished: boolean; finishedAt: number | null
}

interface DashboardData {
  game: { id: string; title: string; status: string; startedAt: string; problemsCount: number }
  teams: TeamData[]
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function AdminGameDashboard() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const load = useCallback(async () => {
    try {
      const d = await api.get<DashboardData>(`/results/${id}`)
      setData(d)
    } catch { navigate('/agt/adm/dashboard') }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  // Автообновление каждые 10 сек
  useEffect(() => {
    const timer = setInterval(load, 10000)
    return () => clearInterval(timer)
  }, [load])

  // Таймер
  useEffect(() => {
    if (!data?.game.startedAt) return
    const startTime = new Date(data.game.startedAt).getTime()
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(t)
  }, [data?.game.startedAt])

  async function stopGame() {
    if (!confirm('Остановить игру?')) return
    await api.post(`/games/${id}/stop`, {})
    load()
  }

  if (!data) return (
    <div className="min-h-screen bg-agt-bg flex items-center justify-center">
      <div className="text-agt-muted text-sm">Загружаем...</div>
    </div>
  )

  const { game, teams } = data

  return (
    <div className="min-h-screen bg-agt-bg">
      {/* Хедер */}
      <div className="bg-agt-surface border-b border-agt-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/agt/adm/dashboard')}
          className="text-agt-muted hover:text-agt-text text-sm">← Назад</button>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-agt-text text-sm truncate">{game.title}</div>
          <div className="text-xs text-agt-muted">
            {game.status === 'ACTIVE' ? '● Идёт' : '✓ Завершена'}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xl font-bold text-agt-orange">{formatTime(elapsed)}</div>
        </div>
        {game.status === 'ACTIVE' && (
          <button onClick={stopGame} className="btn-danger text-sm px-3 py-2">■ Стоп</button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-3 text-center">
            <div className="text-xl font-bold text-agt-blue">{teams.length}</div>
            <div className="text-xs text-agt-muted">Команд</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-xl font-bold text-agt-green">
              {teams.filter(t => t.finished).length}
            </div>
            <div className="text-xs text-agt-muted">Финишировали</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-xl font-bold text-agt-text">{game.problemsCount}</div>
            <div className="text-xs text-agt-muted">Заданий</div>
          </div>
        </div>

        {/* Таблица команд */}
        <h2 className="font-bold text-agt-text mb-3">
          {game.status === 'FINISHED' ? 'Итоговые результаты' : 'Прогресс команд'}
        </h2>

        {teams.length === 0 ? (
          <div className="text-center py-10 text-agt-muted text-sm">
            Команд пока нет
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {teams.map((team, index) => (
              <div key={team.id} className={`card p-4 ${team.finished ? 'border-agt-green/30' : ''}`}>
                <div className="flex items-center gap-3">
                  {/* Место */}
                  <div className={`text-lg font-bold w-8 text-center flex-shrink-0 ${
                    index === 0 ? 'text-agt-orange' :
                    index === 1 ? 'text-agt-muted' :
                    index === 2 ? 'text-agt-pink' : 'text-agt-muted'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>

                  {/* Инфо */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-agt-text text-sm">{team.name}</span>
                      <span className="text-xs text-agt-muted">({team.captain})</span>
                      {team.finished && (
                        <span className="text-xs text-agt-green font-medium">✓ Финиш</span>
                      )}
                    </div>

                    {/* Прогресс бар */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 bg-agt-element rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            team.finished ? 'bg-agt-green' : 'bg-agt-blue'
                          }`}
                          style={{ width: `${(team.solved / team.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-agt-muted flex-shrink-0">
                        {team.solved}/{team.total}
                      </span>
                    </div>

                    {/* Детали */}
                    <div className="flex gap-3 mt-1">
                      {!team.finished && team.currentProblemNum && (
                        <span className="text-xs text-agt-blue">
                          Задание {team.currentProblemNum}
                        </span>
                      )}
                      {team.wrongAnswers > 0 && (
                        <span className="text-xs text-agt-red">
                          ✗ {team.wrongAnswers}
                        </span>
                      )}
                      {team.tipsUsed > 0 && (
                        <span className="text-xs text-agt-pink">
                          💡 {team.tipsUsed}
                        </span>
                      )}
                      {team.totalPenalty > 0 && (
                        <span className="text-xs text-agt-red">
                          +{formatTime(team.totalPenalty)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Время */}
                  <div className="text-right flex-shrink-0">
                    {team.finished ? (
                      <>
                        <div className="font-mono text-sm font-bold text-agt-green">
                          {formatTime(team.totalSeconds)}
                        </div>
                        <div className="text-xs text-agt-muted">
                          {formatTime(team.cleanSeconds)} + {formatTime(team.totalPenalty)}
                        </div>
                      </>
                    ) : (
                      <div className="font-mono text-sm text-agt-muted">
                        {formatTime(elapsed)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Кнопка обновить */}
        <button onClick={load}
          className="btn-secondary text-sm w-full mt-4">
          ↻ Обновить
        </button>
      </div>
    </div>
  )
}
