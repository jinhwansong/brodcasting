import {it,expect} from 'vitest';import {mayApplyResponse} from '../client/src/response-guard';
it('only accepts the current live account epoch',()=>{expect(mayApplyResponse(2,2,true)).toBe(true);for(const [a,b,alive] of [[1,2,true],[2,3,true],[2,2,false],[-1,-1,true],[NaN,NaN,true]] as const)expect(mayApplyResponse(a,b,alive)).toBe(false);});
