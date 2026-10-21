import type {Row} from './window';
export function useReplay(_rate:number,_running:boolean,_stop:()=>void):{rows:Row[];skipped:number}{
 // TODO C: 100ms 묶음 갱신, 대기 200개, 60초 중단, cleanup. 화면은 안전하게 빈 상태로 둡니다.
 return {rows:[],skipped:0};
}
