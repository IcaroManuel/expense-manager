import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

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

  async loginByEmailAndName(email: string, name: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException(
        'Usuário não encontrado. Faça o cadastro primeiro.',
      );
    }

    // Comparação case-insensitive do nome
    if (user.name.trim().toLowerCase() !== name.toLowerCase()) {
      throw new UnauthorizedException('Nome incorreto para este email.');
    }

    return user;
  }

  async registerUser(email: string, name: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new ConflictException('Email já cadastrado. Faça o login.');
    }

    return this.prisma.user.create({ data: { email, name } });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Mantido para compatibilidade com o guard
  isEmailAllowed(_email: string): boolean {
    return true;
  }
}
