import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export async function getTenantIdFromHeader(
  prisma: PrismaService,
  headers: Record<string, any>,
) {
  const slug = headers['x-tenant-slug'] as string | undefined;

  if (!slug) {
    throw new BadRequestException('Header x-tenant-slug é obrigatório');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!tenant) {
    throw new BadRequestException('Tenant inválido para x-tenant-slug');
  }

  return tenant.id;
}
