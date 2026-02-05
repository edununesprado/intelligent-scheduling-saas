import { IsOptional, IsString } from 'class-validator';

export class CreateProfessionalDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  active?: boolean;
}
