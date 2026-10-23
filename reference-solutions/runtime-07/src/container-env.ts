import {readFileSync} from 'node:fs';
if(process.env.RUNTIME07_CONTAINER==='local-practice'){
 const password=readFileSync('/run/secrets/db_password','utf8').trim(),secret=readFileSync('/run/secrets/session_secret','utf8').trim();
 if(!/^[a-f0-9]{64}$/.test(password)||!/^[a-f0-9]{64}$/.test(secret))throw new Error('Invalid local container secrets');
 process.env.RUNTIME05_DATABASE_URL='postgresql://runtime05_app:'+password+'@db:5432/brodcasting_runtime05_lab';process.env.SESSION_SECRET=secret;
}
