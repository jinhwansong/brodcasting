const channels:Record<string,{tag:string;topic:string;room:string}>={a:{tag:'개발',topic:'React',room:'r1'},b:{tag:'개발',topic:'TypeScript',room:'r2'},c:{tag:'토크',topic:'라디오',room:'r1'},d:{tag:'개발',topic:'React',room:'r1'},e:{tag:'개발',topic:'서버',room:'r2'},f:{tag:'음악',topic:'재즈',room:'r1'}};
export const channelInfo=(id:string)=>channels[id]??{tag:'방송',topic:'이야기',room:'r1'};
