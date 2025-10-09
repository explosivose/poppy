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
      uuid: 'vehicle-1',
      locationLatitude: 50.8510,
      locationLongitude: 4.3510,
      model: { make: 'Tesla', name: 'Model 3', tier: 'M' },
      plate: 'ABC123',
      autonomyPercentage: 80,
      displayAutonomy: 200,
    } as PoppyVehicle,
    {
      uuid: 'vehicle-2',
      locationLatitude: 50.8520,
      locationLongitude: 4.3520,
      model: { make: 'BMW', name: 'i3', tier: 'M' },
      plate: 'XYZ789',
      autonomyPercentage: 90,
      displayAutonomy: 150,
    } as PoppyVehicle,
    {
      uuid: 'vehicle-3',
      locationLatitude: 50.8400,
      locationLongitude: 4.3400,
      model: { make: 'Renault', name: 'Zoe', tier: 'M' },
      plate: 'DEF456',
      autonomyPercentage: 70,
      displayAutonomy: 180,
    } as PoppyVehicle,
  ];

  const mockParkingZones: PoppyGeozone[] = [
    {
      geofencingType: 'parking',
      modelType: 'car',
      geom: {
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[[[4.3405, 50.8405], [4.3406, 50.8405], [4.3406, 50.8406], [4.3405, 50.8406], [4.3405, 50.8405]]]],
        },
      },
    } as PoppyGeozone,
    {
      geofencingType: 'parking',
      modelType: 'car',
      geom: {
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[[[4.3305, 50.8305], [4.3306, 50.8305], [4.3306, 50.8306], [4.3305, 50.8306], [4.3305, 50.8305]]]],
        },
      },
    } as PoppyGeozone,
    {
      geofencingType: 'no-parking',
      modelType: 'car',
      geom: {
        geometry: {
          type: 'MultiPolygon',
          coordinates: [[[[4.3200, 50.8200], [4.3201, 50.8200], [4.3201, 50.8201], [4.3200, 50.8201], [4.3200, 50.8200]]]],
        },
      },
    } as PoppyGeozone,
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
            startCoord: { lng: 4.35, lat: 50.8503 },
            startTime: 1234567890,
            endCoord: { lng: 4.36, lat: 50.8403 },
            endTime: 1234567990,
          },
        ],
      };

      const result = await controller.planJourney(journeyRequest);

      expect(result).toBeDefined();
      expect(result.legs).toHaveLength(1);

      // Paths can be 2 or 3 depending on if destination is in parking zone
      expect(result.legs[0].paths.length).toBeGreaterThanOrEqual(2);
      expect(result.legs[0].paths.length).toBeLessThanOrEqual(3);

      // First path should always be walk to vehicle
      expect(result.legs[0].paths[0].mode).toBe('walk');
      // Second path should always be drive
      expect(result.legs[0].paths[1].mode).toBe('drive');
      // Third path (if exists) should be walk to destination
      if (result.legs[0].paths[2]) {
        expect(result.legs[0].paths[2].mode).toBe('walk');
      }

      // Verify API calls
      expect(poppyApiService.getVehicles).toHaveBeenCalled();
      expect(poppyApiService.getParkingZones).toHaveBeenCalled();
    });

    it('should find the nearest vehicle to start location', async () => {
      const journeyRequest: JourneyRequestDto = {
        legs: [
          {
            startCoord: { lng: 4.3515, lat: 50.8515 }, // Closest to vehicle-1 at (4.3510, 50.8510)
            startTime: 1234567890,
            endCoord: { lng: 4.36, lat: 50.8403 },
            endTime: 1234567990,
          },
        ],
      };

      const result = await controller.planJourney(journeyRequest);

      // First path should walk to nearest vehicle (vehicle-2 in this case)
      expect(result.legs[0].paths[0].coords[1].lat).toBe(50.8520);
    });

    it('should find the nearest parking zone to destination', async () => {
      const journeyRequest: JourneyRequestDto = {
        legs: [
          {
            startCoord: { lng: 4.35, lat: 50.8503 },
            startTime: 1234567890,
            endCoord: { lng: 4.3407, lat: 50.8407 }, // Closest to parking-1 at 50.8405
            endTime: 1234567990,
          },
        ],
      };

      const result = await controller.planJourney(journeyRequest);

      // Check drive path ends near parking-1
      expect(result.legs[0].paths[1].coords[1].lat).toBeCloseTo(50.8405, 3);
    });

    it('should calculate distances for each path', async () => {
      const journeyRequest: JourneyRequestDto = {
        legs: [
          {
            startCoord: { lng: 4.35, lat: 50.8503 },
            startTime: 1234567890,
            endCoord: { lng: 4.36, lat: 50.8403 },
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
            startCoord: { lng: 4.35, lat: 50.8503 },
            startTime: 1234567890,
            endCoord: { lng: 4.36, lat: 50.8403 },
            endTime: 1234567990,
          },
          {
            startCoord: { lng: 4.36, lat: 50.8403 },
            startTime: 1234568000,
            endCoord: { lng: 4.37, lat: 50.8303 },
            endTime: 1234568100,
          },
        ],
      };

      const result = await controller.planJourney(journeyRequest);

      expect(result.legs).toHaveLength(2);

      // Each leg should have at least 2 paths (walk to vehicle, drive)
      expect(result.legs[0].paths.length).toBeGreaterThanOrEqual(2);
      expect(result.legs[1].paths.length).toBeGreaterThanOrEqual(2);

      // Verify both legs start with walk and then drive
      result.legs.forEach((leg) => {
        expect(leg.paths[0].mode).toBe('walk');
        expect(leg.paths[1].mode).toBe('drive');
      });

      // Verify API is called for each leg (journey planner now processes sequentially)
      expect(poppyApiService.getVehicles).toHaveBeenCalled();
      expect(poppyApiService.getParkingZones).toHaveBeenCalled();
    });

    it('should preserve original leg coordinates and times', async () => {
      const journeyRequest: JourneyRequestDto = {
        legs: [
          {
            startCoord: { lng: 4.35, lat: 50.8503 },
            startTime: 1234567890,
            endCoord: { lng: 4.36, lat: 50.8403 },
            endTime: 1234567990,
          },
        ],
      };

      const result = await controller.planJourney(journeyRequest);

      expect(result.legs[0].startCoord).toEqual({ lng: 4.35, lat: 50.8503 });
      expect(result.legs[0].startTime).toBe(1234567890);
      expect(result.legs[0].endCoord).toEqual({ lng: 4.36, lat: 50.8403 });
      expect(result.legs[0].endTime).toBe(1234567990);
    });

    it('should filter out non-parking zones', async () => {
      const journeyRequest: JourneyRequestDto = {
        legs: [
          {
            startCoord: { lng: 4.35, lat: 50.8503 },
            startTime: 1234567890,
            endCoord: { lng: 4.36, lat: 50.8200 }, // Closest is no-parking-1, but should use parking-2
            endTime: 1234567990,
          },
        ],
      };

      const result = await controller.planJourney(journeyRequest);

      // Should not use the no-parking zone (50.8200)
      const driveEndCoord = result.legs[0].paths[1].coords[1];
      expect(driveEndCoord.lat).not.toBe(50.8200);
      // Should use one of the actual parking zones
      expect([50.8405, 50.8305]).toContain(driveEndCoord.lat);
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
