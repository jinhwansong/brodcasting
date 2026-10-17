import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { IdDto, ListDto, ScenarioDto } from './broadcast.dto.js';
import { BroadcastsService } from './broadcast.service.js';
@Controller()
export class BroadcastsController {
  constructor(private readonly broadcasts: BroadcastsService) {}
  @Get('broadcasts')
  list(@Query() query: ListDto) { return this.broadcasts.list(query); }
  @Get('broadcasts/:id')
  detail(@Param() params: IdDto, @Query() query: ScenarioDto) { return this.broadcasts.get(params.id, query.scenario); }
  @Post('search-preview')
  @HttpCode(200)
  preview(@Body() query: ListDto) { return this.broadcasts.list(query); }
}
