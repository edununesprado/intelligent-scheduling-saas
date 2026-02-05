import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { SlotsService } from './slots.service';

@Controller('public')
export class SlotsController {
  constructor(private readonly slots: SlotsService) {}

  @Get('tenants/:slug/professionals/:professionalId/slots')
  list(
    @Param('slug') slug: string,
    @Param('professionalId') professionalId: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    if (!serviceId) throw new BadRequestException('Query param serviceId é obrigatório');
    if (!date) throw new BadRequestException('Query param date é obrigatório (YYYY-MM-DD)');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date inválido. Use YYYY-MM-DD');
    }
    
    return this.slots.listSlots(slug, professionalId, serviceId, date);
  }
}
