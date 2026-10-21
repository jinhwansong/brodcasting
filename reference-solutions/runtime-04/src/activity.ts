import {randomUUID} from 'node:crypto';
import {Controller,Get,Injectable,Module} from '@nestjs/common';
import {QueueModule,JobsController} from './queue.js';

@Injectable()
export class ActivityService{
 readonly bootId=randomUUID();
 private count=0;
 snapshot(role:'api'|'worker'){return{role,pid:process.pid,bootId:this.bootId,count:this.count++};}
}
@Module({providers:[ActivityService],exports:[ActivityService]})
export class ActivityModule{}
@Controller()
export class HealthController{
 constructor(private readonly activity:ActivityService){}
 @Get('health')health(){return this.activity.snapshot('api');}
}
@Module({imports:[ActivityModule,QueueModule],controllers:[HealthController,JobsController]})
export class ApiModule{}
@Module({imports:[ActivityModule,QueueModule]})
export class WorkerModule{}
