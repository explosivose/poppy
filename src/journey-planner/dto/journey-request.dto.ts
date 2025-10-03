import { Type } from 'class-transformer';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';

export class LegDto {
  @IsNumber()
  startCoord: number;

  @IsNumber()
  startTime: number;

  @IsNumber()
  endCoord: number;

  @IsNumber()
  endTime: number;
}

export class JourneyRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LegDto)
  legs: LegDto[];
}
