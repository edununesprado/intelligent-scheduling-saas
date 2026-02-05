import { Module } from '@nestjs/common';
import { ServicesModule } from './services/services.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { AvailabilityModule } from './availability/availability.module';

@Module({
  imports: [ServicesModule, ProfessionalsModule, AvailabilityModule]
})
export class AdminModule {}
