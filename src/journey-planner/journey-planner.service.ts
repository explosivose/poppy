import { Injectable } from '@nestjs/common';
import { RoutingService } from './services/routing.service';
import { JourneyRequestDto } from './dto/journey-request.dto';
import { JourneyResponseDto, CoordinateDto, RoutedLegDto } from './dto/journey-response.dto';

@Injectable()
export class JourneyPlannerService {
  constructor(private readonly routingService: RoutingService) {}

  async planJourney(
    journeyRequest: JourneyRequestDto,
  ): Promise<JourneyResponseDto> {
    const routedLegs: RoutedLegDto[] = [];
    const updatedVehiclePositions = new Map<string, CoordinateDto>();

    // Process legs sequentially to track vehicle movements
    for (const leg of journeyRequest.legs) {
      const routedLeg = await this.routingService.routeLeg(leg, updatedVehiclePositions);
      routedLegs.push(routedLeg);

      // Update vehicle position if one was used
      if (routedLeg.vehicleUsage) {
        updatedVehiclePositions.set(
          routedLeg.vehicleUsage.vehicleId,
          routedLeg.vehicleUsage.dropoffLocation,
        );
      }
    }

    // Convert Map to array for response
    const updatedPositions = Array.from(updatedVehiclePositions.entries()).map(
      ([vehicleId, location]) => ({ vehicleId, location }),
    );

    return {
      legs: routedLegs,
      updatedVehiclePositions: updatedPositions,
    };
  }
}
