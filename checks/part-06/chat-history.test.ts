import{expect,it}from'vitest';
import{message as validMessage,page}from'@submission/chat-history';
import{message}from'./chat-ui-fixture';
it('저장메시지의추가필드와bigint문자열을검사한다',()=>{const row={...message(),seq:'9007199254740993'};expect(validMessage(row,'r1')).toBe(true);expect(validMessage({...row,seq:9007199254740993},'r1')).toBe(false);expect(validMessage({...row,clientMessageId:'fake'},'r1')).toBe(false);expect(validMessage({...row,extra:true},'r1')).toBe(false);});
it('고정watermark의정상마지막페이지를받는다',()=>{const row={...message(),seq:'1'},value={items:[row],until:'2',next:'2',done:true};expect(page(value,'r1','0')).toEqual(value);});
it('정규bigint를숫자로변환하지않고비교한다',()=>{const row={...message(),seq:'9007199254740993'},value={items:[row],until:row.seq,next:row.seq,done:true};expect(page(value,'r1','9007199254740992',row.seq)).toEqual(value);});
it.each([
 {items:[],until:'0',next:'0',done:true,secret:'x'},
 {items:[],until:'01',next:'1',done:true},
 {items:[],until:'9223372036854775808',next:'9223372036854775808',done:true},
 {items:[],until:'2',next:'1',done:true},
 {items:[],until:'2',next:'2',done:false},
 {items:[{...message(),seq:'0'}],until:'2',next:'2',done:true},
 {items:[{...message('r2'),seq:'1'}],until:'2',next:'2',done:true},
 {items:[{...message(),seq:'3'}],until:'2',next:'2',done:true}
])('형식/진전/방/범위오류페이지를거부한다: %#',value=>{expect(page(value,'r1','0')).toBeNull();});
it('watermark변경과역순/중복seq를거부한다',()=>{const a={...message(),seq:'1'},b={...message(),seq:'2'};expect(page({items:[a],until:'2',next:'2',done:true},'r1','0','1')).toBeNull();expect(page({items:[b,a],until:'2',next:'2',done:true},'r1','0')).toBeNull();expect(page({items:[a,a],until:'2',next:'2',done:true},'r1','0')).toBeNull();});
