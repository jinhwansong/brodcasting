import {expect,it} from 'vitest';
import {Pool} from 'pg';
import {load,A} from './db-fixture';
const clientMessageId='c3333333-3333-4333-8333-333333333333';
async function service(){const {ChatService}=await load('chat.service');return new ChatService(new Pool({host:'127.0.0.1',port:1}));}
it('허용방의join입력만받고unknownidentity를거부한다',async()=>{
 const s=await service();expect(s.parseJoin({roomId:'r1'})).toEqual({roomId:'r1'});expect(s.parseJoin({roomId:'r2'})).toEqual({roomId:'r2'});expect(()=>s.parseJoin({roomId:'r1',userId:A})).toThrow(expect.objectContaining({status:400}));
});
it.each([null,[],{},'r1',{roomId:'r3'},{roomId:1},{roomId:'r1\n'},{roomId:'r1',role:'admin'}])('잘못된join입력을400으로거부한다: %#',async value=>{const s=await service();expect(()=>s.parseJoin(value)).toThrow(expect.objectContaining({status:400}));});
it('발송ID와Unicode500자를원문으로받는다',async()=>{
 const s=await service();for(const text of [' 안녕 ','<script>alert(1)</script>','😀'.repeat(500)])expect(s.parseSend({roomId:'r1',text,clientMessageId})).toEqual({roomId:'r1',text,clientMessageId});
});
it.each([null,{},[],{roomId:'r1',text:''},{roomId:'r1',text:' \n '},{roomId:'r1',text:'😀'.repeat(501)},{roomId:'r1',text:1},{roomId:'r1',text:'hi',userId:A},{roomId:'r3',text:'hi'}])('잘못된발송내용을400으로거부한다: %#',async value=>{
 const s=await service(),input=typeof value==='object'&&value!==null&&!Array.isArray(value)?{...value,clientMessageId}:value;expect(()=>s.parseSend(input)).toThrow(expect.objectContaining({status:400}));
});
it.each([undefined,null,1,'','uuid','c3333333-3333-1333-8333-333333333333',clientMessageId+'\n'])('UUIDv4가아닌발송ID를거부한다: %#',async id=>{const s=await service();expect(()=>s.parseSend({roomId:'r1',text:'정상',clientMessageId:id})).toThrow(expect.objectContaining({status:400}));});
it('이력의정규bigint문자열과고정until을받는다',async()=>{const s=await service();for(const value of [{roomId:'r1',after:'0'},{roomId:'r2',after:'9007199254740993',until:'9223372036854775807'}])expect(s.parseHistory(value)).toEqual(value);});
it.each(['','00','01','-1','1.0','1e2',' 1','1\n','9223372036854775808',1,null])('잘못된after를거부한다: %#',async after=>{const s=await service();expect(()=>s.parseHistory({roomId:'r1',after})).toThrow(expect.objectContaining({status:400}));});
it.each([{roomId:'r1',after:'0',until:undefined},{roomId:'r1',after:'2',until:'1'},{roomId:'r1',after:'0',until:'00'},{roomId:'r1',after:'0',limit:1000},null,[],{roomId:'r3',after:'0'}])('잘못된이력형식/범위를거부한다: %#',async value=>{const s=await service();expect(()=>s.parseHistory(value)).toThrow(expect.objectContaining({status:400}));});
