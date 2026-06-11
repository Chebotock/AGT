import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { AuthService } from '../services/auth.service'

const authService = new AuthService()

const cookieOpts = { httpOnly: true, secure: true, sameSite: 'none' as const, path: '/' }

export async function authRoutes(app: FastifyInstance) {

  app.post('/register', async (req, reply) => {
    const schema = z.object({ email: z.string().email(), password: z.string().min(8) })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })
    try {
      const { accessToken, refreshToken } = await authService.registerOrganizer(body.data)
      reply
        .setCookie('access_token', accessToken, { ...cookieOpts, maxAge: 60 * 15 })
        .setCookie('refresh_token', refreshToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 })
        .send({ ok: true })
    } catch (e: any) { reply.status(400).send({ error: e.message }) }
  })

  app.post('/login', async (req, reply) => {
    const schema = z.object({ email: z.string().email(), password: z.string() })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })
    try {
      const { accessToken, refreshToken } = await authService.loginOrganizer(body.data)
      reply
        .setCookie('access_token', accessToken, { ...cookieOpts, maxAge: 60 * 15 })
        .setCookie('refresh_token', refreshToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 })
        .send({ ok: true })
    } catch (e: any) { reply.status(401).send({ error: e.message }) }
  })

  app.post('/logout', async (req, reply) => {
    reply.clearCookie('access_token').clearCookie('refresh_token').send({ ok: true })
  })

  app.get('/me', async (req, reply) => {
    const token = req.cookies['access_token']
    if (!token) return reply.status(401).send({ error: 'Unauthorized' })
    try {
      const user = await authService.verifyOrganizer(token)
      reply.send(user)
    } catch { reply.status(401).send({ error: 'Invalid token' }) }
  })

  app.post('/team/register', async (req, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      nickname: z.string().min(2),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })
    try {
      const { accessToken } = await authService.registerCaptain(body.data)
      reply
        .setCookie('captain_token', accessToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 })
        .send({ ok: true })
    } catch (e: any) { reply.status(400).send({ error: e.message }) }
  })

  app.post('/team/login', async (req, reply) => {
    const schema = z.object({ email: z.string().email(), password: z.string() })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })
    try {
      const { accessToken } = await authService.loginCaptain(body.data)
      reply
        .setCookie('captain_token', accessToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 })
        .send({ ok: true })
    } catch (e: any) { reply.status(401).send({ error: e.message }) }
  })

  app.post('/team/join', async (req, reply) => {
    const schema = z.object({ gameCode: z.string().min(3), teamName: z.string().min(2) })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })
    const captainToken = req.cookies['captain_token']
    if (!captainToken) return reply.status(401).send({ error: 'Login first' })
    try {
      const result = await authService.joinGame({ ...body.data, captainToken })
      // Обновить cookie с новым токеном содержащим teamId
      reply
        .setCookie('captain_token', result.accessToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 })
        .send(result)
    } catch (e: any) { reply.status(400).send({ error: e.message }) }
  })

  // POST /auth/refresh — обновить access_token через refresh_token
  app.post('/refresh', async (req, reply) => {
    const refreshToken = req.cookies['refresh_token']
    if (!refreshToken) return reply.status(401).send({ error: 'No refresh token' })
    try {
      const jwt = require('jsonwebtoken')
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any
      if (payload.type !== 'refresh') return reply.status(401).send({ error: 'Invalid token' })
      
      const { prisma } = require('../config/prisma')
      const user = await prisma.user.findUnique({ where: { id: payload.sub } })
      if (!user) return reply.status(401).send({ error: 'User not found' })

      const newAccessToken = jwt.sign(
        { sub: user.id, role: user.role, type: 'organizer' },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      )
      reply
        .setCookie('access_token', newAccessToken, { ...cookieOpts, maxAge: 60 * 60 * 24 })
        .send({ ok: true })
    } catch {
      reply.status(401).send({ error: 'Invalid refresh token' })
    }
  })

  app.get('/team/me', async (req, reply) => {
    const token = req.cookies['captain_token']
    if (!token) return reply.status(401).send({ error: 'Unauthorized' })
    try {
      const result = await authService.getCaptainStatus(token)
      reply.send(result)
    } catch { reply.status(401).send({ error: 'Invalid token' }) }
  })

  app.get('/team/invite/:teamId', async (req, reply) => {
    const { teamId } = req.params as { teamId: string }
    const token = req.cookies['captain_token']
    if (!token) return reply.status(401).send({ error: 'Unauthorized' })
    try {
      const link = await authService.getInviteLink(teamId, token)
      reply.send({ link })
    } catch (e: any) { reply.status(403).send({ error: e.message }) }
  })

  app.get('/member/:inviteToken', async (req, reply) => {
    const { inviteToken } = req.params as { inviteToken: string }
    try {
      const { memberToken } = await authService.joinAsMember(inviteToken)
      reply
        .setCookie('member_token', memberToken, { ...cookieOpts, maxAge: 60 * 60 * 24 })
        .send({ ok: true })
    } catch (e: any) { reply.status(400).send({ error: e.message }) }
  })
}
