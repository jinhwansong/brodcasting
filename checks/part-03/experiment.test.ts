import {expect,it} from 'vitest';
import {Pool} from 'pg';
import {load} from './db-fixture';
it.each(['postgres://example.com/brodcasting_part03_lab','postgres://127.0.0.1/production',undefined])('실험도 잘못된 DB를 연결 전에 거부한다: %s',async raw=>{const {runExperiment}=await load('experiment');await expect(runExperiment(raw,[1000])).rejects.toThrow();});
it.each([{sizes:[]},{sizes:[1000000]},{sizes:[1000,1000]}])('실험 행 수를 정해진 작은 집합으로 제한한다: %j',async({sizes})=>{const {runExperiment}=await load('experiment');await expect(runExperiment('postgres://127.0.0.1:1/brodcasting_part03_lab',sizes)).rejects.toThrow(/sizes/);});
it('실제 TEMP 실험은 계획과 byte 수를 남기고 영구 테이블을 만들지 않는다',async()=>{
  const raw=process.env.PART03_TEST_LAB_URL??process.env.PART03_ADMIN_URL;
  const {runExperiment}=await load('experiment');const report=await runExperiment(raw,[1000]);
  expect(report.samples).toHaveLength(1);expect(report.environment.postgres).toMatch(/^18\./);
  const sample=report.samples[0];expect(sample.rows).toBe(1000);expect(sample.payloadBytes.all).toBeGreaterThan(sample.payloadBytes.page);
  for(const stage of ['before','after'])for(const position of ['first','deep'])expect(sample[stage][position][0].Plan['Actual Rows']).toBe(25);
  const pool=new Pool({connectionString:raw});try{expect((await pool.query("SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename='part03_bench'")).rows[0].count).toBe('0');}finally{await pool.end();}
});
