import { Controller, Get, Render } from '@nestjs/common';

@Controller('map')
export class MapController {
  @Get()
  @Render('map')
  getMap() {
    return {
      title: 'Journey Planner',
      maptilerApiKey: process.env.MAPTILER_API_KEY || 'demo',
    };
  }
}
