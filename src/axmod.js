/* AXMOD: the MedDev accessibility module. One drawer, every app, styled by whatever skin is on.
   Put <div data-axmod></div> in an app's Settings and it becomes the ACCESSIBILITY button; the drawer slides out from the side.
   Cmd+Option+A opens it from anywhere. Settings go to the app's settings ("axmod") when there's an app bridge, else this device.
   Options, defaults and presets come from src/axmod.schema.json (shared with the Swift port). Apps can add to it:
     AXMOD.caption(text, {who})            show a sound caption (when Sound captions is on)
     AXMOD.channels([{id,label,value,set}]) volume sliders, one per sound channel
     AXMOD.describe(el, () => "text", {label}) a text version of a visual (when Text version of visuals is on)
     AXMOD.setSpeaker(fn(text, {rate, voice}))   use the app's own voices for Read aloud
     AXMOD.get(), AXMOD.set({...}), AXMOD.reset(), AXMOD.open(), AXMOD.close(), AXMOD.still(), AXMOD.on(fn)
     "axmod:change" event on window, with detail = the current values. */
(()=>{
  if(window.AXMOD&&window.AXMOD.mounted) return;
  const S=/*AXMOD_SCHEMA*/null;
  if(!S) return;
  const OPT=Object.fromEntries(S.options.map(o=>[o.id,o]));
  const html=document.documentElement, KEY="axmod";
  const app=()=>window.mdfmApp||null;
  const mq=q=>{ try{ return matchMedia("("+q+")"); }catch(e){ return null; } };

  /* ---------- state ---------- */
  let saved={ schema:1, values:{}, channels:{} };
  let store={
    get(){ try{ const a=app(); if(a&&a.settings){ const v=(a.settings.get()||{}).axmod; if(v&&typeof v==="object") return v; } }catch(e){}
      try{ return JSON.parse(localStorage.getItem(KEY)||"null"); }catch(e){ return null; } },
    set(v){ try{ localStorage.setItem(KEY,JSON.stringify(v)); }catch(e){} try{ const a=app(); if(a&&a.settings) a.settings.set({axmod:v}); }catch(e){} }
  };
  const load=()=>{ const v=store.get(); saved={ schema:1, values:(v&&v.values&&typeof v.values==="object")?v.values:{}, channels:(v&&v.channels)||{} }; };
  const osDefault=o=>{ if(!o.os) return undefined; const m=mq(o.os); return m&&m.matches?true:undefined; };
  const val=k=>{ const o=OPT[k]; if(!o) return undefined; if(k in saved.values) return saved.values[k]; const d=osDefault(o); return d===undefined?o.default:d; };
  const values=()=>Object.fromEntries(S.options.map(o=>[o.id,val(o.id)]));
  const clean=(k,v)=>{ const o=OPT[k]; if(!o) return undefined;
    if(o.type==="bool") return !!v;
    if(o.type==="range"){ const n=Number(v); return isFinite(n)?Math.max(o.min,Math.min(o.max,Math.round(Math.round(n/o.step)*o.step*1000)/1000)):o.default; }
    if(o.type==="choice") return o.choices.some(c=>c[0]===String(v))?String(v):o.default;
    return String(v==null?"":v); };
  function set(patch,{persist=true}={}){
    for(const [k,v] of Object.entries(patch||{})){ if(!OPT[k]) continue; const c=clean(k,v);
      const base=(()=>{ const d=osDefault(OPT[k]); return d===undefined?OPT[k].default:d; })();
      if(c===base) delete saved.values[k]; else saved.values[k]=c; }
    if(persist) store.set(saved);
    apply();
  }

  /* ---------- applying ---------- */
  const BOOL_CLASSES=["contrast","colorblind","gray","focus","cursor","spacing","left","ruler","reduce","noflash","still","steady","calm","captions","lock","textalt"];
  const still=()=>!!(val("reduce")||val("still")||val("steady")||val("calm"));
  function apply(){
    const v=values();
    for(const k of BOOL_CLASSES) html.classList.toggle("ax-"+k,!!v[k]);
    html.classList.toggle("ax-still-any",still());
    const z=Number(v.size)/100||1; html.style.setProperty("--ax-zoom",String(z)); html.classList.toggle("ax-zoomed",z!==1);
    html.classList.toggle("ax-font-readable",v.font==="readable"); html.classList.toggle("ax-font-dyslexia",v.font==="dyslexia");
    const f=[]; if(v.gray) f.push("grayscale(1)"); else if(Number(v.saturation)!==100) f.push(`saturate(${Number(v.saturation)/100})`);
    html.style.setProperty("--ax-filter",f.join(" ")||"none"); html.classList.toggle("ax-filtered",f.length>0);
    // High contrast ignores the theme: the skin's stylesheet is switched off while it's on (and back on after).
    const sk=document.getElementById("meddev-skin-theme");
    if(sk){ if(v.contrast){ sk.disabled=true; sk.dataset.axOff="1"; } else if(sk.dataset.axOff){ sk.disabled=false; delete sk.dataset.axOff; } }
    // Lock the layout: skin dropdowns can't change while it's on.
    document.querySelectorAll("select[data-mdfm-skins]").forEach(sel=>{ if(v.lock){ if(!sel.dataset.axLocked){ sel.dataset.axLocked=sel.disabled?"was":"1"; sel.disabled=true; sel.title="Locked by AXMOD (Lock the layout)"; } }
      else if(sel.dataset.axLocked){ if(sel.dataset.axLocked==="1") sel.disabled=false; sel.removeAttribute("title"); delete sel.dataset.axLocked; } });
    document.querySelectorAll('a[target="_blank"]').forEach(a=>{ if(!a.dataset.axNew){ a.dataset.axNew="1"; const s=document.createElement("span"); s.className="ax-sr"; s.textContent=" (opens a new window)"; a.appendChild(s); } });
    if(v.noflash) slowFlashes(); else restoreFlashes();
    if(!v.ruler) ruler.hide();
    if(!v.captions) caps.hide();
    alts.refresh();
    if(drawer) paint();
    led();
    try{ window.dispatchEvent(new CustomEvent("axmod:change",{detail:v})); }catch(e){}
    for(const fn of listeners){ try{ fn(v); }catch(e){} }
  }
  const listeners=new Set();

  /* ---------- no flashing: slow anything that would blink more than 3 times a second ---------- */
  const FLASHY=["opacity","visibility","backgroundColor","color","filter","boxShadow","background","borderColor","outlineColor","fill"];
  const slowed=new Map();
  function checkAnim(a){
    try{ const t=a.effect&&a.effect.getTiming?a.effect.getTiming():null; if(!t||slowed.has(a)) return;
      const dur=typeof t.duration==="number"?t.duration:0; if(!dur||dur>=1000) return;
      const kf=a.effect.getKeyframes?a.effect.getKeyframes():[]; if(!kf.some(k=>FLASHY.some(p=>p in k))) return;
      slowed.set(a,a.playbackRate); a.playbackRate=dur/1000*(a.playbackRate||1); }catch(e){} }
  function slowFlashes(){ try{ (document.getAnimations?document.getAnimations():[]).forEach(checkAnim); }catch(e){} }
  function restoreFlashes(){ for(const [a,r] of slowed){ try{ a.playbackRate=r||1; }catch(e){} } slowed.clear(); }
  document.addEventListener("animationstart",()=>{ if(val("noflash")) slowFlashes(); },true);

  /* ---------- read aloud ---------- */
  let speaker=null;
  const synth=window.speechSynthesis||null;
  function voices(){ try{ return synth?synth.getVoices():[]; }catch(e){ return []; } }
  function speak(text){
    text=String(text||"").replace(/\s+/g," ").trim().slice(0,4000); if(!text) return;
    const rate=Number(val("speakRate"))||1, voice=val("voice")||"";
    if(speaker){ try{ speaker(text,{rate,voice}); return; }catch(e){} }
    if(!synth) return; try{ synth.cancel(); const u=new SpeechSynthesisUtterance(text); u.rate=rate; const vv=voices().find(x=>x.voiceURI===voice||x.name===voice); if(vv) u.voice=vv; synth.speak(u); }catch(e){}
  }
  function hush(){ try{ if(speaker&&speaker.stop) speaker.stop(); }catch(e){} try{ synth&&synth.cancel(); }catch(e){} }
  const speaking=()=>{ try{ return !!(synth&&(synth.speaking||synth.pending)); }catch(e){ return false; } };
  function nameOf(el){
    if(!el||el===document.body) return "";
    let n=el.getAttribute("aria-label")||"";
    if(!n&&el.getAttribute("aria-labelledby")) n=el.getAttribute("aria-labelledby").split(/\s+/).map(id=>{ const t=document.getElementById(id); return t?t.textContent:""; }).join(" ");
    if(!n&&el.labels&&el.labels[0]) n=el.labels[0].textContent;
    if(!n) n=el.getAttribute("title")||el.getAttribute("alt")||el.textContent||"";
    n=n.replace(/\s+/g," ").trim().slice(0,240);
    const role=el.getAttribute("role")||(el.tagName==="BUTTON"?"button":el.tagName==="A"?"link":el.tagName==="SELECT"?"menu":el.type==="checkbox"?"checkbox":el.type==="range"?"slider":el.tagName==="INPUT"||el.tagName==="TEXTAREA"?"text field":"");
    const st=[]; if(el.getAttribute("aria-pressed")==="true") st.push("on"); else if(el.getAttribute("aria-pressed")==="false") st.push("off");
    if(el.type==="checkbox") st.push(el.checked?"checked":"not checked");
    if(el.getAttribute("aria-valuetext")) st.push(el.getAttribute("aria-valuetext")); else if(el.getAttribute("aria-valuenow")) st.push(el.getAttribute("aria-valuenow"));
    if(el.tagName==="SELECT"&&el.selectedOptions&&el.selectedOptions[0]) st.push(el.selectedOptions[0].textContent);
    if((el.tagName==="INPUT"&&el.type==="text")||el.tagName==="TEXTAREA") st.push(el.value?("contains "+el.value.slice(0,80)):"empty");
    return [n,role,st.join(", ")].filter(Boolean).join(", ");
  }
  let focusT=0;
  document.addEventListener("focusin",e=>{ if(!val("speak")) return; clearTimeout(focusT); focusT=setTimeout(()=>speak(nameOf(e.target)),120); ruler.toEl(e.target); });
  function readSelection(){
    const sel=String(window.getSelection?window.getSelection():"").trim();
    if(sel) return speak(sel);
    const f=document.activeElement; if(f&&f!==document.body&&!(drawer&&drawer.contains(f))) return speak(nameOf(f)+". "+((f.closest("section,fieldset,.panel,.deck")||{}).innerText||"").slice(0,1500));
    speak((document.querySelector("main,[role=main],.wrap")||document.body).innerText);
  }

  /* ---------- reading ruler ---------- */
  const ruler=(()=>{ let el=null, on=false;
    const make=()=>{ if(el&&el.isConnected) return el; el=document.createElement("div"); el.className="ax-ruler-band"; el.setAttribute("aria-hidden","true"); document.body.appendChild(el); return el; };
    const at=y=>{ if(!val("ruler")) return; const z=Number(val("size"))/100||1; make().style.top=(y/z)+"px"; on=true; };
    addEventListener("pointermove",e=>{ if(val("ruler")) at(e.clientY); },{passive:true});
    return { hide(){ if(el) el.style.top="-999px"; on=false; }, toEl(t){ if(!val("ruler")||!t||!t.getBoundingClientRect) return; const r=t.getBoundingClientRect(); at(r.top+r.height/2); }, get on(){ return on; } };
  })();

  /* ---------- sound captions ---------- */
  const caps=(()=>{ let box=null, t=0;
    const make=()=>{ if(box&&box.isConnected) return box; box=document.createElement("div"); box.className="ax-cap"; box.setAttribute("role","log"); box.setAttribute("aria-live","polite"); box.setAttribute("aria-label","Sound captions"); document.body.appendChild(box); return box; };
    return {
      show(text,{who="",sound=false}={}){ if(!val("captions")||!text) return; const b=make(); const line=document.createElement("p"); line.className=sound?"ax-snd":"";
        if(who){ const w=document.createElement("b"); w.textContent=who+": "; line.appendChild(w); } line.appendChild(document.createTextNode(sound?`[${text}]`:text));
        b.appendChild(line); while(b.children.length>3) b.firstChild.remove(); b.classList.add("on"); clearTimeout(t); t=setTimeout(()=>{ b.classList.remove("on"); b.textContent=""; },val("still")?30000:14000); },
      hide(){ if(box){ box.classList.remove("on"); box.textContent=""; } } };
  })();

  /* ---------- text versions of visuals ---------- */
  const alts=(()=>{ const reg=[]; let timer=0;
    const tick=()=>{ for(const r of reg){ if(!r.el.isConnected){ r.box&&r.box.remove(); continue; }
        if(!r.box||!r.box.isConnected){ r.box=document.createElement("div"); r.box.className="ax-alt"; r.el.insertAdjacentElement("afterend",r.box); }
        let s=""; try{ s=typeof r.fn==="function"?r.fn():String(r.fn); }catch(e){ s=""; } r.box.textContent=(r.label?r.label+": ":"")+(s||"no reading"); } };
    return {
      add(el,fn,{label=""}={}){ if(!el) return; reg.push({el,fn,label,box:null}); this.refresh(); },
      refresh(){ clearInterval(timer); if(val("textalt")&&reg.length){ tick(); timer=setInterval(tick,2000); } else for(const r of reg){ r.box&&r.box.remove(); r.box=null; } },
      count:()=>reg.length };
  })();

  /* ---------- volume channels ---------- */
  let chans=[];
  function setChannels(list){ chans=(list||[]).filter(c=>c&&c.id&&typeof c.set==="function");
    for(const c of chans){ const v=saved.channels[c.id]; if(typeof v==="number") try{ c.set(v); }catch(e){} }
    if(drawer) build(); }

  /* ---------- the button and the drawer ---------- */
  let drawer=null, opener=null, lastFocus=null;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  let uid=0; const id=p=>`ax-${p}-${++uid}`;
  function mountButtons(){
    document.querySelectorAll("[data-axmod]").forEach(host=>{ if(host.dataset.axmodMounted) return; host.dataset.axmodMounted="1";
      if(host.dataset.axmod==="text"){ const b=document.createElement("button"); b.type="button"; b.className="btn ax-open"; b.textContent="Accessibility"; wireOpen(b); host.appendChild(b); return; }
      host.classList.add("ax-host");
      host.innerHTML=`<div class="rd-btn ax-open-btn"><span class="rd-led"></span><button type="button" class="ax-open" aria-label="Accessibility (AXMOD)" title="Accessibility: Cmd+Option+A"></button><small>ACCESSIBILITY</small></div><span class="ax-host-hint">Text size, contrast, motion, read aloud and more.</span>`;
      wireOpen(host.querySelector("button")); });
    led();
  }
  function wireOpen(b){ b.setAttribute("aria-haspopup","dialog"); b.setAttribute("aria-expanded","false"); b.addEventListener("click",e=>{ opener=b; toggle(); }); }
  function led(){ const n=Object.keys(saved.values).length; document.querySelectorAll(".ax-open-btn .rd-led").forEach(l=>l.classList.toggle("on",n>0));
    document.querySelectorAll(".ax-open").forEach(b=>{ b.setAttribute("aria-expanded",String(!!(drawer&&drawer.classList.contains("open")))); if(drawer) b.setAttribute("aria-controls",drawer.id); }); }

  function knobHTML(o,lid){ return `<div class="tk ax-knob" data-k="${o.id}"><div class="tk-dial"><svg class="tk-ticks" viewBox="0 0 60 60" aria-hidden="true"></svg><div class="rd-knob tk-knob" role="slider" tabindex="0" aria-labelledby="${lid}" aria-valuemin="${o.min}" aria-valuemax="${o.max}"></div></div><div class="rd-mm"><span>MIN</span><span>MAX</span></div></div>`; }
  function rowHTML(o){
    const nid=id("n"), hid=id("h");
    const ref=o.wcag?`<span class="ax-ref" title="WCAG 2.2 success criterion">${esc(o.wcag)}</span>`:"";
    if(o.type==="bool") return `<div class="ax-row" data-k="${o.id}"><div class="rd-btn"><span class="rd-led"></span><button type="button" aria-pressed="false" aria-labelledby="${nid}" aria-describedby="${hid}"></button></div><div class="ax-txt"><span class="ax-name" id="${nid}">${esc(o.label)}</span><small class="ax-hint" id="${hid}">${esc(o.hint||"")}</small></div>${ref}</div>`;
    if(o.type==="choice") return `<div class="ax-row ax-wide" data-k="${o.id}"><div class="ax-txt"><span class="ax-name" id="${nid}">${esc(o.label)}</span><small class="ax-hint" id="${hid}">${esc(o.hint||"")}</small></div>${ref}<div class="ax-seg" role="group" aria-labelledby="${nid}" aria-describedby="${hid}">${o.choices.map(([v,l])=>`<button type="button" class="btn" data-v="${esc(v)}" aria-pressed="false">${esc(l)}</button>`).join("")}</div></div>`;
    if(o.type==="range") return `<div class="ax-row ax-range" data-k="${o.id}">${knobHTML(o,nid)}<div class="ax-txt"><span class="ax-name" id="${nid}">${esc(o.label)}</span><small class="ax-hint">${esc(o.hint||"")}</small><span class="lcd ax-read" aria-hidden="true"></span></div>${ref}</div>`;
    if(o.type==="voice") return `<div class="ax-row ax-wide" data-k="${o.id}"><label class="ax-txt ax-field"><span class="ax-name">${esc(o.label)}</span><select class="ax-voice"></select><small class="ax-hint">${esc(o.hint||"")}</small></label></div>`;
    return "";
  }
  function build(){
    const isOpen=drawer&&drawer.classList.contains("open");
    if(!drawer){ drawer=document.createElement("aside"); drawer.id="axmod"; drawer.className="panel ax-drawer"; drawer.setAttribute("role","dialog"); drawer.setAttribute("aria-modal","true"); drawer.setAttribute("aria-labelledby","axmod-title"); drawer.tabIndex=-1;
      document.body.appendChild(drawer); }
    const sec=s=>S.options.filter(o=>o.section===s);
    const presetKeys=S.presets.map(p=>`<button type="button" class="btn" data-preset="${p.id}" aria-pressed="false">${esc(p.label)}</button>`).join("");
    const chanRows=chans.map(c=>`<div class="ax-row ax-range" data-chan="${esc(c.id)}">${knobHTML({id:"chan-"+c.id,min:0,max:100},"axc-"+esc(c.id))}<div class="ax-txt"><span class="ax-name" id="axc-${esc(c.id)}">${esc(c.label)} volume</span><span class="lcd ax-read" aria-hidden="true"></span></div></div>`).join("");
    drawer.innerHTML=`<div class="wtitle"><span class="wctl ax-wctl"><span class="wbtn"><button type="button" class="ax-close" aria-label="Close accessibility"></button><small>CLOSE</small></span></span><span id="axmod-title">Accessibility</span></div>
<div class="ax-body">
  <section class="ax-sec" aria-labelledby="axs-presets"><h3 id="axs-presets">${esc(S.sections[0].label)}</h3><p class="ax-hint">One tap sets several options. Change anything after and it becomes Custom.</p><div class="ax-seg ax-presets" role="group" aria-labelledby="axs-presets">${presetKeys}<span class="ax-custom" aria-live="polite"></span></div></section>
  ${S.sections.slice(1).map(s=>`<section class="ax-sec" aria-labelledby="axs-${s.id}"><h3 id="axs-${s.id}">${esc(s.label)}</h3>${sec(s.id).map(rowHTML).join("")}${s.id==="reading"?`<div class="row ax-actions"><button type="button" class="btn ax-readpage">Read this page</button><button type="button" class="btn ax-hush">Stop reading</button></div>`:""}${s.id==="hearing"?(chanRows||`<p class="ax-hint ax-nosound">This app has one volume control for now; use it for everything.</p>`):""}${s.id==="controls"?`<dl class="ax-keys">${S.shortcuts.map(([k,d])=>`<dt><kbd>${esc(k)}</kbd></dt><dd>${esc(d)}</dd>`).join("")}</dl>`:""}</section>`).join("")}
  <section class="ax-sec ax-score" aria-labelledby="axs-score"><h3 id="axs-score">Projected WCAG 2.2</h3><div class="lcd ax-lcd" role="status" aria-live="polite"></div><p class="ax-hint">A self-estimate from these settings and this app, not an audit.</p><ul class="ax-open-list"></ul></section>
</div>
<div class="ax-foot row"><button type="button" class="btn ax-reset">Reset all</button><span class="ax-ver">AXMOD · MedDev Receiver ${esc((window.MedDevReceiver&&window.MedDevReceiver.version)||"")}</span></div>`;
    wire(); paint(); ticks();
    if(isOpen) drawer.classList.add("open");
    // decorations follow the skin like any other panel
    try{ if(document.querySelector(".skin-decor")&&!drawer.querySelector(":scope > .skin-decor")){ const d=document.createElement("i"); d.className="skin-decor"; d.setAttribute("aria-hidden","true"); d.dataset.part="panel"; drawer.appendChild(d); } }catch(e){}
  }
  function ticks(){ drawer.querySelectorAll(".tk-ticks").forEach(svg=>{ let h=""; for(let i=0;i<=10;i++){ const a=(-135+i*27)*Math.PI/180, major=i===0||i===10||i===5; h+=`<circle cx="${30+Math.sin(a)*27}" cy="${30-Math.cos(a)*27}" r="${major?1.5:.9}" fill="rgba(226,229,238,.75)"/>`; } svg.innerHTML=h; }); }
  function knob(el,get,put,min,max,step,fmt){
    let sx=0,sy=0,sv=0; const show=()=>{ const v=get(), f=(v-min)/(max-min); el.style.transform=`rotate(${-135+f*270}deg)`; el.setAttribute("aria-valuenow",String(Math.round(v*100)/100)); el.setAttribute("aria-valuetext",fmt(v));
      const r=el.closest(".ax-row").querySelector(".ax-read"); if(r) r.textContent=fmt(v); };
    const p=v=>{ put(Math.max(min,Math.min(max,Math.round(v/step)*step))); show(); };
    el.addEventListener("pointerdown",e=>{ el.setPointerCapture(e.pointerId); sx=e.clientX; sy=e.clientY; sv=get(); e.preventDefault(); });
    el.addEventListener("pointermove",e=>{ if(!el.hasPointerCapture(e.pointerId)) return; p(sv+((e.clientX-sx)-(e.clientY-sy))/150*(max-min)); });
    el.addEventListener("wheel",e=>{ e.preventDefault(); p(get()-Math.sign(e.deltaY)*step); },{passive:false});
    el.addEventListener("keydown",e=>{ const k=e.key, st=e.shiftKey?step*3:step; if(k==="ArrowUp"||k==="ArrowRight") p(get()+st); else if(k==="ArrowDown"||k==="ArrowLeft") p(get()-st); else if(k==="Home") p(min); else if(k==="End") p(max); else return; e.preventDefault(); });
    el._axShow=show; show();
  }
  function wire(){
    drawer.querySelector(".ax-close").addEventListener("click",close);
    drawer.querySelectorAll(".ax-row[data-k]").forEach(row=>{ const k=row.dataset.k, o=OPT[k];
      if(o.type==="bool"){ const b=row.querySelector("button"); const flip=()=>{ set({[k]:!val(k)}); if(val("speak")) speak(o.label+", "+(val(k)?"on":"off")); };
        b.addEventListener("click",flip); row.querySelector(".ax-txt").addEventListener("click",flip); }
      if(o.type==="choice") row.querySelectorAll(".ax-seg button").forEach(b=>b.addEventListener("click",()=>set({[k]:b.dataset.v})));
      if(o.type==="range"){ const fmt=v=>o.unit==="×"?`${(Math.round(v*10)/10).toFixed(1)}×`:`${Math.round(v)}${o.unit||""}`; knob(row.querySelector(".tk-knob"),()=>Number(val(k)),v=>set({[k]:v}),o.min,o.max,o.step,fmt); }
      if(o.type==="voice"){ const sel=row.querySelector("select"); const fill=()=>{ const vs=voices(), cur=val("voice"); sel.innerHTML=`<option value="">System voice</option>`+vs.map(v=>`<option value="${esc(v.voiceURI)}">${esc(v.name)}${v.lang?` (${esc(v.lang)})`:""}</option>`).join(""); sel.value=vs.some(v=>v.voiceURI===cur)?cur:""; };
        fill(); try{ synth&&synth.addEventListener&&synth.addEventListener("voiceschanged",fill); }catch(e){} sel.addEventListener("change",()=>{ set({voice:sel.value}); speak("This is how I sound."); }); }
    });
    drawer.querySelectorAll(".ax-row[data-chan]").forEach(row=>{ const c=chans.find(x=>x.id===row.dataset.chan); if(!c) return;
      const get=()=>{ const v=saved.channels[c.id]; return Math.round(100*(typeof v==="number"?v:(typeof c.value==="function"?c.value():(c.value==null?1:c.value)))); };
      knob(row.querySelector(".tk-knob"),get,v=>{ saved.channels[c.id]=v/100; try{ c.set(v/100); }catch(e){} store.set(saved); },0,100,5,v=>`${Math.round(v)}%`); });
    drawer.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>{ const p=S.presets.find(x=>x.id===b.dataset.preset); saved.values={}; set(p.values); if(val("speak")) speak(p.label+" set up."); }));
    drawer.querySelector(".ax-reset").addEventListener("click",()=>{ saved.values={}; saved.channels={}; for(const c of chans){ try{ c.set(typeof c.value==="function"?c.value():1); }catch(e){} } set({}); });
    drawer.querySelector(".ax-readpage").addEventListener("click",()=>speak((document.querySelector("main,[role=main],.wrap")||document.body).innerText));
    drawer.querySelector(".ax-hush").addEventListener("click",hush);
    drawer.addEventListener("keydown",e=>{
      if(e.key==="Escape"){ if(speaking()){ hush(); } else close(); e.preventDefault(); e.stopPropagation(); return; }
      if(e.key!=="Tab") return; const f=[...drawer.querySelectorAll('button:not([disabled]),select,input,[tabindex="0"]')].filter(x=>x.offsetParent!==null||x===document.activeElement); if(!f.length) return;
      const first=f[0], last=f[f.length-1]; if(e.shiftKey&&document.activeElement===first){ last.focus(); e.preventDefault(); } else if(!e.shiftKey&&document.activeElement===last){ first.focus(); e.preventDefault(); } });
  }
  function currentPreset(){ const keys=Object.keys(saved.values); if(!keys.length) return "";
    for(const p of S.presets){ const pv=Object.entries(p.values).filter(([k,v])=>{ const d=osDefault(OPT[k]); return v!==(d===undefined?OPT[k].default:d); });
      if(pv.length===keys.length&&pv.every(([k,v])=>saved.values[k]===v)) return p.id; } return "custom"; }
  function paint(){
    if(!drawer) return;
    drawer.querySelectorAll(".ax-row[data-k]").forEach(row=>{ const k=row.dataset.k, o=OPT[k], v=val(k);
      if(o.type==="bool"){ row.querySelector("button").setAttribute("aria-pressed",String(!!v)); row.querySelector(".rd-led").classList.toggle("on",!!v); row.classList.toggle("on",!!v); }
      if(o.type==="choice") row.querySelectorAll(".ax-seg button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===String(v))));
      if(o.type==="range"){ const kn=row.querySelector(".tk-knob"); kn&&kn._axShow&&kn._axShow(); }
      row.classList.toggle("ax-changed",k in saved.values); });
    const cp=currentPreset(); drawer.querySelectorAll("[data-preset]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.preset===cp)));
    drawer.querySelector(".ax-custom").textContent=cp==="custom"?"Custom":"";
    const sc=score(); drawer.querySelector(".ax-lcd").textContent=`${sc.pct}%  ·  ${sc.met} met, ${sc.part} partly, ${sc.open} open`;
    drawer.querySelector(".ax-open-list").innerHTML=sc.items.filter(i=>i.s!=="met").map(i=>`<li><b>${esc(i.c)}</b> ${esc(i.n)}: ${esc(i.why)}</li>`).join("")||"<li>Nothing open with these settings.</li>";
  }

  /* ---------- projected WCAG 2.2 self-estimate ---------- */
  function score(){
    const v=values(), skin=html.dataset.skin||"default", plainSkin=skin==="default"||!!v.contrast, hasSound=chans.length>0||!!AX.hasSound;
    const items=[
      {c:"1.1.1",n:"Text alternatives",s:alts.count()===0||v.textalt?"met":"part",why:"turn on Text version of visuals for the meters and EQ"},
      {c:"1.2.1",n:"Captions for sound",s:!hasSound||v.captions?"met":"open",why:"turn on Sound captions"},
      {c:"1.4.3",n:"Text contrast",s:plainSkin?"met":"part",why:`the ${skin} skin is decorative; High contrast guarantees it`},
      {c:"1.4.4",n:"Resize text to 200%",s:"met"},
      {c:"1.4.11",n:"Control contrast",s:plainSkin?"met":"part",why:"skins can soften control edges; High contrast guarantees it"},
      {c:"1.4.12",n:"Text spacing",s:"met"},
      {c:"2.1.1",n:"Keyboard",s:"met"},
      {c:"2.2.2",n:"Pause, stop, hide",s:"met"},
      {c:"2.3.1",n:"Three flashes",s:skin==="default"||v.noflash||v.reduce||v.calm?"met":"part",why:`the ${skin} skin may flash; turn on No flashing`},
      {c:"2.4.1",n:"Bypass blocks",s:document.querySelector(".ax-skip")?"met":"part",why:"no skip link found"},
      {c:"2.4.7",n:"Focus visible",s:"met"},
      {c:"2.4.11",n:"Focus not obscured",s:plainSkin||v.calm?"met":"part",why:"skin decorations can sit over controls; Calm mode hides them"},
      {c:"2.5.8",n:"Target size",s:v.steady?"met":"part",why:"some window buttons are small; turn on Buttons stay put"},
      {c:"3.2.5",n:"Change on request",s:v.lock?"met":"part",why:"turn on Lock the layout"},
      {c:"4.1.2",n:"Name, role, value",s:"met"},
      {c:"4.1.3",n:"Status messages",s:"met"}];
    const met=items.filter(i=>i.s==="met").length, part=items.filter(i=>i.s==="part").length, open=items.length-met-part;
    return { items, met, part, open, pct:Math.round((met+part*.5)/items.length*100) };
  }

  /* ---------- open / close ---------- */
  function open(){ if(!drawer) build(); lastFocus=document.activeElement; drawer.classList.add("open"); drawer.removeAttribute("inert"); led();
    setTimeout(()=>{ const f=drawer.querySelector(".ax-presets button")||drawer; try{ f.focus({preventScroll:true}); }catch(e){ f.focus(); } },30);
    if(val("speak")) speak("Accessibility settings open."); }
  function close(){ if(!drawer||!drawer.classList.contains("open")) return; drawer.classList.remove("open"); drawer.setAttribute("inert",""); led();
    const back=opener&&opener.isConnected?opener:lastFocus; try{ back&&back.focus&&back.focus(); }catch(e){} }
  function toggle(){ drawer&&drawer.classList.contains("open")?close():open(); }
  document.addEventListener("pointerdown",e=>{ if(drawer&&drawer.classList.contains("open")&&!drawer.contains(e.target)&&!e.target.closest(".ax-open")) close(); },true);

  /* ---------- shortcuts ---------- */
  addEventListener("keydown",e=>{
    if(e.key==="Escape"&&speaking()&&!(drawer&&drawer.contains(e.target))){ hush(); return; }
    if(!val("hotkeys")||!e.altKey||!(e.metaKey||e.ctrlKey)||e.shiftKey) return;
    if(e.code==="KeyA"){ e.preventDefault(); opener=null; toggle(); }
    else if(e.code==="KeyS"){ e.preventDefault(); readSelection(); }
  },true);

  /* ---------- skip link ---------- */
  function skip(){ if(document.querySelector(".ax-skip,a[href^='#'].skip,a.skip-link")) return;
    const t=document.querySelector("main,[role=main]")||document.querySelector(".wrap"); if(!t) return; if(!t.id) t.id="ax-main"; if(!t.hasAttribute("tabindex")) t.setAttribute("tabindex","-1");
    const a=document.createElement("a"); a.className="ax-skip"; a.href="#"+t.id; a.textContent="Skip to main content"; document.body.insertBefore(a,document.body.firstChild); }

  /* ---------- start ---------- */
  const AX={ mounted:true, get version(){ return (window.MedDevReceiver&&window.MedDevReceiver.version)||""; }, schema:S, hasSound:false,
    get:values, set:p=>set(p), reset:()=>{ saved.values={}; set({}); }, open, close, toggle, still,
    on:fn=>{ listeners.add(fn); return ()=>listeners.delete(fn); },
    caption:(text,o)=>caps.show(text,o||{}), sound:label=>caps.show(label,{sound:true}),
    channels:setChannels, describe:(el,fn,o)=>alts.add(el,fn,o||{}),
    speak, hush, setSpeaker:fn=>{ speaker=typeof fn==="function"?fn:null; },
    useStore:s=>{ if(s&&typeof s.get==="function"&&typeof s.set==="function"){ store=s; load(); apply(); } },
    refresh:()=>{ mountButtons(); if(drawer) build(); apply(); } };
  window.AXMOD=AX;
  load(); apply();
  const start=()=>{ skip(); mountButtons(); apply();
    for(const o of S.options) if(o.os){ const m=mq(o.os); if(m&&m.addEventListener) m.addEventListener("change",()=>apply()); }
    try{ const a=app(); if(a&&a.settings&&a.settings.onChange) a.settings.onChange(s=>{ if(s&&"axmod" in s){ load(); apply(); } }); }catch(e){}
    window.addEventListener("meddev:skin",()=>{ if(val("contrast")) apply(); else if(drawer) paint(); });
    new MutationObserver(()=>{ if(document.querySelector("[data-axmod]:not([data-axmod-mounted])")) mountButtons(); }).observe(document.body,{childList:true,subtree:true}); };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start); else start();
})();
