import {Injectable,NotFoundException,ForbiddenException,UnauthorizedException} from '@nestjs/common';
import {BroadcastRepository} from './repository.js';
import {SessionRuntime,type SessionRequest} from './session.js';
import {assertOwner,assertRoomAdmin} from './access-policy.js';
import type {ListQuery,User} from './types.js';
@Injectable()
export class BroadcastsService{
 constructor(private readonly repo:BroadcastRepository,private readonly sessions:SessionRuntime){}
 async list(query:ListQuery,req:SessionRequest){
  const user=await this.sessions.currentUser(req);if(query.favoritesOnly&&!user)throw new UnauthorizedException('Authentication required');
  return this.repo.list(query,user?.id);
 }
 async get(id:string,req:SessionRequest){
  const user=await this.sessions.currentUser(req),row=await this.repo.get(id,user?.id);if(!row)throw new NotFoundException('Broadcast not found');return row;
 }
 favorites(actor:User,userId:string,query:ListQuery){assertOwner(actor,userId);return this.repo.list({...query,favoritesOnly:true},actor.id);}
 async setFavorite(actor:User,userId:string,id:string,enabled:boolean){
  assertOwner(actor,userId);if(!await this.repo.get(id,actor.id))throw new NotFoundException('Broadcast not found');
  await this.repo.setFavorite(actor.id,id,enabled);return{id,favorite:enabled};
 }
 async room(id:string,req:SessionRequest){
  const user=await this.sessions.currentUser(req),room=await this.repo.getRoom(id,user?.id);if(!room)throw new NotFoundException('Room not found');return room;
 }
 async updateNotice(actor:User,id:string,notice:string){
  const room=await this.repo.getRoom(id,actor.id);if(!room)throw new NotFoundException('Room not found');
  assertRoomAdmin(room);
  const changed=await this.repo.updateNotice(actor.id,id,notice);if(!changed)throw new ForbiddenException('Room access denied');return changed;
 }
}
