export class PriceBreakdownDto {
  bookUnitPrice: number;
  pauseUnitPrice: number;
  unlockFee: number;
  minutePrice: number;
  kilometerPrice: number;
}

export class PricedLegDto {
  estimatedPrice: number;
  priceBreakdown: PriceBreakdownDto;
}

export class PricingOptionDto {
  pricingType: 'perKilometer' | 'perMinute';
  estimatedPrice: number;
  legs: PricedLegDto[];
}

export class PriceEstimationResponseDto {
  perKilometer: PricingOptionDto;
  perMinute: PricingOptionDto;
  cheapestOption: 'perKilometer' | 'perMinute';
}
