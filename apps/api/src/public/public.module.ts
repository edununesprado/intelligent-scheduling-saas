import { Module } from '@nestjs/common';
import { TenantsController } from './tenants/tenants.controller';
import { TenantsService } from './tenants/tenants.service';
import { ServicesController } from './services/services.controller';
import { ServicesService } from './services/services.service';
import { SlotsController } from './slots/slots.controller';
import { SlotsService } from './slots/slots.service';
import { BookingsController } from './bookings/bookings.controller';
import { BookingsService } from './bookings/bookings.service';

@Module({
  controllers: [
    TenantsController, 
    ServicesController,
    SlotsController,
    BookingsController,
  ],
  providers: [
    TenantsService, 
    ServicesService,
    SlotsService,
    BookingsService,
  ],
})
export class PublicModule {}
