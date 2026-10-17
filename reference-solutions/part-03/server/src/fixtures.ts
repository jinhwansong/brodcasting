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
export async function seed(_pool:Pool):Promise<void> {}
