import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { AuthService } from '../services/auth.service'

const authService = new AuthService()

export async function authRoutes(app: FastifyInstance) {

  // POST /auth/register — регистрация организатора
  app.post('/register', async (req, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    try {
      const { accessToken, refreshToken } = await authService.registerOrganizer(body.data)
      reply
        .setCookie('access_token', accessToken, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 60 * 15 })
        .setCookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 60 * 60 * 24 * 7 })
        .send({ ok: true })
    } catch (e: any) {
      reply.status(400).send({ error: e.message })
    }
  })

  // POST /auth/login — вход организатора
  app.post('/login', async (req, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string(),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    try {
      const { accessToken, refreshToken } = await authService.loginOrganizer(body.data)
      reply
        .setCookie('access_token', accessToken, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 60 * 15 })
        .setCookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 60 * 60 * 24 * 7 })
        .send({ ok: true })
    } catch (e: any) {
      reply.status(401).send({ error: e.message })
    }
  })

  // POST /auth/logout
  app.post('/logout', async (req, reply) => {
    reply
      .clearCookie('access_token')
      .clearCookie('refresh_token')
      .send({ ok: true })
  })

  // GET /auth/me — проверить текущего пользователя
  app.get('/me', async (req, reply) => {
    const token = req.cookies['access_token']
    if (!token) return reply.status(401).send({ error: 'Unauthorized' })
    try {
      const user = await authService.verifyOrganizer(token)
      reply.send(user)
    } catch {
      reply.status(401).send({ error: 'Invalid token' })
    }
  })

  // POST /auth/team/register — регистрация капитана
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
        .setCookie('captain_token', accessToken, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 60 * 60 * 24 * 30 })
        .send({ ok: true })
    } catch (e: any) {
      reply.status(400).send({ error: e.message })
    }
  })

  // POST /auth/team/login — вход капитана
  app.post('/team/login', async (req, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string(),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    try {
      const { accessToken } = await authService.loginCaptain(body.data)
      reply
        .setCookie('captain_token', accessToken, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 60 * 60 * 24 * 30 })
        .send({ ok: true })
    } catch (e: any) {
      reply.status(401).send({ error: e.message })
    }
  })

  // POST /auth/team/join — войти в игру по коду
  app.post('/team/join', async (req, reply) => {
    const schema = z.object({
      gameCode: z.string().min(3),
      teamName: z.string().min(2),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    const captainToken = req.cookies['captain_token']
    if (!captainToken) return reply.status(401).send({ error: 'Login first' })

    try {
      const result = await authService.joinGame({ ...body.data, captainToken })
      reply.send(result)
    } catch (e: any) {
      reply.status(400).send({ error: e.message })
    }
  })

  // GET /auth/team/me — проверить капитана и его игру
  app.get('/team/me', async (req, reply) => {
    const token = req.cookies['captain_token']
    if (!token) return reply.status(401).send({ error: 'Unauthorized' })
    try {
      const result = await authService.getCaptainStatus(token)
      reply.send(result)
    } catch {
      reply.status(401).send({ error: 'Invalid token' })
    }
  })

  // GET /auth/team/invite/:teamId — получить ссылку для участников
  app.get('/team/invite/:teamId', async (req, reply) => {
    const { teamId } = req.params as { teamId: string }
    const token = req.cookies['captain_token']
    if (!token) return reply.status(401).send({ error: 'Unauthorized' })
    try {
      const link = await authService.getInviteLink(teamId, token)
      reply.send({ link })
    } catch (e: any) {
      reply.status(403).send({ error: e.message })
    }
  })

  // GET /auth/member/:inviteToken — вход участника по ссылке
  app.get('/member/:inviteToken', async (req, reply) => {
    const { inviteToken } = req.params as { inviteToken: string }
    try {
      const { memberToken } = await authService.joinAsMember(inviteToken)
      reply
        .setCookie('member_token', memberToken, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 60 * 60 * 24 })
        .send({ ok: true })
    } catch (e: any) {
      reply.status(400).send({ error: e.message })
    }
  })
}
