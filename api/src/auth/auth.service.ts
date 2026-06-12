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
      throw new UnauthorizedException('Invalid session_id from provider');
    }
  }

  async upsertUser(email: string, name: string, picture?: string) {
    if (!this.isEmailAllowed(email)) {
      throw new UnauthorizedException('Email not authorized');
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

  // O NestJS (diferente do FastAPI) geralmente utiliza JWT para manter o estado da sessão sem
  // precisar bater no banco em toda requisição. Como o seu banco Prisma NÃO tem a tabela
  // 'UserSession' (pois não definimos no schema), vamos simplificar e utilizar o próprio
  // Token da Emergent validado via cache ou retornar o usuário direto.

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
