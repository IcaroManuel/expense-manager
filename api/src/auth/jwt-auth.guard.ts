import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Request } from 'express';
import { AuthService } from './auth.service';

interface RequestWithUser extends Request {
  user?: {
    email: string;
    sessionToken: string;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {

  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request) || this.extractTokenFromCookie(request);
    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }
    try {
      const decoded = this.jwtService.verify(token);
      request.user = { email: decoded.email, sessionToken: token };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    // Requer o pacote cookie-parser configurado no main.ts
    return request.cookies?.session_token;
  }
}
