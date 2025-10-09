import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { RoutedLegDto } from '../../journey-planner/dto/journey-response.dto';

export class PriceEstimationRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutedLegDto)
  legs: RoutedLegDto[];
}
