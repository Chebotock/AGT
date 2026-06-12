import { prisma } from '../config/prisma'

export function startScheduler() {
  console.log('Scheduler started')
  
  // Проверяем каждые 30 секунд
  setInterval(async () => {
    try {
      const now = new Date()
      
      // Найти все игры с scheduledAt в прошлом которые ещё DRAFT
      const games = await prisma.game.findMany({
        where: {
          status: 'DRAFT',
          scheduledAt: { lte: now },
        }
      })

      for (const game of games) {
        await prisma.game.update({
          where: { id: game.id },
          data: { status: 'ACTIVE', startedAt: now }
        })
        console.log(`Auto-started game: ${game.title} (${game.id})`)
      }
    } catch (err) {
      console.error('Scheduler error:', err)
    }
  }, 30000)
}
