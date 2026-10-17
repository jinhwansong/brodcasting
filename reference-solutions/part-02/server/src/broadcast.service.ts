import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { Broadcast, Scenario } from './types.js';
import type { ListDto } from './broadcast.dto.js';
import { broadcasts } from './fixtures.js';
@Injectable()
export class BroadcastsService {
  private async experiment(scenario: Scenario = 'normal', search = '') {
    if (scenario === 'error') throw new ServiceUnavailableException('로컬 실패 실험');
    if (scenario === 'slow') await new Promise(resolve => setTimeout(resolve, search.trim().length <= 1 ? 450 : 30));
  }
  async list(query: ListDto): Promise<{ items: Broadcast[] }> {
    await this.experiment(query.scenario, query.search);
    const search = (query.search ?? '').trim().toLocaleLowerCase('ko-KR');
    const collator = new Intl.Collator('ko-KR');
    const items = broadcasts.filter(row => row.title.toLocaleLowerCase('ko-KR').includes(search) || row.hostName.toLocaleLowerCase('ko-KR').includes(search))
      .sort((left, right) => {
        const order = query.sort === 'title-asc' ? collator.compare(left.title, right.title) : right.viewerCount - left.viewerCount;
        return order || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
      }).map(row => ({ ...row }));
    return { items };
  }
  async get(id: string, scenario?: Scenario): Promise<Broadcast> {
    await this.experiment(scenario);
    const row = broadcasts.find(item => item.id === id);
    if (!row) throw new NotFoundException('방송을 찾을 수 없습니다.');
    return { ...row };
  }
}
