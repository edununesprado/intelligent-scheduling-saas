import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(tenantSlug: string, email: string, password: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, name: true },
    });
    if (!tenant) throw new BadRequestException('Tenant inválido');

    const user = await this.prisma.adminUser.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      select: { id: true, email: true, passwordHash: true, active: true, name: true, tenantId: true },
    });

    if (!user || !user.active) throw new UnauthorizedException('Credenciais inválidas');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');

    const payload = {
      sub: user.id,
      tenantId: tenant.id,
      email: user.email,
      name: user.name ?? null,
      tenantSlug: tenant.slug,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
    };
  }
}
