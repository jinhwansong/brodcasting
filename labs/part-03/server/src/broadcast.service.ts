import {HttpException,Injectable,NotFoundException,ServiceUnavailableException} from '@nestjs/common';
import {BroadcastRepository} from './repository.js';
import type {ListQuery} from './types.js';
@Injectable()
export class BroadcastsService {
  constructor(private readonly repo:BroadcastRepository){}
  private async guarded<T>(action:()=>Promise<T>):Promise<T>{
    try{return await action();}catch(error){if(error instanceof HttpException)throw error;throw new ServiceUnavailableException('Database unavailable');}
  }
  list(query:ListQuery){return this.guarded(()=>this.repo.list(query));}
  get(id:string){return this.guarded(async()=>{const row=await this.repo.get(id);if(!row)throw new NotFoundException('Broadcast not found');return row;});}
  setFavorite(id:string,enabled:boolean){return this.guarded(async()=>{
    if(!await this.repo.get(id))throw new NotFoundException('Broadcast not found');
    await this.repo.setFavorite(id,enabled);return {id,favorite:enabled};
  });}
}
