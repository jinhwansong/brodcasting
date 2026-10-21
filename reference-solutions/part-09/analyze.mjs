export function summarize(samples){
 if(!Array.isArray(samples)||samples.some(value=>typeof value!=='number'||!Number.isFinite(value)||value<0))throw Error('Invalid samples');
 const sorted=[...samples].sort((a,b)=>a-b),rank=p=>sorted.length?sorted[Math.ceil(sorted.length*p)-1]:null;
 return {count:sorted.length,p50:rank(.5),p95:rank(.95),p99:rank(.99)};
}
export function validate(value){
 const bounds={clients:[1,10],rooms:[1,2],senders:[1,10],rate:[1,5],seconds:[1,60],bytes:[1,500]};
 if(!value||typeof value!=='object'||Object.keys(value).length!==6||Object.keys(value).some(k=>!(k in bounds)))throw Error('Invalid scenario');
 for(const [key,[min,max]]of Object.entries(bounds))if(!Number.isInteger(value[key])||value[key]<min||value[key]>max)throw Error('Invalid '+key);
 if(value.senders>value.clients||value.rooms>value.clients)throw Error('Invalid distribution');return {...value};
}
