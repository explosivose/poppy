import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JourneyPlannerModule } from './journey-planner/journey-planner.module';
import { MapModule } from './map/map.module';

@Module({
  imports: [JourneyPlannerModule, MapModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
