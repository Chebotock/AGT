import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma'

const SALT_ROUNDS = 12

export class AuthService {

  // ─── Организатор ───────────────────────────────────────────

  async registerOrganizer({ email, password }: { email: string; password: string }) {
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) throw new Error('Email already registered')

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await prisma.user.create({
      data: { email, passwordHash, role: 'ORGANIZER' }
    })
    return this._issueOrganizerTokens(user.id, user.role)
  }

  async loginOrganizer({ email, password }: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new Error('Invalid email or password')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new Error('Invalid email or password')

    return this._issueOrganizerTokens(user.id, user.role)
  }

  async verifyOrganizer(token: string) {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) throw new Error('User not found')
    return { id: user.id, email: user.email, role: user.role }
  }

  private _issueOrganizerTokens(userId: string, role: string) {
    const accessToken = jwt.sign(
      { sub: userId, role, type: 'organizer' },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )
    const refreshToken = jwt.sign(
      { sub: userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    )
    return { accessToken, refreshToken }
  }

  // ─── Капитан ───────────────────────────────────────────────

  async registerCaptain({ email, password, nickname }: { email: string; password: string; nickname: string }) {
    const exists = await prisma.captain.findUnique({ where: { email } })
    if (exists) throw new Error('Email already registered')

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const captain = await prisma.captain.create({
      data: { email, passwordHash, nickname }
    })
    return this._issueCaptainToken(captain.id)
  }

  async loginCaptain({ email, password }: { email: string; password: string }) {
    const captain = await prisma.captain.findUnique({ where: { email } })
    if (!captain) throw new Error('Invalid email or password')

    const valid = await bcrypt.compare(password, captain.passwordHash)
    if (!valid) throw new Error('Invalid email or password')

    return this._issueCaptainToken(captain.id)
  }

  async joinGame({ gameCode, teamName, captainToken }: { gameCode: string; teamName: string; captainToken: string }) {
    const payload = jwt.verify(captainToken, process.env.JWT_SECRET!) as any
    const captainId = payload.sub

    // Найти игру по коду
    const game = await prisma.game.findUnique({ where: { joinCode: gameCode } })
    if (!game) throw new Error('Game not found')
    if (game.status === 'FINISHED') throw new Error('Game already finished')

    // Проверить что капитан ещё не в игре
    const existing = await prisma.team.findFirst({
      where: { gameId: game.id, captainId }
    })
    if (existing) throw new Error('Already joined this game')

    // Создать команду
    const team = await prisma.team.create({
      data: {
        gameId: game.id,
        name: teamName,
        captainId,
        joinMethod: 'code',
        tokenHash: await bcrypt.hash(captainToken, 6),
      }
    })

    return {
      teamId: team.id,
      teamName: team.name,
      gameId: game.id,
      gameStatus: game.status,
      gameTitle: game.title,
    }
  }

  async getCaptainStatus(token: string) {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    const captain = await prisma.captain.findUnique({ where: { id: payload.sub } })
    if (!captain) throw new Error('Captain not found')

    // Найти активную команду капитана
    const team = await prisma.team.findFirst({
      where: { captainId: captain.id },
      include: { game: true },
      orderBy: { createdAt: 'desc' }
    })

    return {
      captain: { id: captain.id, email: captain.email, nickname: captain.nickname },
      team: team ? {
        id: team.id,
        name: team.name,
        gameId: team.gameId,
        gameTitle: team.game.title,
        gameStatus: team.game.status,
      } : null
    }
  }

  async getInviteLink(teamId: string, captainToken: string) {
    const payload = jwt.verify(captainToken, process.env.JWT_SECRET!) as any
    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team || team.captainId !== payload.sub) throw new Error('Forbidden')

    const inviteToken = jwt.sign(
      { teamId, type: 'invite' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )
    return `${process.env.FRONTEND_URL}/agt?invite=${inviteToken}`
  }

  async joinAsMember(inviteToken: string) {
    const payload = jwt.verify(inviteToken, process.env.JWT_SECRET!) as any
    if (payload.type !== 'invite') throw new Error('Invalid invite')

    const memberToken = jwt.sign(
      { teamId: payload.teamId, role: 'member', type: 'member' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )
    return { memberToken }
  }

  private _issueCaptainToken(captainId: string) {
    const accessToken = jwt.sign(
      { sub: captainId, role: 'captain', type: 'captain' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    )
    return { accessToken }
  }
}
