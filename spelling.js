const $=s=>document.querySelector(s);
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const P={x:'<path d="M6 6l12 12M18 6L6 18"/>',spk:'<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'};
document.querySelectorAll("[data-ic]").forEach(e=>e.innerHTML=`<svg viewBox="0 0 24 24" width="${e.id==="eye"?24:26}" height="${e.id==="eye"?24:26}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[e.dataset.ic]}</svg>`);

/* ---------- data ---------- */
const CATS=CFG.raw.trim().split("\n").map(l=>{const[n,w]=l.split("|");return{n,w:[...new Set(w.split(",").map(x=>x.trim()))].map(x=>({w:x,c:n}))}});
const ALL=[...new Map(CATS.flatMap(c=>c.w).map(x=>[x.w.toLowerCase(),x])).values()];
const KEY="ielts-spelling-"+CFG.id;
let S={m:{},set:{rate:.85,voice:"",play:true,auto:true,fix:true,len:20}};
try{const j=JSON.parse(localStorage.getItem(KEY));if(j){S.m=j.m||{};Object.assign(S.set,j.set)}}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const norm=s=>canon(s.toLowerCase().replace(/['’‘`]/g,"").replace(/[^a-z0-9]+/g," ").trim());
const same=(a,w)=>{const n=norm(a);return n===norm(w)||w.includes("/")&&w.split("/").some(p=>norm(p)===n)};
const shuffle=a=>{a=[...a];for(let i=a.length;i>1;){const j=Math.random()*i--|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const clock=ms=>{const s=ms/1000|0;return String(s/60|0).padStart(2,"0")+":"+String(s%60).padStart(2,"0")};

/* ---------- speech (British English) ---------- */
let voices=[];
function loadVoices(){
  voices=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang)).sort((a,b)=>/en[-_]GB/i.test(b.lang)-/en[-_]GB/i.test(a.lang));
  $("#voice").innerHTML='<option value="">Automatic (British English)</option>'+voices.map(v=>`<option value="${esc(v.voiceURI)}">${esc(v.name)} (${esc(v.lang)})</option>`).join("");
  $("#voice").value=S.set.voice;
  $("#vhint").textContent=voices.some(v=>/en[-_]GB/i.test(v.lang))?"":"No British voice was found on this device, so a default English voice is used. Chrome or Edge usually include one.";
}
if("speechSynthesis" in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices}
function speak(t){
  if(!("speechSynthesis" in window))return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(S.set.fix===false?t.replace(/\//g," or "):say(t));
  u.lang="en-GB";u.rate=+S.set.rate;
  const v=voices.find(v=>v.voiceURI===S.set.voice)||pickGB(voices);
  if(v)u.voice=v;
  speechSynthesis.speak(u);
}

/* ---------- screens ---------- */
const show=id=>["home","quiz","result"].forEach(s=>$("#"+s).hidden=s!==id);
function tab(t){
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("on",b.dataset.t===t));
  ["all","cat","mis"].forEach(x=>$("#p-"+x).hidden=x!==t);
}
function home(){
  show("home");
  $("#total").textContent=ALL.length;
  $("#len").value=S.set.len;
  $("#cats").innerHTML=CATS.map((c,i)=>`<button class="cat" data-i="${i}"><b>${esc(c.n)}</b><span>${c.w.length} words</span></button>`).join("");
  const ms=Object.values(S.m).sort((a,b)=>b.n-a.n);
  $("#mc").textContent=ms.length;
  $("#go-mis").disabled=!ms.length;$("#clr").hidden=!ms.length;
  $("#mlist").innerHTML=ms.length?ms.map(m=>`<li><div><b>${esc(m.w)}</b><small>${esc(m.c)}, you typed “${esc(m.last)}”</small></div><span class="n">×${m.n}</span><button class="rm" data-k="${esc(m.w.toLowerCase())}" aria-label="Remove ${esc(m.w)}">✕</button></li>`).join(""):'<li class="empty">No mistakes yet. Words you misspell will be collected here.</li>';
}

/* ---------- quiz ---------- */
let Q=null;
function start(list,mode){
  if(Q)clearInterval(Q.tm);
  list=shuffle(list);const n=+S.set.len;if(n&&list.length>n)list=list.slice(0,n);
  if(!list.length)return;
  Q={list,i:0,ok:0,bad:[],mode,t0:Date.now(),st:"ask",tok:0,tm:setInterval(tick,500)};
  show("quiz");tick();render();
}
const tick=()=>{$("#tm").textContent=clock(Date.now()-Q.t0)};
function setBtn(){const b=$("#chk");b.textContent=Q.st==="ask"?"CHECK":"CONTINUE";b.classList.toggle("on",Q.st!=="ask"||!!$("#ans").value.trim())}
function render(){
  const w=Q.list[Q.i],a=$("#ans");Q.st="ask";
  $("#bar").style.width=Q.i/Q.list.length*100+"%";
  $("#sc").textContent=`Word ${Q.i+1} of ${Q.list.length}. ${Q.ok} correct, ${Q.bad.length} wrong.`;
  a.value="";a.readOnly=false;a.focus();
  $("#peek").hidden=true;$("#fb").innerHTML="";$("#ft").className="ft";setBtn();
  if(S.set.play)setTimeout(()=>Q&&Q.list[Q.i]===w&&speak(w.w),250);
}
function check(){
  if(!Q||$("#quiz").hidden)return;
  if(Q.st==="done")return next();
  const a=$("#ans"),t=a.value.trim();if(!t)return;
  const w=Q.list[Q.i],good=same(t,w.w),k=w.w.toLowerCase();
  Q.st="done";a.readOnly=true;
  if(good){Q.ok++;if(Q.mode==="mis")delete S.m[k]}
  else{Q.bad.push({w:w.w,c:w.c,t});const o=S.m[k];S.m[k]={w:w.w,c:w.c,n:(o?o.n:0)+1,last:t}}
  save();
  $("#ft").className="ft "+(good?"ok":"no");
  $("#fb").innerHTML=good?'<b class="g">Correct</b>':`<b class="r">Incorrect</b><span>Correct spelling: <em>${esc(w.w)}</em></span><small>You typed: ${esc(t)}</small>`;
  setBtn();
  if(good&&S.set.auto){const tk=++Q.tok;setTimeout(()=>{if(Q&&Q.tok===tk&&Q.st==="done")next()},900)}
}
function next(){Q.tok++;if(++Q.i>=Q.list.length)return finish();render()}
function finish(){
  clearInterval(Q.tm);const n=Q.list.length;
  $("#rh").textContent=`${Q.ok} of ${n} correct`;
  $("#rp").textContent=`${Math.round(Q.ok/n*100)}% accuracy in ${clock(Date.now()-Q.t0)}`;
  $("#rbad").innerHTML=Q.bad.length?Q.bad.map(b=>`<li><div><b>${esc(b.w)}</b><small>you typed “${esc(b.t)}”</small></div></li>`).join(""):'<li class="empty">Every word was spelled correctly.</li>';
  $("#retry").hidden=!Q.bad.length;
  show("result");
}
function listen(){if(Q&&Q.list[Q.i]){speak(Q.list[Q.i].w);$("#ans").focus()}}

/* ---------- events ---------- */
$("#go-all").onclick=()=>start(ALL,"all");
$("#go-mis").onclick=()=>start(Object.values(S.m),"mis");
$("#clr").onclick=()=>{if(confirm("Remove every word from your mistakes list?")){S.m={};save();home()}};
$("#cats").onclick=e=>{const b=e.target.closest(".cat");if(b)start(CATS[b.dataset.i].w,"cat")};
$("#mlist").onclick=e=>{const b=e.target.closest(".rm");if(b){delete S.m[b.dataset.k];save();home();tab("mis")}};
document.querySelector(".tabs").onclick=e=>{const b=e.target.closest("button");if(b)tab(b.dataset.t)};
$("#len").onchange=e=>{S.set.len=+e.target.value;save()};
$("#exit").onclick=()=>{clearInterval(Q.tm);speechSynthesis.cancel();home()};
$("#rhome").onclick=home;
$("#retry").onclick=()=>{const l=Q.bad.map(b=>({w:b.w,c:b.c}));const m=Q.mode;start(l,m==="mis"?"mis":"retry")};
$("#listen").onclick=listen;
$("#eye").onclick=()=>{const p=$("#peek");p.textContent=Q.list[Q.i].w;p.hidden=!p.hidden;$("#ans").focus()};
$("#chk").onclick=check;
$("#ans").oninput=()=>Q&&setBtn();
document.addEventListener("keydown",e=>{
  if(document.querySelector("dialog[open]"))return;
  if(e.ctrlKey&&e.code==="Space"&&!$("#quiz").hidden){e.preventDefault();listen()}
  else if(e.key==="Enter"&&!$("#quiz").hidden&&e.target.tagName!=="BUTTON"){e.preventDefault();check()}
});
const openSet=()=>{$("#rate").value=S.set.rate;$("#play").checked=S.set.play;$("#auto").checked=S.set.auto;$("#fix").checked=S.set.fix!==false;$("#voice").value=S.set.voice;$("#set").showModal()};
$("#gh").onclick=$("#gq").onclick=openSet;
$("#sclose").onclick=()=>$("#set").close();
$("#set").onclose=()=>{if(Q&&!$("#quiz").hidden)$("#ans").focus()};
$("#voice").onchange=e=>{S.set.voice=e.target.value;save();speak("Listening")};
$("#rate").onchange=e=>{S.set.rate=+e.target.value;save();speak("Listening")};
$("#play").onchange=e=>{S.set.play=e.target.checked;save()};
$("#auto").onchange=e=>{S.set.auto=e.target.checked;save()};
$("#fix").onchange=e=>{S.set.fix=e.target.checked;save();if(Q&&Q.list[Q.i])speak(Q.list[Q.i].w)};
home();
