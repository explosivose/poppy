# Delivery discussion

## Dev log

I used Claude Code to generate 99% of this project.

* I wrote the readme with an API overview.
* Then I bootstrapped a NestJS project using the Nest CLI.
* Then Claude generated the journey planner API with some basic Jest tests.

30 minutes in. At this point it felt tedious to verify the AI-generated API tests or to exercise the API myself. 

* I decided to ask Claude for a UI where I could verify the app behavior myself. 
* I used the browser network traffic to see whether the numbers made sense and whether the UI reflected the numbers correctly.
* When I spotted an issue I asked Claude to fix it, usually hinting at the code location myself as I noticed Claude sometimes goes in the wrong direction.

Another 45 minutes. The journey planner UI is good enough even if the map and routing lack any detail.

* Claude generated a basic pricing estimation API with some UI controls for leg times.
* I asked Claude to fix some details that were missing or incorrect, like reusing the car from the previous leg.

That was around 50 minutes to fix these details around the data and pricing with Claude.

* There were more details and bugs to fix like counting the pauses incorrectly or handling the units incorrectly
* Next we added both pricing options and highlighted the cheapest in the UI

That was another hour or so.

In total I spent around 3 to 3.5 hours.

## Approach

I took this opportunity to practice the new discipline of using AI. I leaned harder on AI than usual to push Claude harder than I am used to. At Evoluno I'm using Github Copilot in agent mode to take care of menial tasks or get a second opinion on some difficult React Native errors. I'm still writing the majority of the code myself because I don't want to inherit or maintain a lot of code I'm not familiar with.

Was this the right approach for a job interview? Maybe not!

## What would I do differently

I would take either the tests or the implementation tasks myself because without real personal participation I have less familiarity and trust in the results. At this stage I don't want to feel apprehensive about presenting someone else's work. I want to feel excited about explaining a solution than I know and therefore trust.

# Technical discussion

## Stack choices

NestJS offers an opinionated code structure with dependency injection:

* + Easier to organise code
* + Easier to test code
* + Easier to refactor code
* - More boilerplate and tooling than express, koa or fastify

No database used at this stage but it can easily be added later as a NestJS module. 

The webpage is a Pug html template with AlpineJS for clientside state and interactivity, Map Libre GL for rendering a map, Tailwind & DaisyUI for styling. In this proof-of-concept (POC) we're missing a build step for creating our CSS and bundling JS dependencies.

* + Simpler than SPA frameworks
* + Declarative syntax plays nice with HTML templating
* + Good runtime performance
* - Concern that AlpineJS would not scale well with more complexity
* - No opinionated mechanism for making UI components with clearly defined interface like JSX
* - Pug and tailwind actually don't play nice together.
* - Claude and maybe other LLMs aren't great with Pug templates compared with React JSX.

## Scaling

NestJS offers many out of the box solutions to scaling problems including caching, compression, and queues. You can also choose Fastify as the underlying platform.

If the JS options are exhausted then, as long as the NestJS app remains stateless and any cache stores can be externalized, we can leverage horizontal scaling features from a container orchestration platform.

# App scope

## POST /plan

This will give you a detailed journey itinerary for picking up and dropping off cars during your trip. Your trip can have multiple "legs" or stages that begin and end at different times.

It lacks server-side validation for chronological sense (i.e. trips should be limited in time and legs should be chronologically ordered).

Each leg can be multimodal (walking and driving). It also contains information and moving a vehicle which is useful for updating the clientside map.

For a body like this:

```json
{
  "legs": [
    {
      "startCoord": {
        "lng": 4.3259163374417255,
        "lat": 50.87067827531209
      },
      "startTime": 1759837762197,
      "endCoord": {
        "lng": 4.371850838197446,
        "lat": 50.832184249710366
      },
      "endTime": 1759841362197
    },
    {
      "startCoord": {
        "lng": 4.3726710971401985,
        "lat": 50.83097540278641
      },
      "startTime": 1759843162197,
      "endCoord": {
        "lng": 4.334665766156945,
        "lat": 50.79054735966196
      },
      "endTime": 1759846762197
    },
    {
      "startCoord": {
        "lng": 4.337126542983043,
        "lat": 50.79054735966196
      },
      "startTime": 1759848562197,
      "endCoord": {
        "lng": 4.303495926359005,
        "lat": 50.867054632288216
      },
      "endTime": 1759852162197
    }
  ]
}
```

We get a response like this:

