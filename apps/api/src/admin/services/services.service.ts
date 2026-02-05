import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  list(tenantId: string, active?: 'true' | 'false' | 'all') {
    let activeFilter: boolean | undefined = undefined;

    if (active && active !== 'all') {
      if (active === 'true') activeFilter = true;
      else if (active === 'false') activeFilter = false;
      else throw new BadRequestException('Query param active deve ser true, false ou all');
    }

    return this.prisma.service.findMany({
      where: {
        tenantId,
        ...(activeFilter === undefined ? {} : { active: activeFilter }),
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, durationMin: true, priceCents: true, active: true },
    });
  }

  async create(tenantId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        tenantId,
        name: dto.name,
        durationMin: dto.durationMin,
        priceCents: dto.priceCents,
        active: dto.active ?? true,
      },
      select: { id: true, name: true, durationMin: true, priceCents: true, active: true },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateServiceDto) {
    const existing = await this.prisma.service.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existing) throw new NotFoundException('Serviço não encontrado');

    return this.prisma.service.update({
      where: { id },
      data: {
        name: dto.name,
        durationMin: dto.durationMin,
        priceCents: dto.priceCents,
        active: dto.active,
      },
      select: { id: true, name: true, durationMin: true, priceCents: true, active: true },
    });
  }

    async remove(tenantId: string, id: string) {
        const existing = await this.prisma.service.findFirst({
            where: { id, tenantId },
            select: { id: true },
        });

        if (!existing) throw new NotFoundException('Serviço não encontrado');

        await this.prisma.service.update({
            where: { id },
            data: { active: false },
        });

        return { ok: true };
    }

}
