import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

interface Tip {
  id: string; type: number; text: string | null
  delaySeconds: number; penaltySeconds: number
  isUsed: boolean; isAvailable: boolean; secondsUntilAvailable: number
}

interface GameState {
  game: { id: string; title: string; status: string; startedAt: string }
  team: { id: string; name: string }
  progress: { solved: number; total: number; totalElapsed: number; totalPenalty: number }
  currentProblem: {
    id: string; orderNum: number; text: string; tips: Tip[]
  } | null
  finished: boolean
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TeamGame() {
  const [state, setState] = useState<GameState | null>(null)
  const [answer, setAnswer] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [usedTip, setUsedTip] = useState<Tip | null>(null)
  const navigate = useNavigate()

  const loadGame = useCallback(async () => {
    try {
      const data = await api.get<GameState>('/team/game')
      setState(data)
      if (data.finished) navigate('/agt/results')
      if (data.game.status !== 'ACTIVE') navigate('/agt/waiting')
    } catch {
      navigate('/agt')
    }
  }, [navigate])

  useEffect(() => { loadGame() }, [loadGame])

  // Таймер
  useEffect(() => {
    if (!state?.game.startedAt) return
    const startTime = new Date(state.game.startedAt).getTime()
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [state?.game.startedAt])

  async function submitAnswer() {
    if (!answer.trim() || !state?.currentProblem || submitting) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await api.post<{ isCorrect: boolean; message: string }>('/team/answer', {
        problemId: state.currentProblem.id,
        answer: answer.trim(),
      })
      setResult({ correct: res.isCorrect, message: res.message })
      if (res.isCorrect) {
        setAnswer('')
        setTimeout(() => { setResult(null); loadGame() }, 1500)
      } else {
        setAnswer('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function useTip(tip: Tip) {
    if (!tip.isAvailable || tip.isUsed) return
    try {
      const res = await api.post<{ ok: boolean; text: string; penalty: number }>(
        `/team/tip/${tip.id}`, {}
      )
      setUsedTip({ ...tip, text: res.text })
      loadGame()
    } catch (e: any) {
      alert(e?.error || 'Ошибка')
    }
  }

  if (!state) return (
    <div className="min-h-screen bg-agt-bg flex items-center justify-center">
      <div className="text-agt-muted text-sm">Загружаем игру...</div>
    </div>
  )

  const { game, team, progress, currentProblem } = state
  const penalty = progress.totalPenalty

  return (
    <div className="min-h-screen bg-agt-bg flex flex-col">

      {/* Хедер */}
      <div className="bg-agt-surface border-b border-agt-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-agt-muted">{game.title}</div>
            <div className="text-sm font-semibold text-agt-text">{team.name}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-bold text-agt-orange">
              {formatTime(elapsed)}
            </div>
            {penalty > 0 && (
              <div className="text-xs text-agt-red">+{formatTime(penalty)} штраф</div>
            )}
          </div>
        </div>

        {/* Прогресс */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 bg-agt-element rounded-full h-1.5">
            <div
              className="bg-agt-blue h-1.5 rounded-full transition-all"
              style={{ width: `${progress.total ? (progress.solved / progress.total) * 100 : 0}%` }}
            />
          </div>
          <div className="text-xs text-agt-muted">
            {progress.solved}/{progress.total}
          </div>
        </div>
      </div>

      {/* Задание */}
      {currentProblem && (
        <div className="flex-1 flex flex-col px-4 py-5 gap-4">

          <div className="card p-4">
            <div className="text-xs text-agt-blue font-medium mb-2">
              Задание {currentProblem.orderNum} из {progress.total}
            </div>
            <div className="text-agt-text text-sm leading-relaxed">
              {currentProblem.text}
            </div>
          </div>

          {/* Подсказки */}
          {currentProblem.tips.length > 0 && (
            <div>
              <div className="text-xs text-agt-muted uppercase tracking-wider mb-2">Подсказки</div>
              <div className="flex gap-2">
                {currentProblem.tips.map(tip => (
                  <button
                    key={tip.id}
                    onClick={() => useTip(tip)}
                    disabled={!tip.isAvailable || tip.isUsed}
                    className={`flex-1 rounded-lg p-3 text-center border transition-all ${
                      tip.isUsed
                        ? 'border-agt-border bg-agt-element opacity-40'
                        : tip.isAvailable
                          ? 'border-agt-pink bg-agt-pink/10 cursor-pointer hover:bg-agt-pink/20'
                          : 'border-agt-border bg-agt-element opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-base mb-1">
                      {tip.isUsed ? '✓' : tip.isAvailable ? '💡' : '🔒'}
                    </div>
                    <div className="text-xs text-agt-muted">
                      {tip.isUsed ? 'Использована' : tip.isAvailable
                        ? `-${tip.penaltySeconds / 60} мин`
                        : formatTime(tip.secondsUntilAvailable)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Текст использованной подсказки */}
          {usedTip?.text && (
            <div className="card p-4 border-agt-pink/30">
              <div className="text-xs text-agt-pink font-medium mb-1">
                Подсказка {usedTip.type}
              </div>
              <div className="text-sm text-agt-text">{usedTip.text}</div>
            </div>
          )}

          {/* Ответ */}
          <div className="mt-auto">
            {result && (
              <div className={`text-sm font-medium mb-3 text-center ${
                result.correct ? 'text-agt-green' : 'text-agt-red'
              }`}>
                {result.correct ? '✓ ' : '✗ '}{result.message}
              </div>
            )}
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Введите ответ..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitAnswer()}
                autoComplete="off"
              />
              <button
                className="btn-primary px-5"
                onClick={submitAnswer}
                disabled={submitting || !answer.trim()}
              >
                {submitting ? '...' : '→'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
