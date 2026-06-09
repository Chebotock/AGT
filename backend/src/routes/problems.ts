import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { requireOrganizer } from '../middleware/auth.middleware'

export async function problemsRoutes(app: FastifyInstance) {

  // POST /problems — создать задание
  app.post('/', { preHandler: requireOrganizer }, async (req, reply) => {
    const schema = z.object({
      gameId: z.string(),
      orderNum: z.number(),
      text: z.string().min(1),
      timeLimit: z.number().optional(),
      answers: z.array(z.string()).min(1),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    const problem = await prisma.problem.create({
      data: {
        gameId: body.data.gameId,
        orderNum: body.data.orderNum,
        text: body.data.text,
        timeLimit: body.data.timeLimit,
        answers: { create: body.data.answers.map(a => ({ answerText: a })) }
      },
      include: { answers: true }
    })
    reply.status(201).send(problem)
  })

  // PUT /problems/:id — обновить задание
  app.put('/:id', { preHandler: requireOrganizer }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const schema = z.object({
      text: z.string().min(1).optional(),
      timeLimit: z.number().optional(),
      answers: z.array(z.string()).optional(),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    await prisma.problem.update({
      where: { id },
      data: { text: body.data.text, timeLimit: body.data.timeLimit }
    })

    if (body.data.answers) {
      await prisma.problemAnswer.deleteMany({ where: { problemId: id } })
      await prisma.problemAnswer.createMany({
        data: body.data.answers.map(a => ({ problemId: id, answerText: a }))
      })
    }
    reply.send({ ok: true })
  })

  // DELETE /problems/:id
  app.delete('/:id', { preHandler: requireOrganizer }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.problem.delete({ where: { id } })
    reply.send({ ok: true })
  })

  // POST /problems/:id/tips — добавить подсказку
  app.post('/:id/tips', { preHandler: requireOrganizer }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const schema = z.object({
      type: z.number().min(1).max(3),
      text: z.string().min(1),
      delaySeconds: z.number(),
      penaltySeconds: z.number(),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    const tip = await prisma.tip.create({
      data: { problemId: id, ...body.data }
    })
    reply.status(201).send(tip)
  })
}
