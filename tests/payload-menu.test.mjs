import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { executeSelectedPayload } from '../src/payload-selector.js';

const CMD = 'file:/data/pldmgr/payloads/pldmgr/pldmgr_v0.5.2.elf\n';
const sys={socket:1,connect:2,write:3,close:4,setsockopt:5};
function rv(n){return {low:n>>>0,hi:n<0?0xffffffff:0};}
function harness({loader=true,managerBefore=false,managerAfter=true,writeFails=false}={}) {
  globalThis.window={};
  const state={loader,managerBefore,managerAfter,writeFails,sent:'',connects:[],closes:0};
  let fd=20;
  const ptr=(backing,offset=0)=>({backing,offset,add32(delta){return ptr(backing,offset+delta);}});
  const p={
    malloc(size){return ptr(new Uint8Array(size+1000));},
    write4(pointer,n){new DataView(pointer.backing.buffer).setUint32(pointer.offset,n,true);}
  };
  const chain={async syscall(n,...args){
    switch(n){
      case sys.socket:return rv(++fd);
      case sys.setsockopt:return rv(0);
      case sys.connect:{
        const a=args[1].backing,port=(a[2]<<8)|a[3];
        assert.deepEqual(Array.from(a.slice(4,8)),[127,0,0,1]);
        state.connects.push(port);
        if(port===9021)return rv(state.loader?0:-1);
        if(port===8084)return rv(state.managerBefore||(state.sent&&state.managerAfter)?0:-1);
        return rv(-1);
      }
      case sys.write:{
        if(state.writeFails){state.writeFails=false;return rv(-1);}
        state.sent+=Buffer.from(args[1].backing.subarray(args[1].offset,args[1].offset+args[2])).toString();
        return rv(args[2]);
      }
      case sys.close:state.closes++;return rv(0);
      default:throw Error('unexpected syscall '+n);
    }
  }};
  return {p,chain,state};
}
test('PLD Manager: envia apenas o caminho existente pelo socket 9021',async()=>{
  const {p,chain,state}=harness();
  const result=await executeSelectedPayload(p,chain,sys,'pldmgr');
  assert.equal(state.sent,CMD);
  assert.equal(result.commandSent,true);
  assert.equal(result.managerReady,true);
  assert.equal(window.__jarvisPayloadSubmissionStarted,true);
  assert.ok(state.connects.includes(9021));
  assert.ok(state.connects.includes(8084));
  assert.ok(state.closes>0);
});
test('porta 8084 já aberta não reenvia o payload',async()=>{
  const {p,chain,state}=harness({managerBefore:true});
  const result=await executeSelectedPayload(p,chain,sys,'pldmgr');
  assert.equal(state.sent,'');
  assert.equal(result.alreadyRunning,true);
  assert.equal(result.commandSent,false);
});
test('porta 9021 fechada falha sem travar novas tentativas',async()=>{
  const {p,chain,state}=harness({loader:false});
  await assert.rejects(executeSelectedPayload(p,chain,sys,'pldmgr'),/9021/);
  assert.equal(state.sent,'');
  assert.equal(window.__jarvisPayloadSubmissionStarted,undefined);
  state.loader=true;
  const result=await executeSelectedPayload(p,chain,sys,'pldmgr');
  assert.equal(result.commandSent,true);
});
test('falha durante write bloqueia reenvio de resultado incerto',async()=>{
  const {p,chain,state}=harness({writeFails:true});
  await assert.rejects(executeSelectedPayload(p,chain,sys,'pldmgr'),/não confirmado/);
  assert.equal(state.sent,'');
  assert.equal(window.__jarvisPayloadSubmissionStarted,true);
  await assert.rejects(executeSelectedPayload(p,chain,sys,'pldmgr'),/duplicação/);
});
test('clique simultâneo não dispara duas transmissões',async()=>{
  const {p,chain,state}=harness();
  const first=executeSelectedPayload(p,chain,sys,'pldmgr');
  await assert.rejects(executeSelectedPayload(p,chain,sys,'pldmgr'),/andamento/);
  await first;
  assert.equal(state.sent,CMD);
});
test('nome de payload inválido não abre socket',async()=>{
  const {p,chain,state}=harness();
  await assert.rejects(executeSelectedPayload(p,chain,sys,'inexistente'),/não configurado/);
  assert.deepEqual(state.connects,[]);
});
test('index contém o seletor pós-fluxo e script sintaticamente válido',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const site=fs.readFileSync(new URL('../src/site.js',import.meta.url),'utf8');
  assert.match(html,/id="btnPayloadMode"[^>]*hidden disabled/);
  assert.match(html,/id="payloadStartPLD"/);
  assert.match(html,/id="payloadCancel"[^>]*>FECHAR/);
  assert.match(html,/id="payloadOpenManager"/);
  assert.match(site,/payloadModeButton.hidden = false/);
  assert.doesNotMatch(site,/payloadModeButton\.addEventListener\("click"/);
  assert.doesNotMatch(site,/startButton\.click\(\)/);
  const inline=html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(inline,'script inline encontrado');
  assert.doesNotThrow(()=>new vm.Script(inline[1]));
});
