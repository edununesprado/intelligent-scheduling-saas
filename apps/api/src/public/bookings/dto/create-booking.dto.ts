import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  professionalId!: string;

  @IsString()
  serviceId!: string;

  @IsString()
  customerName!: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  // Ex: "2026-01-30T09:00:00.000-03:00"
  @IsISO8601()
  startAt!: string;
}
