import { Injectable } from '@nestjs/common';
import { PoppyApiService } from '../journey-planner/services/poppy-api.service';
import { RoutedLegDto } from '../journey-planner/dto/journey-response.dto';
import { PricingInfo } from '../journey-planner/interfaces/poppy-api.interface';
import {
  PriceEstimationResponseDto,
  PricedLegDto,
  PriceBreakdownDto,
} from './dto/price-estimation-response.dto';

@Injectable()
export class PriceEstimationService {
  constructor(private readonly poppyApiService: PoppyApiService) {}

  async estimatePrice(
    legs: RoutedLegDto[],
  ): Promise<PriceEstimationResponseDto> {
    // Fetch pricing info from API
    const pricingData = await this.poppyApiService.getPricing();

    // Calculate prices for both pricing models
    const perKilometerResult = this.calculatePriceWithModel(
      legs,
      pricingData.pricingPerKilometer,
    );
    const perMinuteResult = this.calculatePriceWithModel(
      legs,
      pricingData.pricingPerMinute,
    );

    // Determine cheapest option
    const cheapestOption =
      perKilometerResult.totalPrice <= perMinuteResult.totalPrice
        ? 'perKilometer'
        : 'perMinute';

    return {
      perKilometer: {
        pricingType: 'perKilometer',
        estimatedPrice: perKilometerResult.totalPrice,
        legs: perKilometerResult.legs,
      },
      perMinute: {
        pricingType: 'perMinute',
        estimatedPrice: perMinuteResult.totalPrice,
        legs: perMinuteResult.legs,
      },
      cheapestOption,
    };
  }

  private calculatePriceWithModel(
    legs: RoutedLegDto[],
    pricing: PricingInfo,
  ): { totalPrice: number; legs: PricedLegDto[] } {
    const pricedLegs: PricedLegDto[] = [];
    let totalPrice = 0;

    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      const nextLeg = i < legs.length - 1 ? legs[i + 1] : null;

      // Calculate pause time if next leg uses the same vehicle
      let pauseMinutes = 0;
      if (nextLeg && leg.vehicleUsage && nextLeg.vehicleUsage) {
        if (leg.vehicleUsage.vehicleId === nextLeg.vehicleUsage.vehicleId) {
          pauseMinutes = (nextLeg.startTime - leg.endTime) / 60000; // convert ms to minutes
        }
      }

      const legPrice = this.calculateLegPrice(leg, pricing, pauseMinutes);
      pricedLegs.push(legPrice);
      totalPrice += legPrice.estimatedPrice;
    }

    return { totalPrice, legs: pricedLegs };
  }

  private calculateLegPrice(
    leg: RoutedLegDto,
    pricing: PricingInfo,
    pauseMinutes: number = 0,
  ): PricedLegDto {
    let legPrice = 0;

    // Add unlock fee (once per leg when picking up a car)
    const hasDrive = leg.paths?.some((path) => path.mode === 'drive');
    const unlockFee = hasDrive ? pricing.unlockFee : 0;
    legPrice += unlockFee;

    // Calculate time-based pricing
    const durationMinutes = (leg.endTime - leg.startTime) / 60000; // convert ms to minutes

    // First 15 minutes of booking are free
    const bookingMinutes = Math.max(0, durationMinutes - 15);
    const bookingPrice = bookingMinutes * pricing.bookUnitPrice;

    // Calculate driving time (when car is unlocked and moving)
    const drivePaths = leg.paths?.filter((path) => path.mode === 'drive') || [];
    const totalDriveDistance = drivePaths.reduce(
      (sum, path) => sum + path.distance,
      0,
    );
    const totalDriveKm = totalDriveDistance / 1000; // convert meters to km

    // Assume average speed of 30 km/h for city driving
    const drivingMinutes = (totalDriveKm / 30) * 60;
    const minutePriceTotal = drivingMinutes * pricing.minutePrice;

    // Calculate distance price (only if exceeds included kilometers)
    const excessKm = Math.max(0, totalDriveKm - pricing.includedKilometers);
    const kilometerPriceTotal = excessKm * pricing.kilometerPrice;

    // Pause price (time between this leg ending and next leg starting with same vehicle)
    const pausePriceTotal = pauseMinutes * pricing.pauseUnitPrice;

    legPrice +=
      bookingPrice + minutePriceTotal + kilometerPriceTotal + pausePriceTotal;

    const priceBreakdown: PriceBreakdownDto = {
      bookUnitPrice: Math.round(bookingPrice),
      pauseUnitPrice: Math.round(pausePriceTotal),
      unlockFee: unlockFee,
      minutePrice: Math.round(minutePriceTotal),
      kilometerPrice: Math.round(kilometerPriceTotal),
    };

    return {
      estimatedPrice: Math.round(legPrice),
      priceBreakdown,
    };
  }
}
