import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/services')
export class ServicesController {
  constructor(private services: ServicesService) {}

  @Get()
  list(@CurrentUser() user: any, @Query('active') active?: 'true' | 'false' | 'all') {
    return this.services.list(user.tenantId, active);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateServiceDto) {
    return this.services.create(user.tenantId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.services.remove(user.tenantId, id);
  }

  @Patch(':id/activate')
  activate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.services.update(user.tenantId, id, { active: true });
  }
}
