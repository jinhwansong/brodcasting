import {Injectable,UnauthorizedException,type CanActivate,type ExecutionContext} from '@nestjs/common';
import {SessionRuntime} from './session.js';
@Injectable()
export class AuthGuard implements CanActivate{
 constructor(private readonly sessions:SessionRuntime){}
 async canActivate(_context:ExecutionContext):Promise<boolean>{
  // B: 현재 서버 세션의 주체를 확인해 request.actor에 설정하세요.
  throw new UnauthorizedException('Authentication exercise incomplete');
 }
}
