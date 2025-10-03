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
      const vehicleCoord = {
        lng: nearestVehicle.locationLongitude,
        lat: nearestVehicle.locationLatitude,
      };

      paths.push({
        mode: 'walk',
        coords: [leg.startCoord, vehicleCoord],
        distance: this.calculateDistance(leg.startCoord, vehicleCoord),
      });

      // Path 2: Drive car to parking
      if (nearestParking) {
        const parkingLng = nearestParking.geom.geometry.coordinates[0][0][0][0];
        const parkingLat = nearestParking.geom.geometry.coordinates[0][0][0][1];
        const parkingCoord = { lng: parkingLng, lat: parkingLat };

        paths.push({
          mode: 'drive',
          coords: [vehicleCoord, parkingCoord],
          distance: this.calculateDistance(vehicleCoord, parkingCoord),
        });

        // Path 3: Walk to destination
        paths.push({
          mode: 'walk',
          coords: [parkingCoord, leg.endCoord],
          distance: this.calculateDistance(parkingCoord, leg.endCoord),
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
    coord: { lng: number; lat: number },
    vehicles: PoppyVehicle[],
  ): PoppyVehicle | null {
    if (!vehicles || vehicles.length === 0) return null;

    return vehicles.reduce((nearest, vehicle) => {
      const distance = this.calculateDistance(coord, {
        lng: vehicle.locationLongitude,
        lat: vehicle.locationLatitude,
      });
      const nearestDistance = this.calculateDistance(coord, {
        lng: nearest.locationLongitude,
        lat: nearest.locationLatitude,
      });
      return distance < nearestDistance ? vehicle : nearest;
    });
  }

  private findNearestParking(
    coord: { lng: number; lat: number },
    parkingZones: PoppyGeozone[],
  ): PoppyGeozone | null {
    if (!parkingZones || parkingZones.length === 0) return null;

    const parkingOnly = parkingZones.filter(
      (zone) => zone.geofencingType === 'parking',
    );

    if (parkingOnly.length === 0) return null;

    return parkingOnly.reduce((nearest: PoppyGeozone | null, zone) => {
      if (!nearest) return zone;
      const zoneLng = zone.geom.geometry.coordinates[0][0][0][0];
      const zoneLat = zone.geom.geometry.coordinates[0][0][0][1];
      const nearestLng = nearest.geom.geometry.coordinates[0][0][0][0];
      const nearestLat = nearest.geom.geometry.coordinates[0][0][0][1];

      const distance = this.calculateDistance(coord, {
        lng: zoneLng,
        lat: zoneLat,
      });
      const nearestDistance = this.calculateDistance(coord, {
        lng: nearestLng,
        lat: nearestLat,
      });
      return distance < nearestDistance ? zone : nearest;
    }, null);
  }

  private calculateDistance(
    coord1: { lng: number; lat: number },
    coord2: { lng: number; lat: number },
  ): number {
    // Haversine formula for distance between two lat/lng points
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.lat * Math.PI) / 180;
    const φ2 = (coord2.lat * Math.PI) / 180;
    const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}
