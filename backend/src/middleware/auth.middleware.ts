import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

export async function requireOrganizer(req: FastifyRequest, reply: FastifyReply) {
  const token = req.cookies['access_token']
  if (!token) return reply.status(401).send({ error: 'Unauthorized' })
  try {
    ;(req as any).user = jwt.verify(token, process.env.JWT_SECRET!)
  } catch {
    return reply.status(401).send({ error: 'Invalid token' })
  }
}

export async function requireTeam(req: FastifyRequest, reply: FastifyReply) {
  const token = req.cookies['team_token']
  if (!token) return reply.status(401).send({ error: 'Unauthorized' })
  try {
    ;(req as any).team = jwt.verify(token, process.env.JWT_SECRET!)
  } catch {
    return reply.status(401).send({ error: 'Invalid team token' })
  }
}
