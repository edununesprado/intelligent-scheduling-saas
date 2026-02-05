import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async listByTenantSlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tenant) throw new NotFoundException('Salão não encontrado');

    return this.prisma.service.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, durationMin: true, priceCents: true },
    });
  }
}
