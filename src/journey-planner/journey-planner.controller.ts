import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { JourneyPlannerService } from './journey-planner.service';
import { JourneyRequestDto } from './dto/journey-request.dto';
import { JourneyResponseDto } from './dto/journey-response.dto';

@Controller('journey-planner')
export class JourneyPlannerController {
  constructor(private readonly journeyPlannerService: JourneyPlannerService) {}

  @Post('plan')
  async planJourney(
    @Body(new ValidationPipe({ transform: true }))
    journeyRequest: JourneyRequestDto,
  ): Promise<JourneyResponseDto> {
    return this.journeyPlannerService.planJourney(journeyRequest);
  }
}
