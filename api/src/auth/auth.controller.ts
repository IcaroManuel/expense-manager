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
    secure: isProd, // true em produção (cookie só viaja em HTTPS)
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax', // 'none' pq front e back são domínios diferentes
    path: '/',
  };
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body('email') email: string,
    @Body('name') name: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!email?.trim() || !name?.trim()) {
      throw new UnauthorizedException('Email e nome são obrigatórios');
    }

    const user = await this.authService.loginByEmailAndName(
      email.trim().toLowerCase(),
      name.trim(),
    );

    const token = this.authService.signToken(user);

    response.cookie('session_token', token, sessionCookieOptions());

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
  }

  @Post('register')
  @HttpCode(201)
  async register(
    @Body('email') email: string,
    @Body('name') name: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!email?.trim() || !name?.trim()) {
      throw new UnauthorizedException('Email e nome são obrigatórios');
    }

    const user = await this.authService.registerUser(
      email.trim().toLowerCase(),
      name.trim(),
    );

    const token = this.authService.signToken(user);

    response.cookie('session_token', token,sessionCookieOptions());

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
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
