import { useState, useMemo, useEffect, useRef, useCallback, createContext, useContext } from "react";

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
    key:"sug_fedcourts", name:"Federal Courts", prof:"Goldsmith", cr:5, term:"Fall 27",
    evalId:"sugg_fedCourts", c:{bg:"#e4eef5",bd:"#2a6080",tx:"#12344a"},
    why:"Litigation + Rule of Law",
    pitch:"Essential for any litigator. Goldsmith is one of the best teachers at HLS: 'I probably learned more there than I did anywhere else at HLS.' Covers the constitutional and statutory limits of Article III courts — the foundation of federal litigation strategy. Hard but worth it.",
  },
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
  ev_r:  {key:"ev_r",  name:"Evidence", prof:"Rubin",    cr:2, days:["Mon"],             s:"13:30",e:"15:30", c:K.blue},
  ev_br: {key:"ev_br", name:"Evidence", prof:"Brewer",   cr:4, days:["Tue","Wed"],       s:"15:45",e:"17:45", c:K.blue},
  // ── FALL CORPORATIONS (multi-section) ──
  co_sp: {key:"co_sp", name:"Corporations", prof:"Spamann",     cr:4, days:["Wed","Thu","Fri"], s:"8:30", e:"9:50",  c:K.green},
  co_fr: {key:"co_fr", name:"Corporations", prof:"Fried",       cr:4, days:["Wed","Thu","Fri"], s:"13:30",e:"15:30", c:K.green},
  co_pg: {key:"co_pg", name:"Corporations", prof:"Pargendler",  cr:4, days:["Mon","Tue"],       s:"15:45",e:"17:45", c:K.green},
  // ── FALL 1A (multi-section) ──
  f_1afe:{key:"f_1afe",name:"1st Amendment",prof:"Feldman",  cr:4, days:["Thu","Fri"],   s:"10:15",e:"12:15", c:K.indigo},
  f_1awe:{key:"f_1awe",name:"1st Amendment",prof:"Weinrib",  cr:4, days:["Mon","Tue"],   s:"13:30",e:"15:30", c:K.indigo},
  f_1afi:{key:"f_1afi",name:"1st Amendment",prof:"Field",    cr:4, days:["Mon","Tue"],   s:"10:15",e:"12:15", c:K.indigo},
  // ── FALL ADMIN LAW ──
  f_adm: {key:"f_adm", name:"Admin Law",    prof:"Freeman",   cr:4, days:["Wed","Thu"],  s:"13:30",e:"15:30", c:K.red},
  // ── FALL BANKRUPTCY ──
  f_bke: {key:"f_bke", name:"Bankruptcy",   prof:"Ellias",    cr:4, days:["Mon","Tue"],  s:"10:15",e:"12:15", c:K.violet},
  // ── TAW ──
  taw:   {key:"taw",   name:"Trial Advocacy Workshop", prof:"Sullivan", cr:3, days:DAYS, s:"14:00",e:"21:00", c:K.gray},
  // ── FALL SEMINARS / COURSES ──
  f_sex: {key:"f_sex", name:"Sex Equality",    prof:"MacKinnon", cr:3, days:["Mon","Tue","Wed"], s:"18:00",e:"20:00", c:K.pink},
  f_sexA:{key:"f_sexA",name:"Adv Sex Equality",prof:"MacKinnon", cr:2, days:["Mon","Tue"],       s:"13:30",e:"15:30", c:K.pink},
  f_fl:  {key:"f_fl",  name:"Facts & Lies",    prof:"Saris",     cr:2, days:["Wed"],             s:"15:45",e:"17:45", c:K.orange},
  f_ec:  {key:"f_ec",  name:"Engaging China",  prof:"Alford",    cr:2, days:["Mon","Tue"],       s:"18:00",e:"20:00", c:K.red},
  f_aa:  {key:"f_aa",  name:"Asian Am & Law",  prof:"Lee",       cr:2, days:["Tue"],             s:"15:45",e:"17:45", c:K.amber},
  // ── SPRING ADMIN LAW (multi-section) ──
  sp_adm_v:{key:"sp_adm_v",name:"Admin Law",prof:"Vermeule", cr:4, days:["Wed","Thu"],   s:"13:30",e:"15:30", c:K.red},
  sp_adm_b:{key:"sp_adm_b",name:"Admin Law",prof:"Block",    cr:3, days:["Tue","Wed"],   s:"15:45",e:"17:15", c:K.red},
  // ── SPRING CORPORATIONS (multi-section) ──
  sp_co_c:{key:"sp_co_c",name:"Corporations",prof:"Coates",    cr:4, days:["Mon","Tue","Wed"], s:"10:15",e:"11:35", c:K.green},
  sp_co_t:{key:"sp_co_t",name:"Corporations",prof:"Tallarita", cr:4, days:["Thu","Fri"],       s:"10:15",e:"12:15", c:K.green},
  // ── SPRING FEDERAL COURTS (multi-section) ──
  sp_fc_r:{key:"sp_fc_r",name:"Federal Courts",prof:"Re",    cr:4, days:["Mon","Tue","Wed"], s:"10:30",e:"11:50", c:K.teal},
  sp_fc_s:{key:"sp_fc_s",name:"Federal Courts",prof:"Sachs", cr:4, days:["Wed","Thu","Fri"], s:"13:40",e:"15:00", c:K.teal},
  // ── SPRING EVIDENCE (multi-section) ──
  sp_ev_l:{key:"sp_ev_l",name:"Evidence",prof:"Lvovsky", cr:4, days:["Mon","Tue","Wed"], s:"10:30",e:"11:50", c:K.blue},
  sp_ev_r:{key:"sp_ev_r",name:"Evidence",prof:"Rubin",   cr:2, days:["Mon"],             s:"13:30",e:"15:30", c:K.blue},
  sp_ev_c:{key:"sp_ev_c",name:"Evidence",prof:"Clary",   cr:3, days:["Wed","Thu"],       s:"13:30",e:"15:00", c:K.blue},
  // ── SPRING CRIM PRO INVESTIGATIONS (multi-section) ──
  sp_cpi_n:{key:"sp_cpi_n",name:"Crim Pro: Investigations",prof:"Natapoff",cr:4,days:["Thu","Fri"],s:"10:15",e:"12:15",c:K.amber},
  sp_cpi_w:{key:"sp_cpi_w",name:"Crim Pro: Investigations",prof:"Whiting", cr:4,days:["Mon","Tue"],s:"10:15",e:"12:15",c:K.amber},
  // ── SPRING SINGLE-SECTION ──
  sp_bk: {key:"sp_bk", name:"Bankruptcy",      prof:"Roe",     cr:4, days:["Mon","Tue","Wed"],  s:"10:30",e:"11:50", c:K.violet},
  sp_cp: {key:"sp_cp", name:"Copyright",       prof:"Fisher",  cr:4, days:["Mon","Tue","Wed"],  s:"10:30",e:"11:50", c:K.sky},
  sp_col:{key:"sp_col",name:"Conflict of Laws",prof:"Sachs",   cr:3, days:["Mon","Tue"],         s:"13:40",e:"15:10", c:K.emerald},
  sp_1a: {key:"sp_1a", name:"1st Amendment",   prof:"Parker",  cr:4, days:["Mon","Tue"],         s:"15:45",e:"17:45", c:K.indigo},
};

