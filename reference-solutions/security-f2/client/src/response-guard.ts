export function mayApplyResponse(requestEpoch:number,currentEpoch:number,alive:boolean):boolean{return alive&&Number.isSafeInteger(requestEpoch)&&requestEpoch>=0&&requestEpoch===currentEpoch;}
