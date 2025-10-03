export interface PoppyVehicle {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  availability: string;
  model: string;
}

export interface PoppyGeozone {
  id: string;
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: {
    name?: string;
    parking?: boolean;
  };
}

export interface PricingInfo {
  bookUnitPrice: number;
  pauseUnitPrice: number;
  unlockFee: number;
}
