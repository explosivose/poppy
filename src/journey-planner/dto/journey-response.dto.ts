export class CoordinateDto {
  lng: number;
  lat: number;
}

export class PathDto {
  mode: 'walk' | 'drive';
  coords: CoordinateDto[];
  distance: number;
}

export class RoutedLegDto {
  startCoord: CoordinateDto;
  startTime: number;
  endCoord: CoordinateDto;
  endTime: number;
  paths: PathDto[];
}

export class JourneyResponseDto {
  legs: RoutedLegDto[];
}
