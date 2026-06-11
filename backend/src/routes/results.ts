import { FastifyInstance } from 'fastify'
import { prisma } from '../config/prisma'
import { requireOrganizer } from '../middleware/auth.middleware'

export async function resultsRoutes(app: FastifyInstance) {

  // GET /results/:gameId — дашборд игры (для организатора)
  app.get('/:gameId', { preHandler: requireOrganizer }, async (req, reply) => {
    const { gameId } = req.params as { gameId: string }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        problems: { orderBy: { orderNum: 'asc' } },
        teams: {
          include: {
            captain: { select: { nickname: true } },
            answerLogs: { orderBy: { submittedAt: 'asc' } },
            usedTips: { include: { tip: { select: { penaltySeconds: true, type: true } } } },
          }
        }
      }
    })

    if (!game) return reply.status(404).send({ error: 'Game not found' })

    const gameStartTime = game.startedAt ? new Date(game.startedAt).getTime() : null
    const now = Date.now()

    const teamsData = game.teams.map(team => {
      const correctAnswers = team.answerLogs.filter(a => a.isCorrect)
      const wrongAnswers = team.answerLogs.filter(a => !a.isCorrect)
      const solvedProblemIds = correctAnswers.map(a => a.problemId)

      // Текущее задание
      const currentProblem = game.problems.find(p => !solvedProblemIds.includes(p.id))

      // Штрафы
      const wrongPenalty = wrongAnswers.length * game.wrongAnswerPenalty
      const tipPenalty = team.usedTips.reduce((sum, ut) => sum + ut.tip.penaltySeconds, 0)
      const totalPenalty = wrongPenalty + tipPenalty

      // Итоговое время
      const finishLog = correctAnswers[correctAnswers.length - 1]
      const finishTime = finishLog && solvedProblemIds.length === game.problems.length
        ? new Date(finishLog.submittedAt).getTime()
        : null
      const elapsedMs = finishTime
        ? finishTime - (gameStartTime || 0)
        : gameStartTime ? now - gameStartTime : 0
      const cleanSeconds = Math.floor(elapsedMs / 1000)
      const totalSeconds = cleanSeconds + totalPenalty
      const finished = solvedProblemIds.length === game.problems.length

      return {
        id: team.id,
        name: team.name,
        captain: team.captain.nickname,
        solved: solvedProblemIds.length,
        total: game.problems.length,
        currentProblemNum: currentProblem?.orderNum || null,
        wrongAnswers: wrongAnswers.length,
        tipsUsed: team.usedTips.length,
        totalPenalty,
        cleanSeconds,
        totalSeconds,
        finished,
        finishedAt: finishTime,
      }
    })

    // Сортировка: финишировавшие по времени, остальные по прогрессу
    teamsData.sort((a, b) => {
      if (a.finished && b.finished) return a.totalSeconds - b.totalSeconds
      if (a.finished) return -1
      if (b.finished) return 1
      if (b.solved !== a.solved) return b.solved - a.solved
      return a.totalPenalty - b.totalPenalty
    })

    reply.send({
      game: {
        id: game.id,
        title: game.title,
        status: game.status,
        startedAt: game.startedAt,
        problemsCount: game.problems.length,
      },
      teams: teamsData,
    })
  })

  // GET /results/:gameId/export — экспорт в CSV
  app.get('/:gameId/export', { preHandler: requireOrganizer }, async (req, reply) => {
    const { gameId } = req.params as { gameId: string }
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        problems: { orderBy: { orderNum: 'asc' } },
        teams: {
          include: {
            captain: { select: { nickname: true } },
            answerLogs: true,
            usedTips: { include: { tip: { select: { penaltySeconds: true } } } },
          }
        }
      }
    })
    if (!game) return reply.status(404).send({ error: 'Not found' })

    const rows = ['Место,Команда,Капитан,Решено,Штраф (сек),Итого (сек)']
    game.teams.forEach((team, i) => {
      const solved = team.answerLogs.filter(a => a.isCorrect).length
      const penalty = team.answerLogs.filter(a => !a.isCorrect).length * game.wrongAnswerPenalty
        + team.usedTips.reduce((s, ut) => s + ut.tip.penaltySeconds, 0)
      rows.push(`${i+1},${team.name},${team.captain.nickname},${solved}/${game.problems.length},${penalty},${penalty}`)
    })

    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="game-${gameId}.csv"`)
      .send(rows.join('\n'))
  })
}
