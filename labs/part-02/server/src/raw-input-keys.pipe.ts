import type { ArgumentMetadata, PipeTransform } from '@nestjs/common';

export class RawInputKeysPipe implements PipeTransform<unknown> {
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    // 과제 B: DTO 종류별 허용 필드를 정하고, 변환 전 미정의 own key를 거부하세요.
    return value;
  }
}
