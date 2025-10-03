import { Injectable } from '@nestjs/common';
import { PoppyApiService } from './poppy-api.service';
import { LegDto } from '../dto/journey-request.dto';
import { RoutedLegDto, PathDto } from '../dto/journey-response.dto';
import { PoppyVehicle, PoppyGeozone } from '../interfaces/poppy-api.interface';

@Injectable()
export class RoutingService {
  constructor(private readonly poppyApiService: PoppyApiService) {}

  async routeLeg(leg: LegDto): Promise<RoutedLegDto> {
    // Fetch available vehicles and parking zones
    const [vehicles, parkingZones] = await Promise.all([
      this.poppyApiService.getVehicles(),
      this.poppyApiService.getParkingZones(),
    ]);

    // Find nearest vehicle to start location
    const nearestVehicle = this.findNearestVehicle(leg.startCoord, vehicles);

    // Find nearest parking zone to destination
    const nearestParking = this.findNearestParking(leg.endCoord, parkingZones);

    // Create paths: walk to car, drive to parking, walk to destination
    const paths: PathDto[] = [];

    // Path 1: Walk to pickup car
    if (nearestVehicle) {
      paths.push({
        mode: 'walk',
        coords: [leg.startCoord, nearestVehicle.locationLatitude],
        distance: this.calculateDistance(
          leg.startCoord,
          nearestVehicle.locationLatitude,
        ),
      });

      // Path 2: Drive car to parking
      if (nearestParking) {
        const parkingLat = nearestParking.geom.geometry.coordinates[0][0][0][1];
        paths.push({
          mode: 'drive',
          coords: [nearestVehicle.locationLatitude, parkingLat],
          distance: this.calculateDistance(
            nearestVehicle.locationLatitude,
            parkingLat,
          ),
        });

        // Path 3: Walk to destination
        paths.push({
          mode: 'walk',
          coords: [parkingLat, leg.endCoord],
          distance: this.calculateDistance(parkingLat, leg.endCoord),
        });
      }
    }

    return {
      startCoord: leg.startCoord,
      startTime: leg.startTime,
      endCoord: leg.endCoord,
      endTime: leg.endTime,
      paths,
    };
  }

  private findNearestVehicle(
    coord: number,
    vehicles: PoppyVehicle[],
  ): PoppyVehicle | null {
    if (!vehicles || vehicles.length === 0) return null;

    return vehicles.reduce((nearest, vehicle) => {
      const distance = Math.abs(vehicle.locationLatitude - coord);
      const nearestDistance = Math.abs(nearest.locationLatitude - coord);
      return distance < nearestDistance ? vehicle : nearest;
    });
  }

  private findNearestParking(
    coord: number,
    parkingZones: PoppyGeozone[],
  ): PoppyGeozone | null {
    if (!parkingZones || parkingZones.length === 0) return null;

    const parkingOnly = parkingZones.filter(
      (zone) => zone.geofencingType === 'parking',
    );

    if (parkingOnly.length === 0) return null;

    return parkingOnly.reduce((nearest: PoppyGeozone | null, zone) => {
      if (!nearest) return zone;
      const distance = Math.abs(
        zone.geom.geometry.coordinates[0][0][0][1] - coord,
      );
      const nearestDistance = Math.abs(
        nearest.geom.geometry.coordinates[0][0][0][1] - coord,
      );
      return distance < nearestDistance ? zone : nearest;
    }, null);
  }

  private calculateDistance(coord1: number, coord2: number): number {
    // Simplified distance calculation - in production, use proper geospatial calculation
    return Math.abs(coord1 - coord2) * 111000; // rough conversion to meters
  }
}
