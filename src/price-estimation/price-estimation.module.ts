import { Module } from '@nestjs/common';
import { PriceEstimationController } from './price-estimation.controller';
import { PriceEstimationService } from './price-estimation.service';
import { PoppyApiService } from '../journey-planner/services/poppy-api.service';

@Module({
  controllers: [PriceEstimationController],
  providers: [PriceEstimationService, PoppyApiService],
})
export class PriceEstimationModule {}
