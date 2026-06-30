import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  signToken(user: { id: string; email: string; name: string }): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
    });
  }

  private validatePasswordStrength(password: string) {
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new UnauthorizedException(
        `Senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Mensagem genérica de propósito — não revela se o email existe ou não
    const genericError = new UnauthorizedException('Email ou senha inválidos.');

    if (!user) throw genericError;

    if (!user.password) {
      throw new UnauthorizedException(
        'Esta conta ainda não tem senha definida. Use "Primeiro acesso" para criar uma.',
      );
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) throw genericError;

    return user;
  }

  async registerUser(email: string, name: string, password: string) {
    this.validatePasswordStrength(password);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email já cadastrado. Faça o login.');
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    return this.prisma.user.create({
      data: { email, name, password: hashed },
    });
  }

  /**
   * Migração única para contas criadas antes da senha existir.
   * Usa email + nome (igual ao login antigo) só como prova de identidade
   * para permitir a criação da senha pela primeira vez.
   * Depois que a senha é definida, esse endpoint não funciona mais pra essa conta.
   */
  async setInitialPassword(email: string, name: string, password: string) {
    this.validatePasswordStrength(password);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
    if (user.password) {
      throw new ConflictException(
        'Esta conta já tem senha definida. Use o login normal.',
      );
    }
    if (user.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
      throw new UnauthorizedException('Nome incorreto para este email.');
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    return this.prisma.user.update({
      where: { email },
      data: { password: hashed },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
