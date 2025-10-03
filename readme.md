
# Poppy journey planner and price estimation

## Journey planner

Given a user journey (which can be several legs) this API will return a set of routed legs. Each leg will generally follow the format:

* Walk to pickup a car
* Drive car to parking closest to the destination
* Walk to destination

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
```
