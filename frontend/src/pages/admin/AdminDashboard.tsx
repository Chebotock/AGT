import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

interface Game {
  id: string
  title: string
  status: 'DRAFT' | 'ACTIVE' | 'FINISHED'
  joinCode: string
  createdAt: string
  _count: { teams: number; problems: number }
}

export default function AdminDashboard() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { loadGames() }, [])

  async function loadGames() {
    try {
      const data = await api.get<Game[]>('/games')
      setGames(data)
    } catch {
      navigate('/agt/adm')
    } finally {
      setLoading(false)
    }
  }

  async function createGame() {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const game = await api.post<Game>('/games', { title: newTitle })
      setGames([game, ...games])
      setNewTitle('')
      setShowCreate(false)
      navigate(`/agt/adm/games/${game.id}`)
    } catch {
      alert('Ошибка создания игры')
    } finally {
      setCreating(false)
    }
  }

  async function startGame(id: string) {
    await api.post(`/games/${id}/start`, {})
    loadGames()
  }

  async function stopGame(id: string) {
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

      {/* Хедер */}
      <div className="bg-agt-surface border-b border-agt-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold text-agt-blue tracking-widest">AGT</span>
          <span className="text-xs font-bold text-agt-red tracking-widest">PROJECT 911</span>
        </div>
        <button onClick={() => { api.post('/auth/logout', {}); navigate('/agt/adm') }}
          className="text-xs text-agt-muted hover:text-agt-text">
          Выйти
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-agt-text">Мои игры</h1>
          <button className="btn-primary text-sm" onClick={() => setShowCreate(true)}>
            + Новая игра
          </button>
        </div>

        {/* Форма создания */}
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
              <button className="btn-secondary text-sm" onClick={() => setShowCreate(false)}>
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Список игр */}
        {loading ? (
          <div className="text-agt-muted text-sm text-center py-10">Загружаем...</div>
        ) : games.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-agt-muted text-sm mb-3">Игр пока нет</div>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              Создать первую игру
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {games.map(game => (
              <div key={game.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-agt-text truncate">{game.title}</div>
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
                  <div className="flex gap-2 flex-shrink-0">
                    {game.status === 'DRAFT' && (
                      <>
                        <button onClick={() => navigate(`/agt/adm/games/${game.id}`)}
                          className="btn-secondary text-xs px-3 py-1.5">
                          Редактировать
                        </button>
                        <button onClick={() => startGame(game.id)}
                          className="btn-primary text-xs px-3 py-1.5">
                          Запустить
                        </button>
                      </>
                    )}
                    {game.status === 'ACTIVE' && (
                      <>
                        <button onClick={() => navigate(`/agt/adm/games/${game.id}`)}
                          className="btn-secondary text-xs px-3 py-1.5">
                          Дашборд
                        </button>
                        <button onClick={() => stopGame(game.id)}
                          className="btn-danger text-xs px-3 py-1.5">
                          Стоп
                        </button>
                      </>
                    )}
                    {game.status === 'FINISHED' && (
                      <button onClick={() => navigate(`/agt/adm/games/${game.id}`)}
                        className="btn-secondary text-xs px-3 py-1.5">
                        Результаты
                      </button>
                    )}
                    <button onClick={() => deleteGame(game.id)}
                      className="text-agt-muted hover:text-agt-red text-xs px-2">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
