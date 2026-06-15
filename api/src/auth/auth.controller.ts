import { Controller, Post, Get, Body, Req, Res, UseGuards, UnauthorizedException, ForbiddenException, HttpCode } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('session')
  @HttpCode(200)
  async createSession(@Body('session_id') sessionId: string, @Res({ passthrough: true }) response: Response) {
    if (!sessionId) {
      throw new UnauthorizedException('Invalid session payload');
    }

    const data = await this.authService.exchangeSessionId(sessionId);
    const email = (data.email || '').toLowerCase();
    const name = data.name || '';
    const picture = data.picture;
    const sessionToken = data.session_token;

    if (!email || !sessionToken) {
      throw new UnauthorizedException('Invalid session payload');
    }

    if (!this.authService.isEmailAllowed(email)) {
      throw new ForbiddenException('Acesso negado. Este e-mail não está autorizado a usar o aplicativo.');
    }

    const user = await this.authService.upsertUser(email, name, picture);

    response.cookie('session_token', sessionToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    // Busca os dados fresquinhos do banco
    const dbUser = await this.authService.findUserByEmail(user.email);
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      picture: dbUser.picture,
    };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('session_token', { path: '/' });
    return { ok: true };
  }
}
