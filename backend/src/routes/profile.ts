import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '../config/prisma'
import { requireOrganizer } from '../middleware/auth.middleware'

export async function profileRoutes(app: FastifyInstance) {

  // GET /profile — получить профиль
  app.get('/', { preHandler: requireOrganizer }, async (req, reply) => {
    const user = (req as any).user
    const data = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, email: true, role: true, createdAt: true }
    })
    if (!data) return reply.status(404).send({ error: 'User not found' })
    reply.send(data)
  })

  // PUT /profile/email — сменить email
  app.put('/email', { preHandler: requireOrganizer }, async (req, reply) => {
    const schema = z.object({
      newEmail: z.string().email(),
      password: z.string(),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    const user = (req as any).user
    const data = await prisma.user.findUnique({ where: { id: user.sub } })
    if (!data) return reply.status(404).send({ error: 'User not found' })

    // Проверить пароль
    const valid = await bcrypt.compare(body.data.password, data.passwordHash)
    if (!valid) return reply.status(401).send({ error: 'Неверный пароль' })

    // Проверить что email не занят
    const exists = await prisma.user.findUnique({ where: { email: body.data.newEmail } })
    if (exists) return reply.status(400).send({ error: 'Email уже используется' })

    await prisma.user.update({
      where: { id: user.sub },
      data: { email: body.data.newEmail }
    })
    reply.send({ ok: true })
  })

  // PUT /profile/password — сменить пароль
  app.put('/password', { preHandler: requireOrganizer }, async (req, reply) => {
    const schema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8, 'Минимум 8 символов'),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.errors[0].message })

    const user = (req as any).user
    const data = await prisma.user.findUnique({ where: { id: user.sub } })
    if (!data) return reply.status(404).send({ error: 'User not found' })

    // Проверить текущий пароль
    const valid = await bcrypt.compare(body.data.currentPassword, data.passwordHash)
    if (!valid) return reply.status(401).send({ error: 'Неверный текущий пароль' })

    const newHash = await bcrypt.hash(body.data.newPassword, 12)
    await prisma.user.update({
      where: { id: user.sub },
      data: { passwordHash: newHash }
    })
    reply.send({ ok: true })
  })
}
