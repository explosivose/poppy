import { Controller, Get, Render } from '@nestjs/common';
import { PoppyApiService } from '../journey-planner/services/poppy-api.service';

@Controller('map')
export class MapController {
  constructor(private readonly poppyApiService: PoppyApiService) {}

  @Get()
  @Render('map')
  async getMap() {
    const [vehicles, parkingZones] = await Promise.all([
      this.poppyApiService.getVehicles(),
      this.poppyApiService.getParkingZones(),
    ]);

    return {
      title: 'Journey Planner',
      vehicles: JSON.stringify(vehicles),
      parkingZones: JSON.stringify(parkingZones),
    };
  }
}
