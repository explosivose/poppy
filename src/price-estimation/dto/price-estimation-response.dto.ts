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

export class PriceEstimationResponseDto {
  estimatedPrice: number;
  legs: PricedLegDto[];
}
