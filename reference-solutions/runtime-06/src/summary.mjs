export function summarize(values){
 if(!Array.isArray(values)||!values.length||values.some(value=>!Number.isFinite(value)||value<0))throw new Error('Non-negative measurements required');
 const sorted=[...values].sort((a,b)=>a-b),at=p=>sorted[Math.ceil(sorted.length*p)-1];
 return{count:sorted.length,p50:at(.5),p95:at(.95),max:sorted.at(-1)};
}
