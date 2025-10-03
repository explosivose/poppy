import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PoppyVehicle, PoppyGeozone } from '../interfaces/poppy-api.interface';

@Injectable()
export class PoppyApiService {
  private readonly vehiclesUrl =
    'https://poppy.red/api/v3/cities/a88ea9d0-3d5e-4002-8bbf-775313a5973c/vehicles';
  private readonly geozonesUrl =
    'https://poppy.red/api/v3/geozones/62c4bd62-881c-473e-8a6b-fbedfd276739';

  async getVehicles(): Promise<PoppyVehicle[]> {
    const response = await axios.get(this.vehiclesUrl);
    return response.data;
  }

  async getParkingZones(): Promise<PoppyGeozone[]> {
    const response = await axios.get(this.geozonesUrl);
    return response.data;
  }
}
