import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { requireTeam } from '../middleware/auth.middleware'
import { compareAnswers } from '../utils/scoring'

export async function teamRoutes(app: FastifyInstance) {

  // GET /team/game — текущее состояние игры для команды
  app.get('/game', { preHandler: requireTeam }, async (req, reply) => {
    const team = (req as any).team
    const teamData = await prisma.team.findUnique({
      where: { id: team.teamId },
      include: {
        game: true,
        answerLogs: { where: { isCorrect: true }, select: { problemId: true } },
        usedTips: { select: { tipId: true, usedAtSeconds: true } },
      }
    })
    if (!teamData) return reply.status(404).send({ error: 'Team not found' })

    const game = teamData.game
    const solvedProblemIds = teamData.answerLogs.map(a => a.problemId)

    // Найти текущее задание
    const problems = await prisma.problem.findMany({
      where: { gameId: game.id },
      orderBy: { orderNum: 'asc' },
      include: { tips: { orderBy: { type: 'asc' } } }
    })

    const currentProblem = problems.find(p => !solvedProblemIds.includes(p.id))

    // Считаем время с начала задания
    const gameStartTime = game.startedAt ? new Date(game.startedAt).getTime() : null
    const now = Date.now()
    const totalElapsed = gameStartTime ? Math.floor((now - gameStartTime) / 1000) : 0

    // Штрафы
    const wrongAnswers = await prisma.answerLog.count({
      where: { teamId: team.teamId, isCorrect: false }
    })
    const tipPenalties = await prisma.usedTip.findMany({
      where: { teamId: team.teamId },
      include: { tip: { select: { penaltySeconds: true } } }
    })
    const totalPenalty = wrongAnswers * game.wrongAnswerPenalty +
      tipPenalties.reduce((sum, t) => sum + t.tip.penaltySeconds, 0)

    reply.send({
      game: {
        id: game.id,
        title: game.title,
        status: game.status,
        startedAt: game.startedAt,
      },
      team: {
        id: teamData.id,
        name: teamData.name,
      },
      progress: {
        solved: solvedProblemIds.length,
        total: problems.length,
        totalElapsed,
        totalPenalty,
      },
      currentProblem: currentProblem ? {
        id: currentProblem.id,
        orderNum: currentProblem.orderNum,
        text: currentProblem.text,
        tips: currentProblem.tips.map(tip => {
          const isUsed = teamData.usedTips.some(ut => ut.tipId === tip.id)
          const taskStartSeconds = totalElapsed - (currentProblem.orderNum - 1) * 0
          const isAvailable = totalElapsed >= tip.delaySeconds
          return {
            id: tip.id,
            type: tip.type,
            text: isUsed ? tip.text : null,
            delaySeconds: tip.delaySeconds,
            penaltySeconds: tip.penaltySeconds,
            isUsed,
            isAvailable,
            secondsUntilAvailable: Math.max(0, tip.delaySeconds - totalElapsed),
          }
        }),
      } : null,
      finished: !currentProblem && solvedProblemIds.length === problems.length,
    })
  })

  // POST /team/answer — отправить ответ
  app.post('/answer', { preHandler: requireTeam }, async (req, reply) => {
    const team = (req as any).team
    const schema = z.object({
      problemId: z.string(),
      answer: z.string().min(1),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    // Проверить ответ
    const correctAnswers = await prisma.problemAnswer.findMany({
      where: { problemId: body.data.problemId }
    })
    const isCorrect = correctAnswers.some(a =>
      compareAnswers(body.data.answer, a.answerText)
    )

    // Записать попытку
    await prisma.answerLog.create({
      data: {
        teamId: team.teamId,
        problemId: body.data.problemId,
        submittedText: body.data.answer,
        isCorrect,
      }
    })

    reply.send({ isCorrect, message: isCorrect ? 'Верно!' : 'Неверно, попробуй ещё раз' })
  })

  // POST /team/tip/:tipId — взять подсказку
  app.post('/tip/:tipId', { preHandler: requireTeam }, async (req, reply) => {
    const team = (req as any).team
    const { tipId } = req.params as { tipId: string }

    const tip = await prisma.tip.findUnique({ where: { id: tipId } })
    if (!tip) return reply.status(404).send({ error: 'Tip not found' })

    // Проверить что подсказка доступна по времени
    const teamGame = await prisma.team.findUnique({
      where: { id: team.teamId },
      include: { game: true }
    })
    if (!teamGame?.game.startedAt) return reply.status(400).send({ error: 'Game not started' })

    const elapsed = Math.floor((Date.now() - new Date(teamGame.game.startedAt).getTime()) / 1000)
    if (elapsed < tip.delaySeconds) {
      return reply.status(400).send({ error: 'Too early', secondsLeft: tip.delaySeconds - elapsed })
    }

    // Проверить что не взята ранее
    const existing = await prisma.usedTip.findUnique({
      where: { teamId_tipId: { teamId: team.teamId, tipId } }
    })
    if (existing) return reply.status(400).send({ error: 'Already used' })

    // Если тип 3 — засчитать 1 и 2
    if (tip.type === 3) {
      const otherTips = await prisma.tip.findMany({
        where: { problemId: tip.problemId, type: { in: [1, 2] } }
      })
      for (const t of otherTips) {
        const ex = await prisma.usedTip.findUnique({
          where: { teamId_tipId: { teamId: team.teamId, tipId: t.id } }
        })
        if (!ex) {
          await prisma.usedTip.create({
            data: { teamId: team.teamId, tipId: t.id, usedAtSeconds: elapsed }
          })
        }
      }
    }

    await prisma.usedTip.create({
      data: { teamId: team.teamId, tipId, usedAtSeconds: elapsed }
    })

    reply.send({ ok: true, text: tip.text, penalty: tip.penaltySeconds })
  })
}
