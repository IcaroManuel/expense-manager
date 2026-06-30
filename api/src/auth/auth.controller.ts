import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  UseGuards,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { type Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { type User } from '@prisma/client';

const isProd = process.env.NODE_ENV === 'production';

function sessionCookieOptions() {
  return {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // 5 tentativas/min por IP
  @Post('login')
  @HttpCode(200)
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!email?.trim() || !password) {
      throw new UnauthorizedException('Email e senha são obrigatórios');
    }

    const user = await this.authService.login(email.trim().toLowerCase(), password);
    const token = this.authService.signToken(user);
    response.cookie('session_token', token, sessionCookieOptions());

    return { id: user.id, email: user.email, name: user.name, picture: user.picture };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @HttpCode(201)
  async register(
    @Body('email') email: string,
    @Body('name') name: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!email?.trim() || !name?.trim() || !password) {
      throw new UnauthorizedException('Email, nome e senha são obrigatórios');
    }

    const user = await this.authService.registerUser(
      email.trim().toLowerCase(),
      name.trim(),
      password,
    );
    const token = this.authService.signToken(user);
    response.cookie('session_token', token, sessionCookieOptions());

    return { id: user.id, email: user.email, name: user.name, picture: user.picture };
  }

  // Migração única pra contas antigas (sem senha). Pode ser removido
  // depois que todo mundo tiver migrado.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('set-initial-password')
  @HttpCode(200)
  async setInitialPassword(
    @Body('email') email: string,
    @Body('name') name: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!email?.trim() || !name?.trim() || !password) {
      throw new UnauthorizedException('Email, nome e senha são obrigatórios');
    }

    const user = await this.authService.setInitialPassword(
      email.trim().toLowerCase(),
      name.trim(),
      password,
    );
    const token = this.authService.signToken(user);
    response.cookie('session_token', token, sessionCookieOptions());

    return { id: user.id, email: user.email, name: user.name, picture: user.picture };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: User) {
    const dbUser = await this.authService.findUserByEmail(user.email);
    return {
      id: dbUser?.id,
      email: dbUser?.email,
      name: dbUser?.name,
      picture: dbUser?.picture,
    };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('session_token', {
      path: '/',
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
    return { ok: true };
  }
}
