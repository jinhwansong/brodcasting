import type { Scenario, SortOrder } from './types.js';
import { IsIn, IsString, MaxLength, Matches, ValidateIf } from 'class-validator';
export class ScenarioDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(['normal', 'slow', 'error'])
  scenario?: Scenario;
}
export class ListDto extends ScenarioDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(80)
  search?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(['viewers-desc', 'title-asc'])
  sort?: SortOrder;
}
export class IdDto {
  @IsString()
  // 끝의 개행도 허용하지 않도록 남은 문자가 없는지 확인합니다.
  @Matches(/^[a-z0-9-]{1,32}(?![\s\S])/)
  id!: string;
}
