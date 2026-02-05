import { Controller, Get, Param } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('public')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('tenants/:slug')
  getTenant(@Param('slug') slug: string) {
    return this.tenantsService.getTenantBySlug(slug);
  }
}
