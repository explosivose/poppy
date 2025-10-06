import { Test, TestingModule } from '@nestjs/testing';
import { PriceEstimationService } from './price-estimation.service';
import { PoppyApiService } from '../journey-planner/services/poppy-api.service';
import { RoutedLegDto } from '../journey-planner/dto/journey-response.dto';

describe('PriceEstimationService', () => {
  let service: PriceEstimationService;
  let poppyApiService: jest.Mocked<PoppyApiService>;

  const mockPricing = {
    pricingPerKilometer: {
      uuid: '17d14c67-aa04-4433-81a0-4fcb1988bd5e',
      tier: 'M',
      modelType: 'car',
      unlockFee: 827,
      minutePrice: 0,
      pauseUnitPrice: 248,
      kilometerPrice: 1017,
      bookUnitPrice: 27,
      hourCapPrice: 0,
      dayCapPrice: 40496,
      includedKilometers: 0,
      type: 'kilometer',
      moveUnitPrice: 0,
      overKilometerPrice: 1017,
    },
    pricingPerMinute: {
      uuid: 'cae26d12-5fd7-444b-85bd-284af7cf81b7',
      tier: 'M',
      modelType: 'car',
      unlockFee: 827,
      minutePrice: 405,
      pauseUnitPrice: 248,
      kilometerPrice: 620,
      bookUnitPrice: 27,
      hourCapPrice: 0,
      dayCapPrice: 90083,
      includedKilometers: 100,
      type: 'minute',
      moveUnitPrice: 405,
      overKilometerPrice: 620,
    },
    smartPricing: {
      uuid: 'ce4d5d0d-f7e7-419c-b3da-da043dee91fc',
      tier: 'M',
      modelType: 'car',
      unlockFee: 826,
      minutePrice: 273,
      pauseUnitPrice: 273,
      kilometerPrice: 228,
      bookUnitPrice: 29,
      hourCapPrice: 10909,
      dayCapPrice: 53636,
      includedKilometers: 0,
      type: 'smart',
      moveUnitPrice: 273,
      overKilometerPrice: 228,
    },
    additionalFees: {
      fees: [
        {
          name: 'ANR Airport',
          amount: 4132,
        },
      ],
      articleId: '248325',
    },
  };

  beforeEach(async () => {
    const mockPoppyApiService = {
      getPricing: jest.fn().mockResolvedValue(mockPricing),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceEstimationService,
        {
          provide: PoppyApiService,
          useValue: mockPoppyApiService,
        },
      ],
    }).compile();

    service = module.get<PriceEstimationService>(PriceEstimationService);
    poppyApiService = module.get(PoppyApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('kilometer pricing calculations', () => {
    it('should correctly calculate price for distance in kilometers not meters', async () => {
      // Test case: 9746 meters should be ~9.91€ for distance (1017 per km * 9.746 km)
      const leg: RoutedLegDto = {
        startCoord: { lng: 4.35, lat: 50.85 },
        startTime: Date.now(),
        endCoord: { lng: 4.36, lat: 50.86 },
        endTime: Date.now() + 20 * 60 * 1000, // 20 minutes later
        paths: [
          {
            mode: 'walk',
            coords: [
              { lng: 4.35, lat: 50.85 },
              { lng: 4.351, lat: 50.851 },
            ],
            distance: 100,
          },
          {
            mode: 'drive',
            coords: [
              { lng: 4.351, lat: 50.851 },
              { lng: 4.36, lat: 50.86 },
            ],
            distance: 9746, // 9.746 km
          },
          {
            mode: 'walk',
            coords: [
              { lng: 4.36, lat: 50.86 },
              { lng: 4.361, lat: 50.861 },
            ],
            distance: 50,
          },
        ],
        vehicleUsage: {
          vehicleId: 'test-vehicle-1',
          pickupLocation: { lng: 4.351, lat: 50.851 },
          dropoffLocation: { lng: 4.36, lat: 50.86 },
        },
      };

      const result = await service.estimatePrice([leg]);

      // Expected: 9.746 km * 1017 = 9911.82 thousandths = ~9.91€
      const expectedKmPrice = Math.round(9.746 * 1017);
      expect(result.legs[0].priceBreakdown.kilometerPrice).toBe(expectedKmPrice);

      // Verify it's in the correct range (around 9911, not 99110)
      expect(result.legs[0].priceBreakdown.kilometerPrice).toBeGreaterThan(9000);
      expect(result.legs[0].priceBreakdown.kilometerPrice).toBeLessThan(11000);
    });

    it('should convert prices from thousandths correctly', async () => {
      const leg: RoutedLegDto = {
        startCoord: { lng: 4.35, lat: 50.85 },
        startTime: Date.now(),
        endCoord: { lng: 4.36, lat: 50.86 },
        endTime: Date.now() + 20 * 60 * 1000,
        paths: [
          {
            mode: 'drive',
            coords: [
              { lng: 4.35, lat: 50.85 },
              { lng: 4.36, lat: 50.86 },
            ],
            distance: 1000, // 1 km
          },
        ],
        vehicleUsage: {
          vehicleId: 'test-vehicle-1',
          pickupLocation: { lng: 4.35, lat: 50.85 },
          dropoffLocation: { lng: 4.36, lat: 50.86 },
        },
      };

      const result = await service.estimatePrice([leg]);

      // 1 km * 1017 = 1017 thousandths = 1.017€
      expect(result.legs[0].priceBreakdown.kilometerPrice).toBe(1017);

      // Unlock fee should be 827 thousandths = 0.827€
      expect(result.legs[0].priceBreakdown.unlockFee).toBe(827);
    });
  });

  describe('pause pricing calculations', () => {
    it('should not add pause price for a single leg journey', async () => {
      const leg: RoutedLegDto = {
        startCoord: { lng: 4.35, lat: 50.85 },
        startTime: Date.now(),
        endCoord: { lng: 4.36, lat: 50.86 },
        endTime: Date.now() + 20 * 60 * 1000,
        paths: [
          {
            mode: 'drive',
            coords: [
              { lng: 4.35, lat: 50.85 },
              { lng: 4.36, lat: 50.86 },
            ],
            distance: 5000,
          },
        ],
        vehicleUsage: {
          vehicleId: 'test-vehicle-1',
          pickupLocation: { lng: 4.35, lat: 50.85 },
          dropoffLocation: { lng: 4.36, lat: 50.86 },
        },
      };

      const result = await service.estimatePrice([leg]);

      // No pause for single leg
      expect(result.legs[0].priceBreakdown.pauseUnitPrice).toBe(0);
    });

    it('should calculate pause price between legs with same vehicle', async () => {
      const startTime = Date.now();
      const leg1EndTime = startTime + 20 * 60 * 1000; // 20 min later
      const leg2StartTime = leg1EndTime + 30 * 60 * 1000; // 30 min pause
      const leg2EndTime = leg2StartTime + 15 * 60 * 1000;

      const legs: RoutedLegDto[] = [
        {
          startCoord: { lng: 4.35, lat: 50.85 },
          startTime,
          endCoord: { lng: 4.36, lat: 50.86 },
          endTime: leg1EndTime,
          paths: [
            {
              mode: 'drive',
              coords: [
                { lng: 4.35, lat: 50.85 },
                { lng: 4.36, lat: 50.86 },
              ],
              distance: 5000,
            },
          ],
          vehicleUsage: {
            vehicleId: 'same-vehicle',
            pickupLocation: { lng: 4.35, lat: 50.85 },
            dropoffLocation: { lng: 4.36, lat: 50.86 },
          },
        },
        {
          startCoord: { lng: 4.36, lat: 50.86 },
          startTime: leg2StartTime,
          endCoord: { lng: 4.37, lat: 50.87 },
          endTime: leg2EndTime,
          paths: [
            {
              mode: 'drive',
              coords: [
                { lng: 4.36, lat: 50.86 },
                { lng: 4.37, lat: 50.87 },
              ],
              distance: 3000,
            },
          ],
          vehicleUsage: {
            vehicleId: 'same-vehicle',
            pickupLocation: { lng: 4.36, lat: 50.86 },
            dropoffLocation: { lng: 4.37, lat: 50.87 },
          },
        },
      ];

      const result = await service.estimatePrice(legs);

      // First leg should have pause price for 30 minutes
      // 30 minutes * 248 (pauseUnitPrice) = 7440 thousandths
      expect(result.legs[0].priceBreakdown.pauseUnitPrice).toBe(7440);

      // Second leg should have no pause (it's the last leg)
      expect(result.legs[1].priceBreakdown.pauseUnitPrice).toBe(0);
    });

    it('should not calculate pause price between legs with different vehicles', async () => {
      const startTime = Date.now();
      const leg1EndTime = startTime + 20 * 60 * 1000;
      const leg2StartTime = leg1EndTime + 30 * 60 * 1000; // 30 min gap
      const leg2EndTime = leg2StartTime + 15 * 60 * 1000;

      const legs: RoutedLegDto[] = [
        {
          startCoord: { lng: 4.35, lat: 50.85 },
          startTime,
          endCoord: { lng: 4.36, lat: 50.86 },
          endTime: leg1EndTime,
          paths: [
            {
              mode: 'drive',
              coords: [
                { lng: 4.35, lat: 50.85 },
                { lng: 4.36, lat: 50.86 },
              ],
              distance: 5000,
            },
          ],
          vehicleUsage: {
            vehicleId: 'vehicle-1',
            pickupLocation: { lng: 4.35, lat: 50.85 },
            dropoffLocation: { lng: 4.36, lat: 50.86 },
          },
        },
        {
          startCoord: { lng: 4.36, lat: 50.86 },
          startTime: leg2StartTime,
          endCoord: { lng: 4.37, lat: 50.87 },
          endTime: leg2EndTime,
          paths: [
            {
              mode: 'drive',
              coords: [
                { lng: 4.36, lat: 50.86 },
                { lng: 4.37, lat: 50.87 },
              ],
              distance: 3000,
            },
          ],
          vehicleUsage: {
            vehicleId: 'vehicle-2', // Different vehicle
            pickupLocation: { lng: 4.36, lat: 50.86 },
            dropoffLocation: { lng: 4.37, lat: 50.87 },
          },
        },
      ];

      const result = await service.estimatePrice(legs);

      // No pause for either leg (different vehicles)
      expect(result.legs[0].priceBreakdown.pauseUnitPrice).toBe(0);
      expect(result.legs[1].priceBreakdown.pauseUnitPrice).toBe(0);
    });
  });

  describe('booking price calculations', () => {
    it('should not charge for first 15 minutes of booking', async () => {
      const startTime = Date.now();
      const endTime = startTime + 10 * 60 * 1000; // 10 minutes

      const leg: RoutedLegDto = {
        startCoord: { lng: 4.35, lat: 50.85 },
        startTime,
        endCoord: { lng: 4.36, lat: 50.86 },
        endTime,
        paths: [
          {
            mode: 'drive',
            coords: [
              { lng: 4.35, lat: 50.85 },
              { lng: 4.36, lat: 50.86 },
            ],
            distance: 5000,
          },
        ],
        vehicleUsage: {
          vehicleId: 'test-vehicle',
          pickupLocation: { lng: 4.35, lat: 50.85 },
          dropoffLocation: { lng: 4.36, lat: 50.86 },
        },
      };

      const result = await service.estimatePrice([leg]);

      // First 15 minutes are free
      expect(result.legs[0].priceBreakdown.bookUnitPrice).toBe(0);
    });

    it('should charge booking price after 15 minutes', async () => {
      const startTime = Date.now();
      const endTime = startTime + 25 * 60 * 1000; // 25 minutes

      const leg: RoutedLegDto = {
        startCoord: { lng: 4.35, lat: 50.85 },
        startTime,
        endCoord: { lng: 4.36, lat: 50.86 },
        endTime,
        paths: [
          {
            mode: 'drive',
            coords: [
              { lng: 4.35, lat: 50.85 },
              { lng: 4.36, lat: 50.86 },
            ],
            distance: 5000,
          },
        ],
        vehicleUsage: {
          vehicleId: 'test-vehicle',
          pickupLocation: { lng: 4.35, lat: 50.85 },
          dropoffLocation: { lng: 4.36, lat: 50.86 },
        },
      };

      const result = await service.estimatePrice([leg]);

      // 25 - 15 = 10 minutes * 27 (bookUnitPrice) = 270 thousandths
      expect(result.legs[0].priceBreakdown.bookUnitPrice).toBe(270);
    });
  });
});
