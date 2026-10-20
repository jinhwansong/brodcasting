import {BadRequestException,type ArgumentMetadata,type PipeTransform} from '@nestjs/common';
import {ListDto,IdDto,UserDto,FavoriteDto} from './broadcast.dto.js';
import {CredentialsDto,NoticeDto} from './auth.dto.js';
const allowed=new Map<Function,string[]>([
 [ListDto,['search','sort','limit','offset','favoritesOnly']],[IdDto,['id']],[UserDto,['userId']],[FavoriteDto,['userId','id']],
 [CredentialsDto,['username','password']],[NoticeDto,['notice']]
]);
export class RawInputKeysPipe implements PipeTransform<unknown>{
 transform(value:unknown,metadata:ArgumentMetadata):unknown{
  const fields=metadata.metatype?allowed.get(metadata.metatype):undefined;
  if(fields&&value!==null&&typeof value==='object'&&Object.keys(value).some(key=>!fields.includes(key)))throw new BadRequestException('Unknown input field');
  return value;
 }
}
