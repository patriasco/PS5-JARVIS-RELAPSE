(function(){
'use strict';
var logEl=document.getElementById('console'),feed=document.getElementById('logfeed'),
 status=document.getElementById('status'),percent=document.getElementById('percent'),
 fill=document.getElementById('progress'),pill=document.getElementById('pill'),
 sub=document.getElementById('subtitle'),voiceInfo=document.getElementById('voice'),
 audio=document.getElementById('jarvis-audio'),button=document.getElementById('play-voice'),
 accentBtn=document.getElementById('switch-accent'),steps=[
 document.getElementById('step-0'),document.getElementById('step-1'),document.getElementById('step-2')];
var phase=-1,failed=false,canplay=false,seen=new Set();
function setPhase(n,title,info){
 if(failed||n<phase)return;
 phase=n;status.textContent=title;pill.textContent=n>=3?'LOADER PRONTO':n===2?'KERNEL OK':n===1?'WEBKIT OK':'EM EXECUÇÃO';
 // Percentages are deliberately not displayed: no real percentage is available.
 percent.textContent=n>=3?'PRONTO': 'ETAPA '+(Math.min(n+1,3))+'/3';
 fill.style.width=(n===3?'100':n===2?'67':n===1?'33':'0')+'%';
 for(var j=0;j<steps.length;j++)steps[j].className=j<(n===3?3:n)?'done':j===n?'active':'';
 if(info)sub.textContent=info;
}
function processLine(text){
 if(!text||seen.has(text))return;seen.add(text);
 if(seen.size>110){seen.clear();seen.add(text);}
 feed.textContent+=(feed.textContent?'\\n':'')+text;
 feed.scrollTop=feed.scrollHeight;
 var msg=text.toLowerCase();
 if(/^\[-\]|(failed|not supported|required|unavailable|exception|error)/i.test(text)){
   failed=true;status.textContent='Falha no exploit — consulte os logs';
   pill.textContent='FALHA';pill.style.color='#ff5865';fill.style.background='#ff5865';return;
 }
 if(/elfldr is listening on port 9021|kernel chain complete/i.test(text))setPhase(3,'ELF Loader pronto','Confirmação registrada pelo Relapse');
 else if(/kernel exploit complete/i.test(text))setPhase(2,'Kernel liberado','Kernel concluído — aguardando carregador');
 else if(/arw ready|webkit base:|worker chain: ready/i.test(text))setPhase(1,'USERLAND concluído','Executando cadeia do Kernel');
 else if(/starting webkit exploit/i.test(text))setPhase(0,'Iniciando USERLAND','Aguardando resultado do WebKit');
}
function refresh(){
 var lines=logEl.children;
 for(var i=0;i<lines.length;i++)processLine((lines[i].textContent||'').trim());
}
if(typeof MutationObserver==='function'){
 var obs=new MutationObserver(refresh);obs.observe(logEl,{childList:true,subtree:true,characterData:true});
}
setInterval(refresh,1000);refresh();
function mediaError(){
 var code=audio.error&&audio.error.code;voiceInfo.textContent='ÁUDIO INDISPONÍVEL'+(code?' (erro '+code+')':'');}
audio.addEventListener('error',mediaError);
audio.addEventListener('canplay',function(){canplay=true;voiceInfo.textContent='ÁUDIO PRONTO · pressione o botão';});
audio.addEventListener('playing',function(){voiceInfo.textContent='NARRAÇÃO EM EXECUÇÃO';button.textContent='❚❚ Pausar voz';});
audio.addEventListener('ended',function(){voiceInfo.textContent='NARRAÇÃO FINALIZADA';button.textContent='▶ Reproduzir voz';});
button.addEventListener('click',function(){
 if(!audio.paused){audio.pause();button.textContent='▶ Continuar voz';voiceInfo.textContent='PAUSADO';return;}
 if(audio.ended)audio.currentTime=0;
 try{var p=audio.play();if(p&&p.catch)p.catch(function(err){voiceInfo.textContent='TOQUE BLOQUEADO: '+(err.name||'erro');});}
 catch(err){voiceInfo.textContent='ÁUDIO: '+(err.name||'erro');}
});
accentBtn.addEventListener('click',function(){document.documentElement.classList.toggle('red');});
var cvs=document.getElementById('particles'),ctx=cvs.getContext&&cvs.getContext('2d');
if(!ctx)return;
var particles=[],num=4100;for(var i=0;i<num;i++){
 var p=Math.acos(2*Math.random()-1),out=i>=3400;
 particles.push({a:Math.random()*6.283,y:Math.cos(p),r:Math.sin(p)*(out?1.08+.22*Math.random():.86+.16*Math.random()),
 size:.55+Math.random()*1.1,speed:.00032+Math.random()*.001});}
var wave=[0,3,66,76,55,53,32,16,13,36,23,14,10,6,7,3,1,0,0,1,1,1,2,11,46,52,55,32,25,43,75,63,44,48,24,63,35,28,55,60,30,25,41,34,25,16,11,6,1,0,0,0,1,1,18,48,66,79,56,65,79,55,57,64,60,45,38,29,14,45,46,25,26,42,41,37,35,18,13,5,1,0,1,1,1,11,92,82,64,35,32,52,60,48,46,48,29,48,40,35,44,38,20,8,2,1,1,1,0,0,0,1,1,4,59,100,68,47,53,68,41,18,73,79,60,52,28,72,49,25,44,51,61,67,46,26,24,17,20,22,12,7,5,6,3,1,1,3,23,98,65,52,32,43,38,23,10,3,1,0,0];var w=0,h=0,angle=0,last=0,lvl=0;
function rescale(){var scale=Math.min(1,devicePixelRatio||1),v=Math.min(innerWidth,1300);
 w=cvs.width=Math.round(innerWidth*scale);h=cvs.height=Math.round(Math.max(innerHeight,850)*scale);}
rescale();window.addEventListener('resize',rescale);
function frame(t){
 requestAnimationFrame(frame);if(t-last<34)return;last=t;
 ctx.clearRect(0,0,w,h);
 var intensity=audio&&!audio.paused?wave[Math.min(wave.length-1,Math.floor(audio.currentTime*20))]/100:.05;
 lvl+=(intensity-lvl)*.2;angle+=.002;
 var c=Math.cos(angle),s=Math.sin(angle),r=Math.min(w,h)*.33*(1+lvl*.12),cx=w/2,cy=h*.39;
 ctx.fillStyle='rgba(158,225,248,.72)';
 for(var i=0;i<num;i++){var v=particles[i];v.a+=v.speed;
 var x=Math.cos(v.a)*v.r,z=Math.sin(v.a)*v.r,depth=x*s+z*c;
 var proj=1/(1.8-depth*.45),px=(x*c-z*s)*proj;
 var size=Math.max(1,v.size*proj);
 ctx.fillRect(cx+px*r,cy+v.y*r*proj,size,size);
 }
}
requestAnimationFrame(frame);
})();
