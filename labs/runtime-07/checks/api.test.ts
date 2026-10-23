import {afterEach,it,expect,vi} from 'vitest';
import {listNotifications} from '../client/src/api';
const row=(seq:string)=>({id:'12345678-1234-4123-8123-123456789abc',seq,body:'test',createdAt:'2026-10-21T00:00:00.000Z',readAt:null});
afterEach(()=>vi.unstubAllGlobals());
it('rejects invalid sequence ordering and oversized server pages',async()=>{for(const items of [[row('5'),{...row('6'),id:'22345678-1234-4123-8123-123456789abc'}],Array.from({length:21},(_,i)=>({...row(String(21-i)),id:'x'+i}))]){vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({items,hasMore:false,nextCursor:null}))));await expect(listNotifications({},new AbortController().signal)).rejects.toThrow();}});
it('rejects a recovery response that repeats or goes behind its exclusive cursor',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({items:[row('5')],hasMore:false,nextCursor:null}))));await expect(listNotifications({after:'5'},new AbortController().signal)).rejects.toThrow();});
