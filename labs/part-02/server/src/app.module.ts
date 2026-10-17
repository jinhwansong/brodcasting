import { Module } from '@nestjs/common';
import { BroadcastsController } from './broadcast.controller.js';
import { BroadcastsService } from './broadcast.service.js';
@Module({ controllers: [BroadcastsController], providers: [BroadcastsService] })
export class AppModule {}
