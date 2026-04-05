import { useState, useMemo, useEffect, useRef, useCallback, createContext, useContext } from "react";

// ── MOBILE DETECTION ─────────────────────────────────────────────────────────
const MobileContext = createContext(false);
function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return mobile;
}

// ── PERSISTENT NOTES ──────────────────────────────────────────────────────────
function useNotes() {
  const [notes, setNotesState] = useState(() => {
    try {
      const saved = localStorage.getItem("hls_notes");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const setNote = useCallback((key, text) => {
    setNotesState(prev => {
      const next = {...prev, [key]: text};
      try { localStorage.setItem("hls_notes", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  return { notes, setNote };
}

function NoteField({ courseKey }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const [saved, setSaved] = useState(false);
  const timerRef = useRef(null);
  const stored = (window.__hlsNotes||{})[courseKey] || "";
  useEffect(() => { if (open) setVal(stored); }, [open]);
  const handleChange = e => {
    const v = e.target.value; setVal(v); setSaved(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { if (window.__hlsSetNote) window.__hlsSetNote(courseKey, v); setSaved(true); setTimeout(() => setSaved(false), 1400); }, 500);
  };
  const hasNote = stored.trim().length > 0;
  return (
    <div style={{marginLeft:8, marginTop:2}}>
      <button onClick={() => setOpen(o=>!o)} style={{fontSize:12,border:"none",cursor:"pointer",padding:"1px 5px",borderRadius:3,color:hasNote?"#1e2d4a":"#8a7e6e",background:hasNote?"#d4dce8":"transparent",fontWeight:hasNote?700:400,fontFamily:"system-ui,sans-serif"}}>
        {open ? "▲ close" : hasNote ? "📝 note" : "+ note"}
      </button>
      {open && (
        <div style={{marginTop:3}}>
          <textarea value={val} onChange={handleChange} placeholder="Your notes…" rows={2}
            style={{width:"100%",boxSizing:"border-box",fontSize:13,padding:"5px 7px",borderRadius:5,border:"1px solid #c4b5fd",outline:"none",resize:"vertical",fontFamily:"system-ui,sans-serif",color:"#1e1b4b",background:"#faf5ff",lineHeight:1.4}}/>
          {saved && <span style={{fontSize:12,color:"#3d6b4f",fontFamily:"system-ui,sans-serif"}}>✓ saved</span>}
        </div>
      )}
    </div>
  );
}

// ── EVAL DATA (lazy-loaded on first Evals/Suggest tab open) ─────────────────────
function useEvalData() {
  const [E, setE] = useState(null);
  useEffect(() => {
    import('./evalData.json').then(m => setE(m.default));
  }, []);
  return E;
}
// Placeholder empty object until data loads — prevents null crashes
const E_EMPTY = {};
const EvalContext = createContext(E_EMPTY);
const starColor = avg => !avg ? "#8a7e6e" : avg >= 4.5 ? "#3d6b4f" : avg >= 3.5 ? "#9a7820" : "#6b1e2e";

function EvalCard({ evalId, label }) {
  const E = useContext(EvalContext);
  const [open, setOpen] = useState(false);
  const ev = E[evalId];
  if (!ev) return null;
  const hasData = ev.comments.length > 0 || ev.tips.length > 0 || ev.bid.length > 0 || ev.note;
  const starStr = ev.avg ? `★${ev.avg}` : "★?";
  return (
    <div style={{marginTop:4, marginLeft:8}}>
      <button onClick={() => setOpen(o=>!o)} style={{
        fontSize:13, border:"none", cursor:"pointer", padding:"3px 8px", borderRadius:3,
        background: open ? "#1e2d4a" : "#ede6d8", color: open ? "#f3ede3" : "#1e2d4a", fontWeight:600,
        display:"inline-flex", alignItems:"center", gap:4, fontFamily:"system-ui,sans-serif",
      }}>
        <span style={{color: open ? "#d4b896" : starColor(ev.avg)}}>{starStr}</span>
        {ev.n > 0 && <span style={{opacity:.75}}>({ev.n})</span>}
        <span>{open ? "▲ hide" : `▼ ${label||"eval & tips"}`}</span>
      </button>
      {open && (
        <div style={{background:"#f3ede3", border:"1px solid #d9ccba", borderRadius:4, padding:"9px 11px", marginTop:3, fontSize:13, lineHeight:1.6, fontFamily:"system-ui,sans-serif"}}>
          {ev.note && <div style={{color:"#5c4e3a", marginBottom:6, fontStyle:"italic"}}>{ev.note}</div>}
          {ev.comments.map((c,i) => (
            <div key={i} style={{marginBottom:6, borderLeft:"2px solid #b0bdd4", paddingLeft:7, color:"#1e2d4a"}}>
              "{c}"
            </div>
          ))}
          {ev.tips.length > 0 && <div style={{marginTop:4}}>
            <div style={{fontWeight:700, color:"#5c4e3a", marginBottom:3}}>📋 Exam / class tips:</div>
            {ev.tips.map((t,i) => <div key={i} style={{color:"#4a3828", marginBottom:3, paddingLeft:6, borderLeft:"2px solid #c4a870"}}>"{t}"</div>)}
          </div>}
          {ev.bid.length > 0 && <div style={{marginTop:4}}>
            <div style={{fontWeight:700, color:"#5c4e3a", marginBottom:2}}>🎯 Bidding:</div>
            {ev.bid.map((b,i) => <div key={i} style={{color:"#8a7e6e", fontSize:13}}>{b}</div>)}
          </div>}
        </div>
      )}
    </div>
  );
}

// ── SUGGESTIONS (based on interests: litigation, gender, rule of law/democracy, entertainment/IP) ──
const SUGGESTIONS = [
  {
    key:"sug_patent_trial", name:"Patent Trial Advocacy", prof:"Tompros", cr:2, term:"Fall/Spring",
    evalId:"sugg_patentTrial", c:{bg:"#ede9fe",bd:"#7c3aed",tx:"#4c1d95"},
    why:"IP Disputes + Trial Work",
    pitch:"'Like a relaxed version of TAW.' Full mock trial with depositions, cross-examination, oral argument in front of real Federal Circuit judges. Perfect intersection of your IP and litigation interests. ★5.0 with zero exam — grade based on performance.",
  },
  {
    key:"sug_judicial_clinic", name:"Judicial Process in Trial Courts Clinic", prof:"Cratsley/Berenson", cr:4, term:"Fall or Spring",
    evalId:"clinicJudicial", c:{bg:"#e6ede2",bd:"#4a7238",tx:"#263d1a"},
    why:"Trial Work (hands-on)",
    pitch:"Judicial externship at a trial court in Boston (federal or state). 'Definitely one of my favorite classes at HLS.' You draft opinions and attend hearings/trials daily. Very easy H. Counts for pro bono. Directly on your trial track.",
  },
  {
    key:"sug_mass_media", name:"Mass Media Law", prof:"McCraw (NYT GC)", cr:3, term:"Fall",
    evalId:"sugg_massMedia", c:{bg:"#f5ede0",bd:"#9a7820",tx:"#5c3810"},
    why:"Entertainment + 1A",
    pitch:"Taught by the deputy GC of the New York Times with Pulitzer-winning guest speakers. Covers freedom of expression through real cases — prior restraint, national security, defamation, press access. 'War stories' + 1A doctrine. Sort of an easy H if you prepare the disclosed policy question.",
  },
  {
    key:"sug_comp_con", name:"Comparative Constitutional Law", prof:"Lessig", cr:3, term:"Spring",
    evalId:"sugg_compCon", c:{bg:"#f5e8e8",bd:"#7c1d2e",tx:"#4a0f1a"},
    why:"Rule of Law + Democracy",
    pitch:"Covers how democracies die, constitutional design, rule of law comparatively. '★5 — I learned a lot about constitutional law in various countries. The breadth was wide, covering topics like how democracies die.' No cold calls. All MC exam.",
  },
  {
    key:"sug_gender_id", name:"Gender Identity, Sexual Orientation & the Law", prof:"Chen", cr:2, term:"Fall",
    evalId:"f_gi", c:{bg:"#fdf4ff",bd:"#a21caf",tx:"#4a044e"},
    why:"Gender Issues",
    pitch:"★5.0. 'Chen is extremely clear in explaining doctrine and also leads insightful discussions about activism and advocacy that apply to a wide range of social issues. You'll learn a lot more than in generic 4-credit BLL classes.' Light assessment: a few response papers + 1,000 word final.",
  },
  {
    key:"sug_emp_disc", name:"Employment Discrimination", prof:"Churchill", cr:3, term:"Fall",
    evalId:"sugg_employDisc", c:{bg:"#ffe4e6",bd:"#e11d48",tx:"#881337"},
    why:"Gender Issues + Litigation",
    pitch:"Plaintiff's-side litigator teaching Title VII doctrine. Directly intersects gender issues and employment. 8-hour take-home exam — 'not an easy H' but substantive. Complements Employment Law (Sachs) if you want the full spectrum.",
  },
  {
    key:"sug_fashion", name:"Fashion Law Lab", prof:"Sarian", cr:2, term:"Fall/Spring",
    evalId:"sugg_fashionLaw", c:{bg:"#fce7f3",bd:"#db2777",tx:"#831843"},
    why:"Entertainment + IP",
    pitch:"★4.5. Covers IP rights in the creative/cultural industry, sustainability, ethics, with celebrity guest speakers. 'Even if you're not interested in the fashion industry — a good introduction course with concentrated topics including IP rights.' Two blogs + ~15p paper. High chance of H.",
  },
  {
    key:"sug_antitrust_ip", name:"Antitrust and IP", prof:"Popofsky", cr:2, term:"Fall",
    evalId:"sugg_antitrust", c:{bg:"#cffafe",bd:"#0891b2",tx:"#164e63"},
    why:"IP Disputes",
    pitch:"★5.0. '…makes a confusing field of law easy to understand. A timely topic in the AI era.' 3-credit version also exists. Only 2 credits, 5 reaction papers, no exam. Connects IP protection with antitrust enforcement — increasingly relevant in tech/entertainment disputes.",
  },
  {
    key:"sug_crim_pros_clinic", name:"Criminal Prosecution Clinic", prof:"Corrigan", cr:4, term:"Fall",
    evalId:"clinicCrimPros", c:{bg:"#ccfbf1",bd:"#0d9488",tx:"#134e4a"},
    why:"Trial Work (most hands-on)",
    pitch:"'Lots of hands-on trial experience' — arraignments, pleas, actual jury trials, second-chairing. The most real trial work available at HLS. 'Despite the intense schedule, one of the best experiences.' Note: you'll be working alongside prosecutors — be clear-eyed on ideology fit.",
  },
  {
    key:"sug_state_ag", name:"State AG Clinic", prof:"Tierney", cr:4, term:"Fall/Spring",
    evalId:"sugg_stateAG", c:{bg:"#d1fae5",bd:"#059669",tx:"#064e3b"},
    why:"Litigation + Rule of Law",
    pitch:"Work in the Mass AG office — trial department, constitutional litigation, civil rights, antitrust. 'Mostly defending the state government in tort and civil rights cases.' Government-side litigation, hands-on, light workload, no commute issues since it's downtown Boston.",
  },
];

// ── MULTI-SECTION RANKING POOL ───────────────────────────────────────────────
const RANKING_POOL = [
  {id:"ev_m",    label:"Evidence · Medwed",    sub:"Fall · 3cr · Th,F 10:30–12:00",     cat:"ev",  cKey:"ev_m"},
  {id:"ev_s",    label:"Evidence · Schulman",  sub:"Fall · 4cr · M,T 8:00–10:00",       cat:"ev",  cKey:"ev_s"},
  {id:"ev_w",    label:"Evidence · Whiting",   sub:"Fall · 4cr · M,T 10:15–12:15",      cat:"ev",  cKey:"ev_w"},
  {id:"sp_ev_c", label:"Evidence · Clary",     sub:"Spr · 3cr · W,Th 1:30–3:00",        cat:"ev",  cKey:"sp_ev_c"},
  {id:"sp_ev_l", label:"Evidence · Lvovsky",   sub:"Spr · 4cr · M–W 10:30–11:50",       cat:"ev",  cKey:"sp_ev_l"},
  {id:"co_sp",   label:"Corps · Spamann",      sub:"Fall · 4cr · W–F 8:30–9:50",        cat:"co",  cKey:"co_sp"},
  {id:"co_fr",   label:"Corps · Fried",        sub:"Fall · 4cr · W–F 1:30–3:30",        cat:"co",  cKey:"co_fr"},
  {id:"co_pg",   label:"Corps · Pargendler",   sub:"Fall · 4cr · M,T 3:45–5:45",        cat:"co",  cKey:"co_pg"},
  {id:"sp_co_c", label:"Corps · Coates",       sub:"Spr · 4cr · M–W 10:15–11:35",       cat:"co",  cKey:"sp_co_c"},
  {id:"sp_co_t", label:"Corps · Tallarita",    sub:"Spr · 4cr · Th,F 10:15–12:15",      cat:"co",  cKey:"sp_co_t"},
  {id:"sp_adm_v",label:"Admin · Vermeule",     sub:"Spr · 4cr · W,Th 1:30–3:30",        cat:"adm", cKey:"sp_adm_v"},
  {id:"sp_adm_b",label:"Admin · Block",        sub:"Spr · 3cr · T,W 3:45–5:15",         cat:"adm", cKey:"sp_adm_b"},
  {id:"taw_f",   label:"TAW · Fall",           sub:"Fall · 3cr · M–F 2–9pm",            cat:"taw", cKey:"taw"},
  {id:"taw_w",   label:"TAW · Winter",         sub:"Winter · 3cr",                       cat:"taw", cKey:"taw"},
];
const RANK_CAT_COLORS={ev:"#2c4a7c",co:"#3d6b4f",adm:"#7c1d2e",taw:"#7a6e64"};
const RANK_CAT_BG={ev:"#e8ecf4",co:"#e8ede6",adm:"#f0e8e8",taw:"#edeae4"};
const RANK_CAT_LABELS={ev:"Evidence",co:"Corporations",adm:"Admin Law",taw:"TAW"};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const toMin = t => { const [h,m]=t.split(":").map(Number); return h*60+m; };
const overlapMin = (s,e,ws="14:00",we="21:00") => Math.max(0, Math.min(toMin(e),toMin(we)) - Math.max(toMin(s),toMin(ws)));
const tawOverlapHrsPerWeek = c => {
  if (!c?.days?.length || !c.s || !c.e) return 0;
  return c.days.reduce((sum,_) => sum + overlapMin(c.s, c.e)/60, 0);
};
const timesOverlap = (a,b) => {
  if (!a?.days||!b?.days||!a.s||!b.s) return false;
  if (!a.days.some(d=>b.days.includes(d))) return false;
  return toMin(a.s)<toMin(b.e) && toMin(b.s)<toMin(a.e);
};
const getConflicts = list => {
  const out=[];
  for(let i=0;i<list.length;i++) for(let j=i+1;j<list.length;j++)
    if(timesOverlap(list[i],list[j])) out.push([list[i],list[j]]);
  return out;
};
const sumCr = list => list.reduce((s,c)=>s+(c?.cr||c?.credits||0),0);
const fmtHr = n => n===0?"0":(n%1===0?String(n):n.toFixed(1));

function generateSuggestedRanking(plan){
  // Gather all "fixed" timed courses (electives, non-ranking multi-sections, clinics)
  const ALL_FE_R=FALL_ELECTIVES.courses.concat(FALL_ELECTIVES.seminars).concat(FALL_ELECTIVES.readings);
  const ALL_SE_R=SP_ELECTIVES.courses.concat(SP_ELECTIVES.seminars).concat(SP_ELECTIVES.readings);
  const fixed=[];
  (plan.fElect||[]).forEach(k=>{const c=ALL_FE_R.find(x=>x.key===k);if(c?.days)fixed.push(c);});
  (plan.spElect||[]).forEach(k=>{const c=ALL_SE_R.find(x=>x.key===k);if(c?.days)fixed.push(c);});
  if(plan.spMTC&&plan.spMTC!=="none"&&C[plan.spMTC]) fixed.push(C[plan.spMTC]);
  if(plan.fAdm&&C.f_adm) fixed.push(C.f_adm);
  if(plan.f1a&&plan.f1a!=="none"&&C[plan.f1a]) fixed.push(C[plan.f1a]);
  if(plan.fCp&&plan.fCp!=="none"&&C[plan.fCp]) fixed.push(C[plan.fCp]);
  if(plan.sp1a&&plan.sp1a!=="none"&&C[plan.sp1a]) fixed.push(C[plan.sp1a]);
  if(plan.spCpi&&plan.spCpi!=="none"&&C[plan.spCpi]) fixed.push(C[plan.spCpi]);
  if(plan.fClinic){const cl=CLINIC_OPTS.find(x=>x.id===plan.fClinic);if(cl?.semFall)fixed.push(cl.semFall);}
  if(plan.spClinic){const cl=CLINIC_OPTS.find(x=>x.id===plan.spClinic);const sem=cl?.semSpring||cl?.semFall;if(sem)fixed.push(sem);}

  const selectedIds=new Set();
  if(plan.fEv) selectedIds.add(plan.fEv);
  if(plan.spEv&&plan.spEv!=="none") selectedIds.add(plan.spEv);
  if(plan.fCo) selectedIds.add(plan.fCo);
  if(plan.spCo&&plan.spCo!=="none") selectedIds.add(plan.spCo);
  if(plan.spAdm) selectedIds.add(plan.spAdm);
  const tawSel=plan.fTAW==="fall"?"taw_f":"taw_w";

  const scored=RANKING_POOL.map(item=>{
    let score=0;
    const isSel=item.id===tawSel||selectedIds.has(item.id);
    if(isSel) score+=1000;

    const cd=C[item.cKey];
    const cfl=[];
    if(cd?.days){
      // Check vs fixed electives/clinics
      for(const fc of fixed){if(fc.days&&timesOverlap(cd,fc))cfl.push(fc.name||fc.key);}
      // Check vs OTHER multi-section categories
      if(item.cat!=="ev"){
        const ek=plan.fEv||(plan.spEv!=="none"?plan.spEv:null);
        if(ek&&C[ek]?.days&&timesOverlap(cd,C[ek]))cfl.push(C[ek].name);
      }
      if(item.cat!=="co"){
        const ck=plan.fCo||(plan.spCo!=="none"?plan.spCo:null);
        if(ck&&C[ck]?.days&&timesOverlap(cd,C[ck]))cfl.push(C[ck].name);
      }
      if(item.cat!=="adm"&&plan.spAdm&&C[plan.spAdm]?.days&&timesOverlap(cd,C[plan.spAdm]))
        cfl.push(C[plan.spAdm].name);
      // TAW overlap check for fall courses
      if(item.cat!=="taw"&&plan.fTAW==="fall"&&!item.id.startsWith("sp_")&&item.id!=="taw_w"){
        const hrs=tawOverlapHrsPerWeek(cd);
        if(hrs>4)cfl.push("TAW ("+fmtHr(hrs)+"hr/wk overlap > 4hr)");
        else if(hrs>0) score-=10; // mild penalty for any overlap
      }
    }
    if(cfl.length===0) score+=100;
    score-=cfl.length*200;
    if(!item.id.startsWith("sp_")&&item.id!=="taw_w") score+=5; // slight fall preference
    return{id:item.id,note:"",score,conflicts:cfl,isSel};
  });
  scored.sort((a,b)=>b.score-a.score);
  return scored.map(({id,note})=>({id,note}));
}

// ── COLOURS ───────────────────────────────────────────────────────────────────
const K={
  blue:   {bg:"#e8ecf4",bd:"#2c4a7c",tx:"#1a2f52"},
  green:  {bg:"#e8ede6",bd:"#3d6b4f",tx:"#1f3d2a"},
  violet: {bg:"#ede8f0",bd:"#5c3d7a",tx:"#2d1f40"},
  red:    {bg:"#f0e8e8",bd:"#7c1d2e",tx:"#4a0f1a"},
  amber:  {bg:"#f5ede0",bd:"#a0622a",tx:"#5c3210"},
  orange: {bg:"#f5ece0",bd:"#b05c20",tx:"#663010"},
  sky:    {bg:"#e4eef5",bd:"#2a6080",tx:"#12344a"},
  indigo: {bg:"#e8ecf2",bd:"#3a4f80",tx:"#1e2a50"},
  gray:   {bg:"#edeae4",bd:"#7a6e64",tx:"#3d342e"},
  pink:   {bg:"#f0e6ec",bd:"#8b3a5c",tx:"#4d1a2e"},
  lime:   {bg:"#e6ede2",bd:"#4a7238",tx:"#263d1a"},
  teal:   {bg:"#e2ecec",bd:"#2d7070",tx:"#143838"},
  emerald:{bg:"#e2ede6",bd:"#2d6e4a",tx:"#123820"},
  rose:   {bg:"#f0e4e8",bd:"#8b2d44",tx:"#4a1020"},
  cyan:   {bg:"#e2ecf0",bd:"#2a6878",tx:"#10343c"},
  yellow: {bg:"#f5ede0",bd:"#9a7820",tx:"#4a3808"},
  fuchsia:{bg:"#eee4f0",bd:"#7c2a8a",tx:"#3c1044"},
};

const DAYS=["Mon","Tue","Wed","Thu","Fri"];

// ── COURSES ───────────────────────────────────────────────────────────────────
const C = {
  // ── FALL EVIDENCE (multi-section) ──
  ev_m:  {key:"ev_m",  name:"Evidence", prof:"Medwed",   cr:3, days:["Thu","Fri"],      s:"10:30",e:"12:00", c:K.blue},
  ev_s:  {key:"ev_s",  name:"Evidence", prof:"Schulman", cr:4, days:["Mon","Tue"],       s:"8:00", e:"10:00", c:K.blue},
  ev_w:  {key:"ev_w",  name:"Evidence", prof:"Whiting",  cr:4, days:["Mon","Tue"],       s:"10:15",e:"12:15", c:K.blue},
  ev_br: {key:"ev_br", name:"Evidence", prof:"Brewer",   cr:4, days:["Tue","Wed"],       s:"15:45",e:"17:45", c:K.blue},
  // ── FALL CORPORATIONS (multi-section) ──
  co_sp: {key:"co_sp", name:"Corporations", prof:"Spamann",     cr:4, days:["Wed","Thu","Fri"], s:"8:30", e:"9:50",  c:K.green},
  co_fr: {key:"co_fr", name:"Corporations", prof:"Fried",       cr:4, days:["Wed","Thu","Fri"], s:"13:30",e:"15:30", c:K.green},
  co_pg: {key:"co_pg", name:"Corporations", prof:"Pargendler",  cr:4, days:["Mon","Tue"],       s:"15:45",e:"17:45", c:K.green},
  // ── FALL BANKRUPTCY ──
  f_bke: {key:"f_bke", name:"Bankruptcy",   prof:"Ellias",    cr:4, days:["Mon","Tue"],  s:"10:15",e:"12:15", c:K.violet},
  // ── FALL ADMIN LAW ──
  f_adm: {key:"f_adm", name:"Admin Law",    prof:"Freeman",   cr:4, days:["Wed","Thu"],  s:"13:30",e:"15:30", c:K.red},
  // ── TAW ──
  taw:   {key:"taw",   name:"Trial Advocacy Workshop", prof:"Sullivan", cr:3, days:DAYS, s:"14:00",e:"21:00", c:K.gray},
  // ── FALL SEMINARS / COURSES ──
  f_sex: {key:"f_sex", name:"Sex Equality",    prof:"MacKinnon", cr:3, days:["Mon","Tue","Wed"], s:"18:00",e:"20:00", c:K.pink},
  f_sexA:{key:"f_sexA",name:"Adv Sex Equality",prof:"MacKinnon", cr:2, days:["Mon","Tue"],       s:"13:30",e:"15:30", c:K.pink},
  f_fl:  {key:"f_fl",  name:"Facts & Lies",    prof:"Saris",     cr:2, days:["Wed"],             s:"15:45",e:"17:45", c:K.orange},
  f_ec:  {key:"f_ec",  name:"Engaging China",  prof:"Alford",    cr:2, days:["Mon","Tue"],       s:"18:00",e:"20:00", c:K.red},
  f_aa:  {key:"f_aa",  name:"Asian Am & Law",  prof:"Lee",       cr:2, days:["Tue"],             s:"15:45",e:"17:45", c:K.amber},
  // ── FALL 1ST AMENDMENT (multi-section) ──
  f_1afe:{key:"f_1afe",name:"1st Amendment",prof:"Feldman",   cr:4, days:["Thu","Fri"],       s:"10:15",e:"12:15", c:K.indigo},
  f_1awe:{key:"f_1awe",name:"1st Amendment",prof:"Weinrib",   cr:4, days:["Mon","Tue"],       s:"13:30",e:"15:30", c:K.indigo},
  // ── FALL CRIM PRO (multi-section) ──
  f_cpsu:{key:"f_cpsu",name:"Crim Pro: Survey",      prof:"Re",   cr:4, days:["Tue","Wed"],   s:"10:15",e:"12:15", c:K.amber},
  // ── SPRING ADMIN LAW (multi-section) ──
  sp_adm_v:{key:"sp_adm_v",name:"Admin Law",prof:"Vermeule", cr:4, days:["Wed","Thu"],   s:"13:30",e:"15:30", c:K.red},
  sp_adm_b:{key:"sp_adm_b",name:"Admin Law",prof:"Block",    cr:3, days:["Tue","Wed"],   s:"15:45",e:"17:15", c:K.red},
  // ── SPRING CORPORATIONS (multi-section) ──
  sp_co_c:{key:"sp_co_c",name:"Corporations",prof:"Coates",    cr:4, days:["Mon","Tue","Wed"], s:"10:15",e:"11:35", c:K.green},
  sp_co_t:{key:"sp_co_t",name:"Corporations",prof:"Tallarita", cr:4, days:["Thu","Fri"],       s:"10:15",e:"12:15", c:K.green},
  // ── SPRING EVIDENCE (multi-section) ──
  sp_ev_l:{key:"sp_ev_l",name:"Evidence",prof:"Lvovsky", cr:4, days:["Mon","Tue","Wed"], s:"10:30",e:"11:50", c:K.blue},
  sp_ev_c:{key:"sp_ev_c",name:"Evidence",prof:"Clary",   cr:3, days:["Wed","Thu"],       s:"13:30",e:"15:00", c:K.blue},
  // ── SPRING 1ST AMENDMENT ──
  sp_1a:  {key:"sp_1a", name:"1st Amendment",prof:"Parker",  cr:4, c:K.indigo},
  // ── SPRING CRIM PRO INVESTIGATIONS (multi-section) ──
  sp_cpi_n:{key:"sp_cpi_n",name:"Crim Pro: Investigations",prof:"Natapoff",cr:4,days:["Thu","Fri"],s:"10:15",e:"12:15",c:K.amber},
  sp_cpi_w:{key:"sp_cpi_w",name:"Crim Pro: Investigations",prof:"Whiting", cr:4,days:["Mon","Tue"],s:"10:15",e:"12:15",c:K.amber},
  // ── SPRING SINGLE-SECTION ──
  sp_bk: {key:"sp_bk", name:"Bankruptcy",      prof:"Roe",     cr:4, days:["Mon","Tue","Wed"],  s:"10:30",e:"11:50", c:K.violet},
  sp_cp: {key:"sp_cp", name:"Copyright",       prof:"Fisher",  cr:4, days:["Mon","Tue","Wed"],  s:"10:30",e:"11:50", c:K.sky},
  sp_col:{key:"sp_col",name:"Conflict of Laws",prof:"Sachs",   cr:3, days:["Mon","Tue"],         s:"13:40",e:"15:10", c:K.emerald},
};

const FALL_ELECTIVES={
  courses:[
    {key:"f_bke",  name:"Bankruptcy",               prof:"Ellias",         cr:4,days:["Mon","Tue"],       s:"10:15",e:"12:15",c:K.violet,evalId:"f_bke"},
    {key:"f_cl",   name:"Complex Litigation",        prof:"Clary",          cr:2,days:["Wed"],             s:"10:15",e:"12:15",c:K.cyan,  evalId:"f_cl"},
    {key:"f_ca",   name:"Class Actions",             prof:"Clary",          cr:2,days:["Tue"],             s:"13:30",e:"15:30",c:K.cyan,  evalId:"f_ca"},
    {key:"f_ctr",  name:"Copyright",                 prof:"Tushnet",        cr:4,days:["Mon","Tue"],       s:"10:15",e:"12:15",c:K.sky,   evalId:null},
    {key:"f_ctml", name:"Copyright & TM Litigation", prof:"Cendali",        cr:2,days:["Mon"],             s:"13:30",e:"15:30",c:K.sky,   evalId:"f_ctml"},
    {key:"f_cpa",  name:"Crim Pro: Adjudication",   prof:"Lanni",          cr:4,days:["Thu","Fri"],       s:"10:15",e:"12:15",c:K.amber, evalId:null},
    {key:"f_dpl",  name:"Drug Product Liability",    prof:"Grossi",         cr:3,days:["Wed"],             s:"13:30",e:"15:30",c:K.orange,evalId:"f_dpl"},
    {key:"f_iip",  name:"Intl Intellectual Property",prof:"Okediji",        cr:3,days:["Mon","Tue"],       s:"15:45",e:"17:15",c:K.sky,   evalId:null},
    {key:"f_lod",  name:"Law of Democracy",          prof:"Stephanopoulos", cr:4,days:["Thu","Fri"],       s:"10:15",e:"12:15",c:K.indigo,evalId:null},
    {key:"f_pat",  name:"Patent Law",                prof:"Tompros",        cr:3,days:["Thu","Fri"],       s:"10:15",e:"11:45",c:K.sky,   evalId:null},
    {key:"f_slg",  name:"State & Local Government",  prof:"Bowie",          cr:4,days:["Wed","Thu","Fri"], s:"13:30",e:"14:50",c:K.violet,evalId:null},
    {key:"f_sex",  name:"Sex Equality",              prof:"MacKinnon",      cr:3,days:["Mon","Tue","Wed"], s:"18:00",e:"20:00",c:K.pink,  evalId:"f_sex"},
    {key:"f_wcc",  name:"White Collar Criminal",     prof:"Apps",           cr:2,days:["Mon"],             s:"15:45",e:"17:45",c:K.fuchsia,evalId:null},
    {key:"f_art",  name:"Art Law Litigation",        prof:"Nikas",          cr:2,days:["Wed"],             s:"13:30",e:"15:30",c:K.lime,  evalId:null},
    {key:"f_bsl",  name:"Business Strategy",         prof:"Spier",          cr:3,days:["Mon","Tue"],       s:"8:30", e:"10:00",c:K.teal,  evalId:"f_bsl"},
    {key:"f_bn",   name:"Business Negotiations",     prof:"Coakley",        cr:3,days:["Wed"],             s:"18:00",e:"21:15",c:K.lime,  evalId:null},
    {key:"f_imm",  name:"Immigration Law",           prof:"Neuman",         cr:3,days:["Mon","Tue"],       s:"15:45",e:"17:15",c:K.amber, evalId:null},
    {key:"f_te",   name:"Trust and Estates",           prof:"Sitkoff",      cr:4,days:["Mon","Tue"],       s:"10:15",e:"12:15",c:K.violet,evalId:"sp_te"},
  ],
  seminars:[
    {key:"f_sexA", name:"Adv Problems in Sex Equality",prof:"MacKinnon",  cr:2,days:["Mon","Tue"],       s:"13:30",e:"15:30",c:K.pink,  evalId:null},
    {key:"f_antip",name:"Antitrust & IP",             prof:"Popofsky",    cr:2,days:["Wed"],             s:"15:45",e:"17:45",c:K.sky,   evalId:null},
    {key:"f_di",   name:"Democratic Innovations",     prof:"Lessig",      cr:2,days:["Wed"],             s:"15:45",e:"17:45",c:K.indigo,evalId:null},
    {key:"f_ec",   name:"Engaging China",             prof:"Alford",      cr:2,days:["Mon","Tue"],       s:"18:00",e:"20:00",c:K.red,   evalId:null},
    {key:"f_fl",   name:"Facts & Lies",               prof:"Saris",       cr:2,days:["Wed"],             s:"15:45",e:"17:45",c:K.orange,evalId:"f_fl"},
    {key:"f_ltd",  name:"Legal Tools for Democracy",  prof:"Schwartztol", cr:2,days:["Wed"],             s:"15:45",e:"17:45",c:K.indigo,evalId:null},
    {key:"f_aa",   name:"Asian Americans & Law",      prof:"Lee",         cr:2,days:["Tue"],             s:"15:45",e:"17:45",c:K.amber, evalId:null},
    {key:"f_pfmb", name:"Past & Future of Music Biz", prof:"Ferrell",     cr:2,days:["Mon"],             s:"18:00",e:"20:00",c:K.lime,  evalId:null},
    {key:"f_sct",  name:"The U.S. Supreme Court",     prof:"Sunstein/Breyer",cr:2,days:["Tue"],          s:"13:30",e:"15:30",c:K.violet,evalId:null},
  ],
  readings:[
    {key:"f_rg_atjl",name:"Advanced Topics in Jewish Law",  prof:"Feldman",    cr:1,days:["Thu"],s:"18:00",e:"20:00",c:K.gray},
    {key:"f_rg_bpl", name:"Building Power Lines",           prof:"Peskoe",     cr:1,days:["Wed"],s:"15:45",e:"17:45",c:K.lime},
    {key:"f_rg_cd",  name:"Celebrity Divorces",             prof:"Yang",       cr:1,days:["Tue"],s:"18:00",e:"20:00",c:K.fuchsia},
    {key:"f_rg_glt", name:"Gender, Law & Society in MENA",  prof:"Waheedi",    cr:1,days:["Thu"],s:"15:45",e:"17:45",c:K.pink},
    {key:"f_rg_gdt", name:"Governing Digital Tech",         prof:"Zittrain",   cr:1,days:["Mon"],s:"15:45",e:"17:45",c:K.sky},
    {key:"f_rg_hrj", name:"Human Rights in ICJ",            prof:"Neuman",     cr:1,days:["Wed"],s:"15:45",e:"17:45",c:K.teal},
    {key:"f_rg_ilwf",name:"Intl Law, War & Film",           prof:"Kalpouzos",  cr:1,days:["Tue"],s:"15:45",e:"17:45",c:K.amber},
    {key:"f_rg_ipls",name:"IP in Life Sciences",            prof:"Freilich",   cr:1,days:["Thu"],s:"18:00",e:"20:00",c:K.sky},
    {key:"f_rg_kid", name:"Knowledge Institutions/Democracy",prof:"Jackson",   cr:1,days:["Tue"],s:"18:00",e:"20:00",c:K.indigo},
    {key:"f_rg_mj",  name:"Misdemeanor Justice",            prof:"Natapoff",   cr:1,days:["Thu"],s:"18:00",e:"20:00",c:K.amber},
    {key:"f_rg_nsc", name:"The New Supreme Court",          prof:"Eggleston",  cr:1,days:["Mon"],s:"15:45",e:"17:45",c:K.violet},
    {key:"f_rg_ens", name:"Evolving National Security State",prof:"Eichensehr",cr:1,days:["Wed"],s:"15:45",e:"17:45",c:K.teal},
  ],
};

const SP_ELECTIVES={
  courses:[
    {key:"sp_crl",  name:"Civil Rights Litigation",  prof:"Michelman",  cr:3,days:["Thu","Fri"],       s:"15:45",e:"17:15",c:K.indigo,evalId:"sp_crl"},
    {key:"sp_col",  name:"Conflict of Laws",         prof:"Sachs",      cr:3,days:["Mon","Tue"],       s:"13:40",e:"15:10",c:K.emerald,evalId:null},
    {key:"sp_fam",  name:"Family Law",               prof:"Gersen",     cr:4,days:["Tue","Wed"],       s:"15:45",e:"17:45",c:K.pink,  evalId:null},
    {key:"sp_iip",  name:"Intl IP Law",              prof:"Okediji",    cr:3,days:["Mon","Tue"],       s:"15:45",e:"17:15",c:K.sky,   evalId:null},
    {key:"sp_itl",  name:"Intl Trade Law",           prof:"Wu",         cr:4,days:["Mon","Tue"],       s:"10:15",e:"12:15",c:K.teal,  evalId:null},
    {key:"sp_lab",  name:"Labor Law",                prof:"Sachs",      cr:4,days:["Mon","Tue"],       s:"13:30",e:"15:30",c:K.rose,  evalId:null},
    {key:"sp_mmlaw",name:"Mass Media Law",           prof:"McCraw",     cr:2,days:["Wed"],             s:"15:45",e:"17:45",c:K.sky,   evalId:"sugg_massMedia"},
    {key:"sp_mus",  name:"Music & Digital Media",    prof:"Bavitz",     cr:2,days:["Mon"],             s:"15:45",e:"17:45",c:K.sky,   evalId:"sp_mus"},
    {key:"sp_pat",  name:"Patent Trial Advocacy",    prof:"Tompros",    cr:3,days:["Thu","Fri"],       s:"10:30",e:"12:00",c:K.sky,   evalId:"sugg_patentTrial"},
    {key:"sp_aml",  name:"Analytical Methods",       prof:"Spier",      cr:3,days:["Mon","Tue"],       s:"8:30", e:"10:00",c:K.teal,  evalId:"sp_aml"},
    {key:"sp_tm",   name:"Trademark & Unfair Comp.", prof:"Tushnet",    cr:3,days:["Mon","Tue"],       s:"8:30", e:"10:00",c:K.sky,   evalId:null},
    {key:"sp_adv",  name:"Advertising Law",          prof:"Tushnet",    cr:3,days:["Mon","Tue"],       s:"13:30",e:"15:00",c:K.sky,   evalId:null},
    {key:"sp_gi",   name:"Gender Identity & Sex Orientation",prof:"Chen",cr:2,days:["Tue"],           s:"15:45",e:"17:45",c:K.fuchsia,evalId:"f_gi"},
    {key:"sp_gvls", name:"Gender Violence Law",      prof:"Rosenfeld",  cr:3,days:["Wed","Thu"],       s:"13:30",e:"15:00",c:K.pink,  evalId:null},
    {key:"sp_rfi",  name:"Regulation of Financial Institutions",prof:"Tarullo",cr:4,days:["Mon","Tue"],s:"13:30",e:"15:30",c:K.violet,evalId:null},
    {key:"sp_ag",   name:"Role of State Attorney General",prof:"Brann", cr:2,days:["Mon"],             s:"13:30",e:"15:30",c:K.indigo,evalId:"sugg_stateAG"},
    {key:"sp_fcg",  name:"Federal Courts",          prof:"Goldsmith",  cr:4,c:K.teal,                                                evalId:"sugg_fedCourts"},
    {key:"sp_rem",  name:"Remedies",                prof:"Gersen",     cr:3,days:["Tue","Wed"],       s:"15:45",e:"17:15",c:K.emerald,evalId:"sp_rem"},
    {key:"sp_te",   name:"Trust and Estates",        prof:"Sitkoff",   cr:4,days:["Mon","Tue"],       s:"10:15",e:"12:15",c:K.violet,evalId:"sp_te"},
    {key:"sp_clwl", name:"Comp Law: Why Law? China", prof:"Alford",    cr:4,days:["Mon","Wed"],       s:"15:45",e:"17:45",c:K.red,   evalId:null},
    {key:"sp_advn", name:"Adv Negotiation: Money & You",prof:"Heen", cr:3,days:["Tue"],             s:"15:45",e:"19:00",c:K.lime,  evalId:"f_advn"},
    {key:"sp_ante", name:"Antitrust Law & Economics",prof:"Elhauge", cr:4,days:["Wed","Thu","Fri"],  s:"13:30",e:"14:50",c:K.teal,  evalId:"f_ante"},
  ],
  seminars:[
    {key:"sp_a2j",  name:"Access to Justice Lab",    prof:"Greiner",    cr:2,days:["Thu"],             s:"18:00",e:"20:00",c:K.lime,  evalId:"sp_a2j"},
    {key:"sp_adm2", name:"Advanced Issues in Admin Law",prof:"Vermeule",cr:2,days:["Tue"],             s:"15:45",e:"17:45",c:K.red,   evalId:null},
    {key:"sp_awa",  name:"Advanced Written Advocacy", prof:"Clary",     cr:2,days:["Wed"],             s:"15:45",e:"17:45",c:K.cyan,  evalId:null},
    {key:"sp_sexA", name:"Comparative & Intl Reproductive Rights",prof:"Yamin",cr:2,days:["Wed"],      s:"15:45",e:"17:45",c:K.pink,  evalId:null},
    {key:"sp_ltd",  name:"Legal Tools for Democracy", prof:"Schwartztol",cr:2,days:["Tue"],            s:"15:45",e:"17:45",c:K.indigo,evalId:null},
    {key:"sp_rc",   name:"The Roberts Court",         prof:"Gershengorn",cr:2,days:["Tue"],            s:"15:45",e:"17:45",c:K.violet,evalId:null},
    {key:"sp_tc",   name:"Teaching Copyright",        prof:"Fisher",    cr:2,days:["Mon"],             s:"18:00",e:"20:00",c:K.sky,   evalId:null},
    {key:"sp_rob",  name:"The Obama Presidency",      prof:"Mack",      cr:2,days:["Tue"],             s:"18:00",e:"20:00",c:K.teal,  evalId:null},
    {key:"sp_cilo", name:"China & Intl Legal Order",  prof:"Wu",        cr:2,days:["Mon"],             s:"18:00",e:"20:00",c:K.red,   evalId:"f_cilo"},
    {key:"sp_lfm",  name:"Leading from the Middle",   prof:"DeFilippo", cr:2,days:["Mon"],             s:"18:00",e:"20:00",c:K.lime,  evalId:"f_lfm"},
    {key:"sp_aaldc",name:"Adaptive Leadership",        prof:"Westfahl",  cr:2,days:["Mon"],             s:"18:00",e:"20:00",c:K.lime,  evalId:null},
    {key:"sp_ldr",  name:"Law & Democracy: Demise/Renewal",prof:"Robinson",cr:2,days:["Mon"],          s:"13:30",e:"15:30",c:K.indigo,evalId:null},
    {key:"sp_lmci", name:"Law & Media: Contesting Images",prof:"Robinson",cr:2,days:["Tue"],           s:"13:30",e:"15:30",c:K.sky,   evalId:null},
  ],
  readings:[
    {key:"sp_rg_fe", name:"Feminist Utopias",               prof:"Rosenfeld",  cr:1,days:["Tue"],s:"15:45",e:"17:45",c:K.pink},
    {key:"sp_rg_me", name:"Money and Empire",               prof:"Desan",      cr:1,days:["Wed"],s:"15:45",e:"17:45",c:K.violet},
    {key:"sp_rg_cda",name:"Constitutional Dimensions/Admin",prof:"Jackson",    cr:1,days:["Thu"],s:"18:00",e:"19:30",c:K.indigo},
    {key:"sp_rg_hlp",name:"Health Law & Policy",            prof:"Sepper",     cr:1,days:["Tue"],s:"18:00",e:"20:00",c:K.lime},
    {key:"sp_rg_ctl",name:"Current Topics in Trust Law",    prof:"Sitkoff",    cr:1,days:["Mon"],s:"15:45",e:"17:45",c:K.violet},
    {key:"sp_rg_bon",name:"Bonobo Sisterhood",              prof:"Rosenfeld",  cr:1,days:["Tue"],s:"15:45",e:"17:45",c:K.pink},
  ],
};

const CLINIC_OPTS=[
  {id:"consumer",  name:"Consumer Protection", semCr:2, fMin:3,fMax:5, term:"both",        c:K.lime,   evalId:"clinicConsumer",
   note:"Fall or spring · WilmerHale Legal Services Center · litigation-heavy · Alexa Rosenbloom",
   semFall:{days:["Tue"],s:"13:30",e:"15:30"}, semSpring:{days:["Tue"],s:"13:30",e:"15:30"}},
  {id:"fedcourts", name:"Federal Courts",      semCr:1, fMin:2,fMax:3, term:"winter+spring",c:K.teal,  evalId:"clinicFedCourts",
   note:"Winter 2cr + Spring 2–3cr fieldwork + 1cr seminar · externship at any federal court nationwide · David Zimmer",
   semSpring:{days:["Wed"],s:"8:30",e:"10:00"}},
  {id:"mediation", name:"Mediation",           semCr:1, fMin:1,fMax:1, term:"both",        c:K.fuchsia,evalId:null,
   note:"Fall or spring · 1cr fieldwork + 1cr seminar = 2cr total · Catherine Mondell",
   semFall:{days:["Tue"],s:"15:45",e:"17:45"}, semSpring:{days:["Tue"],s:"15:45",e:"17:45"}},
  {id:"judicial",  name:"Judicial Process in Trial Courts", semCr:2, fMin:2,fMax:5, term:"both",   c:K.amber,  evalId:"clinicJudicial",
   note:"Fall or spring · observe & assist in MA trial courts · Barbara Berenson",
   semFall:{days:["Thu"],s:"15:45",e:"17:45"}, semSpring:{days:["Wed"],s:"15:45",e:"17:45"}},
  {id:"electionlaw",name:"Election Law",       semCr:2, fMin:2,fMax:5, term:"both",        c:K.indigo, evalId:null,
   note:"Fall or spring · voting rights, redistricting, election admin · Stephanopoulos/Greenwood",
   semFall:{days:["Tue"],s:"15:45",e:"17:45"}, semSpring:{days:["Tue"],s:"15:45",e:"17:45"}},
];

// ── CALENDAR ─────────────────────────────────────────────────────────────────
const CAL_S=8*60, CAL_E=21*60, CAL_H=455;
const yOf=m=>((toMin(m)-CAL_S)/(CAL_E-CAL_S))*CAL_H;
const hOf=(s,e)=>Math.max(((toMin(e)-toMin(s))/(CAL_E-CAL_S))*CAL_H,14);

function Calendar({courses,tawActive}){
  const mob = useContext(MobileContext);
  const calH = mob ? 340 : CAL_H;
  const yOfLocal = m => ((toMin(m)-CAL_S)/(CAL_E-CAL_S))*calH;
  const hOfLocal = (s,e) => Math.max(((toMin(e)-toMin(s))/(CAL_E-CAL_S))*calH,mob?10:14);
  const byDay={};
  DAYS.forEach(d=>byDay[d]=[]);
  courses.forEach(c=>{c?.days?.forEach(d=>byDay[d]?.push(c))});
  const hrs=Array.from({length:13},(_,i)=>i+8);
  const halfHrs=Array.from({length:26},(_,i)=>8*60+i*30);
  return(
    <div style={{overflowX:mob?"auto":"visible",WebkitOverflowScrolling:"touch"}}>
    <div style={{display:"flex",height:calH+24,fontSize:mob?10:11,userSelect:"none",flexShrink:0,borderRadius:5,overflow:"hidden",border:"1px solid #d9ccba",minWidth:mob?420:"auto"}}>
      <div style={{width:mob?26:32,position:"relative",flexShrink:0,paddingTop:24,background:"#f3ede3",borderRight:"1px solid #d9ccba"}}>
        {hrs.map(h=>(
          <div key={h} style={{position:"absolute",top:yOfLocal(`${h}:00`)+24-6,right:mob?2:4,color:"#8a7e6e",fontSize:mob?8:9,fontFamily:"system-ui,sans-serif",lineHeight:1}}>
            {h===12?"12p":h<12?h+"a":(h-12)+"p"}
          </div>
        ))}
      </div>
      {DAYS.map(day=>(
        <div key={day} style={{flex:1,borderLeft:"1px solid #d9ccba",position:"relative",minWidth:0,overflow:"hidden"}}>
          <div style={{textAlign:"center",fontWeight:700,color:"#1e2d4a",height:24,lineHeight:"24px",background:"#ede6d8",borderBottom:"1px solid #d9ccba",fontSize:mob?10:11,fontFamily:"system-ui,sans-serif",letterSpacing:"0.04em"}}>{mob?day.slice(0,2):day}</div>
          {tawActive&&<div style={{position:"absolute",top:yOfLocal("14:00")+24,height:hOfLocal("14:00","21:00"),left:0,right:0,background:"rgba(107,99,90,.05)",borderTop:"1px dashed #c4b8a8",pointerEvents:"none"}}/>}
          {halfHrs.map(m=>{
            const isHour=m%60===0;
            return <div key={m} style={{position:"absolute",top:yOfLocal(`${Math.floor(m/60)}:${m%60===0?"00":"30"}`)+24,left:0,right:0,
              borderTop:isHour?"1px solid #ddd6cc":"1px dashed #ece6de",pointerEvents:"none"}}/>;
          })}
          {byDay[day].map((c,i)=>(
            <div key={c.key+day+i} title={`${c.name}${c.prof?" ("+c.prof+")":""}\n${c.s}–${c.e}`}
              style={{position:"absolute",top:yOfLocal(c.s)+24,height:hOfLocal(c.s,c.e),left:1,right:1,
                background:c.c.bg,borderLeft:`${mob?2:3}px solid ${c.c.bd}`,borderRadius:2,
                padding:mob?"1px 2px":"2px 4px",overflow:"hidden",color:c.c.tx,boxShadow:"0 1px 3px rgba(0,0,0,.1)",cursor:"default"}}>
              <div style={{fontWeight:700,fontSize:mob?8:10,lineHeight:1.2,fontFamily:"system-ui,sans-serif"}}>{c.name}</div>
              {c.prof&&!mob&&<div style={{opacity:.65,fontSize:9,fontFamily:"system-ui,sans-serif"}}>{c.prof}</div>}
            </div>
          ))}
        </div>
      ))}
    </div>
    </div>
  );
}

// ── UI ATOMS ──────────────────────────────────────────────────────────────────
const Dot=({c,sz=8,style={}})=><span style={{display:"inline-block",width:sz,height:sz,borderRadius:"50%",background:c.bd,flexShrink:0,marginRight:4,verticalAlign:"middle",...style}}/>;

function StarBadge({evalId}) {
  const E = useContext(EvalContext);
  const ev = E[evalId]; if(!ev) return null;
  const col = starColor(ev.avg);
  return <span style={{fontSize:13,fontWeight:700,color:col,marginLeft:4}}>{ev.avg?`★${ev.avg}`:"★?"}{ev.n>0?` (${ev.n})`:""}</span>;
}

function Option({type,value,cur,set,label,sub,c,evalId,warn,locked,noteKey}){
  const sel = type==="radio"?(cur===value):cur;
  const nk = noteKey !== undefined ? noteKey : (type==="radio" ? value : null);
  const mob = useContext(MobileContext);
  return(
    <div style={{marginBottom:mob?3:4}}>
      <label style={{display:"flex",alignItems:"flex-start",gap:mob?4:5,cursor:locked?"default":"pointer",
        padding:mob?"3px 5px":"4px 7px",borderRadius:4,
        background:sel?(warn?"#f5ede0":"#edf0f5"):"transparent",
        border:sel?(warn?"1px solid #c4924a":"1px solid #b0bdd4"):"1px solid transparent",
        opacity:locked?.45:1}}>
        {type==="radio"
          ? <input type="radio" checked={sel} onChange={()=>!locked&&set(value)} disabled={locked} style={{marginTop:2,flexShrink:0,accentColor:"#1e2d4a"}}/>
          : <input type="checkbox" checked={sel} onChange={e=>!locked&&set(e.target.checked)} disabled={locked} style={{marginTop:2,flexShrink:0,accentColor:"#1e2d4a"}}/>}
        {c&&<Dot c={c} sz={mob?6:8} style={{marginTop:mob?5:6}}/>}
        <span style={{fontSize:mob?14:17,fontFamily:"system-ui,sans-serif"}}>
          <span style={{fontWeight:600,color:"#2c2418"}}>{label}</span>
          {evalId && <StarBadge evalId={evalId}/>}
          {sub&&<><br/><span style={{color:warn?"#a0622a":"#8a7e6e",fontSize:mob?12:14}}>{sub}</span></>}
        </span>
      </label>
      {evalId && <EvalCard evalId={evalId}/>}
      {nk&&window.__hlsSetNote&&<NoteField courseKey={nk}/>}
    </div>
  );
}

function Sect({title,must,children}){
  const mob = useContext(MobileContext);
  const [open, setOpen] = useState(!!must);
  return(
    <div style={{marginBottom:mob?10:13,borderLeft:`2px solid ${must?"#6b1e2e":"#d9ccba"}`,paddingLeft:mob?7:9}}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{display:"flex",alignItems:"center",gap:5,marginBottom:open?5:0,cursor:"pointer",userSelect:"none"}}>
        <span style={{fontSize:11,color:"#8a7e6e",fontFamily:"system-ui,sans-serif",transition:"transform .2s",transform:open?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
        <span style={{fontSize:mob?12:13,fontWeight:700,color:"#8a7e6e",textTransform:"uppercase",letterSpacing:".07em",fontFamily:"system-ui,sans-serif"}}>{title}</span>
        {must&&<span style={{background:"#f5e8e8",color:"#6b1e2e",borderRadius:10,padding:"1px 7px",fontSize:mob?10:11,fontWeight:700,fontFamily:"system-ui,sans-serif",letterSpacing:".04em"}}>required</span>}
      </div>
      {open&&children}
    </div>
  );
}

function CrBar({cr,min,max,label}){
  const mob = useContext(MobileContext);
  const over=cr>max,under=cr<min;
  const col=over?"#6b1e2e":under?"#9a7820":"#1e2d4a";
  const barCol=over?"#7c1d2e":under?"#a0622a":"#2c4a7c";
  return(
    <div style={{marginBottom:mob?6:8}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:mob?13:14,fontWeight:600,marginBottom:3,fontFamily:"system-ui,sans-serif"}}>
        <span style={{color:col}}>{label}: <strong>{cr}cr</strong> {over?"· over max":under?"· under min":""}</span>
        <span style={{color:"#8a7e6e",fontWeight:400}}>{min}–{max}cr</span>
      </div>
      <div style={{height:4,background:"#d9ccba",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${Math.min(cr/max,1)*100}%`,background:barCol,transition:"width .3s",borderRadius:2}}/>
      </div>
    </div>
  );
}

function ConflictBanner({conflicts,tawOk,tawHrs,tawActive}){
  const mob = useContext(MobileContext);
  const msgs=[...conflicts.map(([a,b])=>`${a.name} (${a.prof}) ↔ ${b.name} (${b.prof})`),
    ...(tawActive&&!tawOk?[`TAW overlap ${fmtHr(tawHrs)}hr/wk — exceeds 4hr limit`]:[])];
  if(!msgs.length) return <div style={{background:"#eaf0e8",border:"1px solid #b0c4a8",borderRadius:4,padding:mob?"3px 8px":"4px 10px",marginBottom:mob?6:8,fontSize:mob?12:14,color:"#2a4a22",fontFamily:"system-ui,sans-serif"}}>✓ No schedule conflicts{tawActive?` · TAW overlap: ${fmtHr(tawHrs)}hr/wk`:""}</div>;
  return(
    <div style={{background:"#f5e8e8",border:"1px solid #c4a4a4",borderRadius:4,padding:mob?"4px 8px":"6px 10px",marginBottom:mob?6:8,fontFamily:"system-ui,sans-serif"}}>
      <div style={{fontWeight:700,color:"#6b1e2e",fontSize:mob?12:14,marginBottom:2}}>⚠ {msgs.length} conflict{msgs.length>1?"s":""}</div>
      {msgs.map((m,i)=><div key={i} style={{fontSize:mob?11:13,color:"#7c1d2e"}}>{m}</div>)}
    </div>
  );
}

function ElectCard({c, sel, toggle}){
  const mob = useContext(MobileContext);
  const on=sel.has(c.key);
  const schedStr=c.days?`${c.days.map(d=>d.slice(0,2)).join(", ")} ${c.s}–${c.e}`:(c.note||"");
  return(
    <div style={{borderRadius:3,background:on?c.c.bg:"#f3ede3",border:on?`1px solid ${c.c.bd}`:"1px solid #d9ccba",overflow:"hidden",marginBottom:2}}>
      <label style={{display:"flex",alignItems:"flex-start",gap:mob?4:5,cursor:"pointer",padding:mob?"4px 5px":"5px 7px",width:"100%",boxSizing:"border-box",fontFamily:"system-ui,sans-serif"}}>
        <input type="checkbox" checked={on} onChange={()=>toggle(c.key)} style={{flexShrink:0,marginTop:2,accentColor:c.c.bd}}/>
        <Dot c={c.c} sz={6} style={{marginTop:4}}/>
        <span style={{flex:1,lineHeight:1.3}}>
          <span style={{fontWeight:600,color:"#2c2418",fontSize:mob?13:14}}>{c.name}</span>
          {c.evalId&&<StarBadge evalId={c.evalId}/>}
          <br/>
          <span style={{color:"#8a7e6e",fontSize:mob?11:12}}>{c.prof} · {c.cr}cr</span>
          {schedStr&&<><br/><span style={{color:on?c.c.bd:"#5a7070",fontSize:mob?11:12,fontWeight:600}}>{schedStr}</span></>}
        </span>
      </label>
      {c.evalId&&<EvalCard evalId={c.evalId}/>}
      {window.__hlsSetNote&&<NoteField courseKey={c.key}/>}
    </div>
  );
}

function ElectiveSect({label, items, sel, toggle, cols=2}){
  const mob = useContext(MobileContext);
  const [open, setOpen] = useState(false);
  if(!items||items.length===0) return null;
  const effectiveCols = mob ? 1 : cols;
  const selCount = items.filter(c=>sel.has(c.key)).length;
  return(
    <div style={{marginBottom:mob?8:10}}>
      <div onClick={()=>setOpen(o=>!o)} style={{fontSize:mob?10:11,fontWeight:700,color:"#8a7e6e",textTransform:"uppercase",letterSpacing:".07em",fontFamily:"system-ui,sans-serif",marginBottom:open?4:0,cursor:"pointer",userSelect:"none",display:"flex",alignItems:"center",gap:4}}>
        <span style={{fontSize:10,transition:"transform .2s",transform:open?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
        {label}{selCount>0&&<span style={{color:"#2c4a7c",fontSize:11}}>({selCount})</span>}
      </div>
      {open&&<div style={{display:"grid",gridTemplateColumns:`repeat(${effectiveCols},1fr)`,gap:3}}>
        {items.map(c=><ElectCard key={c.key} c={c} sel={sel} toggle={toggle}/>)}
      </div>}
    </div>
  );
}

function ClinicSelector({clinicId,setClinicId,fieldCr,setFieldCr,allowedTerms}){
  const mob = useContext(MobileContext);
  const opts=CLINIC_OPTS.filter(cl=>{
    if(allowedTerms==="fall") return cl.term==="both"||cl.term==="fall";
    if(allowedTerms==="spring") return cl.term==="both"||cl.term==="spring"||cl.term==="spring-only"||cl.term==="winter+spring";
    return true;
  });
  const sel=opts.find(c=>c.id===clinicId)||null;
  return(
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:6}}>
        <button onClick={()=>setClinicId(null)} style={{padding:"2px 8px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",background:!clinicId?"#1e2d4a":"#ede6d8",color:!clinicId?"#f3ede3":"#2c2418",border:"none",fontFamily:"system-ui,sans-serif"}}>None</button>
        {opts.map(cl=>(
          <button key={cl.id} onClick={()=>{setClinicId(cl.id);setFieldCr(cl.fMin);}}
            style={{padding:"2px 8px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",background:clinicId===cl.id?cl.c.bd:"#ede6d8",color:clinicId===cl.id?"#f3ede3":"#2c2418",border:"none",fontFamily:"system-ui,sans-serif"}}>
            {cl.name}
          </button>
        ))}
      </div>
      {sel&&(
        <div style={{background:sel.c.bg,border:`1px solid ${sel.c.bd}`,borderRadius:6,padding:"7px 9px",fontSize:14}}>
          <div style={{fontWeight:700,color:sel.c.tx,marginBottom:3}}>{sel.name} Clinic {sel.evalId&&<StarBadge evalId={sel.evalId}/>}</div>
          <div style={{color:sel.c.tx,fontSize:13,marginBottom:5}}>{sel.note}</div>
          {sel.evalId&&<EvalCard evalId={sel.evalId} label="clinic eval"/>}
          {sel.id!=="mediation"&&sel.id!=="fedcourts"&&(
            <>
              <div style={{fontSize:13,fontWeight:600,color:sel.c.tx,marginBottom:3,marginTop:6}}>Fieldwork credits (+ {sel.semCr}cr seminar):</div>
              {(()=>{
                const sem=allowedTerms==="spring"?(sel.semSpring||sel.semFall):sel.semFall||sel.semSpring;
                if(!sem) return null;
                const days=sem.days.map(d=>d.slice(0,2)).join(", ");
                return <div style={{fontSize:12,color:sel.c.tx,marginBottom:4}}>
                  📅 Seminar: <strong>{days} {sem.s}–{sem.e}</strong> · {sel.semCr}cr
                </div>;
              })()}
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                {[sel.fMin,sel.fMin+1,sel.fMin+2].filter(n=>n<=sel.fMax).map(n=>(
                  <button key={n} onClick={()=>setFieldCr(n)} style={{padding:"2px 9px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",background:fieldCr===n?sel.c.bd:"#fff",border:`2px solid ${fieldCr===n?sel.c.bd:sel.c.bd+"60"}`,color:fieldCr===n?"#fff":sel.c.tx}}>{n}cr</button>
                ))}
                <span style={{fontSize:13,color:sel.c.tx}}>= <strong>{fieldCr+sel.semCr}cr</strong> total</span>
              </div>
            </>
          )}
          {sel.id==="fedcourts"&&(
            <>
              <div style={{fontSize:13,fontWeight:600,color:sel.c.tx,marginBottom:3,marginTop:6}}>Spring fieldwork credits (+ 1cr seminar):</div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                {[2,3].map(n=>(
                  <button key={n} onClick={()=>setFieldCr(n)} style={{padding:"2px 9px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",background:fieldCr===n?sel.c.bd:"#fff",border:`2px solid ${fieldCr===n?sel.c.bd:sel.c.bd+"60"}`,color:fieldCr===n?"#fff":sel.c.tx}}>{n}cr</button>
                ))}
                <span style={{fontSize:13,color:sel.c.tx}}>+ 2cr winter = <strong>{fieldCr+1+2}cr</strong> total</span>
              </div>
            </>
          )}
          {sel.id==="mediation"&&<div style={{fontSize:13,color:sel.c.tx,marginTop:3}}>1cr fieldwork + 1cr seminar = <strong>2cr total</strong> · Seminar: T 3:45–5:45</div>}
        </div>
      )}
    </div>
  );
}


// ── PLAN VERSIONS ─────────────────────────────────────────────────────────────
const BLANK_PLAN={fEv:"ev_m",fCo:"co_sp",fTAW:"fall",fAdm:false,f1a:"none",fCp:"none",
  fElect:[],fClinic:null,fField:3,wRepro:false,
  spAdm:"sp_adm_v",spCo:"none",spEv:"none",spMTC:"none",sp1a:"none",spCpi:"none",
  spElect:[],spClinic:null,spField:3,ranking:null};

function loadVersions(){
  try{ const v=JSON.parse(localStorage.getItem("hls_versions")||"[null,null,null,null]"); while(v.length<4)v.push(null); return v; }
  catch{ return [null,null,null,null]; }
}
function saveVersions(vs){ try{ localStorage.setItem("hls_versions",JSON.stringify(vs)); }catch{} }

function planToSnap(state){ return {...state, fElect:[...state.fElect], spElect:[...state.spElect], ranking:state.ranking||[]}; }
function snapToPlan(snap){ return {...snap, fElect:new Set(snap.fElect||[]), spElect:new Set(snap.spElect||[]), ranking:snap.ranking||[]}; }

// ── ICS EXPORT ───────────────────────────────────────────────────────────────
const DAY_TO_ICS = {Mon:"MO",Tue:"TU",Wed:"WE",Thu:"TH",Fri:"FR"};
const DAY_TO_OFFSET = {Mon:0,Tue:1,Wed:2,Thu:3,Fri:4}; // offset from Monday

// Term date ranges
const TERM_DATES = {
  fall:   { start: new Date(2026, 8, 8),  end: "20261204T235959", weekOfMon: new Date(2026, 8, 7) },  // Sept 8 – Dec 4
  winter: { start: new Date(2027, 0, 4),  end: "20270120T235959", weekOfMon: new Date(2027, 0, 4) },  // Jan 4 – Jan 20
  spring: { start: new Date(2027, 0, 25), end: "20270423T235959", weekOfMon: new Date(2027, 0, 25) }, // Jan 25 – Apr 23
};

function generateICS(coursesByTerm) {
  // coursesByTerm: [{courses:[], term:"fall"}, ...]
  const pad2 = n => String(n).padStart(2,"0");
  const fmtDate = d => `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}`;

  let events = [];
  for (const {courses, term} of coursesByTerm) {
    const td = TERM_DATES[term];
    if (!td) continue;
    for (const c of courses) {
      if (!c?.days?.length || !c.s || !c.e) continue;
      const [sh, sm] = c.s.split(":").map(Number);
      const [eh, em] = c.e.split(":").map(Number);

      for (const day of c.days) {
        const icsDay = DAY_TO_ICS[day];
        if (!icsDay) continue;
        const first = new Date(td.weekOfMon);
        first.setDate(first.getDate() + DAY_TO_OFFSET[day]);
        if (first < td.start) first.setDate(first.getDate() + 7);

        const ds = fmtDate(first);
        const uid = `${c.key}-${day}-${term}-${ds}@hls-planner`;
        const summary = `${c.name}${c.prof ? " (" + c.prof + ")" : ""}`;

        events.push([
          "BEGIN:VEVENT",
          `UID:${uid}`,
          `DTSTART:${ds}T${pad2(sh)}${pad2(sm)}00`,
          `DTEND:${ds}T${pad2(eh)}${pad2(em)}00`,
          `RRULE:FREQ=WEEKLY;BYDAY=${icsDay};UNTIL=${td.end}`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${c.cr || ""}cr${c.prof ? " · " + c.prof : ""} [${term}]`,
          "END:VEVENT",
        ].join("\r\n"));
      }
    }
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HLS Reading Room//Schedule Planner//EN",
    "X-WR-CALNAME:HLS 2026-27 Schedule",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadICS(content, filename) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const { notes, setNote } = useNotes();
  const E = useEvalData() || E_EMPTY;
  const isMobile = useIsMobile();
  window.__hlsNotes   = notes;
  window.__hlsSetNote = setNote;

  const [tab,setTab]=useState("fall");
  // Fall multi-section
  const [fEv,setFEv]=useState("ev_m");
  const [fCo,setFCo]=useState("co_sp");
  const [fTAW,setFTAW]=useState("fall");
  const [fAdm,setFAdm]=useState(false);
  // Fall 1A + Crim Pro
  const [f1a,setF1a]=useState("none");
  const [fCp,setFCp]=useState("none");
  // Fall electives
  const [fElect,setFElect]=useState(new Set());
  const [fClinic,setFClinic]=useState(null);
  const [fField,setFField]=useState(3);
  // Winter
  const [wRepro,setWRepro]=useState(false);
  // Spring multi-section
  const [spAdm,setSpAdm]=useState("sp_adm_v");
  const [spCo,setSpCo]=useState("none");
  const [spEv,setSpEv]=useState("none");
  const [spMTC,setSpMTC]=useState("none");
  const [sp1a,setSp1a]=useState("none");
  const [spCpi,setSpCpi]=useState("none");
  // Spring electives
  const [spElect,setSpElect]=useState(new Set());
  const [spClinic,setSpClinic]=useState(null);
  const [spField,setSpField]=useState(3);
  const [evalSearch,setEvalSearch]=useState("");
  const [versions,setVersions]=useState(loadVersions); // [snap|null, snap|null, snap|null]
  const [showVersions,setShowVersions]=useState(false);
  const [pickerOpen,setPickerOpen]=useState(true);
  const [ranking,setRanking]=useState(()=>generateSuggestedRanking(BLANK_PLAN));
  const [rankNoteOpen,setRankNoteOpen]=useState(new Set());

  const planState=()=>planToSnap({fEv,fCo,fTAW,fAdm,f1a,fCp,fElect,fClinic,fField,
    wRepro,spAdm,spCo,spEv,spMTC,sp1a,spCpi,spElect,spClinic,spField,ranking});
  const loadPlan=snap=>{
    const p=snapToPlan(snap);
    setFEv(p.fEv);setFCo(p.fCo);setFTAW(p.fTAW);setFAdm(p.fAdm);
    setF1a(p.f1a||"none");setFCp(p.fCp||"none");
    setFElect(p.fElect);setFClinic(p.fClinic);setFField(p.fField);
    setWRepro(p.wRepro);
    setSpAdm(p.spAdm);setSpCo(p.spCo);setSpEv(p.spEv);
    setSp1a(p.sp1a||"none");setSpCpi(p.spCpi||"none");
    setSpMTC(p.spMTC);setSpElect(p.spElect);setSpClinic(p.spClinic);setSpField(p.spField);
    if(p.ranking&&p.ranking.length>0) setRanking(p.ranking);
  };
  const saveVersion=i=>{
    // Regenerate ranking suggestion on save
    const curPlan={fEv,fCo,fTAW,fAdm,f1a,fCp,fElect:[...fElect],fClinic,fField,
      wRepro,spAdm,spCo,spEv,spMTC,sp1a,spCpi,spElect:[...spElect],spClinic,spField};
    const newRanking=generateSuggestedRanking(curPlan);
    setRanking(newRanking);
    const vs=[...versions];vs[i]=planToSnap({...curPlan,fElect,spElect,ranking:newRanking});setVersions(vs);saveVersions(vs);
  };
  const loadVersion=i=>{if(versions[i])loadPlan(versions[i]);};
  const clearVersion=i=>{const vs=[...versions];vs[i]=null;setVersions(vs);saveVersions(vs);};

  const clinicCrTotal=(clinicId,fieldCr)=>{
    const cl=CLINIC_OPTS.find(c=>c.id===clinicId);
    if(!cl) return 0;
    return cl.id==="mediation"?1:cl.id==="fedcourts"?fieldCr+cl.semCr:fieldCr+cl.semCr;
  };

  const ALL_FE=FALL_ELECTIVES.courses.concat(FALL_ELECTIVES.seminars).concat(FALL_ELECTIVES.readings);
  const ALL_SE=SP_ELECTIVES.courses.concat(SP_ELECTIVES.seminars).concat(SP_ELECTIVES.readings);

  const fallTimed=useMemo(()=>{
    const l=[];
    if(C[fEv]) l.push(C[fEv]);
    if(C[fCo]) l.push(C[fCo]);
    if(fTAW==="fall") l.push(C.taw);
    if(fAdm) l.push(C.f_adm);
    if(f1a!=="none"&&C[f1a]) l.push(C[f1a]);
    if(fCp!=="none"&&C[fCp]) l.push(C[fCp]);
    [...fElect].forEach(k=>{const c=ALL_FE.find(x=>x.key===k);if(c?.days)l.push(c);});
    // Add clinic seminar to calendar
    if(fClinic){const cl=CLINIC_OPTS.find(x=>x.id===fClinic);const sem=cl?.semFall||cl?.semSpring;if(sem)l.push({...sem,key:"f_clinic_sem",name:cl.name+" Seminar",prof:"",cr:0,c:cl.c});}
    return l;
  },[fEv,fCo,fTAW,fAdm,f1a,fCp,fElect,fClinic]);

  const fallNoTAW=fallTimed.filter(c=>c.key!=="taw");
  const fallConflicts=useMemo(()=>getConflicts(fallNoTAW),[fallNoTAW]);
  const fallTAWHrs=useMemo(()=>fTAW==="fall"?fallNoTAW.reduce((s,c)=>s+tawOverlapHrsPerWeek(c),0):0,[fTAW,fallNoTAW]);
  const fallTAWOk=fallTAWHrs<=4;
  const fElectCr=useMemo(()=>[...fElect].reduce((s,k)=>{const c=ALL_FE.find(x=>x.key===k);return s+(c&&!c.days?c.cr:0);},0),[fElect]);
  const fClinicCr=clinicCrTotal(fClinic,fField);
  const fallCr=sumCr(fallTimed)+fElectCr+fClinicCr;

  const useFedWinter=spClinic==="fedcourts";
  const winterCrCalc=useFedWinter?2:(fTAW==="winter"?3:(wRepro?2:0));

  const spTimed=useMemo(()=>{
    const l=[];
    if(C[spAdm]) l.push(C[spAdm]);
    if(spCo!=="none"&&C[spCo]) l.push(C[spCo]);
    if(spEv!=="none"&&C[spEv]) l.push(C[spEv]);
    if(spMTC!=="none"&&C[spMTC]) l.push(C[spMTC]);
    if(sp1a!=="none"&&C[sp1a]) l.push(C[sp1a]);
    if(spCpi!=="none"&&C[spCpi]) l.push(C[spCpi]);
    [...spElect].forEach(k=>{const c=ALL_SE.find(x=>x.key===k);if(c?.days)l.push(c);});
    if(spClinic){const cl=CLINIC_OPTS.find(x=>x.id===spClinic);const sem=cl?.semSpring||cl?.semFall;if(sem)l.push({...sem,key:"sp_clinic_sem",name:cl.name+" Seminar",prof:"",cr:0,c:cl.c});}
    return l;
  },[spAdm,spCo,spEv,spMTC,sp1a,spCpi,spElect,spClinic]);

  const spConflicts=useMemo(()=>getConflicts(spTimed),[spTimed]);
  const spElectCr=useMemo(()=>[...spElect].reduce((s,k)=>{const c=ALL_SE.find(x=>x.key===k);return s+(c&&!c.days?c.cr:0);},0),[spElect]);
  const spClinicCr=spClinic==="fedcourts"?(spField+1):clinicCrTotal(spClinic,spField);
  const springCr=sumCr(spTimed)+spElectCr+spClinicCr;
  const annualCr=fallCr+winterCrCalc+springCr;

  // ── ICS EXPORT HELPERS ──
  const coursesFromSnap = useCallback((snap) => {
    const p = snapToPlan(snap);
    const fall = [];
    if(C[p.fEv]) fall.push(C[p.fEv]);
    if(C[p.fCo]) fall.push(C[p.fCo]);
    if(p.fTAW==="fall") fall.push(C.taw);
    if(p.fAdm) fall.push(C.f_adm);
    if(p.f1a&&p.f1a!=="none"&&C[p.f1a]) fall.push(C[p.f1a]);
    if(p.fCp&&p.fCp!=="none"&&C[p.fCp]) fall.push(C[p.fCp]);
    [...p.fElect].forEach(k=>{const c=ALL_FE.find(x=>x.key===k);if(c?.days)fall.push(c);});
    if(p.fClinic){const cl=CLINIC_OPTS.find(x=>x.id===p.fClinic);const sem=cl?.semFall||cl?.semSpring;if(sem)fall.push({...sem,key:"f_clinic_sem",name:cl.name+" Seminar",prof:"",cr:cl.semCr,c:cl.c});}
    const spring = [];
    if(C[p.spAdm]) spring.push(C[p.spAdm]);
    if(p.spCo!=="none"&&C[p.spCo]) spring.push(C[p.spCo]);
    if(p.spEv!=="none"&&C[p.spEv]) spring.push(C[p.spEv]);
    if(p.spMTC!=="none"&&C[p.spMTC]) spring.push(C[p.spMTC]);
    if(p.sp1a&&p.sp1a!=="none"&&C[p.sp1a]) spring.push(C[p.sp1a]);
    if(p.spCpi&&p.spCpi!=="none"&&C[p.spCpi]) spring.push(C[p.spCpi]);
    [...p.spElect].forEach(k=>{const c=ALL_SE.find(x=>x.key===k);if(c?.days)spring.push(c);});
    if(p.spClinic){const cl=CLINIC_OPTS.find(x=>x.id===p.spClinic);const sem=cl?.semSpring||cl?.semFall;if(sem)spring.push({...sem,key:"sp_clinic_sem",name:cl.name+" Seminar",prof:"",cr:cl.semCr,c:cl.c});}
    return [...fall, ...spring];
  }, [ALL_FE, ALL_SE]);

  const exportCurrentICS = useCallback(() => {
    const ics = generateICS([
      {courses: fallTimed, term: "fall"},
      {courses: spTimed, term: "spring"},
    ]);
    downloadICS(ics, "hls-schedule.ics");
  }, [fallTimed, spTimed]);

  const exportSavedICS = useCallback((i) => {
    const snap = versions[i];
    if (!snap) return;
    const all = coursesFromSnap(snap);
    const fall = all.filter(c => !c.key?.startsWith("sp_"));
    const spring = all.filter(c => c.key?.startsWith("sp_"));
    const ics = generateICS([
      {courses: fall, term: "fall"},
      {courses: spring, term: "spring"},
    ]);
    downloadICS(ics, `hls-plan-${i+1}.ics`);
  }, [versions, coursesFromSnap]);

  const crCol=(cr,min,max)=>cr>max?"#6b1e2e":cr<min?"#9a7820":"#1e2d4a";
  const TABS=["fall","winter","spring","summary","evals","suggest"];
  const TL={fall:"🍂 Fall",winter:"❄️ Winter",spring:"🌸 Spring",summary:"📋 Summary",evals:"★ Evals",suggest:"💡 Suggest"};
  const side=isMobile
    ?{width:"100%",paddingBottom:12}
    :{flex:1,minWidth:0,borderRight:`1px solid #d9ccba`,paddingRight:16,overflowY:"auto",maxHeight:"84vh"};

  const toggleF=k=>setFElect(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});
  const toggleSp=k=>setSpElect(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});

  // All course evals for the browser
  const ALL_EVAL_ITEMS = [
    {id:"ev_m",  name:"Evidence",              prof:"Medwed"},
    {id:"ev_s",  name:"Evidence",              prof:"Schulman"},
    {id:"ev_w",  name:"Evidence",              prof:"Whiting"},
    {id:"sp_ev_l",name:"Evidence",             prof:"Lvovsky"},
    {id:"sp_ev_c",name:"Evidence",             prof:"Clary"},
    {id:"co_sp", name:"Corporations",          prof:"Spaaman"},
    {id:"co_fr", name:"Corporations",          prof:"Fried"},
    {id:"taw",   name:"Trial Advocacy Workshop",prof:"Harden"},
    {id:"sp_bk", name:"Bankruptcy",            prof:"Roe"},
    {id:"f_bke", name:"Bankruptcy",            prof:"Elias"},
    {id:"sp_cp", name:"Copyright",             prof:"Fisher"},
    {id:"f_ctml",name:"Copyright & TM Litigation",prof:"Cendali"},
    {id:"sp_adm_v",name:"Admin Law",           prof:"Vermeule"},
    {id:"sp_adm_b",name:"Admin Law",           prof:"Block"},
    {id:"f_adm", name:"Admin Law",             prof:"Freeman"},
    {id:"sp_col",name:"Conflict of Laws",      prof:"Sachs"},
    {id:"f_sex", name:"Sex Equality",          prof:"MacKinnon"},
    {id:"f_gi",  name:"Gender Identity & Sexual Orientation",prof:"Chen"},
    {id:"f_ca",  name:"Class Actions",         prof:"Clary"},
    {id:"f_cl",  name:"Complex Litigation",    prof:"Clary"},
    {id:"f_taxB",name:"Taxation",              prof:"Brennan"},
    {id:"f_taxD",name:"Taxation",              prof:"Desai"},
    {id:"f_bsl", name:"Business Strategy for Lawyers",prof:"Spier"},
    {id:"f_dpl", name:"Drug Product Liability", prof:"Grossi"},
    {id:"f1a_fe",name:"1st Amendment",          prof:"Feldman"},
    {id:"f1a_we",name:"1st Amendment",          prof:"Weinrib"},
    {id:"sp_1a", name:"1st Amendment",          prof:"Parker"},
    {id:"f_ante",name:"Antitrust Law & Economics",prof:"Elhauge"},
    {id:"f_advn",name:"Advanced Negotiation",   prof:"Heen"},
    {id:"f_cilo",name:"China & Intl Legal Order",prof:"Wu"},
    {id:"f_lfm", name:"Leading from the Middle", prof:"DeFilippo"},
    {id:"sp_rem",name:"Remedies",               prof:"Gersen"},
    {id:"sp_te", name:"Trust and Estates",       prof:"Sitkoff"},
    {id:"sp_mus",name:"Music & Digital Media", prof:"Bavitz"},
    {id:"sp_aml",name:"Analytical Methods",    prof:"Spier"},
    {id:"sp_crl",name:"Civil Rights Litigation",prof:"Michelman"},
    {id:"sugg_fedCourts",name:"Federal Courts", prof:"Goldsmith"},
    {id:"clinicConsumer",name:"Consumer Protection Clinic",prof:"Bertling/Rosenbloom"},
    {id:"clinicFedCourts",name:"Federal Courts Clinic",    prof:"Zimmer"},
    {id:"clinicJudicial",name:"Judicial Process Clinic",   prof:"Cratsley/Berenson"},
    {id:"clinicCrimPros",name:"Criminal Prosecution Clinic",prof:"Corrigan"},
    {id:"sugg_patentTrial",name:"Patent Trial Advocacy",   prof:"Tompros"},
    {id:"sugg_compCon",  name:"Comparative Constitutional Law",prof:"Lessig"},
    {id:"sugg_massMedia",name:"Mass Media Law",            prof:"McCraw"},
    {id:"sugg_fashionLaw",name:"Fashion Law Lab",          prof:"Sarian"},
    {id:"sugg_antitrust",name:"Antitrust & IP",            prof:"Popofsky"},
    {id:"sugg_employDisc",name:"Employment Discrimination", prof:"Churchill"},
    {id:"sugg_stateAG",  name:"State AG Clinic",           prof:"Tierney"},
  ].filter(item=>E[item.id]);

  const filteredEvals = evalSearch.trim()
    ? ALL_EVAL_ITEMS.filter(it=>
        it.name.toLowerCase().includes(evalSearch.toLowerCase())||
        it.prof.toLowerCase().includes(evalSearch.toLowerCase()))
    : ALL_EVAL_ITEMS;

  const RR={bg:"#f9f5ef",paper:"#f3ede3",border:"#d9ccba",navy:"#1e2d4a",maroon:"#6b1e2e",ink:"#2c2418",muted:"#8a7e6e",faint:"#ede6d8",accent:"#7c1d2e",accentLight:"#f5e8e8",gold:"#9a7820"};
  const rrCrCol=(cr,min,max)=>cr>max?RR.maroon:cr<min?RR.gold:RR.navy;

  return(
    <MobileContext.Provider value={isMobile}>
    <EvalContext.Provider value={E}>
    <div style={{fontFamily:"Georgia,'Times New Roman',serif",background:RR.bg,minHeight:"100vh",boxSizing:"border-box",color:RR.ink}}>
      {/* Banner — mirrors The Reading Room nav bar */}
      <div style={{background:RR.bg,borderBottom:`1px solid ${RR.border}`,padding:isMobile?"12px 12px 10px":"18px 24px 14px",display:"flex",alignItems:isMobile?"center":"baseline",justifyContent:"space-between",gap:isMobile?8:0}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:isMobile?9:11,color:RR.muted,fontFamily:"system-ui,sans-serif",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:isMobile?2:4}}>The Reading Room</div>
          <h1 style={{margin:0,fontSize:isMobile?20:26,fontWeight:700,color:RR.maroon,letterSpacing:"-0.01em",fontFamily:"Georgia,'Times New Roman',serif",lineHeight:1}}>Schedule Planner</h1>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:isMobile?8:12,flexShrink:0}}>
          <button onClick={()=>setShowVersions(v=>!v)} style={{padding:isMobile?"3px 7px":"4px 10px",borderRadius:6,fontSize:isMobile?11:12,fontWeight:700,cursor:"pointer",background:showVersions?"#1e2d4a":"#ede6d8",color:showVersions?"#f3ede3":"#2c2418",border:"1px solid #c4b8a8",fontFamily:"system-ui,sans-serif"}}>
            📋 {isMobile?"Plans":"Plans"} {versions.filter(Boolean).length>0?`(${versions.filter(Boolean).length})`:""}
          </button>
          <div style={{textAlign:"right"}}>
            <span style={{fontSize:isMobile?14:15,fontWeight:700,color:rrCrCol(annualCr,24,35),fontFamily:"Georgia,serif"}}>{annualCr}cr</span>
            <div style={{fontSize:9,color:RR.muted,fontFamily:"system-ui,sans-serif",letterSpacing:"0.05em",textTransform:"uppercase",marginTop:2}}>{isMobile?"annual":"annual · req 24–35"}</div>
          </div>
        </div>
      </div>

      {showVersions&&(
        <div style={{background:"#edf0f5",borderBottom:"1px solid #c4bdb4",padding:isMobile?"8px 12px":"10px 24px",fontFamily:"system-ui,sans-serif"}}>
          <div style={{fontSize:isMobile?11:12,fontWeight:700,color:"#1e2d4a",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>Saved Plans{!isMobile&&" — click slot to save current, or load/clear"}</div>
          <div style={{display:"flex",flexDirection:isMobile?"column":"row",gap:isMobile?6:10}}>
            {[0,1,2,3].map(i=>{
              const v=versions[i];
              return(
                <div key={i} style={{flex:1,background:v?"#fff":"#f3ede3",border:"1px solid #c4bdb4",borderRadius:6,padding:"8px 10px",minHeight:60}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#1e2d4a",marginBottom:4}}>Plan {i+1}{v?" ✓":""}</div>
                  {v?(
                    <>
                      <div style={{fontSize:11,color:"#8a7e6e",lineHeight:1.5,marginBottom:6}}>
                        Ev: {v.fEv?.replace("ev_","")} · Co: {v.fCo?.replace("co_","")} · {v.fTAW==="fall"?"TAW fall":v.fTAW==="winter"?"TAW winter":"no TAW"}<br/>
                        {v.fClinic?`${v.fClinic} clinic · `:""}
                        {(v.fElect?.length||0)+(v.spElect?.length||0)} electives
                      </div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        <button onClick={()=>loadVersion(i)} style={{flex:1,padding:"2px 0",fontSize:11,fontWeight:700,cursor:"pointer",background:"#1e2d4a",color:"#f3ede3",border:"none",borderRadius:4}}>Load</button>
                        <button onClick={()=>saveVersion(i)} style={{flex:1,padding:"2px 0",fontSize:11,fontWeight:700,cursor:"pointer",background:"#d9ccba",color:"#2c2418",border:"none",borderRadius:4}}>Overwrite</button>
                        {!isMobile&&<button onClick={()=>exportSavedICS(i)} style={{padding:"2px 6px",fontSize:13,cursor:"pointer",background:"#2d6e4a",color:"#f3ede3",border:"none",borderRadius:4}} title="Export to .ics">📅</button>}
                        <button onClick={()=>clearVersion(i)} style={{padding:"2px 6px",fontSize:11,cursor:"pointer",background:"#f0e4e4",color:"#6b1e2e",border:"none",borderRadius:4}}>✕</button>
                      </div>
                    </>
                  ):(
                    <button onClick={()=>saveVersion(i)} style={{width:"100%",padding:"6px 0",fontSize:12,fontWeight:700,cursor:"pointer",background:"#1e2d4a",color:"#f3ede3",border:"none",borderRadius:4,marginTop:4}}>Save current plan here</button>
                  )}
                </div>
              );
            })}
          </div>
          {!isMobile&&<div style={{marginTop:8}}>
            <button onClick={exportCurrentICS} style={{padding:"4px 10px",borderRadius:6,fontSize:14,fontWeight:700,cursor:"pointer",background:"#2d6e4a",color:"#f3ede3",border:"none",fontFamily:"system-ui,sans-serif"}} title="Export current plan to .ics (Fall 9/8–12/4 · Winter 1/4–1/20 · Spring 1/25–4/23)">
              📅
            </button>
          </div>}
        </div>
      )}
      <div style={{padding:isMobile?"8px 10px":"12px 16px",boxSizing:"border-box"}}>
      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${RR.border}`,marginBottom:isMobile?8:12,flexWrap:isMobile?"nowrap":"wrap",overflowX:isMobile?"auto":"visible",WebkitOverflowScrolling:"touch",gap:0}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>{setTab(t);setPickerOpen(true);}} style={{padding:isMobile?"5px 8px":"6px 13px",fontSize:isMobile?13:15,fontWeight:tab===t?700:400,border:"none",background:"none",cursor:"pointer",fontFamily:"system-ui,sans-serif",letterSpacing:"0.03em",borderBottom:tab===t?`2px solid ${RR.maroon}`:"2px solid transparent",color:tab===t?RR.maroon:RR.muted,marginBottom:-1,display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap",flexShrink:0}}>
            {TL[t]}
            {t==="fall"  &&<span style={{fontSize:11,fontWeight:700,color:rrCrCol(fallCr,10,16)}}>{fallCr}</span>}
            {t==="winter"&&<span style={{fontSize:11,fontWeight:700,color:rrCrCol(winterCrCalc,2,3)}}>{winterCrCalc}</span>}
            {t==="spring"&&<span style={{fontSize:11,fontWeight:700,color:rrCrCol(springCr,10,16)}}>{springCr}</span>}
          </button>
        ))}
      </div>

      {/* ── FALL ── */}
      {tab==="fall"&&(
        <div style={{display:"flex",flexDirection:isMobile?"column":"row",gap:isMobile?8:11}}>
          {isMobile&&(
            <button onClick={()=>setPickerOpen(p=>!p)} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              width:"100%",padding:"8px 10px",borderRadius:5,fontSize:13,fontWeight:700,cursor:"pointer",
              background:pickerOpen?"#1e2d4a":"#ede6d8",color:pickerOpen?"#f3ede3":"#2c2418",
              border:"1px solid #c4b8a8",fontFamily:"system-ui,sans-serif",boxSizing:"border-box"
            }}>
              <span>{pickerOpen?"▼ Hide course picker":"▶ Show course picker"}</span>
              <span style={{fontWeight:400,fontSize:12,opacity:.8}}>{fallCr}cr selected</span>
            </button>
          )}
          {(!isMobile||pickerOpen)&&<div style={side}>

            {/* ─── CLINICS ─── */}
            <Sect title="Clinics">
              <ClinicSelector clinicId={fClinic} setClinicId={setFClinic} fieldCr={fField} setFieldCr={setFField} allowedTerms="fall"/>
            </Sect>

            {/* ─── MULTI-SECTIONS ─── */}
            <Sect title="Multi-Sections">
              <Sect title="Evidence">
                <Option type="radio" value="none"  cur={fEv} set={setFEv} label="Skip" evalId={null} noteKey={null}/>
                <Option type="radio" value="ev_m"  cur={fEv} set={setFEv} c={K.blue}   label="Medwed · 3cr · Th, F 10:30"  evalId="ev_m"  sub="Engaging·rules + policy·cold call recap" noteKey="ev_m"/>
                <Option type="radio" value="ev_w"  cur={fEv} set={setFEv} c={K.blue}   label="Whiting · 4cr · M, T 10:15"  evalId="ev_w"  sub="Crim-focused·organized·hard exam" noteKey="ev_w"/>
                <Option type="radio" value="ev_s"  cur={fEv} set={setFEv} c={K.blue}   label="Schulman · 4cr · M, T 8:00"  evalId="ev_s"  sub="Great · brutal exam · no cold call" noteKey="ev_s"/>
                <Option type="radio" value="ev_br" cur={fEv} set={setFEv} c={K.blue}   label="Brewer · 4cr · T, W 3:45"   evalId={null}  sub="Jurisprudence-focused approach" noteKey="ev_br"/>
              </Sect>

              <Sect title="Corporations">
                <Option type="radio" value="none"  cur={fCo} set={setFCo} label="Skip" evalId={null} noteKey={null}/>
                <Option type="radio" value="co_sp" cur={fCo} set={setFCo} c={K.green}  label="Spamann · 4cr · W, Th, F 8:30"  evalId="co_sp" sub="Rapid fire · strange exam · harsh grader" noteKey="co_sp"/>
                <Option type="radio" value="co_fr" cur={fCo} set={setFCo} c={K.green}  label="Fried · 4cr · W, Th, F 1:30"    evalId="co_fr" sub="No attendance req · organized · no LP · MC only" noteKey="co_fr"/>
                <Option type="radio" value="co_pg" cur={fCo} set={setFCo} c={K.green}  label="Pargendler · 4cr · M, T 3:45"   evalId={null}  sub="Comparative corporate governance focus" noteKey="co_pg"/>
              </Sect>

              <Sect title="Admin Law">
                <Option type="checkbox" cur={fAdm} set={setFAdm} c={K.red} label="Freeman · 4cr · W, Th 1:30" evalId="f_adm"
                  sub={fCo==="co_fr"?"⚠ conflicts with Fried Corporations WThF":""} warn={fCo==="co_fr"} noteKey="f_adm"/>
              </Sect>

              <Sect title="Trial Advocacy Workshop">
                <Option type="radio" value="fall"  cur={fTAW} set={setFTAW} c={K.gray} evalId="taw" noteKey="taw"
                  label="Take in Fall (M–F 2–9pm intensive)"
                  sub={`TAW overlap w/ other courses: ${fmtHr(fallTAWHrs)}hr/wk · max 4hr/wk`} warn={!fallTAWOk}/>
                <Option type="radio" value="winter" cur={fTAW} set={setFTAW} label="Move to Winter" evalId={null} noteKey={null}/>
                <Option type="radio" value="none" cur={fTAW} set={setFTAW} label="Skip TAW" evalId={null} noteKey={null}/>
              </Sect>

              <Sect title="1st Amendment">
                <Option type="radio" value="none"    cur={f1a} set={setF1a} label="Skip" evalId={null} noteKey={null}/>
                <Option type="radio" value="f_1afe"  cur={f1a} set={setF1a} c={K.indigo} label="Feldman · 4cr · Th, F 10:15" evalId="f1a_fe" sub="★5 · showman · philosophy + SCOTUS gossip" noteKey="f_1afe"/>
                <Option type="radio" value="f_1awe"  cur={f1a} set={setF1a} c={K.indigo} label="Weinrib · 4cr · M, T 1:30"   evalId="f1a_we" sub="History-focused · on panel every other week" noteKey="f_1awe"/>
              </Sect>

              <Sect title="Criminal Procedure">
                <Option type="radio" value="none"    cur={fCp} set={setFCp} label="Skip" evalId={null} noteKey={null}/>
                <Option type="radio" value="f_cpsu"  cur={fCp} set={setFCp} c={K.amber} label="Survey · Re · 4cr · T, W 10:15" evalId={null} noteKey="f_cpsu"/>
              </Sect>
            </Sect>

            {/* ─── ELECTIVES ─── */}
            <Sect title="Electives">
              <ElectiveSect label="Courses" items={FALL_ELECTIVES.courses} sel={fElect} toggle={toggleF}/>
              <ElectiveSect label="Seminars" items={FALL_ELECTIVES.seminars} sel={fElect} toggle={toggleF}/>
              <ElectiveSect label="Reading Groups (1cr)" items={FALL_ELECTIVES.readings} sel={fElect} toggle={toggleF} cols={1}/>
            </Sect>

          </div>}
          <div style={{flex:1,minWidth:0}}>
            <CrBar cr={fallCr} min={10} max={16} label="Fall"/>
            {fTAW==="fall"&&<div style={{fontSize:isMobile?12:13,background:fallTAWOk?"#eaf0e8":"#f5e8e8",border:`1px solid ${fallTAWOk?"#b0c4a8":"#c4a4a4"}`,borderRadius:4,padding:isMobile?"2px 7px":"3px 9px",marginBottom:6,color:fallTAWOk?"#2a4a22":"#6b1e2e",fontFamily:"system-ui,sans-serif"}}>
              TAW overlap: <strong>{fmtHr(fallTAWHrs)}hr/wk</strong> / 4hr max {fallTAWOk?"✓":"⚠ exceeded"}
            </div>}
            <ConflictBanner conflicts={fallConflicts} tawOk={fallTAWOk} tawHrs={fallTAWHrs} tawActive={fTAW==="fall"}/>
            {fClinic&&<div style={{fontSize:13,background:"#e8ede6",border:"1px solid #b0c4a8",borderRadius:4,padding:"3px 8px",marginBottom:6,color:"#2a4a22",fontFamily:"system-ui,sans-serif"}}>
              🏥 {CLINIC_OPTS.find(c=>c.id===fClinic)?.name} Clinic · {fClinicCr}cr
            </div>}
            <Calendar courses={fallTimed} tawActive={fTAW==="fall"}/>
          </div>
        </div>
      )}

      {/* ── WINTER ── */}
      {tab==="winter"&&(
        <div style={{maxWidth:500}}>
          <CrBar cr={winterCrCalc} min={2} max={3} label="Winter"/>
          {useFedWinter
            ? <div style={{background:"#e8f0ee",border:"1px solid #9abfb8",borderRadius:5,padding:"10px 12px",fontSize:14,fontFamily:"system-ui,sans-serif"}}>
                <div style={{fontWeight:700,color:"#2d7070",marginBottom:3}}>⚖️ Federal Courts Clinic — winter component</div>
                <div style={{color:"#1a3a38"}}>2cr winter classroom · reserved for Fed Courts · no other winter courses</div>
                <EvalCard evalId="clinicFedCourts" label="clinic eval"/>
              </div>
            : <>
                {fTAW==="winter"&&<Sect title="Trial Advocacy Workshop">
                  <div style={{fontSize:14,padding:"5px 8px",background:"#ede6d8",borderRadius:4,color:"#2c2418",fontWeight:600,fontFamily:"system-ui,sans-serif"}}>TAW (Sullivan) · 3cr · fills winter slot</div>
                  <EvalCard evalId="taw"/>
                </Sect>}
                {fTAW==="fall"&&<Sect title="Winter courses">
                  <Option type="checkbox" cur={wRepro} set={setWRepro} c={K.pink} label="Repro Rights After Dobbs (Spera) · 2cr" evalId={null} noteKey="w_repro"/>
                </Sect>}
              </>
          }
          <div style={{background:"#edf0f5",border:"1px solid #b0bdd4",borderRadius:5,padding:"9px 11px",marginTop:8,fontSize:14,fontFamily:"system-ui,sans-serif"}}>
            <strong>Winter rules:</strong> min 2cr · max 3cr · Fed Courts locks out other courses
            {winterCrCalc<2&&<span style={{color:"#6b1e2e"}}> ⚠ under minimum</span>}
            {winterCrCalc>3&&<span style={{color:"#6b1e2e"}}> ⚠ over maximum</span>}
            {winterCrCalc>=2&&winterCrCalc<=3&&<span style={{color:"#3d6b4f"}}> ✓</span>}
          </div>
        </div>
      )}

      {/* ── SPRING ── */}
      {tab==="spring"&&(
        <div style={{display:"flex",flexDirection:isMobile?"column":"row",gap:isMobile?8:11}}>
          {isMobile&&(
            <button onClick={()=>setPickerOpen(p=>!p)} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              width:"100%",padding:"8px 10px",borderRadius:5,fontSize:13,fontWeight:700,cursor:"pointer",
              background:pickerOpen?"#1e2d4a":"#ede6d8",color:pickerOpen?"#f3ede3":"#2c2418",
              border:"1px solid #c4b8a8",fontFamily:"system-ui,sans-serif",boxSizing:"border-box"
            }}>
              <span>{pickerOpen?"▼ Hide course picker":"▶ Show course picker"}</span>
              <span style={{fontWeight:400,fontSize:12,opacity:.8}}>{springCr}cr selected</span>
            </button>
          )}
          {(!isMobile||pickerOpen)&&<div style={side}>

            {/* ─── CLINICS ─── */}
            <Sect title="Clinics">
              {fClinic&&<div style={{fontSize:13,color:"#6b1e2e",marginBottom:5,fontFamily:"system-ui,sans-serif"}}>⚠ Already have fall clinic — max 1/term</div>}
              <ClinicSelector clinicId={spClinic} setClinicId={setSpClinic} fieldCr={spField} setFieldCr={setSpField} allowedTerms="spring"/>
            </Sect>

            {/* ─── MULTI-SECTIONS ─── */}
            <Sect title="Multi-Sections">
              <Sect title="Admin Law">
                <Option type="radio" value="sp_adm_v" cur={spAdm} set={setSpAdm} c={K.red} label="Vermeule · 4cr · W, Th 1:30"   evalId="sp_adm_v" sub="In-class exam" noteKey="sp_adm_v"/>
                <Option type="radio" value="sp_adm_b" cur={spAdm} set={setSpAdm} c={K.red} label="Block · 3cr · T, W 3:45–5:15"  evalId="sp_adm_b" sub="Take-home exam" noteKey="sp_adm_b"/>
              </Sect>

              <Sect title="Corporations">
                <Option type="radio" value="none"    cur={spCo} set={setSpCo} label="Skip" evalId={null} noteKey={null}/>
                <Option type="radio" value="sp_co_c" cur={spCo} set={setSpCo} c={K.green} label="Coates · 4cr · M, T, W 10:15"  evalId={null} noteKey="sp_co_c"/>
                <Option type="radio" value="sp_co_t" cur={spCo} set={setSpCo} c={K.green} label="Tallarita · 4cr · Th, F 10:15" evalId={null} noteKey="sp_co_t"/>
              </Sect>

              <Sect title="Evidence">
                <Option type="radio" value="none"    cur={spEv} set={setSpEv} label="Skip (took in Fall)" evalId={null} noteKey={null}/>
                <Option type="radio" value="sp_ev_l" cur={spEv} set={setSpEv} c={K.blue}  label="Lvovsky · 4cr · M, T, W 10:30" evalId="sp_ev_l" sub="Rapid fire · tough cold call · brutal curve" noteKey="sp_ev_l"/>
                <Option type="radio" value="sp_ev_c" cur={spEv} set={setSpEv} c={K.blue}  label="Clary · 3cr · W, Th 1:30"      evalId="sp_ev_c" sub="Kinda ok · soft cold call · can miss class · dry but accessible" noteKey="sp_ev_c"/>
              </Sect>


              <Sect title="Bankruptcy / Copyright (share M,T,W 10:30 slot)">
                <div style={{fontSize:13,color:"#6b1e2e",background:"#f5e8e8",borderRadius:3,padding:"2px 6px",marginBottom:4,fontFamily:"system-ui,sans-serif"}}>Roe (Bankruptcy) and Fisher (Copyright) share the same slot</div>
                <Option type="radio" value="none"  cur={spMTC} set={setSpMTC} label="Skip both" evalId={null} noteKey={null}/>
                <Option type="radio" value="sp_bk" cur={spMTC} set={setSpMTC} c={K.violet} label="Bankruptcy (Roe) · 4cr · M, T, W 10:30"  evalId="sp_bk" noteKey="sp_bk"/>
                <Option type="radio" value="sp_cp" cur={spMTC} set={setSpMTC} c={K.sky}    label="Copyright (Fisher) · 4cr · M, T, W 10:30" evalId="sp_cp" noteKey="sp_cp"/>
              </Sect>

              <Sect title="1st Amendment">
                <Option type="radio" value="none"   cur={sp1a} set={setSp1a} label="Skip" evalId={null} noteKey={null}/>
                <Option type="radio" value="sp_1a"  cur={sp1a} set={setSp1a} c={K.indigo} label="Parker · 4cr · TBD" evalId="sp_1a" sub="Psychology of judicial decisions · no cold calls" noteKey="sp_1a"/>
              </Sect>

              <Sect title="Crim Pro: Investigations">
                <Option type="radio" value="none"     cur={spCpi} set={setSpCpi} label="Skip" evalId={null} noteKey={null}/>
                <Option type="radio" value="sp_cpi_n" cur={spCpi} set={setSpCpi} c={K.amber} label="Natapoff · 4cr · Th, F 10:15" evalId={null} sub="Policing + investigation focus" noteKey="sp_cpi_n"/>
                <Option type="radio" value="sp_cpi_w" cur={spCpi} set={setSpCpi} c={K.amber} label="Whiting · 4cr · M, T 10:15"   evalId={null} sub="International/crim procedure" noteKey="sp_cpi_w"/>
              </Sect>
            </Sect>
            {/* ─── ELECTIVES ─── */}
            <Sect title="Electives">
              <ElectiveSect label="Courses" items={SP_ELECTIVES.courses} sel={spElect} toggle={toggleSp}/>
              <ElectiveSect label="Seminars" items={SP_ELECTIVES.seminars} sel={spElect} toggle={toggleSp}/>
              <ElectiveSect label="Reading Groups (1cr)" items={SP_ELECTIVES.readings} sel={spElect} toggle={toggleSp} cols={1}/>
            </Sect>

          </div>}
          <div style={{flex:1,minWidth:0}}>
            <CrBar cr={springCr} min={10} max={16} label="Spring"/>
            <ConflictBanner conflicts={spConflicts} tawOk={true} tawHrs={0} tawActive={false}/>
            {spClinic&&<div style={{fontSize:13,background:"#e8ede6",border:"1px solid #b0c4a8",borderRadius:4,padding:"3px 8px",marginBottom:6,color:"#2a4a22",fontFamily:"system-ui,sans-serif"}}>
              🏥 {CLINIC_OPTS.find(c=>c.id===spClinic)?.name} Clinic · {spClinicCr}cr
            </div>}
            <Calendar courses={spTimed} tawActive={false}/>
          </div>
        </div>
      )}

      {/* ── SUMMARY ── */}
      {tab==="summary"&&(()=>{
        const fClinicObj=CLINIC_OPTS.find(c=>c.id===fClinic);
        const spClinicObj=CLINIC_OPTS.find(c=>c.id===spClinic);
        const fallItems=[C[fEv],C[fCo],fTAW==="fall"?C.taw:null,fAdm?C.f_adm:null,
          f1a!=="none"?C[f1a]:null,fCp!=="none"?C[fCp]:null,
          ...[...fElect].map(k=>ALL_FE.find(x=>x.key===k)),
          fClinicObj?{...fClinicObj,name:fClinicObj.name+" Clinic",cr:fClinicCr}:null].filter(Boolean);
        const winterItems=[
          useFedWinter?{name:"Fed Courts (winter)",cr:2,c:K.teal}:null,
          fTAW==="winter"?C.taw:null,
          wRepro&&fTAW==="fall"&&!useFedWinter?{name:"Repro Rights After Dobbs",cr:2,c:K.pink}:null].filter(Boolean);
        const spItems=[C[spAdm],
          spCo!=="none"?C[spCo]:null,
          spEv!=="none"?C[spEv]:null,
          spMTC!=="none"?C[spMTC]:null,
          sp1a!=="none"?C[sp1a]:null,spCpi!=="none"?C[spCpi]:null,
          ...[...spElect].map(k=>ALL_SE.find(x=>x.key===k)),
          spClinicObj?{...spClinicObj,name:spClinicObj.name+" Clinic",cr:spClinicCr}:null].filter(Boolean);
        const issues=[
          ...fallConflicts.map(([a,b])=>`Fall: ${a.name}/${a.prof} ↔ ${b.name}/${b.prof}`),
          ...spConflicts.map(([a,b])=>`Spring: ${a.name}/${a.prof} ↔ ${b.name}/${b.prof}`),
          ...(!fallTAWOk?[`Fall TAW overlap ${fmtHr(fallTAWHrs)}hr/wk > 4hr limit`]:[]),
          ...(fallCr>16?[`Fall ${fallCr}cr > 16cr max`]:[]),
          ...(fallCr<10?[`Fall ${fallCr}cr < 10cr min`]:[]),
          ...(winterCrCalc>3?[`Winter ${winterCrCalc}cr > 3cr max`]:[]),
          ...(winterCrCalc<2?[`Winter ${winterCrCalc}cr < 2cr min`]:[]),
          ...(springCr>16?[`Spring ${springCr}cr > 16cr max`]:[]),
          ...(springCr<10?[`Spring ${springCr}cr < 10cr min`]:[]),
          ...(annualCr>35?[`Annual ${annualCr}cr > 35cr max`]:[]),
          ...(annualCr<24?[`Annual ${annualCr}cr < 24cr min`]:[]),
          ...(fClinic&&spClinic&&fClinic!=="fedcourts"&&spClinic!=="fedcourts"?["Clinic in both fall AND spring — max 1/term"]:[]),
        ];
        const ok=!issues.length;

        // ── GRADUATION REQUIREMENTS PROGRESS ──
        const INTL_COMP_KEYS = new Set(["f_iip","f_imm","sp_iip","sp_itl","sp_clwl","sp_cilo"]);
        const EXPERIENTIAL_COURSE_KEYS = new Set(["taw"]); // courses (non-clinic) tagged experiential
        const allKeys = [...fallItems,...winterItems,...spItems].map(c=>c?.key).filter(Boolean);
        const allElectKeys = new Set([...fElect,...spElect]);

        // 1) International / Comparative — need 1 course ≥ 3 classroom credits
        const intlCourse = [...fallItems,...spItems].find(c => c?.key && INTL_COMP_KEYS.has(c.key) && (c.cr||0) >= 3);
        const intlMet = !!intlCourse;

        // 2) Professional Responsibility — need ≥ 2 classroom credits
        //    Some clinic seminars *may* satisfy PR (check catalog); typically taken 3L
        //    We flag clinics whose seminars are known to satisfy PR
        const PR_CLINIC_IDS = new Set(["consumer"]);
        const prFromClinic = (fClinic && PR_CLINIC_IDS.has(fClinic)) || (spClinic && PR_CLINIC_IDS.has(spClinic));
        const prMet = prFromClinic; // conservative: only if enrolled in a qualifying clinic
        const prNote = prFromClinic
          ? `May be satisfied by ${[fClinic,spClinic].filter(id=>PR_CLINIC_IDS.has(id)).map(id=>CLINIC_OPTS.find(c=>c.id===id)?.name).join(" / ")} clinic seminar — confirm with Registrar`
          : "Not yet fulfilled — typically taken 3L. Some clinic seminars may qualify; check catalog.";

        // 3) Written Work — analytical paper (20-25p seminar/independent) + professional writing (clinic/experiential)
        const FALL_SEM_KEYS = new Set(FALL_ELECTIVES.seminars.map(s=>s.key));
        const SP_SEM_KEYS = new Set(SP_ELECTIVES.seminars.map(s=>s.key));
        const hasAnalyticalPaperCourse = [...allElectKeys].some(k => FALL_SEM_KEYS.has(k) || SP_SEM_KEYS.has(k));
        const hasProfWritingSource = !!fClinicObj || !!spClinicObj;
        const writtenBoth = hasAnalyticalPaperCourse && hasProfWritingSource;
        const writtenPartial = hasAnalyticalPaperCourse || hasProfWritingSource;

        // 4) Experiential Learning — need ≥ 6 credits total
        //    1L baseline: JET (2cr) + Spring LRW (2cr) = 4cr
        const EL_1L = 4;
        let elCr2L = 0;
        if (allKeys.includes("taw")) elCr2L += 3;
        if (fClinicObj) elCr2L += fClinicCr;
        if (spClinicObj) elCr2L += spClinicCr;
        const elTotal = EL_1L + elCr2L;
        const elMet = elTotal >= 6;

        const reqItems = [
          {
            label: "International / Comparative",
            icon: "🌐",
            met: intlMet,
            partial: false,
            detail: intlMet
              ? `✓ ${intlCourse.name} (${intlCourse.prof}, ${intlCourse.cr}cr)`
              : "Need 1 course ≥ 3cr — e.g. Comp Con Law, Intl IP, Public Intl Law",
          },
          {
            label: "Professional Responsibility",
            icon: "⚖️",
            met: prMet,
            partial: prFromClinic,
            detail: prNote,
          },
          {
            label: "Written Work",
            icon: "✍️",
            met: writtenBoth,
            partial: writtenPartial,
            detail: (() => {
              const parts = [];
              parts.push(hasAnalyticalPaperCourse ? "✓ Analytical paper (seminar enrolled)" : "✗ Analytical paper — enroll in a seminar or arrange independent writing");
              parts.push(hasProfWritingSource ? "✓ Professional writing (clinic enrolled)" : "✗ Professional writing — enroll in a clinic or experiential course");
              return parts.join("\n");
            })(),
          },
          {
            label: "Experiential Learning",
            icon: "🏛️",
            met: elMet,
            partial: elCr2L > 0,
            detail: `${elTotal}cr of 6cr required (1L: ${EL_1L}cr${elCr2L > 0 ? ` + 2L: ${elCr2L}cr` : ""})${!elMet ? " — add TAW or a clinic" : ""}`,
            bar: { cur: elTotal, max: 6 },
          },
        ];

        return(
          <div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:7,marginBottom:11}}>
              {[{l:"🍂 Fall",cr:fallCr,min:10,max:16},{l:"❄️ Winter",cr:winterCrCalc,min:2,max:3},{l:"🌸 Spring",cr:springCr,min:10,max:16},{l:"📅 Annual",cr:annualCr,min:24,max:35}].map(({l,cr,min,max})=>{
                const ok2=cr>=min&&cr<=max;
                return(
                  <div key={l} style={{background:ok2?"#eaf0e8":"#f5ede0",border:`1px solid ${ok2?"#b0c4a8":"#c4924a"}`,borderRadius:5,padding:"9px",textAlign:"center",fontFamily:"system-ui,sans-serif"}}>
                    <div style={{fontSize:15,fontWeight:700,color:"#1e2d4a",marginBottom:2}}>{l}</div>
                    <div style={{fontSize:22,fontWeight:900,color:ok2?"#3d6b4f":"#9a4a1a"}}>{cr}</div>
                    <div style={{fontSize:12,color:"#8a7e6e"}}>req {min}–{max}cr</div>
                  </div>
                );
              })}
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:8,marginBottom:11}}>
              {[{l:"🍂 Fall",items:fallItems},{l:"❄️ Winter",items:winterItems},{l:"🌸 Spring",items:spItems}].map(term=>(
                <div key={term.l} style={{background:"#f3ede3",border:"1px solid #d9ccba",borderRadius:5,padding:isMobile?"7px":"9px",fontFamily:"system-ui,sans-serif"}}>
                  <div style={{fontWeight:700,fontSize:isMobile?14:16,marginBottom:6,color:"#1e2d4a"}}>{term.l}</div>
                  {term.items.length===0?<div style={{color:"#8a7e6e",fontSize:14}}>Nothing selected</div>
                   :term.items.map((c,i)=>(
                     <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3,fontSize:14}}>
                       <span style={{display:"flex",alignItems:"center",gap:3}}>
                         {c.c&&<span style={{width:6,height:6,borderRadius:"50%",background:c.c.bd,display:"inline-block",flexShrink:0}}/>}
                         {c.name}{c.prof?` · ${c.prof}`:""}
                       </span>
                       <span style={{color:"#8a7e6e",fontSize:13,flexShrink:0,marginLeft:3}}>{c.cr||c.credits}cr</span>
                     </div>
                   ))}
                </div>
              ))}
            </div>
            <div style={{background:ok?"#eaf0e8":"#f5e8e8",border:`1px solid ${ok?"#b0c4a8":"#c4a4a4"}`,borderRadius:5,padding:"9px 11px",marginBottom:11,fontFamily:"system-ui,sans-serif"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:ok?0:5,color:ok?"#2a4a22":"#6b1e2e"}}>
                {ok?"✓ Valid schedule":`⚠ ${issues.length} issue${issues.length>1?"s":""}`}
              </div>
              {issues.map((m,i)=><div key={i} style={{fontSize:14,color:"#6b1e2e"}}>{m}</div>)}
            </div>

            {/* ── GRADUATION REQUIREMENTS PROGRESS ── */}
            <div style={{background:"#f3ede3",border:"1px solid #d9ccba",borderRadius:5,padding:isMobile?"10px":"12px 14px",fontFamily:"system-ui,sans-serif"}}>
              <div style={{fontWeight:700,fontSize:isMobile?14:16,color:"#1e2d4a",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                🎓 Graduation Requirements Progress
                <span style={{fontSize:11,fontWeight:400,color:"#8a7e6e",marginLeft:"auto"}}>
                  {reqItems.filter(r=>r.met).length}/{reqItems.length} fulfilled
                </span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?8:10}}>
                {reqItems.map(r => {
                  const bg = r.met ? "#eaf0e8" : r.partial ? "#f5ede0" : "#f5e8e8";
                  const bd = r.met ? "#b0c4a8" : r.partial ? "#c4924a" : "#c4a4a4";
                  const statusColor = r.met ? "#2a4a22" : r.partial ? "#9a7820" : "#6b1e2e";
                  const statusText = r.met ? "✓ Fulfilled" : r.partial ? "⏳ In progress" : "✗ Not yet";
                  return (
                    <div key={r.label} style={{background:bg,border:`1px solid ${bd}`,borderRadius:5,padding:isMobile?"8px":"10px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontWeight:700,fontSize:isMobile?13:14,color:"#1e2d4a"}}>{r.icon} {r.label}</span>
                        <span style={{fontSize:isMobile?11:12,fontWeight:700,color:statusColor,background:"#fff",borderRadius:8,padding:"1px 7px"}}>{statusText}</span>
                      </div>
                      {r.bar && (
                        <div style={{height:5,background:"#d9ccba",borderRadius:3,overflow:"hidden",marginBottom:5}}>
                          <div style={{height:"100%",width:`${Math.min(r.bar.cur/r.bar.max,1)*100}%`,background:r.met?"#3d6b4f":"#a0622a",borderRadius:3,transition:"width .3s"}}/>
                        </div>
                      )}
                      <div style={{fontSize:isMobile?12:13,color:"#5c4e3a",lineHeight:1.5,whiteSpace:"pre-line"}}>{r.detail}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop:8,fontSize:11,color:"#8a7e6e",lineHeight:1.5}}>
                Assumes standard 1L completion (JET 2cr + LRW 2cr = 4cr experiential). Verify all requirement satisfaction with your Degree Audit in HELIOS and the Registrar's Office. Pro bono (50hr) tracked separately.
              </div>
            </div>

            {/* ── MULTI-SECTION RANKING ── */}
            {(()=>{
              // Compute live conflict info for each ranking item
              const curPlan={fEv,fCo,fTAW,fAdm,f1a,fCp,fElect:[...fElect],fClinic,fField,
                wRepro,spAdm,spCo,spEv,spMTC,sp1a,spCpi,spElect:[...spElect],spClinic,spField};
              const fixedR=[];
              ALL_FE.forEach(c=>{if(fElect.has(c.key)&&c.days)fixedR.push(c);});
              ALL_SE.forEach(c=>{if(spElect.has(c.key)&&c.days)fixedR.push(c);});
              if(spMTC!=="none"&&C[spMTC])fixedR.push(C[spMTC]);
              if(fAdm&&C.f_adm)fixedR.push(C.f_adm);
              if(f1a!=="none"&&C[f1a])fixedR.push(C[f1a]);
              if(fCp!=="none"&&C[fCp])fixedR.push(C[fCp]);
              if(sp1a!=="none"&&C[sp1a])fixedR.push(C[sp1a]);
              if(spCpi!=="none"&&C[spCpi])fixedR.push(C[spCpi]);
              if(fClinic){const cl=CLINIC_OPTS.find(x=>x.id===fClinic);if(cl?.semFall)fixedR.push(cl.semFall);}
              if(spClinic){const cl=CLINIC_OPTS.find(x=>x.id===spClinic);const sem=cl?.semSpring||cl?.semFall;if(sem)fixedR.push(sem);}

              const selectedIdsR=new Set();
              selectedIdsR.add(fEv); if(spEv!=="none")selectedIdsR.add(spEv);
              selectedIdsR.add(fCo); if(spCo!=="none")selectedIdsR.add(spCo);
              selectedIdsR.add(spAdm);
              const tawSelR=fTAW==="fall"?"taw_f":"taw_w";

              const infoMap={};
              RANKING_POOL.forEach(item=>{
                const isSel=item.id===tawSelR||selectedIdsR.has(item.id);
                const cd=C[item.cKey];
                const cfl=[];
                if(cd?.days){
                  for(const fc of fixedR){if(fc.days&&timesOverlap(cd,fc))cfl.push(fc.name||fc.key);}
                  if(item.cat!=="ev"){const ek=fEv||(spEv!=="none"?spEv:null);if(ek&&C[ek]?.days&&timesOverlap(cd,C[ek]))cfl.push(C[ek].name);}
                  if(item.cat!=="co"){const ck=fCo||(spCo!=="none"?spCo:null);if(ck&&C[ck]?.days&&timesOverlap(cd,C[ck]))cfl.push(C[ck].name);}
                  if(item.cat!=="adm"&&C[spAdm]?.days&&timesOverlap(cd,C[spAdm]))cfl.push(C[spAdm].name);
                  if(item.cat!=="taw"&&fTAW==="fall"&&!item.id.startsWith("sp_")&&item.id!=="taw_w"){
                    const hrs=tawOverlapHrsPerWeek(cd);
                    if(hrs>4)cfl.push("TAW ("+fmtHr(hrs)+"hr > 4hr limit)");
                  }
                }
                infoMap[item.id]={isSel,conflicts:cfl};
              });

              const moveRank=(from,to)=>{
                setRanking(prev=>{
                  const next=[...prev];const[moved]=next.splice(from,1);next.splice(to,0,moved);return next;
                });
              };
              const setRankNote=(idx,note)=>{
                setRanking(prev=>{const next=[...prev];next[idx]={...next[idx],note};return next;});
              };
              const regenRanking=()=>{setRanking(generateSuggestedRanking(curPlan));};

              return(
                <div style={{background:"#f3ede3",border:"1px solid #d9ccba",borderRadius:5,padding:isMobile?"10px":"12px 14px",marginTop:11,fontFamily:"system-ui,sans-serif"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:6}}>
                    <div style={{fontWeight:700,fontSize:isMobile?14:16,color:"#1e2d4a"}}>
                      🗳️ Multi-Section Preference Ranking
                    </div>
                    <button onClick={regenRanking} style={{padding:"3px 10px",borderRadius:5,fontSize:12,fontWeight:700,cursor:"pointer",background:"#ede6d8",color:"#2c2418",border:"1px solid #c4b8a8"}}>
                      🔄 Regenerate from plan
                    </button>
                  </div>
                  <div style={{fontSize:12,color:"#5c4e3a",marginBottom:10,lineHeight:1.5}}>
                    Drag to reorder (or use arrows). Save a plan version to auto-generate suggestion. Your customizations are preserved when you load a saved plan.
                  </div>

                  {ranking.map((r,idx)=>{
                    const pool=RANKING_POOL.find(p=>p.id===r.id);
                    if(!pool) return null;
                    const info=infoMap[r.id]||{isSel:false,conflicts:[]};
                    const catCol=RANK_CAT_COLORS[pool.cat];
                    const catBg=RANK_CAT_BG[pool.cat];
                    const hasCfl=info.conflicts.length>0;
                    const borderCol=info.isSel?catCol:hasCfl?"#c4a4a4":"#d9ccba";
                    const bgCol=info.isSel?catBg:hasCfl?"#f9f0f0":"#faf8f4";
                    const noteIsOpen=rankNoteOpen.has(r.id);

                    // Eval data & bid tips
                    const evalKey = pool.cKey === "taw" ? "taw" : pool.id;
                    const ev = E[evalKey] || E[pool.cKey] || null;
                    const bidTips = ev?.bid || [];
                    const bidStr = bidTips.join(" ").toLowerCase();
                    const isCompetitive = bidStr.includes("high") || bidStr.includes("first") || bidStr.includes("rank it 1") || bidStr.includes("competitive") || bidStr.includes("bid high");
                    const isEasy = bidStr.includes("vacanc") || bidStr.includes("empty") || bidStr.includes("not difficult") || bidStr.includes("not too") || bidStr.includes("no need");
                    // TAW overlap for non-TAW fall items
                    let tawWarn = null;
                    if (pool.cat !== "taw" && fTAW==="fall" && !pool.id.startsWith("sp_") && pool.id !== "taw_w") {
                      const cd = C[pool.cKey];
                      if (cd?.days) {
                        const tawHrs = tawOverlapHrsPerWeek(cd);
                        if (tawHrs > 4) tawWarn = { t: `TAW ${fmtHr(tawHrs)}hr > 4hr`, c: "#6b1e2e" };
                        else if (tawHrs > 0) tawWarn = { t: `TAW ${fmtHr(tawHrs)}hr/wk`, c: "#9a7820" };
                      }
                    }

                    return(
                      <div key={r.id}
                        draggable
                        onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",String(idx));}}
                        onDragOver={e=>{e.preventDefault();}}
                        onDrop={e=>{e.preventDefault();const from=parseInt(e.dataTransfer.getData("text/plain"),10);if(!isNaN(from)&&from!==idx)moveRank(from,idx);}}
                        style={{
                          display:"flex",alignItems:"stretch",gap:0,
                          marginBottom:3,borderRadius:5,overflow:"hidden",
                          border:`1.5px solid ${borderCol}`,
                          background:bgCol,
                          cursor:"grab",
                          opacity:hasCfl&&!info.isSel?0.7:1,
                          transition:"box-shadow .15s",
                        }}>

                        {/* Rank number + drag zone */}
                        <div style={{width:isMobile?30:36,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:info.isSel?catCol:"#ede6d8",flexShrink:0,padding:"4px 0"}}>
                          <div style={{fontWeight:900,fontSize:isMobile?13:15,color:info.isSel?"#fff":"#2c2418",lineHeight:1}}>{idx+1}</div>
                          <div style={{fontSize:8,color:info.isSel?"rgba(255,255,255,.7)":"#8a7e6e",marginTop:1}}>⋮⋮</div>
                        </div>

                        {/* Content */}
                        <div style={{flex:1,padding:isMobile?"5px 7px":"6px 10px",minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                            <span style={{fontSize:11,fontWeight:700,color:catCol,background:catBg,borderRadius:8,padding:"1px 6px",flexShrink:0}}>
                              {RANK_CAT_LABELS[pool.cat]}
                            </span>
                            <span style={{fontWeight:600,fontSize:isMobile?13:14,color:"#2c2418"}}>{pool.label.split(" · ")[1]}</span>
                            <span style={{fontSize:isMobile?11:12,color:"#8a7e6e"}}>{pool.sub}</span>
                            {ev?.avg&&<span style={{fontSize:11,fontWeight:700,color:starColor(ev.avg),flexShrink:0}}>★{ev.avg}</span>}
                            {info.isSel&&<span style={{fontSize:10,fontWeight:700,color:"#fff",background:catCol,borderRadius:8,padding:"0 5px",flexShrink:0}}>★ PLAN</span>}
                            {isCompetitive&&<span style={{fontSize:10,fontWeight:700,color:"#b05c20",background:"#fef3e2",borderRadius:8,padding:"0 5px",flexShrink:0}}>🔥 Competitive</span>}
                            {isEasy&&!isCompetitive&&<span style={{fontSize:10,fontWeight:700,color:"#3d6b4f",background:"#eaf0e8",borderRadius:8,padding:"0 5px",flexShrink:0}}>😌 Easy</span>}
                            {tawWarn&&<span style={{fontSize:10,fontWeight:700,color:tawWarn.c,background:tawWarn.c==="#6b1e2e"?"#f5e8e8":"#f5ede0",borderRadius:8,padding:"0 5px",flexShrink:0}}>{tawWarn.t}</span>}
                            {hasCfl&&<span style={{fontSize:10,fontWeight:700,color:"#6b1e2e",background:"#f5e8e8",borderRadius:8,padding:"0 5px",flexShrink:0}}>⚠ {info.conflicts.join(", ")}</span>}
                          </div>
                          {/* Bid tip quote */}
                          {bidTips.length>0&&(
                            <div style={{fontSize:11,color:"#7a6e5e",marginTop:2,fontStyle:"italic",lineHeight:1.4}}>
                              🎯 {bidTips[0]}
                            </div>
                          )}
                          {/* Note */}
                          {(r.note||noteIsOpen)&&(
                            <div style={{marginTop:3}}>
                              <input value={r.note} onChange={e=>setRankNote(idx,e.target.value)}
                                placeholder="Add note…"
                                style={{width:"100%",boxSizing:"border-box",fontSize:12,padding:"2px 6px",borderRadius:3,border:"1px solid #d9ccba",outline:"none",background:"#fff",color:"#2c2418",fontFamily:"system-ui,sans-serif"}}/>
                            </div>
                          )}
                          {!r.note&&!noteIsOpen&&(
                            <button onClick={(e)=>{e.stopPropagation();setRankNoteOpen(prev=>{const n=new Set(prev);n.add(r.id);return n;});}} style={{fontSize:11,border:"none",cursor:"pointer",padding:"1px 4px",borderRadius:3,color:"#8a7e6e",background:"transparent",marginTop:2}}>
                              + note
                            </button>
                          )}
                        </div>

                        {/* Up/Down arrows */}
                        <div style={{display:"flex",flexDirection:"column",justifyContent:"center",gap:1,padding:"0 4px",flexShrink:0}}>
                          <button disabled={idx===0} onClick={e=>{e.stopPropagation();moveRank(idx,idx-1);}}
                            style={{border:"none",cursor:idx===0?"default":"pointer",background:"transparent",fontSize:isMobile?12:14,padding:0,lineHeight:1,color:idx===0?"#d9ccba":"#5c4e3a",opacity:idx===0?.4:1}}>▲</button>
                          <button disabled={idx===ranking.length-1} onClick={e=>{e.stopPropagation();moveRank(idx,idx+1);}}
                            style={{border:"none",cursor:idx===ranking.length-1?"default":"pointer",background:"transparent",fontSize:isMobile?12:14,padding:0,lineHeight:1,color:idx===ranking.length-1?"#d9ccba":"#5c4e3a",opacity:idx===ranking.length-1?.4:1}}>▼</button>
                        </div>
                      </div>
                    );
                  })}

                  <div style={{marginTop:8,fontSize:11,color:"#8a7e6e",lineHeight:1.5}}>
                    ★ PLAN = section in your current plan. ⚠ = time conflict with your schedule. 🔥 = competitive (bid high). 😌 = easy to get in. 🎯 = peer bid tip. Once enrolled in one section, all lower-ranked sections of that course are automatically skipped by the algorithm.
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* ── EVALS BROWSER ── */}
      {tab==="evals"&&(
        <div>
          <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
            <input value={evalSearch} onChange={e=>setEvalSearch(e.target.value)}
              placeholder="Search courses or professors…"
              style={{flex:1,maxWidth:isMobile?undefined:320,padding:isMobile?"5px 8px":"6px 10px",borderRadius:4,border:"1px solid #d9ccba",fontSize:isMobile?14:15,outline:"none",background:"#f3ede3",color:"#2c2418",fontFamily:"system-ui,sans-serif"}}/>
            <span style={{fontSize:isMobile?12:14,color:"#8a7e6e",fontFamily:"system-ui,sans-serif",flexShrink:0}}>{filteredEvals.length}</span>
          </div>
          <div style={{columns:isMobile?1:2,columnGap:14}}>
            {filteredEvals.map(item=>{
              const ev=E[item.id];
              if(!ev) return null;
              const avg=ev.avg;
              const col=starColor(avg);
              return(
                <div key={item.id} style={{breakInside:"avoid",marginBottom:isMobile?8:12,background:"#f3ede3",border:"1px solid #d9ccba",borderRadius:5,padding:isMobile?"8px 10px":"10px 12px"}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:isMobile?4:6,marginBottom:4,fontFamily:"system-ui,sans-serif",flexWrap:isMobile?"wrap":"nowrap"}}>
                    <span style={{fontWeight:700,fontSize:isMobile?14:16,color:"#1e2d4a"}}>{item.name}</span>
                    <span style={{fontSize:isMobile?12:14,color:"#8a7e6e"}}>{item.prof}</span>
                    <span style={{marginLeft:"auto",fontWeight:700,fontSize:isMobile?14:16,color:col}}>{avg?`★${avg}`:"★?"}</span>
                    {ev.n>0&&<span style={{fontSize:isMobile?11:13,color:"#8a7e6e"}}>n={ev.n}</span>}
                  </div>
                  {ev.note&&<div style={{fontSize:13,color:"#5c4e3a",fontStyle:"italic",marginBottom:5,fontFamily:"system-ui,sans-serif"}}>{ev.note}</div>}
                  {ev.comments.map((c,i)=>(
                    <div key={i} style={{fontSize:13,color:"#1e2d4a",borderLeft:"2px solid #b0bdd4",paddingLeft:7,marginBottom:5,lineHeight:1.5,fontFamily:"system-ui,sans-serif"}}>
                      "{c}"
                    </div>
                  ))}
                  {ev.tips.length>0&&(
                    <div style={{marginTop:4,fontFamily:"system-ui,sans-serif"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#7a5c2a",marginBottom:2}}>📋 Exam tips:</div>
                      {ev.tips.map((t,i)=><div key={i} style={{fontSize:13,color:"#4a3828",borderLeft:"2px solid #c4a870",paddingLeft:7,marginBottom:3,lineHeight:1.5}}>"{t}"</div>)}
                    </div>
                  )}
                  {ev.bid.length>0&&(
                    <div style={{marginTop:3,fontSize:10,color:"#8a7e6e",fontFamily:"system-ui,sans-serif"}}>
                      🎯 <em>{ev.bid.join(" / ")}</em>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SUGGESTIONS ── */}
      {tab==="suggest"&&(
        <div>
          <div style={{background:"#edf0f5",border:"1px solid #b0bdd4",borderRadius:5,padding:isMobile?"8px 10px":"10px 12px",marginBottom:isMobile?10:14,fontSize:11,fontFamily:"system-ui,sans-serif"}}>
            <div style={{fontWeight:700,fontSize:isMobile?13:15,marginBottom:4,color:"#1e2d4a"}}>Based on your interests: litigation · trial work · gender issues · rule of law/democracy · entertainment · IP disputes</div>
            <div style={{color:"#5c4e3a",fontSize:isMobile?11:undefined}}>These courses are not in your main schedule but are worth considering. Click "▼ eval & tips" to see direct peer quotes.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?8:10}}>
            {SUGGESTIONS.map(s=>(
              <div key={s.key} style={{background:s.c.bg,border:`1px solid ${s.c.bd}`,borderRadius:5,padding:isMobile?"8px 10px":"10px 12px"}}>
                <div style={{display:"flex",alignItems:"baseline",gap:isMobile?4:6,marginBottom:3,fontFamily:"system-ui,sans-serif",flexWrap:isMobile?"wrap":"nowrap"}}>
                  <span style={{fontWeight:700,fontSize:isMobile?14:16,color:s.c.tx}}>{s.name}</span>
                  <span style={{fontSize:isMobile?12:14,color:s.c.tx,opacity:.8}}>{s.prof}</span>
                  <span style={{marginLeft:isMobile?0:"auto",fontSize:isMobile?11:13,fontWeight:700,color:s.c.bd,background:"#f3ede3",borderRadius:8,padding:"1px 6px"}}>{s.cr}cr · {s.term}</span>
                </div>
                <div style={{fontSize:isMobile?12:13,fontWeight:700,color:s.c.bd,marginBottom:4,fontFamily:"system-ui,sans-serif"}}>🎯 Why: {s.why}</div>
                <div style={{fontSize:isMobile?13:14,color:s.c.tx,lineHeight:1.55,marginBottom:5,fontFamily:"system-ui,sans-serif"}}>{s.pitch}</div>
                {s.evalId&&<EvalCard evalId={s.evalId} label="peer quotes"/>}
                {window.__hlsSetNote&&<NoteField courseKey={s.key}/>}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
    </EvalContext.Provider>
    </MobileContext.Provider>
  );
}
