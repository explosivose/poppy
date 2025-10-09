import { Type } from 'class-transformer';
import { IsArray, IsNumber, ValidateNested, ArrayMinSize } from 'class-validator';

export class CoordinateDto {
  @IsNumber()
  lng: number;

  @IsNumber()
  lat: number;
}

export class LegDto {
  @ValidateNested()
  @Type(() => CoordinateDto)
  startCoord: CoordinateDto;

  @IsNumber()
  startTime: number;

  @ValidateNested()
  @Type(() => CoordinateDto)
  endCoord: CoordinateDto;

  @IsNumber()
  endTime: number;
}

export class JourneyRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LegDto)
  legs: LegDto[];
}
