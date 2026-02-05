import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DateTime } from 'luxon';

const TZ = 'America/Sao_Paulo';

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  async listSlots(slug: string, professionalId: string, serviceId: string, date: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!tenant) throw new NotFoundException('Salão não encontrado');

    const professional = await this.prisma.professional.findFirst({
      where: { id: professionalId, tenantId: tenant.id, active: true },
      select: { id: true },
    });
    if (!professional) throw new NotFoundException('Profissional não encontrado');

    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: tenant.id, active: true },
      select: { durationMin: true },
    });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    // Dia no fuso BR
    const day = DateTime.fromISO(date, { zone: TZ }).startOf('day');
    const dayOfWeek = day.weekday % 7; // luxon: 1..7 (seg..dom). Ajuste para 0..6 (dom..sab)
    // weekday 7 (domingo) vira 0, weekday 1 (segunda) vira 1...
    // 7 % 7 = 0

    // 1) regras do dia
    const rules = await this.prisma.availabilityRule.findMany({
        where: {
            tenantId: tenant.id,
            professionalId,
            dayOfWeek,
            active: true,
        },
        select: { 
            startMin: true, 
            endMin: true, 
            intervalMin: true 
        },
    });
    if (!rules.length) return [];

    // 2) bloqueios e agendamentos
    const startDay = day.toJSDate();
    const endDay = day.endOf('day').toJSDate();

    const timeOffs = await this.prisma.timeOff.findMany({
      where: {
        tenantId: tenant.id,
        professionalId,
        startAt: { lte: endDay },
        endAt: { gte: startDay },
      },
      select: { startAt: true, endAt: true },
    });

    const bookings = await this.prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
        professionalId,
        status: 'CONFIRMED',
        startAt: { lte: endDay },
        endAt: { gte: startDay },
      },
      select: { startAt: true, endAt: true },
    });

    // 3) gerar slots
    const slots: Array<{ startAt: string; label: string }> = [];

    for (const rule of rules) {
        let current = rule.startMin;

        while (current + service.durationMin <= rule.endMin) {
            const startAt = day.plus({ minutes: current });
            const endAt = startAt.plus({ minutes: service.durationMin });

            const startJS = startAt.toJSDate();
            const endJS = endAt.toJSDate();

            const conflictTimeOff = timeOffs.some((t) => startJS < t.endAt && endJS > t.startAt);
            if (conflictTimeOff) {
                current += rule.intervalMin;
                continue;
            }

            const conflictBooking = bookings.some((b) => startJS < b.endAt && endJS > b.startAt);
            if (conflictBooking) {
                current += rule.intervalMin;
                continue;
            }

            slots.push({
                startAt: startAt.toISO()!,   // ISO com timezone correto
                label: startAt.toFormat('HH:mm'), // "09:00"
            });

            current += rule.intervalMin;
        }
    }

    return slots;
  }
}
