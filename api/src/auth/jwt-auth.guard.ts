import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request) || this.extractTokenFromCookie(request);

    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    // NOTA: Em uma implementação completa com NestJS, você decodificaria o JWT aqui.
    // Por enquanto, vamos permitir a requisição e salvar o token (simulando a sessão).
    request['user'] = { sessionToken: token };
    return true;
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
