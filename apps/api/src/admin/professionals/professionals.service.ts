import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.professional.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, phone: true, active: true },
    });
  }

  create(tenantId: string, dto: CreateProfessionalDto) {
    return this.prisma.professional.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        active: dto.active ?? true,
      },
      select: { id: true, name: true, email: true, phone: true, active: true },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProfessionalDto) {
    const existing = await this.prisma.professional.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Profissional não encontrado');

    return this.prisma.professional.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        active: dto.active,
      },
      select: { id: true, name: true, email: true, phone: true, active: true },
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.professional.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Profissional não encontrado');

    await this.prisma.professional.update({
      where: { id },
      data: { active: false },
    });

    return { ok: true };
  }
}
