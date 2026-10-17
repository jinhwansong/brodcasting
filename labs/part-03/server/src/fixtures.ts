import type { Broadcast } from './types.js';
import type { Pool } from 'pg';
export const FIXTURES: readonly Omit<Broadcast,'favorite'>[] = [
  { id: 'a', title: '새벽 React 작업실', hostName: '세모', viewerCount: 210, description: '코드와 이야기를 나누는 가상의 방송입니다.' },
  { id: 'b', title: 'TypeScript 클리닉', hostName: '루프', viewerCount: 84, description: '코드와 이야기를 나누는 가상의 방송입니다.' },
  { id: 'c', title: '주말 산책 라디오', hostName: '모노', viewerCount: 84, description: '코드와 이야기를 나누는 가상의 방송입니다.' },
  { id: 'd', title: 'React 상태 실험', hostName: '리프', viewerCount: 450, description: '코드와 이야기를 나누는 가상의 방송입니다.' },
  { id: 'e', title: '작은 서버 만들기', hostName: 'NodeLab', viewerCount: 130, description: '코드와 이야기를 나누는 가상의 방송입니다.' },
  { id: 'f', title: '재즈와 코딩', hostName: 'jazzLab', viewerCount: 35, description: '코드와 이야기를 나누는 가상의 방송입니다.' },
];
export async function seed(pool:Pool):Promise<void> {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO demo_users(id) VALUES($1) ON CONFLICT(id) DO NOTHING',['demo-user']);
    for(const row of FIXTURES) await client.query('INSERT INTO broadcasts(id,title,host_name,viewer_count,description) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING',[row.id,row.title,row.hostName,row.viewerCount,row.description]);
    await client.query('COMMIT');
  } catch(error) {await client.query('ROLLBACK');throw error;} finally {client.release();}
}
