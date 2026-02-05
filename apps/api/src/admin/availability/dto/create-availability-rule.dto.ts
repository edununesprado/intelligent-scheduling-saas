import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateAvailabilityRuleDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsInt()
  @Min(0)
  @Max(1439)
  startMin!: number;

  @IsInt()
  @Min(1)
  @Max(1440)
  endMin!: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  intervalMin?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
