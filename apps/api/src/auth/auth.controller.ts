import { Body, Controller, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';

class LoginDto {
  @IsString() tenantSlug!: string;
  @IsString() email!: string;
  @IsString() password!: string;
}

/**
 * Autenticação (Admin) - Login
 *
 * Endpoint para o usuário admin do salão obter um JWT.
 *
 * Body esperado:
 * - email: string
 * - password: string
 *
 * Retorno:
 * - accessToken: JWT contendo (no payload) o tenantId do salão.
 *
 * Observação:
 * - Todas as rotas /admin exigem Authorization: Bearer <token>.
 * - O tenantId do token define o "escopo" (multi-tenant) e impede acesso a dados de outros salões.
*/
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.tenantSlug, dto.email, dto.password);
  }
}
