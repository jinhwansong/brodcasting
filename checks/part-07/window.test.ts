import {expect,test} from 'vitest';
import {retain,range} from '@submission/window';
const rows=(start:number,n:number)=>Array.from({length:n},(_,i)=>({id:start+i,text:'연습 '+(start+i)}));
test('보관량은 1000개, 오래된 것부터 버리고 입력을 보존한다',()=>{const old=rows(1,990),batch=rows(991,50);const got=retain(old,batch);expect(got).toHaveLength(1000);expect(got[0].id).toBe(41);expect(got.at(-1)?.id).toBe(1040);expect(old).toHaveLength(990);expect(batch).toHaveLength(50);});
test('한 번에 큰 묶음이 와도 최근 1000개만 보관한다',()=>{expect(retain([],rows(1,2000)).map(x=>x.id)).toEqual(rows(1001,1000).map(x=>x.id));});
test('빈 목록과 처음 화면은 음수 범위를 만들지 않는다',()=>{expect(range(0,0)).toEqual({start:0,end:0});expect(range(1000,0)).toEqual({start:0,end:11});});
test('중간과 끝 스크롤은 보이는 8줄과 양옆 3줄만 선택한다',()=>{expect(range(1000,480)).toEqual({start:7,end:21});expect(range(1000,999999)).toEqual({start:989,end:1000});});
