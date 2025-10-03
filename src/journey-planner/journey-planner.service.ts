import { Injectable } from '@nestjs/common';
import { RoutingService } from './services/routing.service';
import { JourneyRequestDto } from './dto/journey-request.dto';
import { JourneyResponseDto } from './dto/journey-response.dto';

@Injectable()
export class JourneyPlannerService {
  constructor(private readonly routingService: RoutingService) {}

  async planJourney(
    journeyRequest: JourneyRequestDto,
  ): Promise<JourneyResponseDto> {
    const routedLegs = await Promise.all(
      journeyRequest.legs.map((leg) => this.routingService.routeLeg(leg)),
    );

    return {
      legs: routedLegs,
    };
  }
}
