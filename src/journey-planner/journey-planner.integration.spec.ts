import { Test, TestingModule } from '@nestjs/testing';
import { JourneyPlannerController } from './journey-planner.controller';
import { JourneyPlannerService } from './journey-planner.service';
import { RoutingService } from './services/routing.service';
import { PoppyApiService } from './services/poppy-api.service';
import { JourneyRequestDto } from './dto/journey-request.dto';
import { PoppyVehicle, PoppyGeozone } from './interfaces/poppy-api.interface';

describe('JourneyPlanner Integration Tests', () => {
  let controller: JourneyPlannerController;
  let poppyApiService: PoppyApiService;

  const mockVehicles: PoppyVehicle[] = [
    {
      id: 'vehicle-1',
      location: { latitude: 50.8510, longitude: 4.3510 },
      availability: 'available',
      model: 'Tesla Model 3',
    },
    {
      id: 'vehicle-2',
      location: { latitude: 50.8520, longitude: 4.3520 },
      availability: 'available',
      model: 'BMW i3',
    },
    {
      id: 'vehicle-3',
      location: { latitude: 50.8400, longitude: 4.3400 },
      availability: 'available',
      model: 'Renault Zoe',
    },
  ];

  const mockParkingZones: PoppyGeozone[] = [
    {
      id: 'parking-1',
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[4.3405, 50.8405, 0]]],
      },
      properties: {
        name: 'Parking Zone 1',
        parking: true,
      },
    },
    {
      id: 'parking-2',
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[4.3305, 50.8305, 0]]],
      },
      properties: {
        name: 'Parking Zone 2',
        parking: true,
      },
    },
    {
      id: 'no-parking-1',
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[4.3200, 50.8200, 0]]],
      },
      properties: {
        name: 'No Parking Zone',
        parking: false,
      },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JourneyPlannerController],
      providers: [
        JourneyPlannerService,
        RoutingService,
        {
          provide: PoppyApiService,
          useValue: {
            getVehicles: jest.fn().mockResolvedValue(mockVehicles),
            getParkingZones: jest.fn().mockResolvedValue(mockParkingZones),
          },
        },
      ],
    }).compile();

    controller = module.get<JourneyPlannerController>(JourneyPlannerController);
    poppyApiService = module.get<PoppyApiService>(PoppyApiService);
  });

  describe('POST /journey-planner/plan', () => {
    it('should plan a journey with a single leg', async () => {
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

      const result = await controller.planJourney(journeyRequest);

      expect(result).toBeDefined();
      expect(result.legs).toHaveLength(1);
      expect(result.legs[0].paths).toHaveLength(3);

      // Verify path structure
      expect(result.legs[0].paths[0].mode).toBe('walk');
      expect(result.legs[0].paths[1].mode).toBe('drive');
      expect(result.legs[0].paths[2].mode).toBe('walk');

      // Verify API calls
      expect(poppyApiService.getVehicles).toHaveBeenCalled();
      expect(poppyApiService.getParkingZones).toHaveBeenCalled();
    });

    it('should find the nearest vehicle to start location', async () => {
      const journeyRequest: JourneyRequestDto = {
        legs: [
          {
            startCoord: 50.8515, // Closest to vehicle-2 at 50.8520
            startTime: 1234567890,
            endCoord: 50.8403,
            endTime: 1234567990,
          },
        ],
      };

      const result = await controller.planJourney(journeyRequest);

      // First path should walk to vehicle-2
      expect(result.legs[0].paths[0].coords[1]).toBe(50.8520);
    });

    it('should find the nearest parking zone to destination', async () => {
      const journeyRequest: JourneyRequestDto = {
        legs: [
          {
            startCoord: 50.8503,
            startTime: 1234567890,
            endCoord: 50.8310, // Closest to parking-2 at 50.8305
            endTime: 1234567990,
          },
        ],
      };

      const result = await controller.planJourney(journeyRequest);

      // Last path should walk from parking-2
      expect(result.legs[0].paths[2].coords[0]).toBe(50.8305);
    });

    it('should calculate distances for each path', async () => {
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

      const result = await controller.planJourney(journeyRequest);

      // Verify all paths have distance calculated
      result.legs[0].paths.forEach((path) => {
        expect(path.distance).toBeDefined();
        expect(typeof path.distance).toBe('number');
        expect(path.distance).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle multiple legs correctly', async () => {
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

      const result = await controller.planJourney(journeyRequest);

      expect(result.legs).toHaveLength(2);
      expect(result.legs[0].paths).toHaveLength(3);
      expect(result.legs[1].paths).toHaveLength(3);

      // Verify both legs have correct structure
      result.legs.forEach((leg) => {
        expect(leg.paths[0].mode).toBe('walk');
        expect(leg.paths[1].mode).toBe('drive');
        expect(leg.paths[2].mode).toBe('walk');
      });

      // Verify API is called for each leg
      expect(poppyApiService.getVehicles).toHaveBeenCalledTimes(2);
      expect(poppyApiService.getParkingZones).toHaveBeenCalledTimes(2);
    });

    it('should preserve original leg coordinates and times', async () => {
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

      const result = await controller.planJourney(journeyRequest);

      expect(result.legs[0].startCoord).toBe(50.8503);
      expect(result.legs[0].startTime).toBe(1234567890);
      expect(result.legs[0].endCoord).toBe(50.8403);
      expect(result.legs[0].endTime).toBe(1234567990);
    });

    it('should filter out non-parking zones', async () => {
      const journeyRequest: JourneyRequestDto = {
        legs: [
          {
            startCoord: 50.8503,
            startTime: 1234567890,
            endCoord: 50.8200, // Closest is no-parking-1, but should use parking-2
            endTime: 1234567990,
          },
        ],
      };

      const result = await controller.planJourney(journeyRequest);

      // Should not use the no-parking zone (50.8200)
      const finalWalkCoord = result.legs[0].paths[2].coords[0];
      expect(finalWalkCoord).not.toBe(50.8200);
      // Should use one of the actual parking zones
      expect([50.8405, 50.8305]).toContain(finalWalkCoord);
    });

    it('should handle empty vehicle list gracefully', async () => {
      jest.spyOn(poppyApiService, 'getVehicles').mockResolvedValue([]);

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

      const result = await controller.planJourney(journeyRequest);

      expect(result.legs[0].paths).toHaveLength(0);
    });

    it('should handle empty parking zones gracefully', async () => {
      jest.spyOn(poppyApiService, 'getParkingZones').mockResolvedValue([]);

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

      const result = await controller.planJourney(journeyRequest);

      // Should have walk to vehicle but no drive or final walk
      expect(result.legs[0].paths.length).toBeLessThan(3);
    });
  });
});
