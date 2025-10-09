
# Poppy journey planner and price estimation

You can start the project locally like this:
```
pnpm install
pnpm start:dev
```

Then open http://localhost:3000/map in your browser.

For discussion and background on this project see [this page](./discussion.md).

## Journey planner

Given a user journey (which can be several legs) this API will return a set of routed legs. Each leg will generally follow the format:

* Walk to pickup a car
* Drive car to parking closest to the destination
* Walk to destination

To create the routed journey we will use the following data sources:

* the cars fetched from here: https://poppy.red/api/v3/cities/a88ea9d0-3d5e-4002-8bbf-775313a5973c/vehicles
* the parking zones fetched from here: https://poppy.red/api/v3/geozones/62c4bd62-881c-473e-8a6b-fbedfd276739

Input schema:

```yaml
journey:
  legs:
    startCoord: number
    startTime: number
    endCoord: number
    endTime: number
```

Output schema:

```yaml
journey:
  legs:
    startCoord: number
    startTime: number
    endCoord: number
    endTime: number
    paths:
      mode: walk | drive
      coords: number[]
      distance: number
```

## Price estimation

Given a routed journey this API will return the cheapest estimated price. It will consider price differences between keeping a car booked between each leg or re-booking a different car from the same parking (assuming the new car is parked in the same location.)

The pricing information is fetched from here: https://poppy.red/api/v3/geozones/62c4bd62-881c-473e-8a6b-fbedfd276739 

Input schema:

```yaml
journey:
  legs:
    startCoord: number
    startTime: number
    endCoord: number
    endTime: number
    paths:
      mode: walk | drive
      distance: number
      coords: number[]
```

Output schema:

```yaml
journey:
  estimatedPrice: number
  legs:
    estimatedPrice: number
    priceBreakdown:
      bookUnitPrice: number
      pauseUnitPrice: number
      unlockFee: number
      minutePrice: number
      kilometerPrice: number
```

### **Notes on units**

- All prices are in thousandths VAT excluded per minute. So `"unlockFee":827` means 1€ VAT incl.
- bookUnitPrice is the price per minute a user pays to hold their reservation before unlocking the car, the first 15 minutes are free
- minutePrice is the price per minute a user pays as soon as the user unlocked a car
- kilometerPrice is the price per kilometer once includedKilometers is exceeded
- pauseUnitPrice is the price while the car is at a standstill and still booked for the user (locked in the street or at a standstill)
