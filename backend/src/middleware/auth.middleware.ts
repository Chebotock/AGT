import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

export async function requireOrganizer(req: FastifyRequest, reply: FastifyReply) {
  const token = req.cookies['access_token']
  if (!token) return reply.status(401).send({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (payload.type !== 'organizer') return reply.status(401).send({ error: 'Unauthorized' })
    ;(req as any).user = payload
  } catch {
    return reply.status(401).send({ error: 'Invalid token' })
  }
}

export async function requireTeam(req: FastifyRequest, reply: FastifyReply) {
  const token = req.cookies['captain_token']
  if (!token) return reply.status(401).send({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (payload.type !== 'captain') return reply.status(401).send({ error: 'Unauthorized' })
    ;(req as any).team = payload
  } catch {
    return reply.status(401).send({ error: 'Invalid token' })
  }
}

export async function requireMember(req: FastifyRequest, reply: FastifyReply) {
  // Участник может иметь captain_token или member_token
  const token = req.cookies['captain_token'] || req.cookies['member_token']
  if (!token) return reply.status(401).send({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    ;(req as any).member = payload
  } catch {
    return reply.status(401).send({ error: 'Invalid token' })
  }
}
