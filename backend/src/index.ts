import Fastify from 'fastify'
import { registerPlugins } from './config/plugins'
import { registerRoutes } from './routes/index'

const app = Fastify({ logger: { level: 'info' } })

async function start() {
  await registerPlugins(app)
  await registerRoutes(app)
  const port = Number(process.env.PORT) || 3000
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`AGT-911 backend running on port ${port}`)
}

start().catch((err) => { console.error(err); process.exit(1) })
