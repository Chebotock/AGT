import { FastifyInstance } from 'fastify'
import { authRoutes }     from './auth'
import { gamesRoutes }    from './games'
import { problemsRoutes } from './problems'
import { tipsRoutes }     from './tips'
import { teamRoutes }     from './team'
import { resultsRoutes }  from './results'

export async function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok', project: 'AGT-911' }))
  app.register(authRoutes,     { prefix: '/auth' })
  app.register(gamesRoutes,    { prefix: '/games' })
  app.register(problemsRoutes, { prefix: '/problems' })
  app.register(tipsRoutes,     { prefix: '/tips' })
  app.register(teamRoutes,     { prefix: '/team' })
  app.register(resultsRoutes,  { prefix: '/results' })
}
