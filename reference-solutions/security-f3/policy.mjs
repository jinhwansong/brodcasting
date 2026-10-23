export function policyHeaders(mode,origin){
 if(!['report','enforce'].includes(mode))throw new Error('Use report or enforce');const url=new URL(origin);if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||url.origin!==origin)throw new Error('Loopback origin required');
 const policy="default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' "+origin.replace('http:','ws:')+"; img-src 'self'; media-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; report-uri /csp-report";
 return{[mode==='report'?'Content-Security-Policy-Report-Only':'Content-Security-Policy']:policy,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
}
