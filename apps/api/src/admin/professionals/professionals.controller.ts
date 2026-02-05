import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { ProfessionalsService } from './professionals.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/professionals')
export class ProfessionalsController {
  constructor(private professionals: ProfessionalsService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.professionals.list(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateProfessionalDto) {
    return this.professionals.create(user.tenantId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateProfessionalDto) {
    return this.professionals.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.professionals.remove(user.tenantId, id);
  }

  @Patch(':id/activate')
  activate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.professionals.update(user.tenantId, id, { active: true });
  }
}
