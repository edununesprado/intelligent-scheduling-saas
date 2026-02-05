import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { CreateTimeOffDto } from './dto/create-timeoff.dto';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  private async assertProfessional(tenantId: string, professionalId: string) {
    const p = await this.prisma.professional.findFirst({
      where: { id: professionalId, tenantId },
      select: { id: true },
    });
    if (!p) throw new NotFoundException('Profissional não encontrado');
  }

  async listRules(tenantId: string, professionalId: string) {
    await this.assertProfessional(tenantId, professionalId);

    return this.prisma.availabilityRule.findMany({
      where: { tenantId, professionalId },
      orderBy: [{ dayOfWeek: 'asc' }, { startMin: 'asc' }],
      select: { id: true, dayOfWeek: true, startMin: true, endMin: true, intervalMin: true, active: true },
    });
  }

  async createRule(tenantId: string, professionalId: string, dto: CreateAvailabilityRuleDto) {
    await this.assertProfessional(tenantId, professionalId);

    if (dto.endMin <= dto.startMin) {
      throw new BadRequestException('endMin deve ser maior que startMin');
    }

    return this.prisma.availabilityRule.create({
      data: {
        tenantId,
        professionalId,
        dayOfWeek: dto.dayOfWeek,
        startMin: dto.startMin,
        endMin: dto.endMin,
        intervalMin: dto.intervalMin ?? 30,
        active: dto.active ?? true,
      },
      select: { id: true, dayOfWeek: true, startMin: true, endMin: true, intervalMin: true, active: true },
    });
  }

  async listTimeOffs(tenantId: string, professionalId: string) {
    await this.assertProfessional(tenantId, professionalId);

    return this.prisma.timeOff.findMany({
      where: { tenantId, professionalId },
      orderBy: { startAt: 'desc' },
      select: { id: true, startAt: true, endAt: true, reason: true },
    });
  }

  async createTimeOff(tenantId: string, professionalId: string, dto: CreateTimeOffDto) {
    await this.assertProfessional(tenantId, professionalId);

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Datas inválidas');
    }
    if (endAt <= startAt) {
      throw new BadRequestException('endAt deve ser maior que startAt');
    }

    return this.prisma.timeOff.create({
      data: { tenantId, professionalId, startAt, endAt, reason: dto.reason },
      select: { id: true, startAt: true, endAt: true, reason: true },
    });
  }
}
