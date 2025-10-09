import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { PriceEstimationService } from './price-estimation.service';
import { PriceEstimationRequestDto } from './dto/price-estimation-request.dto';
import { PriceEstimationResponseDto } from './dto/price-estimation-response.dto';

@Controller('price-estimation')
export class PriceEstimationController {
  constructor(private readonly priceEstimationService: PriceEstimationService) {}

  @Post('estimate')
  async estimatePrice(
    @Body(new ValidationPipe({ transform: true }))
    request: PriceEstimationRequestDto,
  ): Promise<PriceEstimationResponseDto> {
    return this.priceEstimationService.estimatePrice(request.legs);
  }
}
