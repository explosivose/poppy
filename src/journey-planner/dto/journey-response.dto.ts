export class CoordinateDto {
  lng: number;
  lat: number;
}

export class PathDto {
  mode: 'walk' | 'drive';
  coords: CoordinateDto[];
  distance: number;
}

export class VehicleUsageDto {
  vehicleId: string;
  pickupLocation: CoordinateDto;
  dropoffLocation: CoordinateDto;
}

export class RoutedLegDto {
  startCoord: CoordinateDto;
  startTime: number;
  endCoord: CoordinateDto;
  endTime: number;
  paths: PathDto[];
  vehicleUsage?: VehicleUsageDto;
}

export class JourneyResponseDto {
  legs: RoutedLegDto[];
  updatedVehiclePositions: { vehicleId: string; location: CoordinateDto }[];
}
