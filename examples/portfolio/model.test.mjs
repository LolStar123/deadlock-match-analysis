import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from './model.mjs';
test('workflow invariants and boundary cases',()=>{
const r=m.analyse([{economy:1,won:true},{economy:2,won:false},{economy:-1,won:false}],'economy',0);assert.equal(r.yes.rate,.5);assert.equal(r.no.rate,0);assert.equal(r.yes.n,2);assert.equal(m.group([]).rate,null);const ci=m.interval(50,100);assert.ok(ci[0]>.40&&ci[0]<.41&&ci[1]>.59&&ci[1]<.60);
});
