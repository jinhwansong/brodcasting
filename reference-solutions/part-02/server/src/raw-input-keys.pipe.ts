import { BadRequestException, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';
import { IdDto, ListDto, ScenarioDto } from './broadcast.dto.js';

// DTO 변환이 일부 키를 제거하기 전에 원래 입력의 필드 집합을 검사합니다.
export class RawInputKeysPipe implements PipeTransform<unknown> {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const fields = metadata.metatype === ListDto ? ['search', 'sort', 'scenario']
      : metadata.metatype === ScenarioDto ? ['scenario']
      : metadata.metatype === IdDto ? ['id'] : null;
    if (fields && value !== null && typeof value === 'object'
      && Object.keys(value).some(key => !fields.includes(key))) {
      throw new BadRequestException('Unknown input field');
    }
    return value;
  }
}
