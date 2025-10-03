import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JourneyPlannerModule } from './journey-planner/journey-planner.module';

@Module({
  imports: [JourneyPlannerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
