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
    decor(/skin-decor/.test(css));
    fill(); try{ window.dispatchEvent(new Event("meddev:skin")); }catch(e){}
    return pick;
  }
  // decorations: one .skin-decor over each .deck and .panel, only while a skin uses them
  function decor(on){
    document.querySelectorAll(".deck,.panel").forEach(el=>{ let d=el.querySelector(":scope > .skin-decor");
      if(on&&!d){ d=document.createElement("i"); d.className="skin-decor"; d.setAttribute("aria-hidden","true"); d.dataset.part=el.classList.contains("deck")?"deck":"panel"; el.appendChild(d); }
      else if(!on&&d) d.remove(); });
  }
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
