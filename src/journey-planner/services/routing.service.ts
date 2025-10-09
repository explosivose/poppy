import { Injectable } from '@nestjs/common';
import { PoppyApiService } from './poppy-api.service';
import { LegDto } from '../dto/journey-request.dto';
import { RoutedLegDto, PathDto, VehicleUsageDto, CoordinateDto } from '../dto/journey-response.dto';
import { PoppyVehicle, PoppyGeozone } from '../interfaces/poppy-api.interface';

@Injectable()
export class RoutingService {
  constructor(private readonly poppyApiService: PoppyApiService) {}

  async routeLeg(
    leg: LegDto,
    updatedVehiclePositions: Map<string, CoordinateDto> = new Map(),
  ): Promise<RoutedLegDto> {
    // Fetch available vehicles and parking zones
    const [vehicles, parkingZones] = await Promise.all([
      this.poppyApiService.getVehicles(),
      this.poppyApiService.getParkingZones(),
    ]);

    // Apply updated positions to vehicles
    const updatedVehicles = vehicles.map((vehicle) => {
      const updatedPosition = updatedVehiclePositions.get(vehicle.uuid);
      if (updatedPosition) {
        return {
          ...vehicle,
          locationLongitude: updatedPosition.lng,
          locationLatitude: updatedPosition.lat,
        };
      }
      return vehicle;
    });

    // Find nearest vehicle to start location
    const nearestVehicle = this.findNearestVehicle(leg.startCoord, updatedVehicles);

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
        // Check if destination is inside the parking zone
        const isDestinationInZone = this.isPointInPolygon(
          leg.endCoord,
          nearestParking,
        );

        let parkingCoord: { lng: number; lat: number };

        if (isDestinationInZone) {
          // Drive directly to destination if it's inside the parking zone
          parkingCoord = leg.endCoord;
        } else {
          // Find the closest point on the edge of the parking zone to the destination
          parkingCoord = this.findClosestPointInZone(
            nearestParking,
            leg.endCoord,
          );
        }

        paths.push({
          mode: 'drive',
          coords: [vehicleCoord, parkingCoord],
          distance: this.calculateDistance(vehicleCoord, parkingCoord),
        });

        // Path 3: Walk to destination (only if parking point != destination)
        if (!isDestinationInZone) {
          paths.push({
            mode: 'walk',
            coords: [parkingCoord, leg.endCoord],
            distance: this.calculateDistance(parkingCoord, leg.endCoord),
          });
        }
      }
    }

    // Create vehicle usage info if a vehicle was used
    let vehicleUsage: VehicleUsageDto | undefined;
    if (nearestVehicle && nearestParking && paths.length >= 2) {
      const vehicleCoord = {
        lng: nearestVehicle.locationLongitude,
        lat: nearestVehicle.locationLatitude,
      };
      const parkingCoord = this.findClosestPointInZone(nearestParking, leg.endCoord);

      vehicleUsage = {
        vehicleId: nearestVehicle.uuid,
        pickupLocation: vehicleCoord,
        dropoffLocation: parkingCoord,
      };
    }

    return {
      startCoord: leg.startCoord,
      startTime: leg.startTime,
      endCoord: leg.endCoord,
      endTime: leg.endTime,
      paths,
      vehicleUsage,
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

    // Find the zone with the closest point to the destination
    let nearestZone: PoppyGeozone | null = null;
    let minDistance = Infinity;

    parkingOnly.forEach((zone) => {
      // Find the closest point in this zone to the destination
      let closestDistanceInZone = Infinity;

      zone.geom.geometry.coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          ring.forEach((coordArray) => {
            const point = { lng: coordArray[0], lat: coordArray[1] };
            const distance = this.calculateDistance(point, coord);

            if (distance < closestDistanceInZone) {
              closestDistanceInZone = distance;
            }
          });
        });
      });

      // If this zone has a closer point than any previous zone, select it
      if (closestDistanceInZone < minDistance) {
        minDistance = closestDistanceInZone;
        nearestZone = zone;
      }
    });

    return nearestZone;
  }

  private isPointInPolygon(
    point: { lng: number; lat: number },
    zone: PoppyGeozone,
  ): boolean {
    // Check if point is inside any polygon in the MultiPolygon
    for (const polygon of zone.geom.geometry.coordinates) {
      // Only check the outer ring (first ring) for containment
      const outerRing = polygon[0];
      if (this.pointInRing(point, outerRing)) {
        // Check if it's in any holes (inner rings)
        let inHole = false;
        for (let i = 1; i < polygon.length; i++) {
          if (this.pointInRing(point, polygon[i])) {
            inHole = true;
            break;
          }
        }
        if (!inHole) {
          return true;
        }
      }
    }
    return false;
  }

  private pointInRing(
    point: { lng: number; lat: number },
    ring: number[][],
  ): boolean {
    // Ray-casting algorithm
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];

      const intersect =
        yi > point.lat !== yj > point.lat &&
        point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }

  private findClosestPointInZone(
    zone: PoppyGeozone,
    targetCoord: { lng: number; lat: number },
  ): { lng: number; lat: number } {
    let closestPoint = { lng: 0, lat: 0 };
    let minDistance = Infinity;

    // Iterate through all polygons in the MultiPolygon
    zone.geom.geometry.coordinates.forEach((polygon) => {
      // Iterate through all rings in the polygon (first ring is outer boundary)
      polygon.forEach((ring) => {
        // Check each coordinate in the ring
        ring.forEach((coord) => {
          const point = { lng: coord[0], lat: coord[1] };
          const distance = this.calculateDistance(point, targetCoord);

          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = point;
          }
        });
      });
    });

    return closestPoint;
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
