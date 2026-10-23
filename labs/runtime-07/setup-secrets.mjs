import {mkdir,writeFile} from 'node:fs/promises';import {randomBytes} from 'node:crypto';
await mkdir(new URL('./.secrets/',import.meta.url),{recursive:true,mode:0o700});
for(const name of ['db_password','session_secret'])try{await writeFile(new URL('./.secrets/'+name,import.meta.url),randomBytes(32).toString('hex'),{flag:'wx',mode:0o600});}catch(error){if(error.code!=='EEXIST')throw error;}
console.log('Local secret files are ready; existing values were preserved.');