```json
{
  "legs": [
    {
      "startCoord": {
        "lng": 4.3259163374417255,
        "lat": 50.87067827531209
      },
      "startTime": 1759837762197,
      "endCoord": {
        "lng": 4.371850838197446,
        "lat": 50.832184249710366
      },
      "endTime": 1759841362197,
      "paths": [
        {
          "mode": "walk",
          "coords": [
            {
              "lng": 4.3259163374417255,
              "lat": 50.87067827531209
            },
            {
              "lng": 4.325693,
              "lat": 50.869286
            }
          ],
          "distance": 155.6052062604934
        },
        {
          "mode": "drive",
          "coords": [
            {
              "lng": 4.325693,
              "lat": 50.869286
            },
            {
              "lng": 4.371850838197446,
              "lat": 50.832184249710366
            }
          ],
          "distance": 5245.952377389267
        }
      ],
      "vehicleUsage": {
        "vehicleId": "d3409c71-8784-4075-a2f5-27e62038f80d",
        "pickupLocation": {
          "lng": 4.325693,
          "lat": 50.869286
        },
        "dropoffLocation": {
          "lng": 4.367494,
          "lat": 50.833184
        }
      }
    },
    {
      "startCoord": {
        "lng": 4.3726710971401985,
        "lat": 50.83097540278641
      },
      "startTime": 1759843162197,
      "endCoord": {
        "lng": 4.334665766156945,
        "lat": 50.79054735966196
      },
      "endTime": 1759846762197,
      "paths": [
        {
          "mode": "walk",
          "coords": [
            {
              "lng": 4.3726710971401985,
              "lat": 50.83097540278641
            },
            {
              "lng": 4.367494,
              "lat": 50.833184
            }
          ],
          "distance": 438.7579320839092
        },
        {
          "mode": "drive",
          "coords": [
            {
              "lng": 4.367494,
              "lat": 50.833184
            },
            {
              "lng": 4.334665766156945,
              "lat": 50.79054735966196
            }
          ],
          "distance": 5272.282214752194
        }
      ],
      "vehicleUsage": {
        "vehicleId": "d3409c71-8784-4075-a2f5-27e62038f80d",
        "pickupLocation": {
          "lng": 4.367494,
          "lat": 50.833184
        },
        "dropoffLocation": {
          "lng": 4.333101899,
          "lat": 50.790007679
        }
      }
    },
    {
      "startCoord": {
        "lng": 4.337126542983043,
        "lat": 50.79054735966196
      },
      "startTime": 1759848562197,
      "endCoord": {
        "lng": 4.303495926359005,
        "lat": 50.867054632288216
      },
      "endTime": 1759852162197,
      "paths": [
        {
          "mode": "walk",
          "coords": [
            {
              "lng": 4.337126542983043,
              "lat": 50.79054735966196
            },
            {
              "lng": 4.333101899,
              "lat": 50.790007679
            }
          ],
          "distance": 289.19920345134705
        },
        {
          "mode": "drive",
          "coords": [
            {
              "lng": 4.333101899,
              "lat": 50.790007679
            },
            {
              "lng": 4.303495926359005,
              "lat": 50.867054632288216
            }
          ],
          "distance": 8815.968457169929
        }
      ],
      "vehicleUsage": {
        "vehicleId": "d3409c71-8784-4075-a2f5-27e62038f80d",
        "pickupLocation": {
          "lng": 4.333101899,
          "lat": 50.790007679
        },
        "dropoffLocation": {
          "lng": 4.301261219,
          "lat": 50.868198279
        }
      }
    }
  ],
  "updatedVehiclePositions": [
    {
      "vehicleId": "d3409c71-8784-4075-a2f5-27e62038f80d",
      "location": {
        "lng": 4.301261219,
        "lat": 50.868198279
      }
    }
  ]
}
```


## POST /estimate

The estimate API will take a planned journey and estimate the pricing in both per-kilometer and per-minute modes. It will indicate the cheapest.

In the example below we can see the pause price is applied when the same vehicle is reused for a subsequent leg. This disappears if the next leg begins near a different vehicle on the map.

This presents an interesting but unimplemented pricing optimisation: if the pause-time is long it may be cheaper to rent a different vehicle for the next leg.

Given the body:

