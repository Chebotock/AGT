import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { formatInTimezone } from '../../utils/timezones'

interface Game {
  id: string
  title: string
  status: 'DRAFT' | 'ACTIVE' | 'FINISHED'
  joinCode: string
  createdAt: string
  scheduledAt: string | null
  timezone: string
  _count: { teams: number; problems: number }
}

function formatCountdown(diff: number): string {
  const abs = Math.abs(diff)
  const days = Math.floor(abs / 86400)
  const hours = Math.floor((abs % 86400) / 3600)
  const mins = Math.floor((abs % 3600) / 60)
  const secs = abs % 60
  return [
    days > 0 ? `${days} дн` : '',
    hours > 0 ? `${hours} ч` : '',
    `${mins} мин`,
    `${String(secs).padStart(2, '0')} сек`
  ].filter(Boolean).join(' ')
}

export default function AdminDashboard() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [now, setNow] = useState(Date.now())
  const navigate = useNavigate()

  const loadGames = useCallback(async () => {
    try {
      const data = await api.get<Game[]>('/games')
      setGames(data)
    } catch {
      navigate('/agt/adm')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { loadGames() }, [loadGames])
  useEffect(() => { const t = setInterval(loadGames, 30000); return () => clearInterval(t) }, [loadGames])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  async function createGame() {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const game = await api.post<Game>('/games', { title: newTitle })
      setNewTitle('')
      setShowCreate(false)
      navigate(`/agt/adm/games/${game.id}`)
    } catch {
      alert('Ошибка создания игры')
    } finally {
      setCreating(false)
    }
  }

  async function renameGame(id: string) {
    if (!editTitle.trim()) return
    try {
      await api.put(`/games/${id}`, { title: editTitle })
      setGames(games.map(g => g.id === id ? { ...g, title: editTitle } : g))
      setEditingId(null)
    } catch { alert('Ошибка') }
  }

  async function startGame(id: string) {
    await api.post(`/games/${id}/start`, {})
    loadGames()
  }

  async function stopGame(id: string) {
    if (!confirm('Остановить игру?')) return
    await api.post(`/games/${id}/stop`, {})
    loadGames()
  }

  async function deleteGame(id: string) {
    if (!confirm('Удалить игру?')) return
    await api.delete(`/games/${id}`)
    setGames(games.filter(g => g.id !== id))
  }

  const statusLabel = { DRAFT: 'Черновик', ACTIVE: 'Идёт', FINISHED: 'Завершена' }
  const statusColor = { DRAFT: 'text-agt-muted', ACTIVE: 'text-agt-green', FINISHED: 'text-agt-blue' }

  return (
    <div className="min-h-screen bg-agt-bg">
      <div className="bg-agt-surface border-b border-agt-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-agt-blue tracking-widest">PROJECT 911</span>
          <span className="text-xl font-extrabold text-agt-red tracking-widest">AGT</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/agt/adm/profile')}
            className="text-xs text-agt-muted hover:text-agt-text">⚙ Профиль</button>
          <button onClick={() => { api.post('/auth/logout', {}); navigate('/agt/adm') }}
            className="text-xs text-agt-muted hover:text-agt-text">Выйти</button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-agt-text">Мои игры</h1>
          <button className="btn-primary text-sm" onClick={() => setShowCreate(true)}>
            + Новая игра
          </button>
        </div>

        {showCreate && (
          <div className="card p-4 mb-4">
            <div className="text-sm font-medium text-agt-text mb-3">Новая игра</div>
            <input className="input mb-3" placeholder="Название игры"
              value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createGame()} autoFocus />
            <div className="flex gap-2">
              <button className="btn-primary text-sm" onClick={createGame} disabled={creating}>
                {creating ? 'Создаём...' : 'Создать'}
              </button>
              <button className="btn-secondary text-sm" onClick={() => setShowCreate(false)}>Отмена</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-agt-muted text-sm text-center py-10">Загружаем...</div>
        ) : games.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-agt-muted text-sm mb-3">Игр пока нет</div>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>Создать первую игру</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {games.map(game => {
              const diff = game.scheduledAt
                ? Math.floor((new Date(game.scheduledAt).getTime() - now) / 1000)
                : null

              return (
                <div key={game.id} className="card p-4">
                  {/* Верхняя часть */}
                  <div className="flex items-start justify-between gap-3">
                    {/* Левая колонка */}
                    <div className="flex-1 min-w-0">
                      {editingId === game.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            className="input text-sm py-1 px-2 flex-1"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') renameGame(game.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                            autoFocus
                          />
                          <button onClick={() => renameGame(game.id)}
                            className="text-xs text-agt-green hover:text-agt-text">✓</button>
                          <button onClick={() => setEditingId(null)}
                            className="text-xs text-agt-muted hover:text-agt-text">✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <div className="font-semibold text-agt-text truncate">{game.title}</div>
                          <button
                            onClick={() => { setEditingId(game.id); setEditTitle(game.title) }}
                            className="text-agt-muted hover:text-agt-blue text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            ✎
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs font-medium ${statusColor[game.status]}`}>
                          ● {statusLabel[game.status]}
                        </span>
                        <span className="text-xs text-agt-muted font-mono">{game.joinCode}</span>
                      </div>
                      <div className="text-xs text-agt-muted mt-1">
                        {game._count.problems} заданий · {game._count.teams} команд
                      </div>
                    </div>

                    {/* Правая колонка — кнопки */}
                    <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                      {game.status === 'DRAFT' && <>
                        <button onClick={() => navigate(`/agt/adm/games/${game.id}`)}
                          className="btn-secondary text-xs px-3 py-1.5">Редактировать</button>
                        <button onClick={() => startGame(game.id)}
                          className="btn-primary text-xs px-3 py-1.5">▶ Запустить</button>
                      </>}
                      {game.status === 'ACTIVE' && <>
                        <button onClick={() => navigate(`/agt/adm/dashboard/${game.id}`)}
                          className="btn-secondary text-xs px-3 py-1.5">📊 Дашборд</button>
                        <button onClick={() => navigate(`/agt/adm/games/${game.id}`)}
                          className="btn-secondary text-xs px-3 py-1.5">Игра</button>
                        <button onClick={() => stopGame(game.id)}
                          className="btn-danger text-xs px-3 py-1.5">■ Стоп</button>
                      </>}
                      {game.status === 'FINISHED' && <>
                        <button onClick={() => navigate(`/agt/adm/dashboard/${game.id}`)}
                          className="btn-secondary text-xs px-3 py-1.5">📊 Результаты</button>
                      </>}
                      <button onClick={() => deleteGame(game.id)}
                        className="text-agt-muted hover:text-agt-red text-xs px-2">✕</button>
                    </div>
                  </div>

                  {/* Нижняя полоска — время автостарта */}
                  {game.scheduledAt && game.status === 'DRAFT' && diff !== null && (
                    <div className="border-t border-agt-border mt-3 pt-2 flex items-center justify-between">
                      <span className="text-xs text-agt-muted">
                        {diff > 0 ? (
                          <>
                            <span className="text-agt-text">Старт через: </span>
                            <span className="text-agt-orange font-medium">{formatCountdown(diff)}</span>
                          </>
                        ) : (
                          <span className="text-agt-green">Запускается...</span>
                        )}
                      </span>
                      <span className="text-xs text-agt-blue">
                        🕐 {formatInTimezone(game.scheduledAt, game.timezone)}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
