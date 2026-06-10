import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'

interface Answer { id: string; answerText: string }
interface Tip { id: string; type: number; text: string; delaySeconds: number; penaltySeconds: number }
interface Problem {
  id: string; orderNum: number; text: string; timeLimit?: number
  answers: Answer[]; tips: Tip[]
}
interface Game {
  id: string; title: string; status: string; joinCode: string
  wrongAnswerPenalty: number; problems: Problem[]
  _count: { teams: number }
}

export default function AdminGameEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)

  // Форма нового задания
  const [showAddProblem, setShowAddProblem] = useState(false)
  const [problemText, setProblemText] = useState('')
  const [problemAnswers, setProblemAnswers] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadGame() }, [id])

  async function loadGame() {
    try {
      const data = await api.get<Game>(`/games/${id}`)
      setGame(data)
    } catch {
      navigate('/agt/adm/dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function addProblem() {
    if (!problemText.trim() || !problemAnswers.trim()) return
    setSaving(true)
    try {
      const answers = problemAnswers.split('\n').map(a => a.trim()).filter(Boolean)
      await api.post('/problems', {
        gameId: id,
        orderNum: (game?.problems.length || 0) + 1,
        text: problemText,
        answers,
      })
      setProblemText('')
      setProblemAnswers('')
      setShowAddProblem(false)
      loadGame()
    } catch {
      alert('Ошибка добавления задания')
    } finally {
      setSaving(false)
    }
  }

  async function deleteProblem(problemId: string) {
    if (!confirm('Удалить задание?')) return
    await api.delete(`/problems/${problemId}`)
    loadGame()
  }

  async function startGame() {
    if (!confirm(`Запустить игру "${game?.title}"? Код: ${game?.joinCode}`)) return
    await api.post(`/games/${id}/start`, {})
    loadGame()
  }

  if (loading) return (
    <div className="min-h-screen bg-agt-bg flex items-center justify-center">
      <div className="text-agt-muted text-sm">Загружаем...</div>
    </div>
  )

  if (!game) return null

  return (
    <div className="min-h-screen bg-agt-bg">

      {/* Хедер */}
      <div className="bg-agt-surface border-b border-agt-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/agt/adm/dashboard')}
          className="text-agt-muted hover:text-agt-text text-sm">← Назад</button>
        <div className="flex-1">
          <div className="font-bold text-agt-text text-sm">{game.title}</div>
          <div className="text-xs text-agt-muted font-mono">{game.joinCode}</div>
        </div>
        {game.status === 'DRAFT' && (
          <button onClick={startGame} className="btn-primary text-sm px-4 py-2">
            ▶ Запустить
          </button>
        )}
        {game.status === 'ACTIVE' && (
          <span className="text-xs font-bold text-agt-green">● ИДЁТ</span>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Инфо об игре */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-agt-blue">{game.problems.length}</div>
              <div className="text-xs text-agt-muted">Заданий</div>
            </div>
            <div>
              <div className="text-xl font-bold text-agt-orange">{game._count.teams}</div>
              <div className="text-xs text-agt-muted">Команд</div>
            </div>
            <div>
              <div className="text-xl font-bold text-agt-pink">{game.wrongAnswerPenalty / 60} мин</div>
              <div className="text-xs text-agt-muted">Штраф</div>
            </div>
          </div>
        </div>

        {/* Задания */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-agt-text">Задания</h2>
          {game.status === 'DRAFT' && (
            <button className="btn-primary text-sm" onClick={() => setShowAddProblem(true)}>
              + Добавить
            </button>
          )}
        </div>

        {/* Форма добавления задания */}
        {showAddProblem && (
          <div className="card p-4 mb-4">
            <div className="text-sm font-medium text-agt-text mb-3">
              Задание {(game.problems.length || 0) + 1}
            </div>
            <div className="mb-3">
              <label className="block text-xs text-agt-muted uppercase tracking-wider mb-1.5">
                Текст задания
              </label>
              <textarea
                className="w-full bg-agt-element border border-agt-border rounded-md px-3 py-2.5
                           text-agt-text placeholder-agt-muted text-sm resize-none
                           focus:outline-none focus:border-agt-blue"
                rows={4} placeholder="Опишите задание..."
                value={problemText} onChange={e => setProblemText(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-agt-muted uppercase tracking-wider mb-1.5">
                Правильные ответы (каждый с новой строки)
              </label>
              <textarea
                className="w-full bg-agt-element border border-agt-border rounded-md px-3 py-2.5
                           text-agt-text placeholder-agt-muted text-sm font-mono resize-none
                           focus:outline-none focus:border-agt-blue"
                rows={3} placeholder={"ответ1\nответ2\nвариант3"}
                value={problemAnswers} onChange={e => setProblemAnswers(e.target.value)}
              />
              <div className="text-xs text-agt-muted mt-1">
                Регистр и пробелы игнорируются при проверке
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-sm" onClick={addProblem} disabled={saving}>
                {saving ? 'Сохраняем...' : 'Сохранить'}
              </button>
              <button className="btn-secondary text-sm" onClick={() => setShowAddProblem(false)}>
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Список заданий */}
        {game.problems.length === 0 ? (
          <div className="text-center py-10 text-agt-muted text-sm">
            Заданий пока нет — добавьте первое!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {game.problems.map((problem) => (
              <div key={problem.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-agt-blue font-medium mb-1">
                      Задание {problem.orderNum}
                    </div>
                    <div className="text-sm text-agt-text mb-2">{problem.text}</div>
                    <div className="flex flex-wrap gap-1">
                      {problem.answers.map(a => (
                        <span key={a.id}
                          className="text-xs bg-agt-element border border-agt-border
                                     text-agt-green rounded px-2 py-0.5 font-mono">
                          {a.answerText}
                        </span>
                      ))}
                    </div>
                    {problem.tips.length > 0 && (
                      <div className="text-xs text-agt-muted mt-2">
                        {problem.tips.length} подсказок
                      </div>
                    )}
                  </div>
                  {game.status === 'DRAFT' && (
                    <button onClick={() => deleteProblem(problem.id)}
                      className="text-agt-muted hover:text-agt-red text-sm px-2 flex-shrink-0">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
