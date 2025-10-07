# Dev log

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

# Approach

I took this opportunity to practice the new discipline of using AI. I leaned harder on AI than usual to push Claude harder than I am used to. At Evoluno I'm using Github Copilot in agent mode to take care of menial tasks or get a second opinion on some difficult React Native errors. I'm still writing the majority of the code myself because I don't want to inherit or maintain a lot of code I'm not familiar with.

Was this the right approach for a job interview? Maybe not! To back myself up I've provided a PR review of this project with my own comments an no AI.
