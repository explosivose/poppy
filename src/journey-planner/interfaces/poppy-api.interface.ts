export interface PoppyVehicle {
  uuid: string;
  plate: string;
  locationLatitude: number;
  locationLongitude: number;
  autonomy: number;
  discountAmount: number;
  discountPercent: number;
  model: {
    type: string;
    uuid: string;
    tier: string;
    make: string;
    energy: string;
    name: string;
  };
  autonomyPercentage: number;
  displayAutonomy: number;
  isElligibleForFueling: boolean;
  isElligibleForCharging: boolean;
  fuelingReward: number;
  chargingReward: number;
  pictureUrl: string;
}

export interface PoppyGeozone {
  geofencingType: string;
  modelType: string;
  geom: {
    type: string;
    geometry: {
      type: string;
      coordinates: number[][][][];
    };
  };
}

export interface PricingInfo {
  uuid: string;
  tier: string;
  modelType: string;
  unlockFee: number;
  minutePrice: number;
  pauseUnitPrice: number;
  kilometerPrice: number;
  bookUnitPrice: number;
  hourCapPrice: number;
  dayCapPrice: number;
  includedKilometers: number;
  type: string;
  moveUnitPrice: number;
  overKilometerPrice: number;
}

export interface PoppyPricingResponse {
  pricingPerMinute: PricingInfo;
  pricingPerKilometer: PricingInfo;
  smartPricing: PricingInfo;
  additionalFees: {
    fees: Array<{
      name: string;
      amount: number;
    }>;
    articleId: string;
  };
}
