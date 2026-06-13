import { FastifyInstance } from 'fastify'
import { authRoutes }     from './auth'
import { gamesRoutes }    from './games'
import { problemsRoutes } from './problems'
import { tipsRoutes }     from './tips'
import { teamRoutes }     from './team'
import { resultsRoutes }  from './results'
import { profileRoutes }  from './profile'
import { prisma } from '../config/prisma'

export async function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok', project: 'AGT-911' }))
  app.register(authRoutes,     { prefix: '/auth' })
  app.register(gamesRoutes,    { prefix: '/games' })
  app.register(problemsRoutes, { prefix: '/problems' })
  app.register(tipsRoutes,     { prefix: '/tips' })
  app.register(teamRoutes,     { prefix: '/team' })
  app.register(resultsRoutes,  { prefix: '/results' })
  app.register(profileRoutes,  { prefix: '/profile' })

  // Публичный эндпоинт — инфо об игре для страницы ожидания
  app.get('/game-info/:gameId', async (req, reply) => {
    const { gameId } = req.params as { gameId: string }
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, title: true, status: true, scheduledAt: true, timezone: true }
    })
    if (!game) return reply.status(404).send({ error: 'Not found' })
    reply.send(game)
  })
}
