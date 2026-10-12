/* Skins: pick how the receiver looks. The page carries the skins in a JSON script tag with id "meddev-skins"
   (MD Hub can hand a newer set through window.mdfmApp.skins()). Choice: the person's own pick, else the house default.
   In an app it's saved with the app's settings (and on this device as a fallback); in a browser, on this device.
   Any select element with data-mdfm-skins becomes a skin dropdown. A skin is CSS only; it is applied in the style tag "meddev-skin-theme". */
(()=>{
  const newer=(a,b)=>{ const p=v=>String(v||"0.0.0").split(".").map(n=>parseInt(n,10)||0), x=p(a), y=p(b); for(let i=0;i<3;i++) if(x[i]!==y[i]) return x[i]>y[i]; return false; };
  const app=()=>window.mdfmApp||null;
  let bundle=null;
  const load=()=>{ let b=null; try{ const el=document.getElementById("meddev-skins"); if(el) b=JSON.parse(el.textContent); }catch(e){}
    try{ const a=app(); if(a&&typeof a.skins==="function"){ const n=a.skins(); if(n&&n.skins&&(!b||newer(n.version,b.version))) b=n; } }catch(e){}
    return b&&Array.isArray(b.skins)?b:{ version:"0.0.0", default:"default", skins:[{ id:"default", name:"Default", description:"", css:"" }] }; };
  const find=id=>bundle.skins.find(s=>s.id===id);
  const KEY="mdfmSkin";
  const choice=()=>{ try{ const a=app(); if(a&&a.settings){ const v=(a.settings.get()||{}).skin; if(typeof v==="string") return v; } }catch(e){} try{ return localStorage.getItem(KEY)||""; }catch(e){ return ""; } };
  const save=id=>{ try{ localStorage.setItem(KEY,id); }catch(e){} try{ const a=app(); if(a&&a.settings) a.settings.set({skin:id}); }catch(e){} };
  let styleEl=null;
  const theme=()=>{ if(styleEl&&styleEl.isConnected) return styleEl; styleEl=document.getElementById("meddev-skin-theme");
    if(!styleEl){ styleEl=document.createElement("style"); styleEl.id="meddev-skin-theme"; (document.head||document.documentElement).appendChild(styleEl); } return styleEl; };
  function apply(id){
    const pick=find(id)||find(bundle.default)||find("default")||bundle.skins[0];
    const css=pick?pick.css||"":""; if(theme().textContent!==css) theme().textContent=css;
    document.documentElement.dataset.skin=pick?pick.id:"default";
    if(pick&&pick.tint==="dye") document.documentElement.dataset.tint="dye"; else delete document.documentElement.dataset.tint;
    decor(/skin-decor/.test(css)); extras(pick);
    fill(); try{ window.dispatchEvent(new Event("meddev:skin")); }catch(e){}
    return pick;
  }
  // decorations: one .skin-decor over each .deck and .panel, only while a skin uses them
  function decor(on){
    document.querySelectorAll(".deck,.panel").forEach(el=>{ let d=el.querySelector(":scope > .skin-decor");
      if(on&&!d){ d=document.createElement("i"); d.className="skin-decor"; d.setAttribute("aria-hidden","true"); d.dataset.part=el.classList.contains("deck")?"deck":"panel"; el.appendChild(d); }
      else if(!on&&d) d.remove(); });
  }
  // Skin extras: tappable spots from the skin's own data (menus, message boxes, read-only pages). Built from text only,
  // never markup. Every page has a way back: its Back button, a "back" spot (e.g. the first sheet tab) or Esc.
  const X={id:null,x:null,els:[],menu:null,page:null,dlg:null,from:{},cs:new Set()};
  const el=(t,c,txt)=>{ const e=document.createElement(t); if(c) e.className=c; if(txt!=null) e.textContent=txt; return e; };
  const xHost=()=>document.querySelector(".wrap")||document.body;
  const xFocus=k=>{ const f=X.from[k]; X.from[k]=null; if(f&&f.isConnected) f.focus(); };
  function xClose(kind){ if((!kind||kind==="menu")&&X.menu){ X.menu.remove(); X.menu=null; } if((!kind||kind==="dlg")&&X.dlg){ X.dlg.remove(); X.dlg=null; } }
  function xBack(){ xClose(); if(X.page){ X.page.remove(); X.page=null; } }
  // Mysteries: a spot or menu entry can carry "clue": "<id>" (found when tapped), "need": n with "locked": text (works only
  // once n clues are found), "solve": true (the skin's case is solved) and "reset": true (forget the clues and the solve).
  // Progress is kept per skin in this browser or app. While a skin with clues is on, <html> gets data-sx-clues="<found>"
  // and, once solved, data-sx-solved (skins use it for rewards, e.g. a new cursor). Found spots get data-found.
  // Text can say {found} and {total}.
  const CK="meddev-skin-case:";
  const cRead=()=>{ try{ const v=JSON.parse(localStorage.getItem(CK+X.id)||"{}")||{}; return {clues:Array.isArray(v.clues)?v.clues.filter(c=>typeof c==="string"&&X.cs.has(c)):[],solved:v.solved===true}; }catch(e){ return {clues:[],solved:false}; } };
  const cWrite=v=>{ try{ localStorage.setItem(CK+X.id,JSON.stringify(v)); }catch(e){} };
  function cShow(){ const r=document.documentElement; if(!X.cs.size){ delete r.dataset.sxClues; delete r.dataset.sxSolved; return; }
    const c=cRead(); r.dataset.sxClues=String(c.clues.length); if(c.solved) r.dataset.sxSolved=""; else delete r.dataset.sxSolved;
    X.els.forEach(l=>l.querySelectorAll(".sx-spot[data-clue]").forEach(b=>{ if(c.clues.includes(b.dataset.clue)) b.dataset.found=""; else delete b.dataset.found; })); }
  const fillT=t=>t==null?t:String(t).replace(/\{found\}/g,String(cRead().clues.length)).replace(/\{total\}/g,String(X.cs.size));
  function xDo(o,x,from){ xClose("menu");
    if(o.need&&cRead().clues.length<o.need){ xSay(fillT(o.locked),from); return; }
    if(o.clue||o.solve||o.reset){ const c=cRead(); if(o.reset){ c.clues=[]; c.solved=false; } if(o.clue&&!c.clues.includes(o.clue)) c.clues.push(o.clue); if(o.solve) c.solved=true; cWrite(c); cShow(); }
    if(o.back){ xBack(); if(from&&from.isConnected) from.focus(); return; } if(o.say!=null){ const t=fillT(o.say); xSay(t,from,o.title); if(o.speak) xSpeak(t,o.speak); return; } if(o.page) xPage(o.page,x,from); }
  // speak: a spot's line read aloud by the computer's voice (an actor in a play). Text only; pitch, rate and preferred voice names.
  // While a line is read, the page hears "meddev:voice" {on, sung} so a radio can duck its music (to silence for sung lines).
  let XV=0; const xVoice=(on,sung)=>{ try{ window.dispatchEvent(new CustomEvent("meddev:voice",{detail:{on,sung}})); }catch(e){} };
  function xSpeak(text,o){ try{ const S=window.speechSynthesis; if(!S||typeof SpeechSynthesisUtterance!=="function") return; S.cancel();
    const sung=/[♪♫]/.test(text), my=++XV; let t=0; const fin=()=>{ clearTimeout(t); if(my===XV){ XV++; xVoice(false,sung); } };
    const u=new SpeechSynthesisUtterance(String(text).replace(/[♪♫]/g,"").trim()); if(o.pitch!=null) u.pitch=o.pitch; if(o.rate!=null) u.rate=o.rate;
    const vs=S.getVoices(), names=o.voices||[]; for(const n of names){ const v=vs.find(v=>v.name===n||v.name.startsWith(n+" ")); if(v){ u.voice=v; break; } }
    u.onend=fin; u.onerror=fin; t=setTimeout(fin,Math.min(40000,3000+text.length*120));   // never leave the music ducked
    xVoice(true,sung); S.speak(u); }catch(e){} }
  // scenes: a layer can hold several scenes; spots with "scene": k show only in scene k, "next"/"prev" spots move between them (wrapping).
  function xScene(lay,step){ const n=+lay.dataset.scenes||1, cur=+lay.dataset.scene||0, nx=((cur+step)%n+n)%n;
    lay.dataset.prev=cur; lay.dataset.scene=nx; lay.querySelectorAll(".sx-spot[data-scene]").forEach(b=>{ b.hidden=+b.dataset.scene!==nx; });
    try{ window.speechSynthesis&&window.speechSynthesis.cancel(); }catch(e){} xClose("dlg"); }
  function xSay(text,from,title){ xClose("dlg"); const d=el("div","sx-dialog"); d.setAttribute("role","alertdialog"); d.setAttribute("aria-label",title||"Message");
    const ok=el("button","btn sx-back","OK"); ok.type="button"; ok.addEventListener("click",()=>{ xClose("dlg"); xFocus("dlg"); });
    if(title) d.appendChild(el("h2",null,title)); d.append(el("p","sx-note",text),ok); document.body.appendChild(d); X.dlg=d; X.from.dlg=from; ok.focus(); }
  function xPage(pid,x,from){ const ps=x.pages||{}, pg=Object.prototype.hasOwnProperty.call(ps,pid)?ps[pid]:null; if(!pg||!Array.isArray(pg.cols)||!Array.isArray(pg.rows)) return; if(X.page) X.page.remove();
    const P=el("section","sx-page"); P.setAttribute("aria-label",pg.title);
    const back=el("button","btn sx-back","← Back"); back.type="button"; back.addEventListener("click",()=>{ xBack(); xFocus("page"); });
    const head=el("div","sx-head"); head.append(back,el("h2",null,pg.title)); P.appendChild(head);
    const t=el("table","sx-grid"), hr=el("tr"); pg.cols.forEach(c=>hr.appendChild(el("th",null,c))); const th=el("thead"); th.appendChild(hr); t.appendChild(th);
    const tb=el("tbody"); pg.rows.forEach(r=>{ const tr=el("tr"); pg.cols.forEach((_,i)=>tr.appendChild(el("td",null,r[i]||""))); tb.appendChild(tr); }); t.appendChild(tb);
    const tw=el("div","sx-grid-wrap"); tw.appendChild(t); P.appendChild(tw); if(pg.note) P.appendChild(el("p","sx-note",pg.note));
    xHost().appendChild(P); X.page=P; X.from.page=from; P.scrollTop=0; back.focus(); }
  function xMenu(sp,btn,x){ if(X.menu&&X.menu.dataset.for===sp.label){ xClose("menu"); return; } xClose("menu");
    const m=el("div","sx-menu"); m.setAttribute("role","menu"); m.setAttribute("aria-label",sp.label); m.dataset.for=sp.label;
    sp.menu.forEach(e=>{ if(e.sep){ m.appendChild(el("div","sx-sep")); return; }
      const b=el("button","sx-item"); b.type="button"; b.setAttribute("role","menuitem"); b.appendChild(el("span",null,fillT(e.text))); if(e.hint) b.appendChild(el("small",null,fillT(e.hint)));
      if(e.disabled) b.disabled=true; else b.addEventListener("click",ev=>{ ev.stopPropagation(); xDo(e,x,btn); }); m.appendChild(b); });
    document.body.appendChild(m); X.from.menu=btn; const r=btn.getBoundingClientRect();
    m.style.left=Math.max(4,Math.min(r.left,innerWidth-m.offsetWidth-4))+scrollX+"px"; m.style.top=(r.bottom+2+scrollY)+"px"; X.menu=m;
    const f=m.querySelector("button:not(:disabled)"); if(f) f.focus(); }
  function extras(pick){
    const x=pick&&pick.extras, id=pick&&pick.id;
    if(X.id===id&&X.x===x&&X.els.length&&X.els.every(e=>e.isConnected)) return;
    xBack(); X.els.forEach(e=>e.remove()); X.els=[]; X.id=id; X.x=x; X.cs=new Set();
    if(!x||!Array.isArray(x.layers)){ cShow(); return; }
    x.layers.forEach(L=>(L.spots||[]).forEach(sp=>{ if(sp.clue) X.cs.add(sp.clue); (sp.menu||[]).forEach(e=>{ if(e&&e.clue) X.cs.add(e.clue); }); }));
    const parts={top:".top .deck",station:".panel.station",pinfoot:".pinfoot"};
    x.layers.forEach(L=>{ const a=document.querySelector(parts[L.anchor]); if(!a) return; const lay=el("div","sx-layer");
      if(L.scenes){ lay.dataset.scenes=L.scenes; lay.dataset.scene="0"; }
      for(const [k,v] of Object.entries(L.box||{})) lay.style[k]=v;
      (L.spots||[]).forEach(sp=>{ const b=el("button","sx-spot"); b.type="button"; b.setAttribute("aria-label",sp.label); b.title=sp.label;
        for(const k of ["left","top","width","height"]) if(sp[k]) b.style[k]=sp[k];
        if(sp.scene!=null){ b.dataset.scene=sp.scene; b.hidden=sp.scene!==0; } if(sp.clue) b.dataset.clue=sp.clue;
        if(sp.next||sp.prev){ b.addEventListener("click",ev=>{ ev.stopPropagation(); xScene(lay,sp.prev?-1:1); }); }
        else if(sp.open){ b.setAttribute("aria-pressed","false"); b.addEventListener("click",ev=>{ ev.stopPropagation(); b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")==="true"?"false":"true"); }); }
        else if(sp.menu){ b.setAttribute("aria-haspopup","menu"); b.addEventListener("click",ev=>{ ev.stopPropagation(); xMenu(sp,b,x); }); }
        else b.addEventListener("click",ev=>{ ev.stopPropagation(); xDo(sp,x,b); });
        lay.appendChild(b); });
      a.appendChild(lay); X.els.push(lay); });
    cShow();
  }
  document.addEventListener("click",e=>{ if(X.menu&&!X.menu.contains(e.target)) xClose("menu"); });
  document.addEventListener("keydown",e=>{ if(e.key!=="Escape") return; if(X.menu){ xClose("menu"); xFocus("menu"); } else if(X.dlg){ xClose("dlg"); xFocus("dlg"); } else if(X.page){ xBack(); xFocus("page"); } });
  function fill(){
    const cur=choice(), house=find(bundle.default)||bundle.skins[0];
    document.querySelectorAll("select[data-mdfm-skins]").forEach(sel=>{
      if(sel.dataset.filled!==bundle.version+":"+bundle.skins.length+":"+bundle.default){ sel.textContent="";
        const o=document.createElement("option"); o.value=""; o.textContent=`House default (${house?house.name:"Default"})`; sel.appendChild(o);
        for(const s of bundle.skins){ const op=document.createElement("option"); op.value=s.id; op.textContent=s.name; if(s.description) op.title=s.description; sel.appendChild(op); }
        sel.dataset.filled=bundle.version+":"+bundle.skins.length+":"+bundle.default; }
      sel.value=find(cur)?cur:"";
      if(!sel.dataset.wired){ sel.dataset.wired="1"; sel.addEventListener("change",()=>{ save(sel.value); apply(sel.value); }); }
    });
  }
  const start=()=>{ bundle=load(); apply(choice());
    try{ const a=app(); if(a&&a.settings&&a.settings.onChange) a.settings.onChange(s=>{ if(s&&"skin" in s) apply(s.skin||""); }); }catch(e){} };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start); else start();
  window.MDFM_skins={ list:()=>bundle?bundle.skins.map(({id,name,description})=>({id,name,description})):[], houseDefault:()=>bundle&&bundle.default,
    current:()=>document.documentElement.dataset.skin, set:id=>{ save(id||""); return apply(id||""); }, refresh:()=>{ bundle=load(); apply(choice()); } };
})();
