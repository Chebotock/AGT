import { FastifyReply } from 'fastify'

const clients = new Map<string, FastifyReply[]>()

export function addClient(gameId: string, reply: FastifyReply) {
  if (!clients.has(gameId)) clients.set(gameId, [])
  clients.get(gameId)!.push(reply)
}
export function removeClient(gameId: string, reply: FastifyReply) {
  clients.set(gameId, (clients.get(gameId) || []).filter(r => r !== reply))
}
export function broadcastEvent(gameId: string, event: object) {
  const data = "data: " + JSON.stringify(event) + "\n\n"
  ;(clients.get(gameId) || []).forEach(r => r.raw.write(data))
}