```json
{
  "legs": [
    {
      "startCoord": {
        "lng": 4.3259163374417255,
        "lat": 50.87067827531209
      },
      "startTime": 1759837762197,
      "endCoord": {
        "lng": 4.371850838197446,
        "lat": 50.832184249710366
      },
      "endTime": 1759838503747.0337,
      "paths": [
        {
          "mode": "walk",
          "coords": [
            {
              "lng": 4.3259163374417255,
              "lat": 50.87067827531209
            },
            {
              "lng": 4.325693,
              "lat": 50.869286
            }
          ],
          "distance": 155.6052062604934
        },
        {
          "mode": "drive",
          "coords": [
            {
              "lng": 4.325693,
              "lat": 50.869286
            },
            {
              "lng": 4.371850838197446,
              "lat": 50.832184249710366
            }
          ],
          "distance": 5245.952377389267
        }
      ],
      "vehicleUsage": {
        "vehicleId": "d3409c71-8784-4075-a2f5-27e62038f80d",
        "pickupLocation": {
          "lng": 4.325693,
          "lat": 50.869286
        },
        "dropoffLocation": {
          "lng": 4.367494,
          "lat": 50.833184
        }
      }
    },
    {
      "startCoord": {
        "lng": 4.3726710971401985,
        "lat": 50.83097540278641
      },
      "startTime": 1759840303747.0337,
      "endCoord": {
        "lng": 4.334665766156945,
        "lat": 50.79054735966196
      },
      "endTime": 1759841252326.6106,
      "paths": [
        {
          "mode": "walk",
          "coords": [
            {
              "lng": 4.3726710971401985,
              "lat": 50.83097540278641
            },
            {
              "lng": 4.367494,
              "lat": 50.833184
            }
          ],
          "distance": 438.7579320839092
        },
        {
          "mode": "drive",
          "coords": [
            {
              "lng": 4.367494,
              "lat": 50.833184
            },
            {
              "lng": 4.334665766156945,
              "lat": 50.79054735966196
            }
          ],
          "distance": 5272.282214752194
        }
      ],
      "vehicleUsage": {
        "vehicleId": "d3409c71-8784-4075-a2f5-27e62038f80d",
        "pickupLocation": {
          "lng": 4.367494,
          "lat": 50.833184
        },
        "dropoffLocation": {
          "lng": 4.333101899,
          "lat": 50.790007679
        }
      }
    },
    {
      "startCoord": {
        "lng": 4.337126542983043,
        "lat": 50.79054735966196
      },
      "startTime": 1759843052326.6106,
      "endCoord": {
        "lng": 4.303495926359005,
        "lat": 50.867054632288216
      },
      "endTime": 1759844318466.252,
      "paths": [
        {
          "mode": "walk",
          "coords": [
            {
              "lng": 4.337126542983043,
              "lat": 50.79054735966196
            },
            {
              "lng": 4.333101899,
              "lat": 50.790007679
            }
          ],
          "distance": 289.19920345134705
        },
        {
          "mode": "drive",
          "coords": [
            {
              "lng": 4.333101899,
              "lat": 50.790007679
            },
            {
              "lng": 4.303495926359005,
              "lat": 50.867054632288216
            }
          ],
          "distance": 8815.968457169929
        }
      ],
      "vehicleUsage": {
        "vehicleId": "d3409c71-8784-4075-a2f5-27e62038f80d",
        "pickupLocation": {
          "lng": 4.333101899,
          "lat": 50.790007679
        },
        "dropoffLocation": {
          "lng": 4.301261219,
          "lat": 50.868198279
        }
      }
    }
  ]
}
```

The response looks like:

```json
{
  "perKilometer": {
    "pricingType": "perKilometer",
    "estimatedPrice": 37211,
    "legs": [
      {
        "estimatedPrice": 13602,
        "priceBreakdown": {
          "bookUnitPrice": 0,
          "pauseUnitPrice": 7440,
          "unlockFee": 827,
          "minutePrice": 0,
          "kilometerPrice": 5335
        }
      },
      {
        "estimatedPrice": 13651,
        "priceBreakdown": {
          "bookUnitPrice": 22,
          "pauseUnitPrice": 7440,
          "unlockFee": 827,
          "minutePrice": 0,
          "kilometerPrice": 5362
        }
      },
      {
        "estimatedPrice": 9958,
        "priceBreakdown": {
          "bookUnitPrice": 165,
          "pauseUnitPrice": 0,
          "unlockFee": 827,
          "minutePrice": 0,
          "kilometerPrice": 8966
        }
      }
    ]
  },
  "perMinute": {
    "pricingType": "perMinute",
    "estimatedPrice": 33208,
    "legs": [
      {
        "estimatedPrice": 12516,
        "priceBreakdown": {
          "bookUnitPrice": 0,
          "pauseUnitPrice": 7440,
          "unlockFee": 827,
          "minutePrice": 4249,
          "kilometerPrice": 0
        }
      },
      {
        "estimatedPrice": 12559,
        "priceBreakdown": {
          "bookUnitPrice": 22,
          "pauseUnitPrice": 7440,
          "unlockFee": 827,
          "minutePrice": 4271,
          "kilometerPrice": 0
        }
      },
      {
        "estimatedPrice": 8133,
        "priceBreakdown": {
          "bookUnitPrice": 165,
          "pauseUnitPrice": 0,
          "unlockFee": 827,
          "minutePrice": 7141,
          "kilometerPrice": 0
        }
      }
    ]
  },
  "cheapestOption": "perMinute"
}
```

## Web page

There's a lot of issues with the rough-and-ready UI.

* Clear All button does not clear all
* Plan Jouney button can be clicked too early 
* Editing the times is clunky, allows for nonsensical inputs
* The map tiles have no roads or any useful details
* The routing is straight lines only
* The client-side app does not automatically stay up-to-date with realtime data like car location.
