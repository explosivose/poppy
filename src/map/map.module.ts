import { Module } from '@nestjs/common';
import { MapController } from './map.controller';
import { PoppyApiService } from '../journey-planner/services/poppy-api.service';

@Module({
  controllers: [MapController],
  providers: [PoppyApiService],
})
export class MapModule {}
