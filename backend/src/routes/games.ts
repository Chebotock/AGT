import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { requireOrganizer } from '../middleware/auth.middleware'

function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = '911-'
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)]
  code += '-'
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function gamesRoutes(app: FastifyInstance) {

  // GET /games — список игр организатора
  app.get('/', { preHandler: requireOrganizer }, async (req, reply) => {
    const user = (req as any).user
    const games = await prisma.game.findMany({
      where: { createdById: user.sub },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { teams: true, problems: true } } }
    })
    reply.send(games)
  })

  // POST /games — создать игру
  app.post('/', { preHandler: requireOrganizer }, async (req, reply) => {
    const schema = z.object({
      title: z.string().min(2),
      description: z.string().optional(),
      wrongAnswerPenalty: z.number().default(600),
      maxTeams: z.number().optional(),
      scoringType: z.enum(['BY_TIME', 'BY_TIPS', 'MIXED']).default('BY_TIME'),
      timezone: z.string().default('Europe/Moscow'),
      scheduledAt: z.string().optional(),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    const user = (req as any).user
    const joinCode = generateGameCode()

    const game = await prisma.game.create({
      data: {
        title: body.data.title,
        description: body.data.description,
        wrongAnswerPenalty: body.data.wrongAnswerPenalty,
        maxTeams: body.data.maxTeams,
        scoringType: body.data.scoringType,
        joinCode,
        timezone: body.data.timezone,
        scheduledAt: body.data.scheduledAt ? new Date(body.data.scheduledAt) : null,
        createdById: user.sub,
      }
    })
    reply.status(201).send(game)
  })

  // GET /games/:id — одна игра
  app.get('/:id', { preHandler: requireOrganizer }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const user = (req as any).user
    const game = await prisma.game.findFirst({
      where: { id, createdById: user.sub },
      include: {
        problems: {
          orderBy: { orderNum: 'asc' },
          include: { answers: true, tips: true }
        },
        teams: { include: { captain: true } },
        _count: { select: { teams: true } }
      }
    })
    if (!game) return reply.status(404).send({ error: 'Game not found' })
    reply.send(game)
  })

  // PUT /games/:id — обновить игру
  app.put('/:id', { preHandler: requireOrganizer }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const user = (req as any).user
    const schema = z.object({
      title: z.string().min(2).optional(),
      description: z.string().optional(),
      wrongAnswerPenalty: z.number().optional(),
      maxTeams: z.number().optional(),
      scheduledAt: z.string().optional().nullable(),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    const { scheduledAt, ...rest } = body.data
    const game = await prisma.game.updateMany({
      where: { id, createdById: user.sub },
      data: {
        ...rest,
        scheduledAt: scheduledAt === null ? null : scheduledAt ? new Date(scheduledAt) : undefined,
      }
    })
    if (!game.count) return reply.status(404).send({ error: 'Game not found' })
    reply.send({ ok: true })
  })

  // POST /games/:id/start — запустить игру
  app.post('/:id/start', { preHandler: requireOrganizer }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const user = (req as any).user
    const game = await prisma.game.updateMany({
      where: { id, createdById: user.sub, status: 'DRAFT' },
      data: { status: 'ACTIVE', startedAt: new Date() }
    })
    if (!game.count) return reply.status(400).send({ error: 'Cannot start game' })
    reply.send({ ok: true })
  })

  // POST /games/:id/stop — остановить игру
  app.post('/:id/stop', { preHandler: requireOrganizer }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const user = (req as any).user
    const game = await prisma.game.updateMany({
      where: { id, createdById: user.sub, status: 'ACTIVE' },
      data: { status: 'FINISHED', finishedAt: new Date() }
    })
    if (!game.count) return reply.status(400).send({ error: 'Cannot stop game' })
    reply.send({ ok: true })
  })

  // DELETE /games/:id — удалить игру
  app.delete('/:id', { preHandler: requireOrganizer }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const user = (req as any).user
    await prisma.game.deleteMany({ where: { id, createdById: user.sub } })
    reply.send({ ok: true })
  })
}
