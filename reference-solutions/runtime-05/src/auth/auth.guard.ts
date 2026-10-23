import {Injectable,UnauthorizedException,type CanActivate,type ExecutionContext} from '@nestjs/common';
import {SessionRuntime,type SessionRequest} from './session.js';
@Injectable()
export class AuthGuard implements CanActivate{
 constructor(private readonly sessions:SessionRuntime){}
 async canActivate(context:ExecutionContext):Promise<boolean>{
  const req=context.switchToHttp().getRequest<SessionRequest>(),user=await this.sessions.currentUser(req);
  if(!user)throw new UnauthorizedException('Authentication required');
  req.actor=user;return true;
 }
}
