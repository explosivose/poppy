import { Test, TestingModule } from '@nestjs/testing';
import { JourneyPlannerController } from './journey-planner.controller';
import { JourneyPlannerService } from './journey-planner.service';
import { JourneyRequestDto } from './dto/journey-request.dto';
import { JourneyResponseDto } from './dto/journey-response.dto';

describe('JourneyPlannerController', () => {
  let controller: JourneyPlannerController;
  let service: JourneyPlannerService;

  const mockJourneyPlannerService = {
    planJourney: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JourneyPlannerController],
      providers: [
        {
          provide: JourneyPlannerService,
          useValue: mockJourneyPlannerService,
        },
      ],
    }).compile();

    controller = module.get<JourneyPlannerController>(JourneyPlannerController);
    service = module.get<JourneyPlannerService>(JourneyPlannerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('planJourney', () => {
    it('should return a routed journey', async () => {
      const journeyRequest: JourneyRequestDto = {
        legs: [
          {
            startCoord: 50.8503,
            startTime: 1234567890,
            endCoord: 50.8403,
            endTime: 1234567990,
          },
        ],
      };

      const expectedResponse: JourneyResponseDto = {
        legs: [
          {
            startCoord: 50.8503,
            startTime: 1234567890,
            endCoord: 50.8403,
            endTime: 1234567990,
            paths: [
              {
                mode: 'walk',
                coords: [50.8503, 50.8510],
                distance: 77.7,
              },
              {
                mode: 'drive',
                coords: [50.8510, 50.8405],
                distance: 1165.5,
              },
              {
                mode: 'walk',
                coords: [50.8405, 50.8403],
                distance: 22.2,
              },
            ],
          },
        ],
      };

      mockJourneyPlannerService.planJourney.mockResolvedValue(expectedResponse);

      const result = await controller.planJourney(journeyRequest);

      expect(result).toEqual(expectedResponse);
      expect(service.planJourney).toHaveBeenCalledWith(journeyRequest);
    });

    it('should handle multiple legs', async () => {
      const journeyRequest: JourneyRequestDto = {
        legs: [
          {
            startCoord: 50.8503,
            startTime: 1234567890,
            endCoord: 50.8403,
            endTime: 1234567990,
          },
          {
            startCoord: 50.8403,
            startTime: 1234568000,
            endCoord: 50.8303,
            endTime: 1234568100,
          },
        ],
      };

      const expectedResponse: JourneyResponseDto = {
        legs: [
          {
            startCoord: 50.8503,
            startTime: 1234567890,
            endCoord: 50.8403,
            endTime: 1234567990,
            paths: [
              {
                mode: 'walk',
                coords: [50.8503, 50.8510],
                distance: 77.7,
              },
              {
                mode: 'drive',
                coords: [50.8510, 50.8405],
                distance: 1165.5,
              },
              {
                mode: 'walk',
                coords: [50.8405, 50.8403],
                distance: 22.2,
              },
            ],
          },
          {
            startCoord: 50.8403,
            startTime: 1234568000,
            endCoord: 50.8303,
            endTime: 1234568100,
            paths: [
              {
                mode: 'walk',
                coords: [50.8403, 50.8410],
                distance: 77.7,
              },
              {
                mode: 'drive',
                coords: [50.8410, 50.8305],
                distance: 1165.5,
              },
              {
                mode: 'walk',
                coords: [50.8305, 50.8303],
                distance: 22.2,
              },
            ],
          },
        ],
      };

      mockJourneyPlannerService.planJourney.mockResolvedValue(expectedResponse);

      const result = await controller.planJourney(journeyRequest);

      expect(result).toEqual(expectedResponse);
      expect(result.legs).toHaveLength(2);
      expect(service.planJourney).toHaveBeenCalledWith(journeyRequest);
    });
  });
});
