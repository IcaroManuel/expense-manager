import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

const EMERGENT_SESSION_DATA_URL = 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data';
const SESSION_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private allowedEmails(): Set<string> {
    const raw = process.env.ALLOWED_EMAILS || '';
    const emails = raw.split(',').map(e => e.trim().toLowerCase()).filter(e => e);
    return new Set(emails);
  }

  isEmailAllowed(email: string): boolean {
    const allowed = this.allowedEmails();
    if (allowed.size === 0) return true; // Allowlist desabilitada
    return allowed.has(email.toLowerCase());
  }

  async exchangeSessionId(sessionId: string): Promise<any> {
    try {
      const resp = await axios.get(EMERGENT_SESSION_DATA_URL, {
        headers: { 'X-Session-ID': sessionId },
        timeout: 20000,
      });
      return resp.data;
    } catch (error) {
      throw new UnauthorizedException({
        message: 'Sessão inválida ou expirada',
        code: 'INVALID_SESSION',
      });
    }
  }

  async upsertUser(email: string, name: string, picture?: string) {
    if (!this.isEmailAllowed(email)) {
      throw new UnauthorizedException({
        message: 'Email não autorizado',
        code: 'UNAUTHORIZED_EMAIL',
      });
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return this.prisma.user.update({
        where: { email },
        data: { name, picture },
      });
    }

    return this.prisma.user.create({
      data: { email, name, picture },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