const FALL_ELECTIVES={
  courses:[
    {key:"f_bke",  name:"Bankruptcy",               prof:"Ellias",         cr:4,days:["Mon","Tue"],       s:"10:15",e:"12:15",c:K.violet,evalId:"f_bke"},
    {key:"f_cap",  name:"Capital Punishment",        prof:"Steiker",        cr:4,days:["Thu","Fri"],       s:"10:15",e:"12:15",c:K.amber, evalId:null},
    {key:"f_cl",   name:"Complex Litigation",        prof:"Clary",          cr:2,days:["Wed"],             s:"10:15",e:"12:15",c:K.cyan,  evalId:"f_cl"},
    {key:"f_ca",   name:"Class Actions",             prof:"Clary",          cr:2,days:["Tue"],             s:"13:30",e:"15:30",c:K.cyan,  evalId:"f_ca"},
    {key:"f_clsj", name:"Communication Law & Social Justice",prof:"Jenkins",cr:4,days:["Thu","Fri"],       s:"10:15",e:"12:15",c:K.red,   evalId:null},
    {key:"f_ccl",  name:"Comparative Constitutional Law",prof:"Jackson",    cr:4,days:["Wed","Thu"],       s:"13:30",e:"15:30",c:K.teal,  evalId:null},
    {key:"f_ctr",  name:"Copyright",                 prof:"Tushnet",        cr:4,days:["Mon","Tue"],       s:"10:15",e:"12:15",c:K.sky,   evalId:null},
    {key:"f_ctml", name:"Copyright & TM Litigation", prof:"Cendali",        cr:2,days:["Mon"],             s:"13:30",e:"15:30",c:K.sky,   evalId:"f_ctml"},
    {key:"f_cpa",  name:"Crim Pro: Adjudication",    prof:"Lanni",          cr:4,days:["Thu","Fri"],       s:"10:15",e:"12:15",c:K.amber, evalId:null},
    {key:"f_cp",   name:"Crim Pro: Survey",          prof:"Re",             cr:4,days:["Tue","Wed"],       s:"10:15",e:"12:15",c:K.amber, evalId:null},
    {key:"f_dpl",  name:"Drug Product Liability",    prof:"Grossi",         cr:3,days:["Wed"],             s:"13:30",e:"15:30",c:K.orange,evalId:null},
    {key:"f_emp",  name:"Employment Law",            prof:"Sachs",          cr:4,days:["Mon","Tue"],       s:"13:30",e:"15:30",c:K.rose,  evalId:"f_emp"},
    {key:"f_fce",  name:"Federal Courts",            prof:"Goldsmith",      cr:5,days:["Wed","Thu","Fri"], s:"13:30",e:"15:10",c:K.teal,  evalId:null},
    {key:"f_iip",  name:"Intl Intellectual Property",prof:"Okediji",        cr:3,days:["Mon","Tue"],       s:"15:45",e:"17:15",c:K.sky,   evalId:null},
    {key:"f_lod",  name:"Law of Democracy",          prof:"Stephanopoulos", cr:4,days:["Thu","Fri"],       s:"10:15",e:"12:15",c:K.indigo,evalId:null},
    {key:"f_pat",  name:"Patent Law",                prof:"Tompros",        cr:3,days:["Thu","Fri"],       s:"10:15",e:"11:45",c:K.sky,   evalId:null},
    {key:"f_rac",  name:"Race Relations Law",        prof:"Kennedy",        cr:3,days:["Mon","Tue"],       s:"13:30",e:"15:00",c:K.red,   evalId:null},
    {key:"f_slg",  name:"State & Local Government",  prof:"Bowie",          cr:4,days:["Wed","Thu","Fri"], s:"13:30",e:"14:50",c:K.violet,evalId:null},
    {key:"f_sex",  name:"Sex Equality",              prof:"MacKinnon",      cr:3,days:["Mon","Tue","Wed"], s:"18:00",e:"20:00",c:K.pink,  evalId:"f_sex"},
    {key:"f_wcc",  name:"White Collar Criminal",     prof:"Apps",           cr:2,days:["Mon"],             s:"15:45",e:"17:45",c:K.fuchsia,evalId:null},
    {key:"f_art",  name:"Art Law Litigation",        prof:"Nikas",          cr:2,days:["Wed"],             s:"13:30",e:"15:30",c:K.lime,  evalId:null},
    {key:"f_bsl",  name:"Business Strategy",         prof:"Spier",          cr:3,days:["Mon","Tue"],       s:"8:30", e:"10:00",c:K.teal,  evalId:"f_bsl"},
    {key:"f_bn",   name:"Business Negotiations",     prof:"Coakley",        cr:3,days:["Wed"],             s:"18:00",e:"21:15",c:K.lime,  evalId:null},
    {key:"f_imm",  name:"Immigration Law",           prof:"Neuman",         cr:3,days:["Mon","Tue"],       s:"15:45",e:"17:15",c:K.amber, evalId:null},
  ],
  seminars:[
    {key:"f_sexA", name:"Adv Problems in Sex Equality",prof:"MacKinnon",  cr:2,days:["Mon","Tue"],       s:"13:30",e:"15:30",c:K.pink,  evalId:null},
    {key:"f_antip",name:"Antitrust & IP",             prof:"Popofsky",    cr:2,days:["Wed"],             s:"15:45",e:"17:45",c:K.sky,   evalId:null},
    {key:"f_di",   name:"Democratic Innovations",     prof:"Lessig",      cr:2,days:["Wed"],             s:"15:45",e:"17:45",c:K.indigo,evalId:null},
    {key:"f_ec",   name:"Engaging China",             prof:"Alford",      cr:2,days:["Mon","Tue"],       s:"18:00",e:"20:00",c:K.red,   evalId:null},
    {key:"f_fl",   name:"Facts & Lies",               prof:"Saris",       cr:2,days:["Wed"],             s:"15:45",e:"17:45",c:K.orange,evalId:"f_fl"},
    {key:"f_iov",  name:"Independent Oversight",      prof:"Goldsmith",   cr:2,days:["Mon"],             s:"18:00",e:"20:00",c:K.teal,  evalId:null},
    {key:"f_jrd",  name:"Role of Judiciary/Democracy",prof:"Abella",      cr:2,days:["Tue","Wed"],       s:"15:45",e:"17:45",c:K.teal,  evalId:null},
    {key:"f_jsg",  name:"Jurisprudence of Sports",    prof:"Re",          cr:2,days:["Mon"],             s:"13:30",e:"15:30",c:K.lime,  evalId:null},
    {key:"f_ltd",  name:"Legal Tools for Democracy",  prof:"Schwartztol", cr:2,days:["Wed"],             s:"15:45",e:"17:45",c:K.indigo,evalId:null},
    {key:"f_aa",   name:"Asian Americans & Law",      prof:"Lee",         cr:2,days:["Tue"],             s:"15:45",e:"17:45",c:K.amber, evalId:null},
    {key:"f_pfmb", name:"Past & Future of Music Biz", prof:"Ferrell",     cr:2,days:["Mon"],             s:"18:00",e:"20:00",c:K.lime,  evalId:null},
    {key:"f_sct",  name:"The U.S. Supreme Court",     prof:"Sunstein/Breyer",cr:2,days:["Tue"],          s:"13:30",e:"15:30",c:K.violet,evalId:null},
    {key:"f_tss",  name:"Trade Secret Law",           prof:"Gershenson",  cr:2,days:["Thu"],             s:"15:45",e:"17:45",c:K.sky,   evalId:null},
    {key:"f_cci",  name:"Corporate Criminal Invest.", prof:"Kahn/Tsao",   cr:2,c:K.fuchsia,             evalId:"f_cci"},
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
    {key:"sp_cr",   name:"Corporate Restructuring",  prof:"Ellias",     cr:4,days:["Mon","Tue"],       s:"13:30",e:"15:30",c:K.violet,evalId:null},
    {key:"sp_ej",   name:"Environmental Justice",    prof:"Simms",      cr:3,days:["Mon","Tue"],       s:"8:30", e:"10:00",c:K.lime,  evalId:null},
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
    {key:"sp_pi",   name:"Public International Law", prof:"Blum",       cr:4,days:["Wed","Fri"],       s:"13:30",e:"15:30",c:K.teal,  evalId:null},
    {key:"sp_rfi",  name:"Regulation of Financial Institutions",prof:"Tarullo",cr:4,days:["Mon","Tue"],s:"13:30",e:"15:30",c:K.violet,evalId:null},
    {key:"sp_ag",   name:"Role of State Attorney General",prof:"Brann", cr:2,days:["Mon"],             s:"13:30",e:"15:30",c:K.indigo,evalId:"sugg_stateAG"},
    {key:"sp_1a",   name:"1st Amendment",            prof:"Parker",     cr:4,days:["Mon","Tue"],       s:"15:45",e:"17:45",c:K.indigo,evalId:"sp_1a"},
  ],
  seminars:[
    {key:"sp_a2j",  name:"Access to Justice Lab",    prof:"Greiner",    cr:2,days:["Thu"],             s:"18:00",e:"20:00",c:K.lime,  evalId:"sp_a2j"},
    {key:"sp_adm2", name:"Advanced Issues in Admin Law",prof:"Vermeule",cr:2,days:["Tue"],             s:"15:45",e:"17:45",c:K.red,   evalId:null},
    {key:"sp_awa",  name:"Advanced Written Advocacy", prof:"Clary",     cr:2,days:["Wed"],             s:"15:45",e:"17:45",c:K.cyan,  evalId:null},
    {key:"sp_sexA", name:"Comparative & Intl Reproductive Rights",prof:"Yamin",cr:2,days:["Wed"],      s:"15:45",e:"17:45",c:K.pink,  evalId:null},
    {key:"sp_elsc", name:"Environ. Law in Supreme Court",prof:"Lazarus", cr:2,days:["Mon","Tue"],       s:"15:45",e:"17:45",c:K.lime,  evalId:null},
    {key:"sp_ltd",  name:"Legal Tools for Democracy", prof:"Schwartztol",cr:2,days:["Tue"],            s:"15:45",e:"17:45",c:K.indigo,evalId:null},
    {key:"sp_pol",  name:"Policing in America",       prof:"Umunna",    cr:2,days:["Mon"],             s:"18:00",e:"20:00",c:K.amber, evalId:null},
    {key:"sp_rc",   name:"The Roberts Court",         prof:"Gershengorn",cr:2,days:["Tue"],            s:"15:45",e:"17:45",c:K.violet,evalId:null},
    {key:"sp_tc",   name:"Teaching Copyright",        prof:"Fisher",    cr:2,days:["Mon"],             s:"18:00",e:"20:00",c:K.sky,   evalId:null},
    {key:"sp_tint", name:"Terrorism & Intl Law",      prof:"Modirzadeh",cr:2,days:["Tue"],             s:"15:45",e:"17:45",c:K.amber, evalId:null},
    {key:"sp_rob",  name:"The Obama Presidency",      prof:"Mack",      cr:2,days:["Tue"],             s:"18:00",e:"20:00",c:K.teal,  evalId:null},
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
  {id:"consumer",  name:"Consumer Protection", semCr:2, fMin:3,fMax:5, term:"spring-only", c:K.lime,   evalId:"clinicConsumer",
   note:"Spring only · WilmerHale Legal Services Center · litigation-heavy"},
  {id:"cyberlaw",  name:"Cyberlaw",            semCr:2, fMin:3,fMax:5, term:"both",        c:K.sky,    evalId:"clinicCyber",
   note:"Fall or spring · Berkman Klein · IP/privacy/tech/AI"},
  {id:"employment",name:"Employment",          semCr:2, fMin:3,fMax:5, term:"both",        c:K.rose,   evalId:null,
   note:"Fall or spring · employment rights & discrimination"},
  {id:"fedcourts", name:"Federal Courts",      semCr:1, fMin:2,fMax:3, term:"winter+spring",c:K.teal,  evalId:"clinicFedCourts",
   note:"Winter 2cr + Spring 2–3cr fieldwork + 1cr seminar · externship at any federal court nationwide"},
  {id:"mediation", name:"Mediation",           semCr:0, fMin:1,fMax:1, term:"both",        c:K.fuchsia,evalId:null,
   note:"1cr total · standalone format"},
];

// ── CALENDAR ─────────────────────────────────────────────────────────────────
const CAL_S=8*60, CAL_E=20*60, CAL_H=420;
const yOf=m=>((toMin(m)-CAL_S)/(CAL_E-CAL_S))*CAL_H;
const hOf=(s,e)=>Math.max(((toMin(e)-toMin(s))/(CAL_E-CAL_S))*CAL_H,14);

function Calendar({courses,tawActive}){
  const byDay={};
  DAYS.forEach(d=>byDay[d]=[]);
  courses.forEach(c=>{c?.days?.forEach(d=>byDay[d]?.push(c))});
  const hrs=Array.from({length:14},(_,i)=>i+7);
  return(
    <div style={{display:"flex",height:CAL_H+24,fontSize:11,userSelect:"none",flexShrink:0,borderRadius:5,overflow:"hidden",border:"1px solid #d9ccba"}}>
      <div style={{width:28,position:"relative",flexShrink:0,paddingTop:24,background:"#f3ede3"}}>
        {hrs.map(h=><div key={h} style={{position:"absolute",top:yOf(`${h}:30`)+24,right:2,color:"#8a7e6e",fontSize:9,fontFamily:"system-ui,sans-serif"}}>{h===12?"12p":h<12?h+"a":(h-12)+"p"}</div>)}
      </div>
      {DAYS.map(day=>(
        <div key={day} style={{flex:1,borderLeft:"1px solid #d9ccba",position:"relative",minWidth:0,overflow:"hidden"}}>
          <div style={{textAlign:"center",fontWeight:700,color:"#1e2d4a",height:24,lineHeight:"24px",background:"#ede6d8",borderBottom:"1px solid #d9ccba",fontSize:11,fontFamily:"system-ui,sans-serif",letterSpacing:"0.04em"}}>{day}</div>
          {tawActive&&<div style={{position:"absolute",top:yOf("14:00"),height:hOf("14:00","20:00"),left:0,right:0,background:"rgba(107,99,90,.05)",borderTop:"1px dashed #c4b8a8",pointerEvents:"none"}}/>}
          {hrs.map(h=><div key={h} style={{position:"absolute",top:yOf(`${h}:00`),left:0,right:0,borderTop:h%2===0?"1px solid #e8e0d4":"1px solid #f0ebe2"}}/>)}
          {byDay[day].map((c,i)=>(
            <div key={c.key+day+i} title={`${c.name} (${c.prof})\n${c.s}–${c.e}`}
              style={{position:"absolute",top:yOf(c.s),height:hOf(c.s,c.e),left:1,right:1,
                background:c.c.bg,borderLeft:`3px solid ${c.c.bd}`,borderRadius:2,
                padding:"2px 4px",overflow:"hidden",color:c.c.tx,boxShadow:"0 1px 3px rgba(0,0,0,.1)",cursor:"default"}}>
              <div style={{fontWeight:700,fontSize:10,lineHeight:1.2,fontFamily:"system-ui,sans-serif"}}>{c.name}</div>
              <div style={{opacity:.65,fontSize:9,fontFamily:"system-ui,sans-serif"}}>{c.prof}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── UI ATOMS ──────────────────────────────────────────────────────────────────
const Dot=({c,sz=8})=><span style={{display:"inline-block",width:sz,height:sz,borderRadius:"50%",background:c.bd,flexShrink:0,marginRight:4}}/>;

function StarBadge({evalId}) {
  const E = useContext(EvalContext);
  const ev = E[evalId]; if(!ev) return null;
  const col = starColor(ev.avg);
  return <span style={{fontSize:13,fontWeight:700,color:col,marginLeft:4}}>{ev.avg?`★${ev.avg}`:"★?"}{ev.n>0?` (${ev.n})`:""}</span>;
}

function Option({type,value,cur,set,label,sub,c,evalId,warn,locked,noteKey}){
  const sel = type==="radio"?(cur===value):cur;
  const nk = noteKey !== undefined ? noteKey : (type==="radio" ? value : null);
  return(
    <div style={{marginBottom:4}}>
      <label style={{display:"flex",alignItems:"flex-start",gap:5,cursor:locked?"default":"pointer",
        padding:"4px 7px",borderRadius:4,
        background:sel?(warn?"#f5ede0":"#edf0f5"):"transparent",
        border:sel?(warn?"1px solid #c4924a":"1px solid #b0bdd4"):"1px solid transparent",
        opacity:locked?.45:1}}>
        {type==="radio"
          ? <input type="radio" checked={sel} onChange={()=>!locked&&set(value)} disabled={locked} style={{marginTop:2,flexShrink:0,accentColor:"#1e2d4a"}}/>
          : <input type="checkbox" checked={sel} onChange={e=>!locked&&set(e.target.checked)} disabled={locked} style={{marginTop:2,flexShrink:0,accentColor:"#1e2d4a"}}/>}
        {c&&<Dot c={c}/>}
        <span style={{fontSize:17,fontFamily:"system-ui,sans-serif"}}>
          <span style={{fontWeight:600,color:"#2c2418"}}>{label}</span>
          {evalId && <StarBadge evalId={evalId}/>}
          {sub&&<><br/><span style={{color:warn?"#a0622a":"#8a7e6e",fontSize:14}}>{sub}</span></>}
        </span>
      </label>
      {evalId && <EvalCard evalId={evalId}/>}
      {nk&&window.__hlsSetNote&&<NoteField courseKey={nk}/>}
    </div>
  );
}

function Sect({title,must,children}){
  return(
    <div style={{marginBottom:13,borderLeft:`2px solid ${must?"#6b1e2e":"#d9ccba"}`,paddingLeft:9}}>
      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
        <span style={{fontSize:13,fontWeight:700,color:"#8a7e6e",textTransform:"uppercase",letterSpacing:".07em",fontFamily:"system-ui,sans-serif"}}>{title}</span>
        {must&&<span style={{background:"#f5e8e8",color:"#6b1e2e",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700,fontFamily:"system-ui,sans-serif",letterSpacing:".04em"}}>required</span>}
      </div>
      {children}
    </div>
  );
}

function CrBar({cr,min,max,label}){
  const over=cr>max,under=cr<min;
  const col=over?"#6b1e2e":under?"#9a7820":"#1e2d4a";
  const barCol=over?"#7c1d2e":under?"#a0622a":"#2c4a7c";
  return(
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:600,marginBottom:3,fontFamily:"system-ui,sans-serif"}}>
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
  const msgs=[...conflicts.map(([a,b])=>`${a.name} (${a.prof}) ↔ ${b.name} (${b.prof})`),
    ...(tawActive&&!tawOk?[`TAW overlap ${fmtHr(tawHrs)}hr/wk — exceeds 4hr limit`]:[])];
  if(!msgs.length) return <div style={{background:"#eaf0e8",border:"1px solid #b0c4a8",borderRadius:4,padding:"4px 10px",marginBottom:8,fontSize:14,color:"#2a4a22",fontFamily:"system-ui,sans-serif"}}>✓ No schedule conflicts{tawActive?` · TAW overlap: ${fmtHr(tawHrs)}hr/wk`:""}</div>;
  return(
    <div style={{background:"#f5e8e8",border:"1px solid #c4a4a4",borderRadius:4,padding:"6px 10px",marginBottom:8,fontFamily:"system-ui,sans-serif"}}>
      <div style={{fontWeight:700,color:"#6b1e2e",fontSize:14,marginBottom:2}}>⚠ {msgs.length} conflict{msgs.length>1?"s":""}</div>
      {msgs.map((m,i)=><div key={i} style={{fontSize:13,color:"#7c1d2e"}}>{m}</div>)}
    </div>
  );
}

function ElectCard({c, sel, toggle}){
  const on=sel.has(c.key);
  const schedStr=c.days?`${c.days.map(d=>d.slice(0,2)).join(", ")} ${c.s}–${c.e}`:(c.note||"");
  return(
    <div style={{borderRadius:3,background:on?c.c.bg:"#f3ede3",border:on?`1px solid ${c.c.bd}`:"1px solid #d9ccba",overflow:"hidden",marginBottom:2}}>
      <label style={{display:"flex",alignItems:"flex-start",gap:5,cursor:"pointer",padding:"5px 7px",width:"100%",boxSizing:"border-box",fontFamily:"system-ui,sans-serif"}}>
        <input type="checkbox" checked={on} onChange={()=>toggle(c.key)} style={{flexShrink:0,marginTop:2,accentColor:c.c.bd}}/>
        <Dot c={c.c} sz={6} style={{marginTop:4}}/>
        <span style={{flex:1,lineHeight:1.3}}>
          <span style={{fontWeight:600,color:"#2c2418",fontSize:14}}>{c.name}</span>
          {c.evalId&&<StarBadge evalId={c.evalId}/>}
          <br/>
          <span style={{color:"#8a7e6e",fontSize:12}}>{c.prof} · {c.cr}cr</span>
          {schedStr&&<><br/><span style={{color:on?c.c.bd:"#5a7070",fontSize:12,fontWeight:600}}>{schedStr}</span></>}
        </span>
      </label>
      {c.evalId&&<EvalCard evalId={c.evalId}/>}
      {window.__hlsSetNote&&<NoteField courseKey={c.key}/>}
    </div>
  );
}

function ElectiveSect({label, items, sel, toggle, cols=2}){
  if(!items||items.length===0) return null;
  return(
    <div style={{marginBottom:10}}>
      <div style={{fontSize:11,fontWeight:700,color:"#8a7e6e",textTransform:"uppercase",letterSpacing:".07em",fontFamily:"system-ui,sans-serif",marginBottom:4}}>{label}</div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:3}}>
        {items.map(c=><ElectCard key={c.key} c={c} sel={sel} toggle={toggle}/>)}
      </div>
    </div>
  );
}

function ClinicSelector({clinicId,setClinicId,fieldCr,setFieldCr,allowedTerms}){
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
          {sel.id==="mediation"&&<div style={{fontSize:13,color:sel.c.tx,marginTop:3}}>Total: <strong>1cr</strong></div>}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const { notes, setNote } = useNotes();
  const E = useEvalData() || E_EMPTY;
  window.__hlsNotes   = notes;
  window.__hlsSetNote = setNote;

  const [tab,setTab]=useState("fall");
  // Fall multi-section
  const [fEv,setFEv]=useState("ev_m");
  const [fCo,setFCo]=useState("co_sp");
  const [f1A,setF1A]=useState("none");
  const [fTAW,setFTAW]=useState(true);
  const [fAdm,setFAdm]=useState(false);
  // Fall electives
  const [fElect,setFElect]=useState(new Set());
  const [fClinic,setFClinic]=useState(null);
  const [fField,setFField]=useState(3);
  // Winter
  const [wRepro,setWRepro]=useState(false);
  // Spring multi-section
  const [spAdm,setSpAdm]=useState("sp_adm_v");
  const [spCo,setSpCo]=useState("none");
  const [spFc,setSpFc]=useState("none");
  const [spEv,setSpEv]=useState("none");
  const [spCpi,setSpCpi]=useState("none");
  const [spMTC,setSpMTC]=useState("none");
  // Spring electives
  const [spElect,setSpElect]=useState(new Set());
  const [spClinic,setSpClinic]=useState(null);
  const [spField,setSpField]=useState(3);
  const [evalSearch,setEvalSearch]=useState("");

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
    if(fTAW) l.push(C.taw);
    if(fAdm) l.push(C.f_adm);
    if(f1A==="feld") l.push(C.f_1afe);
    if(f1A==="fi")   l.push(C.f_1afi);
    if(f1A==="wein") l.push(C.f_1awe);
    [...fElect].forEach(k=>{const c=ALL_FE.find(x=>x.key===k);if(c?.days)l.push(c);});
    return l;
  },[fEv,fCo,fTAW,fAdm,f1A,fElect]);

  const fallNoTAW=fallTimed.filter(c=>c.key!=="taw");
  const fallConflicts=useMemo(()=>getConflicts(fallNoTAW),[fallNoTAW]);
  const fallTAWHrs=useMemo(()=>fTAW?fallNoTAW.reduce((s,c)=>s+tawOverlapHrsPerWeek(c),0):0,[fTAW,fallNoTAW]);
  const fallTAWOk=fallTAWHrs<=4;
  const fElectCr=useMemo(()=>[...fElect].reduce((s,k)=>{const c=ALL_FE.find(x=>x.key===k);return s+(c&&!c.days?c.cr:0);},0),[fElect]);
  const fClinicCr=clinicCrTotal(fClinic,fField);
  const fallCr=sumCr(fallTimed)+fElectCr+fClinicCr;

  const useFedWinter=spClinic==="fedcourts";
  const winterCrCalc=useFedWinter?2:(!fTAW?3:(wRepro?2:0));

  const spTimed=useMemo(()=>{
    const l=[];
    if(C[spAdm]) l.push(C[spAdm]);
    if(spCo!=="none"&&C[spCo]) l.push(C[spCo]);
    if(spFc!=="none"&&C[spFc]) l.push(C[spFc]);
    if(spEv!=="none"&&C[spEv]) l.push(C[spEv]);
    if(spCpi!=="none"&&C[spCpi]) l.push(C[spCpi]);
    if(spMTC!=="none"&&C[spMTC]) l.push(C[spMTC]);
    [...spElect].forEach(k=>{const c=ALL_SE.find(x=>x.key===k);if(c?.days)l.push(c);});
    return l;
  },[spAdm,spCo,spFc,spEv,spCpi,spMTC,spElect]);

  const spConflicts=useMemo(()=>getConflicts(spTimed),[spTimed]);
  const spElectCr=useMemo(()=>[...spElect].reduce((s,k)=>{const c=ALL_SE.find(x=>x.key===k);return s+(c&&!c.days?c.cr:0);},0),[spElect]);
  const spClinicCr=spClinic==="fedcourts"?(spField+1):clinicCrTotal(spClinic,spField);
  const springCr=sumCr(spTimed)+spElectCr+spClinicCr;
  const annualCr=fallCr+winterCrCalc+springCr;

  const crCol=(cr,min,max)=>cr>max?"#6b1e2e":cr<min?"#9a7820":"#1e2d4a";
  const TABS=["fall","winter","spring","summary","evals","suggest"];
  const TL={fall:"🍂 Fall",winter:"❄️ Winter",spring:"🌸 Spring",summary:"📋 Summary",evals:"★ Evals",suggest:"💡 Suggest"};
  const side={flex:1,minWidth:0,borderRight:`1px solid #d9ccba`,paddingRight:16,overflowY:"auto",maxHeight:"84vh"};

  const toggleF=k=>setFElect(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});
  const toggleSp=k=>setSpElect(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});

  // All course evals for the browser
  const ALL_EVAL_ITEMS = [
    {id:"ev_m",  name:"Evidence",              prof:"Medwed"},
    {id:"ev_s",  name:"Evidence",              prof:"Schulman"},
    {id:"ev_w",  name:"Evidence",              prof:"Whiting"},
    {id:"co_sp", name:"Corporations",          prof:"Spaaman"},
    {id:"co_fr", name:"Corporations",          prof:"Fried"},
    {id:"taw",   name:"Trial Advocacy Workshop",prof:"Harden"},
    {id:"sp_bk", name:"Bankruptcy",            prof:"Roe"},
    {id:"f_bke", name:"Bankruptcy",            prof:"Elias"},
    {id:"sp_cp", name:"Copyright",             prof:"Fisher"},
    {id:"f_ctml",name:"Copyright & TM Litigation",prof:"Cendali"},
    {id:"sp_adm_v",name:"Admin Law",           prof:"Vermeule"},
    {id:"sp_adm_b",name:"Admin Law",           prof:"Block"},
    {id:"sp_col",name:"Conflict of Laws",      prof:"Sachs"},
    {id:"sp_1a", name:"1st Amendment",         prof:"Parker"},
    {id:"f1a_fe",name:"1st Amendment",         prof:"Feldman"},
    {id:"f1a_we",name:"1st Amendment",         prof:"Weinrib"},
    {id:"f_sex", name:"Sex Equality",          prof:"MacKinnon"},
    {id:"f_gi",  name:"Gender Identity & Sexual Orientation",prof:"Chen"},
    {id:"f_emp", name:"Employment Law",        prof:"Sachs"},
    {id:"f_ca",  name:"Class Actions",         prof:"Clary"},
    {id:"f_cl",  name:"Complex Litigation",    prof:"Clary"},
    {id:"f_cci", name:"Corporate Criminal Invest.",prof:"Kahn/Tsao"},
    {id:"f_taxB",name:"Taxation",              prof:"Brennan"},
    {id:"f_taxD",name:"Taxation",              prof:"Desai"},
    {id:"f_bsl", name:"Business Strategy for Lawyers",prof:"Spier"},
    {id:"sp_mus",name:"Music & Digital Media", prof:"Bavitz"},
    {id:"sp_aml",name:"Analytical Methods",    prof:"Spier"},
    {id:"sp_crl",name:"Civil Rights Litigation",prof:"Michelman"},
    {id:"clinicConsumer",name:"Consumer Protection Clinic",prof:"Bertling/Rosenbloom"},
    {id:"clinicCyber",   name:"Cyberlaw Clinic",           prof:"Bavitz"},
    {id:"clinicFedCourts",name:"Federal Courts Clinic",    prof:"Zimmer"},
    {id:"clinicJudicial",name:"Judicial Process Clinic",   prof:"Cratsley/Berenson"},
    {id:"clinicCrimPros",name:"Criminal Prosecution Clinic",prof:"Corrigan"},
    {id:"sugg_fedCourts",name:"Federal Courts",            prof:"Goldsmith"},
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
    <EvalContext.Provider value={E}>
    <div style={{fontFamily:"Georgia,'Times New Roman',serif",background:RR.bg,minHeight:"100vh",boxSizing:"border-box",color:RR.ink}}>
      {/* Banner — mirrors The Reading Room nav bar */}
      <div style={{background:RR.bg,borderBottom:`1px solid ${RR.border}`,padding:"18px 24px 14px",display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:11,color:RR.muted,fontFamily:"system-ui,sans-serif",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>The Reading Room</div>
          <h1 style={{margin:0,fontSize:26,fontWeight:700,color:RR.maroon,letterSpacing:"-0.01em",fontFamily:"Georgia,'Times New Roman',serif",lineHeight:1}}>Schedule Planner</h1>
        </div>
        <div style={{textAlign:"right"}}>
          <span style={{fontSize:15,fontWeight:700,color:rrCrCol(annualCr,24,35),fontFamily:"Georgia,serif"}}>{annualCr}cr</span>
          <div style={{fontSize:9,color:RR.muted,fontFamily:"system-ui,sans-serif",letterSpacing:"0.05em",textTransform:"uppercase",marginTop:2}}>annual · req 24–35</div>
        </div>
      </div>

      <div style={{padding:"12px 16px",boxSizing:"border-box"}}>
      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${RR.border}`,marginBottom:12,flexWrap:"wrap"}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 13px",fontSize:15,fontWeight:tab===t?700:400,border:"none",background:"none",cursor:"pointer",fontFamily:"system-ui,sans-serif",letterSpacing:"0.03em",borderBottom:tab===t?`2px solid ${RR.maroon}`:"2px solid transparent",color:tab===t?RR.maroon:RR.muted,marginBottom:-1,display:"flex",alignItems:"center",gap:3}}>
            {TL[t]}
            {t==="fall"  &&<span style={{fontSize:11,fontWeight:700,color:rrCrCol(fallCr,10,16)}}>{fallCr}</span>}
            {t==="winter"&&<span style={{fontSize:11,fontWeight:700,color:rrCrCol(winterCrCalc,2,3)}}>{winterCrCalc}</span>}
            {t==="spring"&&<span style={{fontSize:11,fontWeight:700,color:rrCrCol(springCr,10,16)}}>{springCr}</span>}
          </button>
        ))}
      </div>

      {/* ── FALL ── */}
      {tab==="fall"&&(
        <div style={{display:"flex",gap:11}}>
          <div style={side}>

            {/* ─── CLINICS ─── */}
            <Sect title="Clinics (Fall)">
              <ClinicSelector clinicId={fClinic} setClinicId={setFClinic} fieldCr={fField} setFieldCr={setFField} allowedTerms="fall"/>
            </Sect>

            {/* ─── MULTI-SECTION REQUIRED ─── */}
            <Sect title="Evidence" must>
              <Option type="radio" value="ev_m"  cur={fEv} set={setFEv} c={K.blue}   label="Medwed · 3cr · Th, F 10:30"  evalId="ev_m"  sub="Engaging·rules + policy·cold call recap" noteKey="ev_m"/>
              <Option type="radio" value="ev_w"  cur={fEv} set={setFEv} c={K.blue}   label="Whiting · 4cr · M, T 10:15"  evalId="ev_w"  sub="Crim-focused·organized·hard exam" noteKey="ev_w"/>
              <Option type="radio" value="ev_s"  cur={fEv} set={setFEv} c={K.blue}   label="Schulman · 4cr · M, T 8:00"  evalId="ev_s"  sub="Video clips·rules-focused·brutal exam" noteKey="ev_s"/>
              <Option type="radio" value="ev_r"  cur={fEv} set={setFEv} c={K.blue}   label="Rubin · 2cr · M 1:30"        evalId="ev_r"  sub="2cr condensed version" noteKey="ev_r"/>
              <Option type="radio" value="ev_br" cur={fEv} set={setFEv} c={K.blue}   label="Brewer · 4cr · T, W 3:45"   evalId={null}  sub="Jurisprudence-focused approach" noteKey="ev_br"/>
            </Sect>

            <Sect title="Corporations" must>
              <Option type="radio" value="co_sp" cur={fCo} set={setFCo} c={K.green}  label="Spamann · 4cr · W, Th, F 8:30"  evalId="co_sp" sub="MC + essay · cold calls · not DE law" noteKey="co_sp"/>
              <Option type="radio" value="co_fr" cur={fCo} set={setFCo} c={K.green}  label="Fried · 4cr · W, Th, F 1:30"    evalId="co_fr" sub="MC + policy · no cold calls · funny" noteKey="co_fr"/>
              <Option type="radio" value="co_pg" cur={fCo} set={setFCo} c={K.green}  label="Pargendler · 4cr · M, T 3:45"   evalId={null}  sub="Comparative corporate governance focus" noteKey="co_pg"/>
            </Sect>

            <Sect title="Admin Law — Fall" must>
              <Option type="checkbox" cur={fAdm} set={setFAdm} c={K.red} label="Freeman · 4cr · W, Th 1:30" evalId="f_adm"
                sub={fCo==="co_fr"?"⚠ conflicts with Fried Corporations WThF":""} warn={fCo==="co_fr"} noteKey="f_adm"/>
            </Sect>

            <Sect title="Trial Advocacy Workshop" must>
              <Option type="radio" value={true}  cur={fTAW} set={setFTAW} c={K.gray} evalId="taw" noteKey="taw"
                label="Take in Fall (M–F 2–9pm intensive)"
                sub={`TAW overlap w/ other courses: ${fmtHr(fallTAWHrs)}hr/wk · max 4hr/wk`} warn={!fallTAWOk}/>
              <Option type="radio" value={false} cur={fTAW} set={setFTAW} label="Move to Winter" evalId={null} noteKey={null}/>
            </Sect>

            {/* ─── 1A: multi-section but optional ─── */}
            <Sect title="1st Amendment (pick section or take Spring)">
              <Option type="radio" value="none" cur={f1A} set={setF1A} label="Skip — take Parker in Spring" evalId={null} noteKey={null}/>
              <Option type="radio" value="feld" cur={f1A} set={setF1A} c={K.indigo} label="Feldman · 4cr · Th, F 10:15" evalId="f1a_fe" noteKey="f1a_fe"/>
              <Option type="radio" value="fi"   cur={f1A} set={setF1A} c={K.indigo} label="Field · 4cr · M, T 10:15"    evalId="f1a_fi" noteKey="f1a_fi"/>
              <Option type="radio" value="wein" cur={f1A} set={setF1A} c={K.indigo} label="Weinrib · 4cr · M, T 1:30"   evalId="f1a_we" noteKey="f1a_we"/>
            </Sect>

            {/* ─── ELECTIVES ─── */}
            <Sect title="Electives — Courses">
              <ElectiveSect label="Courses" items={FALL_ELECTIVES.courses} sel={fElect} toggle={toggleF}/>
            </Sect>
            <Sect title="Electives — Seminars">
              <ElectiveSect label="Seminars" items={FALL_ELECTIVES.seminars} sel={fElect} toggle={toggleF}/>
            </Sect>
            <Sect title="Electives — Reading Groups">
              <ElectiveSect label="Reading Groups (1cr)" items={FALL_ELECTIVES.readings} sel={fElect} toggle={toggleF} cols={1}/>
            </Sect>

          </div>
          <div style={{flex:1,minWidth:0}}>
            <CrBar cr={fallCr} min={10} max={16} label="Fall"/>
            {fTAW&&<div style={{fontSize:13,background:fallTAWOk?"#eaf0e8":"#f5e8e8",border:`1px solid ${fallTAWOk?"#b0c4a8":"#c4a4a4"}`,borderRadius:4,padding:"3px 9px",marginBottom:6,color:fallTAWOk?"#2a4a22":"#6b1e2e",fontFamily:"system-ui,sans-serif"}}>
              TAW overlap: <strong>{fmtHr(fallTAWHrs)}hr/wk</strong> / 4hr max {fallTAWOk?"✓":"⚠ exceeded"}
            </div>}
            <ConflictBanner conflicts={fallConflicts} tawOk={fallTAWOk} tawHrs={fallTAWHrs} tawActive={fTAW}/>
            {fClinic&&<div style={{fontSize:13,background:"#e8ede6",border:"1px solid #b0c4a8",borderRadius:4,padding:"3px 8px",marginBottom:6,color:"#2a4a22",fontFamily:"system-ui,sans-serif"}}>
              🏥 {CLINIC_OPTS.find(c=>c.id===fClinic)?.name} Clinic · {fClinicCr}cr
            </div>}
            <Calendar courses={fallTimed} tawActive={fTAW}/>
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
                {!fTAW&&<Sect title="Trial Advocacy Workshop" must>
                  <div style={{fontSize:14,padding:"5px 8px",background:"#ede6d8",borderRadius:4,color:"#2c2418",fontWeight:600,fontFamily:"system-ui,sans-serif"}}>TAW (Sullivan) · 3cr · fills winter slot</div>
                  <EvalCard evalId="taw"/>
                </Sect>}
                {fTAW&&<Sect title="Winter courses">
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
        <div style={{display:"flex",gap:11}}>
          <div style={side}>

            {/* ─── CLINICS ─── */}
            <Sect title="Clinics (Spring)">
              {fClinic&&<div style={{fontSize:13,color:"#6b1e2e",marginBottom:5,fontFamily:"system-ui,sans-serif"}}>⚠ Already have fall clinic — max 1/term</div>}
              <ClinicSelector clinicId={spClinic} setClinicId={setSpClinic} fieldCr={spField} setFieldCr={setSpField} allowedTerms="spring"/>
            </Sect>

            {/* ─── MULTI-SECTION REQUIRED ─── */}
            <Sect title="Admin Law" must>
              <Option type="radio" value="sp_adm_v" cur={spAdm} set={setSpAdm} c={K.red} label="Vermeule · 4cr · W, Th 1:30"   evalId="sp_adm_v" sub="In-class exam" noteKey="sp_adm_v"/>
              <Option type="radio" value="sp_adm_b" cur={spAdm} set={setSpAdm} c={K.red} label="Block · 3cr · T, W 3:45–5:15"  evalId="sp_adm_b" sub="Take-home exam" noteKey="sp_adm_b"/>
            </Sect>

            <Sect title="Corporations (Spring)">
              <Option type="radio" value="none"    cur={spCo} set={setSpCo} label="Skip" evalId={null} noteKey={null}/>
              <Option type="radio" value="sp_co_c" cur={spCo} set={setSpCo} c={K.green} label="Coates · 4cr · M, T, W 10:15"  evalId={null} noteKey="sp_co_c"/>
              <Option type="radio" value="sp_co_t" cur={spCo} set={setSpCo} c={K.green} label="Tallarita · 4cr · Th, F 10:15" evalId={null} noteKey="sp_co_t"/>
            </Sect>

            <Sect title="Federal Courts (Spring)">
              <Option type="radio" value="none"    cur={spFc} set={setSpFc} label="Skip" evalId={null} noteKey={null}/>
              <Option type="radio" value="sp_fc_r" cur={spFc} set={setSpFc} c={K.teal}  label="Re · 4cr · M, T, W 10:30"       evalId="sp_fc_r" sub="SCOTUS and lower court focus" noteKey="sp_fc_r"/>
              <Option type="radio" value="sp_fc_s" cur={spFc} set={setSpFc} c={K.teal}  label="Sachs · 4cr · W, Th, F 1:40"   evalId="sp_fc_s" sub="Doctrine + history" noteKey="sp_fc_s"/>
            </Sect>

            <Sect title="Evidence (Spring)">
              <Option type="radio" value="none"    cur={spEv} set={setSpEv} label="Skip (took in Fall)" evalId={null} noteKey={null}/>
              <Option type="radio" value="sp_ev_l" cur={spEv} set={setSpEv} c={K.blue}  label="Lvovsky · 4cr · M, T, W 10:30" evalId="sp_ev_l" sub="Evidence history + doctrine" noteKey="sp_ev_l"/>
              <Option type="radio" value="sp_ev_r" cur={spEv} set={setSpEv} c={K.blue}  label="Rubin · 2cr · M 1:30"          evalId="sp_ev_r" sub="Condensed" noteKey="sp_ev_r"/>
              <Option type="radio" value="sp_ev_c" cur={spEv} set={setSpEv} c={K.blue}  label="Clary · 3cr · W, Th 1:30"      evalId="sp_ev_c" sub="Litigation-focused" noteKey="sp_ev_c"/>
            </Sect>

            <Sect title="Crim Pro: Investigations (Spring)">
              <Option type="radio" value="none"     cur={spCpi} set={setSpCpi} label="Skip" evalId={null} noteKey={null}/>
              <Option type="radio" value="sp_cpi_n" cur={spCpi} set={setSpCpi} c={K.amber} label="Natapoff · 4cr · Th, F 10:15" evalId={null} sub="Policing + investigation focus" noteKey="sp_cpi_n"/>
              <Option type="radio" value="sp_cpi_w" cur={spCpi} set={setSpCpi} c={K.amber} label="Whiting · 4cr · M, T 10:15"   evalId={null} sub="International/crim procedure" noteKey="sp_cpi_w"/>
            </Sect>

            <Sect title="Bankruptcy / Copyright (share M,T,W 10:30 slot)">
              <div style={{fontSize:13,color:"#6b1e2e",background:"#f5e8e8",borderRadius:3,padding:"2px 6px",marginBottom:4,fontFamily:"system-ui,sans-serif"}}>Roe (Bankruptcy) and Fisher (Copyright) share the same slot</div>
              <Option type="radio" value="none"  cur={spMTC} set={setSpMTC} label="Skip both" evalId={null} noteKey={null}/>
              <Option type="radio" value="sp_bk" cur={spMTC} set={setSpMTC} c={K.violet} label="Bankruptcy (Roe) · 4cr · M, T, W 10:30"  evalId="sp_bk" noteKey="sp_bk"/>
              <Option type="radio" value="sp_cp" cur={spMTC} set={setSpMTC} c={K.sky}    label="Copyright (Fisher) · 4cr · M, T, W 10:30" evalId="sp_cp" noteKey="sp_cp"/>
            </Sect>

            {/* ─── ELECTIVES ─── */}
            <Sect title="Electives — Courses">
              <ElectiveSect label="Courses" items={SP_ELECTIVES.courses} sel={spElect} toggle={toggleSp}/>
            </Sect>
            <Sect title="Electives — Seminars">
              <ElectiveSect label="Seminars" items={SP_ELECTIVES.seminars} sel={spElect} toggle={toggleSp}/>
            </Sect>
            <Sect title="Electives — Reading Groups">
              <ElectiveSect label="Reading Groups (1cr)" items={SP_ELECTIVES.readings} sel={spElect} toggle={toggleSp} cols={1}/>
            </Sect>

          </div>
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
        const fallItems=[C[fEv],C[fCo],fTAW?C.taw:null,fAdm?C.f_adm:null,
          f1A==="feld"?C.f_1afe:f1A==="fi"?C.f_1afi:f1A==="wein"?C.f_1awe:null,
          ...[...fElect].map(k=>ALL_FE.find(x=>x.key===k)),
          fClinicObj?{...fClinicObj,name:fClinicObj.name+" Clinic",cr:fClinicCr}:null].filter(Boolean);
        const winterItems=[
          useFedWinter?{name:"Fed Courts (winter)",cr:2,c:K.teal}:null,
          !fTAW?C.taw:null,
          wRepro&&fTAW&&!useFedWinter?{name:"Repro Rights After Dobbs",cr:2,c:K.pink}:null].filter(Boolean);
        const spItems=[C[spAdm],
          spCo!=="none"?C[spCo]:null,spFc!=="none"?C[spFc]:null,
          spEv!=="none"?C[spEv]:null,spCpi!=="none"?C[spCpi]:null,
          spMTC!=="none"?C[spMTC]:null,
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
        return(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:11}}>
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
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:11}}>
              {[{l:"🍂 Fall",items:fallItems},{l:"❄️ Winter",items:winterItems},{l:"🌸 Spring",items:spItems}].map(term=>(
                <div key={term.l} style={{background:"#f3ede3",border:"1px solid #d9ccba",borderRadius:5,padding:"9px",fontFamily:"system-ui,sans-serif"}}>
                  <div style={{fontWeight:700,fontSize:16,marginBottom:6,color:"#1e2d4a"}}>{term.l}</div>
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
          </div>
        );
      })()}

      {/* ── EVALS BROWSER ── */}
      {tab==="evals"&&(
        <div>
          <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
            <input value={evalSearch} onChange={e=>setEvalSearch(e.target.value)}
              placeholder="Search courses or professors…"
              style={{flex:1,maxWidth:320,padding:"6px 10px",borderRadius:4,border:"1px solid #d9ccba",fontSize:15,outline:"none",background:"#f3ede3",color:"#2c2418",fontFamily:"system-ui,sans-serif"}}/>
            <span style={{fontSize:14,color:"#8a7e6e",fontFamily:"system-ui,sans-serif"}}>{filteredEvals.length} courses</span>
          </div>
          <div style={{columns:2,columnGap:14}}>
            {filteredEvals.map(item=>{
              const ev=E[item.id];
              if(!ev) return null;
              const avg=ev.avg;
              const col=starColor(avg);
              return(
                <div key={item.id} style={{breakInside:"avoid",marginBottom:12,background:"#f3ede3",border:"1px solid #d9ccba",borderRadius:5,padding:"10px 12px"}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:4,fontFamily:"system-ui,sans-serif"}}>
                    <span style={{fontWeight:700,fontSize:16,color:"#1e2d4a"}}>{item.name}</span>
                    <span style={{fontSize:14,color:"#8a7e6e"}}>{item.prof}</span>
                    <span style={{marginLeft:"auto",fontWeight:700,fontSize:16,color:col}}>{avg?`★${avg}`:"★?"}</span>
                    {ev.n>0&&<span style={{fontSize:13,color:"#8a7e6e"}}>n={ev.n}</span>}
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
          <div style={{background:"#edf0f5",border:"1px solid #b0bdd4",borderRadius:5,padding:"10px 12px",marginBottom:14,fontSize:11,fontFamily:"system-ui,sans-serif"}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4,color:"#1e2d4a"}}>Based on your interests: litigation · trial work · gender issues · rule of law/democracy · entertainment · IP disputes</div>
            <div style={{color:"#5c4e3a"}}>These courses are not in your main schedule but are worth considering. Click "▼ eval & tips" to see direct peer quotes.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {SUGGESTIONS.map(s=>(
              <div key={s.key} style={{background:s.c.bg,border:`1px solid ${s.c.bd}`,borderRadius:5,padding:"10px 12px"}}>
                <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:3,fontFamily:"system-ui,sans-serif"}}>
                  <span style={{fontWeight:700,fontSize:16,color:s.c.tx}}>{s.name}</span>
                  <span style={{fontSize:14,color:s.c.tx,opacity:.8}}>{s.prof}</span>
                  <span style={{marginLeft:"auto",fontSize:13,fontWeight:700,color:s.c.bd,background:"#f3ede3",borderRadius:8,padding:"1px 6px"}}>{s.cr}cr · {s.term}</span>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:s.c.bd,marginBottom:4,fontFamily:"system-ui,sans-serif"}}>🎯 Why: {s.why}</div>
                <div style={{fontSize:14,color:s.c.tx,lineHeight:1.55,marginBottom:5,fontFamily:"system-ui,sans-serif"}}>{s.pitch}</div>
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
  );
}
