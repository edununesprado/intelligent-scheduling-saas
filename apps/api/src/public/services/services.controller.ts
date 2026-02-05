import { Controller, Get, Param } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('public')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('tenants/:slug/services')
  list(@Param('slug') slug: string) {
    return this.servicesService.listByTenantSlug(slug);
  }
}
