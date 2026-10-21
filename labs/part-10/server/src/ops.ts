export type Deployment={databaseUrl:string;secret:string;browserOrigin:string;trustedProxy:string;release:string};
export function readDeployment(_env:Record<string,string|undefined>):Deployment{throw Error('TODO A: 배포 설정 검증');}
export async function ready(_pool:{query:(sql:string)=>Promise<unknown>}):Promise<boolean>{return false;/* TODO B: 실제 DB 준비 확인 */}
export function requestLog(_value:Record<string,unknown>):Record<string,unknown>|null{return null;/* TODO C: 정제 로그 */}
