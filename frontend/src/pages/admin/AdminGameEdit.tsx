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

const TIP_LABELS = ['', 'Лёгкая', 'Средняя', 'Полная']
const TIP_COLORS = ['', 'text-agt-green', 'text-agt-orange', 'text-agt-red']

export default function AdminGameEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)

  // Форма задания
  const [showAddProblem, setShowAddProblem] = useState(false)
  const [problemText, setProblemText] = useState('')
  const [problemAnswers, setProblemAnswers] = useState('')
  const [saving, setSaving] = useState(false)

  // Форма подсказки
  const [addingTipFor, setAddingTipFor] = useState<string | null>(null)
  const [tipType, setTipType] = useState(1)
  const [tipText, setTipText] = useState('')
  const [tipDelay, setTipDelay] = useState(900)
  const [tipPenalty, setTipPenalty] = useState(600)
  const [savingTip, setSavingTip] = useState(false)

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
      setProblemText(''); setProblemAnswers('')
      setShowAddProblem(false)
      loadGame()
    } catch { alert('Ошибка') } finally { setSaving(false) }
  }

  async function addTip(problemId: string) {
    if (!tipText.trim()) return
    setSavingTip(true)
    try {
      await api.post(`/problems/${problemId}/tips`, {
        type: tipType,
        text: tipText,
        delaySeconds: tipDelay,
        penaltySeconds: tipPenalty,
      })
      setTipText(''); setTipType(1); setTipDelay(900); setTipPenalty(600)
      setAddingTipFor(null)
      loadGame()
    } catch (e: any) {
      alert(e?.error || 'Ошибка добавления подсказки')
    } finally { setSavingTip(false) }
  }

  async function deleteProblem(problemId: string) {
    if (!confirm('Удалить задание?')) return
    await api.delete(`/problems/${problemId}`)
    loadGame()
  }

  async function startGame() {
    if (!confirm(`Запустить игру "${game?.title}"?\nКод для команд: ${game?.joinCode}`)) return
    await api.post(`/games/${id}/start`, {})
    loadGame()
  }

  async function stopGame() {
    if (!confirm('Остановить игру?')) return
    await api.post(`/games/${id}/stop`, {})
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
        <div className="flex-1 min-w-0">
          <div className="font-bold text-agt-text text-sm truncate">{game.title}</div>
          <div className="text-xs text-agt-muted font-mono">{game.joinCode}</div>
        </div>
        {game.status === 'DRAFT' && (
          <button onClick={startGame} className="btn-primary text-sm px-4 py-2">▶ Запустить</button>
        )}
        {game.status === 'ACTIVE' && (
          <button onClick={stopGame} className="btn-danger text-sm px-4 py-2">■ Стоп</button>
        )}
        {game.status === 'FINISHED' && (
          <span className="text-xs text-agt-muted">Завершена</span>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Статистика */}
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

        {/* Заголовок заданий */}
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
              <label className="block text-xs text-agt-muted uppercase tracking-wider mb-1.5">Текст задания</label>
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
                rows={3} placeholder={"ответ1\nответ2"}
                value={problemAnswers} onChange={e => setProblemAnswers(e.target.value)}
              />
              <div className="text-xs text-agt-muted mt-1">Регистр и пробелы игнорируются</div>
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
          <div className="flex flex-col gap-4">
            {game.problems.map(problem => (
              <div key={problem.id} className="card p-4">
                {/* Задание */}
                <div className="flex items-start justify-between gap-2 mb-3">
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
                  </div>
                  {game.status === 'DRAFT' && (
                    <button onClick={() => deleteProblem(problem.id)}
                      className="text-agt-muted hover:text-agt-red text-sm px-2 flex-shrink-0">✕</button>
                  )}
                </div>

                {/* Подсказки */}
                <div className="border-t border-agt-border pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-agt-muted uppercase tracking-wider">Подсказки</div>
                    {game.status === 'DRAFT' && problem.tips.length < 3 && (
                      <button
                        onClick={() => setAddingTipFor(addingTipFor === problem.id ? null : problem.id)}
                        className="text-xs text-agt-blue hover:text-agt-orange">
                        + Добавить подсказку
                      </button>
                    )}
                  </div>

                  {/* Список подсказок */}
                  {problem.tips.length > 0 && (
                    <div className="flex flex-col gap-2 mb-3">
                      {problem.tips.map(tip => (
                        <div key={tip.id}
                          className="bg-agt-element rounded-md p-3 flex items-start gap-3">
                          <span className={`text-xs font-bold ${TIP_COLORS[tip.type]} flex-shrink-0`}>
                            {TIP_LABELS[tip.type]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-agt-text mb-1">{tip.text}</div>
                            <div className="text-xs text-agt-muted">
                              Через {tip.delaySeconds / 60} мин · Штраф {tip.penaltySeconds / 60} мин
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Форма добавления подсказки */}
                  {addingTipFor === problem.id && (
                    <div className="bg-agt-element rounded-md p-3 mt-2">
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div>
                          <label className="block text-xs text-agt-muted mb-1">Тип</label>
                          <select
                            className="w-full bg-agt-bg border border-agt-border rounded px-2 py-1.5
                                       text-agt-text text-xs focus:outline-none focus:border-agt-blue"
                            value={tipType}
                            onChange={e => setTipType(Number(e.target.value))}
                          >
                            {[1,2,3].filter(t => !problem.tips.find(tip => tip.type === t)).map(t => (
                              <option key={t} value={t}>{TIP_LABELS[t]}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-agt-muted mb-1">Через (мин)</label>
                          <input type="number" min={1}
                            className="w-full bg-agt-bg border border-agt-border rounded px-2 py-1.5
                                       text-agt-text text-xs focus:outline-none focus:border-agt-blue"
                            value={tipDelay / 60}
                            onChange={e => setTipDelay(Number(e.target.value) * 60)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-agt-muted mb-1">Штраф (мин)</label>
                          <input type="number" min={0}
                            className="w-full bg-agt-bg border border-agt-border rounded px-2 py-1.5
                                       text-agt-text text-xs focus:outline-none focus:border-agt-blue"
                            value={tipPenalty / 60}
                            onChange={e => setTipPenalty(Number(e.target.value) * 60)}
                          />
                        </div>
                      </div>
                      <div className="mb-2">
                        <label className="block text-xs text-agt-muted mb-1">Текст подсказки</label>
                        <textarea
                          className="w-full bg-agt-bg border border-agt-border rounded px-2 py-1.5
                                     text-agt-text text-xs resize-none
                                     focus:outline-none focus:border-agt-blue"
                          rows={2} placeholder="Текст подсказки..."
                          value={tipText} onChange={e => setTipText(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-primary text-xs py-1.5 px-3"
                          onClick={() => addTip(problem.id)} disabled={savingTip}>
                          {savingTip ? '...' : 'Сохранить'}
                        </button>
                        <button className="btn-secondary text-xs py-1.5 px-3"
                          onClick={() => setAddingTipFor(null)}>
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}

                  {problem.tips.length === 0 && game.status === 'DRAFT' && addingTipFor !== problem.id && (
                    <div className="text-xs text-agt-muted">Подсказок нет</div>
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
