import type { Scenario, SortOrder } from './types.js';
// 과제 B: 타입 선언 외에 실제 요청을 검증하는 decorator와 전역 Pipe를 추가하세요.
// 선택적 필드라도 null·배열·다른 타입은 허용하지 않습니다.
export class ScenarioDto { scenario?: Scenario; }
export class ListDto extends ScenarioDto {
  search?: string;
  sort?: SortOrder;
}
export class IdDto { id!: string; }
