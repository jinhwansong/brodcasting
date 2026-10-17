import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { fixture, load, reset } from './db-fixture';
let db: Awaited<ReturnType<typeof fixture>>;
let repo: any;
const query = { search: '', sort: 'viewers-desc', limit: 2, offset: 0, favoritesOnly: false };
beforeAll(async () => { db = await fixture(); });
beforeEach(async () => { await reset(db.pool); const { BroadcastRepository } = await load('repository'); repo = new BroadcastRepository(db.pool); });
afterAll(async () => { await db?.close(); });
it('동률을 id로 나눠 3페이지와 빈 페이지를 반환한다', async () => {
  const pages=[];
  for(const offset of [0,2,4,6]) pages.push(await repo.list({...query,offset}));
  expect(pages.map(p=>p.items.map((x:any)=>x.id))).toEqual([['d','a'],['e','b'],['c','f'],[]]);
  expect(pages.map(p=>p.hasMore)).toEqual([true,true,false,false]);
  expect(pages[0]).toMatchObject({limit:2,offset:0});
});
it('마지막 한 행 다음 유무와 빈 검색을 구분한다', async () => {
  expect(await repo.list({...query,limit:5,offset:5})).toMatchObject({items:[{id:'f'}],hasMore:false});
  expect(await repo.list({...query,search:'not-found'})).toMatchObject({items:[],hasMore:false});
});
it('공백·대소문자 검색과 제목 정렬을 실제 SQL로 수행한다', async () => {
  expect((await repo.list({...query,search:' rEaCt ',limit:50})).items.map((x:any)=>x.id)).toEqual(['d','a']);
  const expected=(await db.pool.query('SELECT id FROM broadcasts ORDER BY title COLLATE "C", id')).rows.map(x=>x.id);
  expect((await repo.list({...query,sort:'title-asc',limit:50})).items.map((x:any)=>x.id)).toEqual(expected);
});
it.each(['%', '_', '\\'])('LIKE 문자는 검색값 그대로 취급한다: %s', async search => {
  await db.pool.query('INSERT INTO broadcasts VALUES($1,$2,$3,$4,$5)', ['literal','literal '+search,'host',1,'text']);
  expect((await repo.list({...query,search,limit:50})).items.map((x:any)=>x.id)).toEqual(['literal']);
});
it('SQL 주입 문자열은 검색값이며 테이블을 변경하지 않는다', async () => {
  expect((await repo.list({...query,search:"' OR 1=1; DROP TABLE broadcasts;--"})).items).toEqual([]);
  expect(Number((await db.pool.query('SELECT count(*) FROM broadcasts')).rows[0].count)).toBe(6);
});
it('상세는 nullable 조회와 favorite 값을 포함한다', async () => {
  expect(await repo.get('a')).toMatchObject({id:'a',favorite:false,viewerCount:210});
  expect(await repo.get('missing')).toBeNull();
});
it('같은 즐겨찾기의 동시 추가와 재시도는 한 행만 남긴다', async () => {
  await Promise.all(Array.from({length:8},()=>repo.setFavorite('a',true)));
  expect(Number((await db.pool.query('SELECT count(*) FROM favorites')).rows[0].count)).toBe(1);
  expect(await repo.get('a')).toMatchObject({favorite:true});
});
it('새 repository에도 저장되고 즐겨찾기만 조회하며 삭제는 멱등이다', async () => {
  await repo.setFavorite('a',true);
  const {BroadcastRepository}=await load('repository'); const next=new BroadcastRepository(db.pool);
  expect((await next.list({...query,favoritesOnly:true})).items.map((x:any)=>x.id)).toEqual(['a']);
  await next.setFavorite('a',false); await next.setFavorite('a',false);
  expect(await next.get('a')).toMatchObject({favorite:false});
});
it('다른 demo 사용자의 즐겨찾기를 내 결과로 섞지 않는다', async () => {
  await db.pool.query('INSERT INTO demo_users VALUES($1)',['other']);
  await db.pool.query('INSERT INTO favorites VALUES($1,$2)',['other','a']);
  expect((await repo.list({...query,favoritesOnly:true})).items).toEqual([]);
  expect(await repo.get('a')).toMatchObject({favorite:false});
});
it('음수 시청자 수는 DB CHECK로 거부한다', async () => { await expect(db.pool.query('UPDATE broadcasts SET viewer_count=-1 WHERE id=$1',['a'])).rejects.toMatchObject({code:'23514'}); });
it('즐겨찾기 중복은 복합 기본 키로 거부한다', async () => {
  await db.pool.query('INSERT INTO favorites VALUES($1,$2)',['demo-user','a']);
  await expect(db.pool.query('INSERT INTO favorites VALUES($1,$2)',['demo-user','a'])).rejects.toMatchObject({code:'23505'});
});
it.each([['missing','a'],['demo-user','missing']])('없는 사용자/방송 FK를 거부한다: %s/%s', async (user,id) => { await expect(db.pool.query('INSERT INTO favorites VALUES($1,$2)',[user,id])).rejects.toMatchObject({code:'23503'}); });
it('즐겨찾기 null 키를 거부한다', async () => { await expect(db.pool.query('INSERT INTO favorites VALUES(NULL,$1)',['a'])).rejects.toMatchObject({code:'23502'}); });
it('방송 삭제는 연결된 즐겨찾기만 지운다', async () => {
  await db.pool.query('INSERT INTO favorites VALUES($1,$2),($1,$3)',['demo-user','a','b']);
  await db.pool.query('DELETE FROM broadcasts WHERE id=$1',['a']);
  expect((await db.pool.query('SELECT broadcast_id FROM favorites')).rows).toEqual([{broadcast_id:'b'}]);
});
it('시청자+id 보조 인덱스가 존재한다', async () => {
  const indexes=(await db.pool.query('SELECT indexdef FROM pg_indexes WHERE schemaname=current_schema() AND tablename=$1',['broadcasts'])).rows.map(x=>x.indexdef).join('\n');
  expect(indexes).toMatch(/viewer_count DESC, id/);
});
it('migrations는 처음2개·재실행0개이며 seed는 중복 없이6행이다', async () => {
  const fresh=await fixture(false);
  try { const {applyMigrations}=await load('migrate'); expect(await applyMigrations(fresh.pool)).toBe(2); expect(await applyMigrations(fresh.pool)).toBe(0); const {seed}=await load('fixtures'); await seed(fresh.pool); await seed(fresh.pool); expect(Number((await fresh.pool.query('SELECT count(*) FROM broadcasts')).rows[0].count)).toBe(6); } finally {await fresh.close();}
});
it('적용한 migration 변경은 거부한다', async () => {
  const fresh=await fixture(false);
  try {const {applyMigrations}=await load('migrate'); await applyMigrations(fresh.pool,[{version:'test',sql:'CREATE TABLE guard(id int)'}]); await expect(applyMigrations(fresh.pool,[{version:'test',sql:'CREATE TABLE different(id int)'}])).rejects.toThrow(/changed/);} finally {await fresh.close();}
});
it('잘못된 migration은 앞선 DDL과 버전 기록까지 rollback한다', async () => {
  const fresh=await fixture(false);
  try {const {applyMigrations}=await load('migrate'); await expect(applyMigrations(fresh.pool,[{version:'one',sql:'CREATE TABLE rollback_probe(id int)'},{version:'two',sql:'NOT VALID SQL'}])).rejects.toThrow(); expect((await fresh.pool.query("SELECT to_regclass('rollback_probe') AS name")).rows[0].name).toBeNull();} finally {await fresh.close();}
});
it('app 역할은 조회·즐겨찾기만 허용하고 방송 쓰기와 schema DDL을 거부한다', async () => {
  const app=await db.limitedPool();
  expect((await app.query('SELECT id FROM broadcasts')).rows).toHaveLength(6);
  await app.query('INSERT INTO favorites VALUES($1,$2)',['demo-user','a']);
  await app.query('DELETE FROM favorites WHERE user_id=$1',['demo-user']);
  await expect(app.query('DELETE FROM broadcasts')).rejects.toMatchObject({code:'42501'});
  await expect(app.query('CREATE TABLE forbidden(id int)')).rejects.toMatchObject({code:'42501'});
});
it.each(['postgres://localhost/brodcasting_part03_test','postgres://example.com/brodcasting_part03_test','postgres://127.0.0.1/production','https://127.0.0.1/brodcasting_part03_test',undefined])('테스트 대상 오지정을 연결 전에 거부한다: %s', async raw => {
  const {requireLocalDatabase}=await load('db-config'); expect(()=>requireLocalDatabase(raw,'brodcasting_part03_test')).toThrow();
});
