import {BadRequestException,type ArgumentMetadata,type PipeTransform} from '@nestjs/common';
import {IdDto,ListDto} from './broadcast.dto.js';
export class RawInputKeysPipe implements PipeTransform<unknown> {
  transform(value:unknown,metadata:ArgumentMetadata):unknown {
    const fields=metadata.metatype===ListDto?['search','sort','limit','offset','favoritesOnly']:metadata.metatype===IdDto?['id']:null;
    if(fields&&value!==null&&typeof value==='object'&&Object.keys(value).some(key=>!fields.includes(key)))throw new BadRequestException('Unknown input field');
    return value;
  }
}
