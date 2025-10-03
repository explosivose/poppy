export class PathDto {
  mode: 'walk' | 'drive';
  coords: number[];
  distance: number;
}

export class RoutedLegDto {
  startCoord: number;
  startTime: number;
  endCoord: number;
  endTime: number;
  paths: PathDto[];
}

export class JourneyResponseDto {
  legs: RoutedLegDto[];
}
