import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsService } from './bookings.service';
import { Patch } from '@nestjs/common';

@Controller('public')
export class BookingsController {
    constructor(private readonly bookings: BookingsService) {}

    /**
     * Cria um novo agendamento público para um salão.
     *
     * @param slug Identificador único do salão (ex: salao-bela-arte)
     * @param body Dados do agendamento (profissional, serviço, cliente, horário)
     *
     * Regras:
     * - Horário deve estar disponível
     * - Considera bloqueios e agendamentos existentes
     * - Retorna datas no fuso America/Sao_Paulo
    */
    @Post('tenants/:slug/bookings')
    create(@Param('slug') slug: string, @Body() dto: CreateBookingDto) {
        if (!slug) throw new BadRequestException('slug obrigatório');
        return this.bookings.create(slug, dto);
    }

    @Get('tenants/:slug/professionals/:professionalId/bookings')
    listDay(
        @Param('slug') slug: string,
        @Param('professionalId') professionalId: string,
        @Query('date') date?: string,
    ) {
        if (!date) throw new BadRequestException('Query param date é obrigatório (YYYY-MM-DD)');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new BadRequestException('date inválido. Use YYYY-MM-DD');
        }
        return this.bookings.listByProfessionalAndDate(slug, professionalId, date);
    }

    @Patch('tenants/:slug/bookings/:bookingId/cancel')
    cancel(@Param('slug') slug: string, @Param('bookingId') bookingId: string) {
        return this.bookings.cancel(slug, bookingId);
    }

    @Patch('tenants/:slug/bookings/:bookingId/confirm')
    confirm(@Param('slug') slug: string, @Param('bookingId') bookingId: string) {
        return this.bookings.confirm(slug, bookingId);
    }
}
