import { Module } from '@nestjs/common';
import { JourneyPlannerController } from './journey-planner.controller';
import { JourneyPlannerService } from './journey-planner.service';
import { RoutingService } from './services/routing.service';
import { PoppyApiService } from './services/poppy-api.service';

@Module({
  controllers: [JourneyPlannerController],
  providers: [JourneyPlannerService, RoutingService, PoppyApiService],
})
export class JourneyPlannerModule {}
