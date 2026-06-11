import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

interface TeamResult {
  id: string; name: string; captain: string
  solved: number; total: number
  cleanSeconds: number; totalPenalty: number; totalSeconds: number
  wrongAnswers: number; tipsUsed: number
  finished: boolean
}

interface ResultsData {
  game: { id: string; title: string; status: string }
  teams: TeamResult[]
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TeamResults() {
  const [data, setData] = useState<ResultsData | null>(null)
  const [myTeamId, setMyTeamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        // Получить статус команды
        const me = await api.get<any>('/auth/team/me')
        if (!me.team) { navigate('/agt'); return }
        setMyTeamId(me.team.id)

        // Получить результаты
        const results = await api.get<ResultsData>(`/results/${me.team.gameId}`)
        setData(results)
      } catch {
        navigate('/agt')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  if (loading) return (
    <div className="min-h-screen bg-agt-bg flex items-center justify-center">
      <div className="text-agt-muted text-sm">Загружаем результаты...</div>
    </div>
  )

  if (!data) return null

  const myTeam = data.teams.find(t => t.id === myTeamId)
  const myPlace = data.teams.findIndex(t => t.id === myTeamId) + 1

  return (
    <div className="min-h-screen bg-agt-bg flex flex-col">

      {/* Хедер */}
      <div className="bg-agt-surface border-b border-agt-border px-4 py-3 text-center">
        <div className="text-xs font-bold text-agt-red tracking-widest mb-0.5">PROJECT 911</div>
        <div className="text-lg font-extrabold text-agt-blue">{data.game.title}</div>
        <div className="text-xs text-agt-muted mt-0.5">
          {data.game.status === 'FINISHED' ? 'Игра завершена' : 'Итоги'}
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full px-4 py-6">

        {/* Моё место */}
        {myTeam && (
          <div className={`card p-5 mb-6 text-center ${
            myPlace === 1 ? 'border-agt-orange/50' :
            myPlace === 2 ? 'border-agt-muted/30' :
            myPlace === 3 ? 'border-agt-pink/30' : ''
          }`}>
            <div className="text-4xl mb-2">
              {myPlace === 1 ? '🥇' : myPlace === 2 ? '🥈' : myPlace === 3 ? '🥉' : `#${myPlace}`}
            </div>
            <div className="text-xl font-bold text-agt-text mb-1">{myTeam.name}</div>
            {myTeam.finished ? (
              <>
                <div className="font-mono text-3xl font-bold text-agt-green mb-1">
                  {formatTime(myTeam.totalSeconds)}
                </div>
                <div className="text-xs text-agt-muted">
                  {formatTime(myTeam.cleanSeconds)} чистое
                  {myTeam.totalPenalty > 0 && ` + ${formatTime(myTeam.totalPenalty)} штраф`}
                </div>
                <div className="flex justify-center gap-4 mt-3">
                  {myTeam.wrongAnswers > 0 && (
                    <span className="text-xs text-agt-red">✗ {myTeam.wrongAnswers} ошибок</span>
                  )}
                  {myTeam.tipsUsed > 0 && (
                    <span className="text-xs text-agt-pink">💡 {myTeam.tipsUsed} подсказок</span>
                  )}
                  <span className="text-xs text-agt-green">
                    ✓ {myTeam.solved}/{myTeam.total} заданий
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-agt-muted text-sm mb-1">Не финишировали</div>
                <div className="text-xs text-agt-muted">
                  Решено {myTeam.solved} из {myTeam.total} заданий
                </div>
              </>
            )}
          </div>
        )}

        {/* Таблица результатов */}
        <h2 className="font-bold text-agt-text mb-3">Таблица результатов</h2>
        <div className="flex flex-col gap-2">
          {data.teams.map((team, index) => {
            const isMe = team.id === myTeamId
            return (
              <div key={team.id} className={`card p-3 ${isMe ? 'border-agt-blue/40' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`text-sm font-bold w-7 text-center flex-shrink-0 ${
                    index === 0 ? 'text-agt-orange' :
                    index === 1 ? 'text-agt-muted' :
                    index === 2 ? 'text-agt-pink' : 'text-agt-muted'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isMe ? 'text-agt-blue' : 'text-agt-text'}`}>
                        {team.name}
                      </span>
                      {isMe && <span className="text-xs text-agt-blue">← вы</span>}
                    </div>
                    <div className="text-xs text-agt-muted mt-0.5">
                      {team.finished
                        ? `${formatTime(team.cleanSeconds)} + ${formatTime(team.totalPenalty)} штраф`
                        : `${team.solved}/${team.total} заданий`
                      }
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {team.finished ? (
                      <div className={`font-mono text-sm font-bold ${
                        isMe ? 'text-agt-blue' : 'text-agt-text'
                      }`}>
                        {formatTime(team.totalSeconds)}
                      </div>
                    ) : (
                      <div className="text-xs text-agt-muted">DNF</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <button onClick={() => navigate('/agt')}
          className="btn-secondary w-full mt-6 text-sm">
          На главную
        </button>
      </div>
    </div>
  )
}
