import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

const TZ = 'America/Sao_Paulo';

@Injectable()
export class BookingsService {

    private toBR<T extends { startAt: Date; endAt: Date }>(b: T) {
        const startBR = DateTime.fromJSDate(b.startAt).setZone(TZ);
        const endBR = DateTime.fromJSDate(b.endAt).setZone(TZ);

        return {
            ...b,
            startAt: startBR.toISO(),
            endAt: endBR.toISO(),
            labelStart: startBR.toFormat('HH:mm'),
            labelEnd: endBR.toFormat('HH:mm'),
        };
    }
    constructor(private prisma: PrismaService) {}

    async create(slug: string, dto: CreateBookingDto) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!tenant) throw new NotFoundException('Salão não encontrado');

        const professional = await this.prisma.professional.findFirst({
            where: { id: dto.professionalId, tenantId: tenant.id, active: true },
            select: { id: true },
        });
        if (!professional) throw new NotFoundException('Profissional não encontrado');

        const service = await this.prisma.service.findFirst({
            where: { id: dto.serviceId, tenantId: tenant.id, active: true },
            select: { id: true, durationMin: true },
        });
        if (!service) throw new NotFoundException('Serviço não encontrado');

        // Parse startAt (mantendo offset que vier) e converte para TZ
        const start = DateTime.fromISO(dto.startAt, { setZone: true }).setZone(TZ);
        if (!start.isValid) throw new BadRequestException('startAt inválido');

        const end = start.plus({ minutes: service.durationMin });

        // Validar que está dentro de alguma regra ativa do dia
        const dayOfWeek = start.weekday % 7; // luxon 1..7 => 0..6 (domingo=0)
        const startMin = start.hour * 60 + start.minute;
        const endMin = end.hour * 60 + end.minute;

        const rules = await this.prisma.availabilityRule.findMany({
            where: {
                tenantId: tenant.id,
                professionalId: dto.professionalId,
                dayOfWeek,
                active: true,
            },
            select: { startMin: true, endMin: true },
        });

        const fitsRule = rules.some((r) => startMin >= r.startMin && endMin <= r.endMin);
        if (!fitsRule) {
            throw new BadRequestException('Horário fora da disponibilidade do profissional');
        }

        // Conflitos: timeOff e booking (mesmo dia, overlap)
        const startJS = start.toJSDate();
        const endJS = end.toJSDate();

        const hasTimeOff = await this.prisma.timeOff.findFirst({
            where: {
                tenantId: tenant.id,
                professionalId: dto.professionalId,
                startAt: { lt: endJS },
                endAt: { gt: startJS },
            },
            select: { id: true },
        });
        if (hasTimeOff) {
            throw new BadRequestException('Horário indisponível (bloqueio do profissional)');
        }

        const hasBooking = await this.prisma.booking.findFirst({
            where: {
                tenantId: tenant.id,
                professionalId: dto.professionalId,
                startAt: { lt: endJS },
                endAt: { gt: startJS },
                status: 'CONFIRMED',
            },
            select: { id: true },
        });
        if (hasBooking) {
            throw new BadRequestException('Horário já reservado');
        }

        // Criar booking
        const booking = await this.prisma.booking.create({
            data: {
                tenantId: tenant.id,
                professionalId: dto.professionalId,
                serviceId: dto.serviceId,
                customerName: dto.customerName,
                customerPhone: dto.customerPhone,
                startAt: startJS,
                endAt: endJS,
                status: 'CONFIRMED',
            },
            select: {
                id: true,
                professionalId: true,
                serviceId: true,
                customerName: true,
                customerPhone: true,
                startAt: true,
                endAt: true,
                status: true,
            },
        });

        return this.toBR(booking);
    }

    async listByProfessionalAndDate(slug: string, professionalId: string, date: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!tenant) throw new NotFoundException('Salão não encontrado');

        const professional = await this.prisma.professional.findFirst({
            where: { id: professionalId, tenantId: tenant.id },
            select: { id: true },
        });
        if (!professional) throw new NotFoundException('Profissional não encontrado');

        // date = "YYYY-MM-DD" no fuso BR
        const day = DateTime.fromISO(date, { zone: TZ }).startOf('day');
        if (!day.isValid) throw new BadRequestException('date inválido. Use YYYY-MM-DD');

        const startDay = day.toJSDate();
        const endDay = day.endOf('day').toJSDate();

        const rows = await this.prisma.booking.findMany({
            where: {
                tenantId: tenant.id,
                professionalId,
                startAt: { gte: startDay, lte: endDay },
                // se quiser mostrar apenas confirmados, descomente:
                // status: 'CONFIRMED',
            },
            orderBy: { startAt: 'asc' },
            select: {
                id: true,
                startAt: true,
                endAt: true,
                status: true,
                customerName: true,
                customerPhone: true,
                service: {
                    select: {
                    id: true,
                    name: true,
                    durationMin: true,
                    priceCents: true,
                    },
                },
            },
        });

        return rows.map((b) => this.toBR(b));
    }

    async cancel(slug: string, bookingId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!tenant) throw new NotFoundException('Salão não encontrado');

        const existing = await this.prisma.booking.findFirst({
            where: { id: bookingId, tenantId: tenant.id },
            select: { id: true, status: true },
        });
        if (!existing) throw new NotFoundException('Agendamento não encontrado');

        if (existing.status === 'CANCELED') {
            const current = await this.prisma.booking.findFirst({
                where: { id: bookingId },
                select: {
                    id: true,
                    status: true,
                    startAt: true,
                    endAt: true,
                    customerName: true,
                    serviceId: true,
                    professionalId: true,
                },
            });

            // só para o TS (e por segurança)
            if (!current) throw new NotFoundException('Agendamento não encontrado');
            
            return this.toBR(current);
        }

        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELED' },
            select: {
                id: true,
                status: true,
                startAt: true,
                endAt: true,
                customerName: true,
                serviceId: true,
                professionalId: true,
            },
        });

        return this.toBR(updated);
    }

    async confirm(slug: string, bookingId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!tenant) throw new NotFoundException('Salão não encontrado');

        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, tenantId: tenant.id },
            select: { id: true, startAt: true, endAt: true, professionalId: true },
        });
        if (!booking) throw new NotFoundException('Agendamento não encontrado');

        // Checar conflito antes de reativar
        const conflict = await this.prisma.booking.findFirst({
            where: {
                tenantId: tenant.id,
                professionalId: booking.professionalId,
                status: 'CONFIRMED',
                startAt: { lt: booking.endAt },
                endAt: { gt: booking.startAt },
                NOT: { id: booking.id },
            },
            select: { id: true },
        });

        if (conflict) {
            throw new BadRequestException('Não é possível reativar: horário já ocupado');
        }

        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CONFIRMED' },
            select: {
                id: true,
                status: true,
                startAt: true,
                endAt: true,
                customerName: true,
                serviceId: true,
                professionalId: true,
            },
        });

        return this.toBR(updated);
    }
}
