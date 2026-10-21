export const DELIVERY_WIDTH=Symbol('delivery width');
export async function deliver<T>(targets:T[],width:1|4,send:(target:T)=>Promise<void>):Promise<void>{
 if(width!==1&&width!==4)throw Error('Invalid delivery width');
 for(let i=0;i<targets.length;i+=width){
  const results=await Promise.allSettled(targets.slice(i,i+width).map(send));
  const failed=results.find(result=>result.status==='rejected');
  if(failed?.status==='rejected')throw failed.reason;
 }
}
