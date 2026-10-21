export const DELIVERY_WIDTH=Symbol('delivery width');
export async function deliver<T>(_targets:T[],_width:1|4,_send:(target:T)=>Promise<void>):Promise<void>{throw Error('TODO C: 동시 전달 상한');}
