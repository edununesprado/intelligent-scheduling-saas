import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { CreateTimeOffDto } from './dto/create-timeoff.dto';

@UseGuards(JwtAuthGuard)
@Controller('admin/professionals/:professionalId')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Get('availability-rules')
  listRules(@CurrentUser() user: any, @Param('professionalId') professionalId: string) {
    return this.availability.listRules(user.tenantId, professionalId);
  }

  @Post('availability-rules')
  createRule(
    @CurrentUser() user: any,
    @Param('professionalId') professionalId: string,
    @Body() dto: CreateAvailabilityRuleDto,
  ) {
    return this.availability.createRule(user.tenantId, professionalId, dto);
  }

  @Get('time-offs')
  listTimeOffs(@CurrentUser() user: any, @Param('professionalId') professionalId: string) {
    return this.availability.listTimeOffs(user.tenantId, professionalId);
  }

  @Post('time-offs')
  createTimeOff(
    @CurrentUser() user: any,
    @Param('professionalId') professionalId: string,
    @Body() dto: CreateTimeOffDto,
  ) {
    return this.availability.createTimeOff(user.tenantId, professionalId, dto);
  }
}
