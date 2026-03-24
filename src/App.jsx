import { useState, useMemo, useEffect, useRef, useCallback } from "react";

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
      <button onClick={() => setOpen(o=>!o)} style={{fontSize:9.5,border:"none",cursor:"pointer",padding:"1px 5px",borderRadius:4,color:hasNote?"#7c3aed":"#9ca3af",background:hasNote?"#ede9fe":"transparent",fontWeight:hasNote?700:400}}>
        {open ? "▲ close" : hasNote ? "📝 note" : "+ note"}
      </button>
      {open && (
        <div style={{marginTop:3}}>
          <textarea value={val} onChange={handleChange} placeholder="Your notes…" rows={2}
            style={{width:"100%",boxSizing:"border-box",fontSize:11,padding:"5px 7px",borderRadius:5,border:"1px solid #c4b5fd",outline:"none",resize:"vertical",fontFamily:"system-ui,sans-serif",color:"#1e1b4b",background:"#faf5ff",lineHeight:1.4}}/>
          {saved && <span style={{fontSize:9.5,color:"#16a34a"}}>✓ saved</span>}
        </div>
      )}
    </div>
  );
}

// ── EVAL DATA (direct quotes from peer spreadsheet) ───────────────────────────
const E = {
  ev_m:  { avg:null, n:0, comments:[], tips:[], bid:[], note:"Visiting prof from Northeastern. Students note strong recaps and accessible teaching style." },
  ev_s:  { avg:4.5, n:3,
    comments:[
      "Important course for litigation, nicely organized and the professor is clear in articulating the black letter rules. We sometimes watched short films demonstrating the rules.",
      "Highly recommend if you love all the hypos in 1L Civ Pro! Prof. Schulman is super clear and organized. Lots of film clips and trial recordings to lift your spirit at 8 am. Exam is hard but you'll be fine if you follow her lecture.",
      "Schulman is great, well-organized, clear, and accessible… I do not think this needed to be a 4-credit course though — sometimes she goes too much into details about facts of cases — but I would still recommend if you want to do litigation and learn evidence well!",
    ],
    tips:["Exam was around 18 short questions, pretty much going over all the important rules. I thought it was pretty difficult.","Remember & understand all the hearsay rules (to the extent that you don't need to look at the outline) + do sample exam = H is possible though not guaranteed.","A little like a typing contest but if you learn the rules well, start early to make a great outline, and do some practice exams you will be fine."],
    bid:["High. Popular class very full","I bid it first."] },
  ev_w:  { avg:null, n:0, comments:["Crim-focused, organized, clear."], tips:[], bid:[] },
  co_sp: { avg:5.0, n:3,
    comments:[
      "Spamann is genius (just search how many degrees he has) and one of the most effective, thought-provoking, hilarious professors I have ever met. There are few, if any, old-fashioned court cases; instead, professor explains economic/political rationale behind corporate law and assigns HBS-like case studies — you will act as the Unocal board and come up with anti-takeover strategies yourself, which is a lot of fun.",
      "Spamann is extremely smart. He expects everybody to be prepared and not being able to answer his cold calls can be a little embarrassing. Attendance is expected. But his class is fascinating and if you really want to learn stuff, take his corporation!",
      "Main topic is corporate fiduciary duty. Have a good outline and you'll be fine. Light reading but heavy exercise/case studies.",
    ],
    tips:["Multiple choice and 2 short essays (not policy heavy, more like issue spotter but not quite).","Short doctrinal questions, issue spotter-like questions that are open-ended and focus on legal/business questions the board faces."],
    bid:["Extremely popular. Perhaps now it's easier to bid because his popularity has convinced him to teach two corporations classes each year."] },
  co_fr: { avg:5.0, n:1,
    comments:[
      "No cold calls and very entertaining in class. Fried is a very funny lecturer, especially the way he interacts with LLM students with preconceived notions about corporate law in other countries. He also covers the doctrine in a clear way, and makes his own (short) readings, so the 'textbook' is free!",
      "Fried is without a doubt one of the most laid-back professors at HLS. He has great subject matter knowledge, yet he does not take himself too seriously. He has a healthy amount of cynicism regarding the topic he teaches. He never cold calls. Some may complain that his pace is too slow, but if you are engaged with the material and actively participate, you can get a lot out of the course.",
      "My friend asked about the rule of the duty of loyalty and Fried said something like: 'This is not a rule-based class. You don't need to know the rule. I want you to understand the boardroom dynamics.' If you don't want to bog down with a rule chart and are remotely interested in corporations, do it with Fried.",
    ],
    tips:["MCs, issue spotters and a policy question. The MCs require a good grasp of how the basic concepts work. Paying attention to Fried's own views on the subject area might be a way to differentiate. He tends to be free market/pro-flexibility. I also made a joke or two, echoing his cynicism about corporate law — that worked.","Short essay questions. He will ask in the final exam if you disagree with any of his claims made in class. It helps to note his claims in your class notes."],
    bid:["Very popular","I don't recall anyone complaining about not being able to take his class."] },
  taw:   { avg:5.0, n:2,
    comments:[
      "Great J-term class! Many amazing practitioners will come in to advise you on your trial work, and often they give very on-point feedback. The class is definitely intensive, but because it's not graded, the only pressure comes from you not wanting to look unprepared in front of your peers. I certainly felt like I learned a lot of trial skills. This course also made me really excited about doing trial work in the future.",
      "Echo everything Lucy said. I thought it was indeed somewhat intense/stressful, and the 2–9 schedule made it feel exhausting at times, but the feedback was just invaluable. Learned so much from all the trial lawyers/judges. Despite the intense schedule, I still think it's one of the best classes I took at HLS.",
    ],
    tips:["No exam. Only two mock trials, but the class is credit/fail."],
    bid:["I bid it 4th and got in directly."] },
  sp_bk: { avg:5.0, n:10,
    comments:[
      "Great professor! Worth taking it even if you have zero interest in practicing as a Bankruptcy lawyer. You will generally be cold called 1–4 times during the entire semester. Plenty of good outlines online so you won't miss much even if you decide not to take notes. But BE AWARE that attendance is expected.",
      "Roe is extremely organized, clear, and concise — a very rare quality at HLS, especially for transactional law professors. There's not a lot of readings. For those who do not like to read long-winded judicial opinions but enjoy extracting rules from each case, this class is for you.",
      "Lectures can be really entertaining sometimes. Very solid coverage of bankruptcy code and economic rationale behind each doctrine. If you like corporate finance and corporate governance from Corporations you should really like this class. Along with Taxation, Bankruptcy will really help your understanding of corporate transactions.",
      "Cold call policy is quite random and doesn't matter much to the final grade. The course material is extremely useful as long as your future work touches upon debt. Highly recommended for people who want to do corporate even if you don't want to do bankruptcy specifically.",
    ],
    tips:["Rumors say that he gives LPs, but you will have to really try to screw up to get one. The exam is fairly standard. If you have a good understanding of the code, you can get a good grade.","Multiple choice questions + issue spotter. Easy H in my opinion because no policy question — if you take the time to really understand the rules and cases it's easy to stand out.","Past exams are super helpful since his exams follow pretty similar format. There are some really comprehensive outlines out there as well."],
    bid:["popular, need to bid in the top 3 positions.","No need to rank very high — there were empty seats after the drop-add period."] },
  sp_cp: { avg:4.5, n:3,
    comments:[
      "Best course I've taken at HLS. Fisher is an amazing lecturer, and really cares about covering the emerging doctrines and theories behind recent cases. Instead of assigning us to read a casebook, he re-publishes all the recent decisions online. A lot of his examples relate to artworks, music (e.g., Katy Perry, Dua Lipa), design, architecture, media trend. If you are into soft IP, this class is a cannot-miss.",
      "This is a 4 credit class that only meets twice a week. For the other class, you watch Fisher's prerecorded videos on your own time. The videos are very clear on the doctrinal law, and the classes discuss the readings, more like case studies. Fisher is super nice and the classes usually offer insightful comments.",
      "One of my favorite classes at HLS. Fisher is an engaging lecturer who dives deeply not only into the doctrines but also into their rationales and the philosophical debates underlying IP law. You learn the core doctrines and rules by watching a 90-minute lecture video each week, and the classes focus on thorough discussions of case studies involving artwork, architecture, music, film, AI, etc.",
    ],
    tips:["In-class exam is an issue spotter — quite straightforward — so the paper might be the tie-breaker for most people.","8-hour take-home exam that includes an issue spotter and a policy essay."],
    bid:["There were empty seats."] },
  sp_adm_v:{ avg:4.0, n:1,
    comments:["Administrative law is obviously a really important subject, but I think the value-add on top of LegReg will depend a lot on which professor you had for LegReg. Even if you've read most of the cases before, Prof. Vermeule offers a really interesting theory of administrative law which he imbues throughout the course. He really shines at making sense of mysterious/conflicting doctrine. No cold calls my year, which admittedly made it a bit difficult to stay on top of the class."],
    tips:["3 hour exam with unpredictable format. Past exams may be representative, but he's changed the format a bit over the years."],
    bid:["Rank it 1 or 2; it's a big class but you will not get in if you rank it below 3."] },
  sp_adm_b:{ avg:null, n:0, comments:[], tips:[], bid:[], note:"Block teaches from a regulatory policy + executive power lens. Take-home exam." },
  sp_col: { avg:4.5, n:1,
    comments:["Sachs is a new hire from Duke. This class is very different from Singer's COL — doctrine-heavy. We re-learned a lot of CivPro cases, but from the perspective of COL. He covers a lot of content in one session, so speed-typing would be helpful. He grades cold calls, but it's more of a hit-or-miss situation."],
    tips:["Grade based on papers and moot court oral exercises. No exam."], bid:[] },
  sp_1a:  { avg:null, n:0,
    comments:["Be the judge for yourself. My year, the exam question was: 'In class, at least twice, I've asked how to fit together the developments in First Amendment law and argument studied in the first part of the semester and those studied in the second part. That is what I'm asking now. Please describe, with reference to specific cases, the developments you are addressing and why my question is, at least initially, a puzzling one.'"],
    tips:[], bid:[], note:"Parker comes from the critical legal studies tradition; analysis is more structural than technical. No cold calls." },
  f1a_fe: { avg:5.0, n:1,
    comments:["Feldman is a brilliant lecturer in my opinion (and less controversial in the classroom than he is as a person). Not super focused on doctrines (to be fair 1A is also a doctrinal mess) but there are a lot of interesting discussions about philosophy, legal history, ethics, and SCOTUS gossips. Would recommend if you're interested in 1A and/or con law in general."],
    tips:["8 hour exam with a 1,450 word limit so it's a bit of a wild card."],
    bid:["Have to rank first."] },
  f1a_we: { avg:null, n:0,
    comments:["This class was okay. Weinrib is a decent lecturer but she tends to squeeze too much material into each class — but also 1A doctrine is just confusing in the first place. You're on panel every other week and have to write a comment each time you're on panel."],
    tips:[], bid:[] },
  f_sex:  { avg:4.5, n:1,
    comments:["I found the class to be quite interesting since MacKinnon is such an icon on this topic; the class is basically her universe of sex equality, and students are not really welcomed to challenge that. There's limited space for discussions and interactions in class, but she seems to be accessible during office hours. Workload is definitely on the heavy end given it's a 3-credit course taking half of a semester."],
    tips:["A two-day take home or 3 × 1,000-word papers."],
    bid:["Initially might have a waitlist but it moves pretty fast."] },
  f_fl:   { avg:null, n:0, comments:[], tips:[], bid:[], note:"Saris (federal judge): writing skills focus, accessible professor. Good candidate for professional writing requirement." },
  f_emp:  { avg:4.5, n:2,
    comments:[
      "Very clear and organized. Helpful if you are interested in the topic, not that enjoyable if you are not. Prof is nice and cold calls require details. Lots of chances to volunteer and discuss policies.",
      "I love Sachs. He's a great lecturer, engages with issues critically and from multiple perspectives (even though he certainly has his own strong opinions) and clearly cares a lot about his students. There are also plenty of outlines that basically have everything he says in class.",
    ],
    tips:[], bid:["Plenty of vacancies."] },
  f_gi:   { avg:5.0, n:1,
    comments:["I highly recommend this seminar if you're interested in the topic. Chen is extremely clear in explaining doctrine and also leads insightful discussions about activism and advocacy that apply to a wide range of social issues. You'll learn a lot more in this class than the generic 4-credit BLL classes and really engage with the material. The reading is on the high side though."],
    tips:["You only have to do a few response papers and a slightly longer (only 1,000 word) final paper."],
    bid:[] },
  f_ca:   { avg:4.0, n:2,
    comments:[
      "A practical class to get hands-on experience of being a class action litigant. Four writing assignments throughout the semester (opening brief, opposing brief, response to opposing brief, ruling). Readings are heavy and cover most important class action cases. Class is dry but the writing process is rewarding.",
      "The class teaches both class action doctrines and legal writing. Clary tries to assign only the relevant excerpts, so the overall amount of readings is manageable. No cold call but class participation is part of the grade. Each writing assignment is 8 or 10 pages double spaced, closed-universe. Getting comments/edits on briefs from an experienced litigator is very helpful. Also provides multiple writing samples and Clary is a very good recommender.",
    ],
    tips:[], bid:["Very high. Only 20 people."] },
  f_cl:   { avg:4.5, n:1,
    comments:["Really enjoyed the class. An overview of complex litigation, with a focus on MDLs. Clary was the litigation chair at Cravath before he retired. He tells amazing war stories and provides practical tips. Class was well organized. No cold call. Manageable amount of reading. Cases serve only as examples, the statutes matter more. Downside is Clary could be a little dry — he tends to speak softly and slowly."],
    tips:["8 hr final, 5,000 words limit. Typical issue spotters with one short policy question. Pay attention to circuit splits and the jurisdictions mentioned in the questions, you may get bonus points there."],
    bid:[] },
  f_ctml: { avg:3.0, n:1,
    comments:["It is very clear, interesting and comprehensive, covering three topics: copyright, trademark, and trial. Good choice if you want to know all three (or soft IP) quickly in a 2-credit course. Downside is that lectures can be packed with information, since each topic is worth a separate course."],
    tips:["Focus on the key cases — no need to look at the small cases she mentioned in one sentence or two. Kind of a typing competition."],
    bid:["No need to rank high, still vacancies after add/drop."] },
  f_cci:  { avg:null, n:0,
    comments:["Super chill but insightful seminar on white collar crime. Professors are practitioners with lots of experience. They also bring in a lot of guest speakers to talk about their experience with various aspects of corporate crime. No exam, only a 10-page paper at the end. Highly recommend."],
    tips:["No exam. 10-page paper."], bid:[] },
  f_taxB: { avg:3.5, n:1,
    comments:["One of the nicest persons in the world. If you do not like answering policy questions, Brennan's taxation is your go-to course. Very detailed and well structured outlines online. Some people don't like his teaching because he speaks very quietly so sometimes it's hard to hear/understand. But with the help of the outlines you will have no trouble mastering the subject matter."],
    tips:["You will get a good grade if you take the time to study the rules and examples in the slides."],
    bid:["Waitlist cleared out my year."] },
  f_taxD: { avg:4.0, n:1,
    comments:["Quite econ and finance focused. Prof is really nice and very willing to slow down to help students process, although generally he speaks fast. Whichever professor you choose, I strongly recommend taking taxation some time at law school. It is one of the most useful courses, no matter which area of law you are interested in."],
    tips:["Class mirrors Warren's structure so consider his outlines as well. Policy heavy so no time pressure. Past exam questions sometimes recur."],
    bid:["Lots of vacancies."] },
  f_bsl:  { avg:3.25, n:2,
    comments:["A pretty easy-to-follow class that covers a wide range of basic economic topics that relate to business management. I'd actually recommend anyone who's studied economics in college NOT to take this class — you've probably learned most of the stuff this class covers.","This class is pretty straightforward for people with an econ background. We read business school case studies for reading materials, which may provide a refreshing perspective compared to traditional black letter law classes."],
    tips:[], bid:[] },
  f_bke:  { avg:5.0, n:1,
    comments:["One of the best classes I've taken at HLS. Ellias's lecture has great cadence and was never boring. The course covers the basics of the bankruptcy process with focus on Chapters 3, 5, and 11 (mostly relevant to corporate restructuring). The case law demonstrates what Ellias calls 'beautiful lawyering' among various parties fighting over assets of a distressed company in a zero-sum game."],
    tips:["Pretty standard issue spotters and policy questions."], bid:["Not difficult to get in — I got in from the waitlist."] },
  sp_mus: { avg:4.0, n:4,
    comments:[
      "One of my fav courses at HLS! Super engaging and caring prof, lots of amazing guest speakers. I loved discussions of Andrew Lloyd Webber and Taylor Swift, especially.",
      "Agree with everything April said. Fun, useful and easy H.",
      "Bavitz's teaching really does not work well for me — his teaching presumes a basic understanding of the American music industry and copyright law. Also, the class is heavily student discussion based, which can be confusing.",
      "Even coming from a copyright background, I found the discussion somewhat disorganized and difficult to follow. Some background on the American music industry would have helped.",
    ],
    tips:["Paper + canvas post."], bid:["High. I ranked it #1 or #2."] },
  sp_aml: { avg:4.0, n:2,
    comments:["Professor is very helpful. Recommend for anyone w/o finance/econ background.","Helpful for anyone without an econ background, and quite easy if you have one. The format is similar to an undergrad econ class (weekly assignments + 2 exams)."],
    tips:["Lots of practice materials, do a few of them and you'll be fine."], bid:["I ranked it third."] },
  sp_a2j: { avg:null, n:0, comments:[], tips:["Blog posts instead of a long final paper. Students contribute three substantive posts to the Access to Justice Lab's blog."], bid:[], note:"Easy H. Great for those interested in access to civil justice." },
  sp_crl: { avg:null, n:0, comments:[], tips:[], bid:[], note:"Michelman — civil rights litigation. Directly relevant to litigation track." },
  clinicConsumer: { avg:4.0, n:1,
    comments:["The seminar is informal and conversational. Clinical work is fun but occasionally intense. A lot of opportunities to interact with clients. Fair amount of chances to do oral argument in court (most likely in the small claims session). Chances to write complaint, dispositive motions, and sometimes do discovery related work. Depositions are rare. The two supervisors are knowledgeable and very nice, but often hands-off, so you really have to be in charge of all your cases. Great opportunity for people interested in litigation."],
    tips:["The seminar has no exam. One final paper and presentation, could be on anything consumer-protection related."],
    bid:["Didn't place it as #1."] },
  clinicCyber: { avg:4.0, n:2,
    comments:[
      "I didn't like the cyberlaw clinic much because I didn't work well with my supervisor. However, my peers generally had a good time and Chris Bavitz is an incredible professor. The seminar is not uninteresting.",
      "Your project and supervisor can make or break the experience. Make sure to fill out the survey as specifically as possible to get a project that you like. Relatively low stress and great learning experience.",
    ],
    tips:["Mid-semester reflection, end-of-semester reflection, 2 blog posts and a short presentation. No exam."],
    bid:["I ranked it first."] },
  clinicFedCourts: { avg:5.0, n:1,
    comments:["Highly recommend! Students apply for and complete an externship at a federal court anywhere in the country (in person during J term and remote in the spring), with HLS covering housing and travel expenses. Great way to escape Cambridge in January — I externed at SDNY and had an amazing experience drafting opinions and going to hearings/trials for many very, very interesting cases."],
    tips:["The clinic includes a seminar in the spring, which requires two reflection papers (2 pages) and a final paper (10 pages). The professor was busy and flexible with the deadline."],
    bid:["Very competitive. Even ranking it #1 does not guarantee a spot."] },
  clinicJudicial: { avg:5.0, n:1,
    comments:["Clinical placement is a judicial internship at a trial court in Boston. You can choose federal or state. I was at MA superior court with Judge Sarah Ellis. Very rewarding experience. Wrote a couple memos/draft opinions for the judge. Observed lots of cool trials/hearings. Learned a ton. Definitely one of my favorite classes at HLS. The clinical seminar invites lots of guest speakers such as judges from different courts."],
    tips:["3 very short (1–2 page) reflection papers + final reflection or final paper. Very easy H."],
    bid:["Bid high."] },
  clinicCrimPros: { avg:5.0, n:1,
    comments:["Clinical placement is in one of the DA's offices around Massachusetts. Students would usually have the chance to perform arraignments, pleas, jury trials, and other tasks associated with standing for cases. They would also observe prosecutors and second-chair trials. Corrigan's seminar is super chill and he makes a lot of allowances if you're busy in court. Highly recommend if you're looking for lots of hands-on trial experience."],
    tips:[], bid:["I bid #1, but it's probably not too competitive."] },
  sugg_patentTrial: { avg:5.0, n:1,
    comments:["Highly recommend. It's like a relaxed version of TAW. The course is organized as a mock trial. You will go through the whole process of deposition, hearing, motion, cross/direct examination, oral argument etc. You will be arguing in front of real Fed Cir judges and there will be a jury. I learned tons of practical stuff."],
    tips:["No exam. The grade is based on your writing and mock trial performance."],
    bid:["I ranked it #5, then waited a while to get off the wl."] },
  sugg_fedCourts: { avg:5.0, n:2,
    comments:[
      "Highly recommend. Goldsmith teaches very clearly and effectively. Very thorough analysis of SCOTUS cases. It's like a combination of Con law and advanced Civ Pro. He assigns a lot of readings and expects everybody to work on it. He calls everyone 1–2 times per semester with 1 free pass.",
      "Tough class but very well-taught. I probably learned more there than I did anywhere else at HLS, and it made me revisit some cases with a more critical eye. The limits of what Art. III courts can/cannot do are articulated in the Constitution, conferred by statute, and interrogated in courts. 'Do not confuse the necessary with the familiar.'",
    ],
    tips:["4hr in-class exam with issue-spotters. Not easy to get an H.","3.5 hour exam, very tough — borderline demoralizing."],
    bid:["Bid high.","I ranked it first and was initially #40 on the waitlist. Others who ranked it first were #70, for context."] },
  sugg_compCon: { avg:5.0, n:1,
    comments:["Great class! Professor doesn't cold call so there's no real need to do the readings. I learned a lot about the constitutional law in various countries. The breadth was also wide, covering topics that's not as ostensibly important in American law, but may be consequential (like how democracies die)."],
    tips:["All MC, take good notes in class and compare notes with friends."], bid:[] },
  sugg_massMedia: { avg:3.5, n:1,
    comments:["Professor is VP and deputy GC at NYT. Great war stories, fascinating guest speakers (Pulitzer winners etc), nice introduction to the freedom of expression with many real life examples. However, readings are long and not well excerpted. Doctrines are organized in a weird way. Sometimes a little too many sidetracks, which makes the class hard to follow if you are not familiar with politics or news in general."],
    tips:["3 hr issue spotter + short answers + 1 policy essay, no word limit. He discloses the topic of the policy question in advance, so think it through and be prepared. Sort of an easy H."],
    bid:["Bid high."] },
  sugg_fashionLaw: { avg:4.5, n:2,
    comments:[
      "Recommended even if you are not interested in the fashion industry (like me). A good introduction course with concentrated topics, including sustainability, IP rights, and ethics.",
      "非常推荐，尤其如果对fashion industry或者cultural industry感兴趣。很多课有很多有趣的speaker，包括celebrities，他们会带来很多关于这个行业的独特体验和思考。考核内容也很轻松，两篇blog加一篇15页左右paper。拿H概率较高。",
    ],
    tips:["Two blogs + ~15 page paper. High chance of H."], bid:[] },
  sugg_antitrust: { avg:5.0, n:1,
    comments:["Excellent professor. Very clear about course material, interesting and engaging in class, and makes a confusing field of law easy to understand for beginners in antitrust with no economics background. No cold calls. He calls on volunteers. Also only 3 credits."],
    tips:["Three hour closed book exam. Competitive but manageable."], bid:["I ranked it pretty high."] },
  sugg_employDisc: { avg:3.0, n:2,
    comments:[
      "Pretty doctrinal — teacher lectures by going through a few cases each class. Teacher is a plaintiff's side litigator, very nice. Primarily about Title VII.",
      "I would recommend: each class's structure and connections aren't always super clear, so it's helpful to find another professor's outline or supplement to organize the structure. Be conscious of keeping the statutory language in front of you.",
    ],
    tips:["8-hour take-home. Follows a somewhat consistent pattern (issue spotter + short answers + essay + book review). Not an 'easy H.'"], bid:[] },
  sugg_stateAG: { avg:4.0, n:1,
    comments:["You will be working in Mass AG and will be assigned to a department of your interests. I was in the trial department and liked it a lot: mostly defending the state government in tort and civil rights cases. Others have been assigned to constitutional litigation / criminal law / antitrust, etc. Workload is light but you need to commute to the office."],
    tips:[], bid:[] },
};

const starColor = avg => !avg ? "#9ca3af" : avg >= 4.5 ? "#16a34a" : avg >= 3.5 ? "#d97706" : "#dc2626";

function EvalCard({ evalId, label }) {
  const [open, setOpen] = useState(false);
  const ev = E[evalId];
  if (!ev) return null;
  const hasData = ev.comments.length > 0 || ev.tips.length > 0 || ev.bid.length > 0 || ev.note;
  const starStr = ev.avg ? `★${ev.avg}` : "★?";
  return (
    <div style={{marginTop:4, marginLeft:8}}>
      <button onClick={() => setOpen(o=>!o)} style={{
        fontSize:9.5, border:"none", cursor:"pointer", padding:"2px 6px", borderRadius:4,
        background: open ? "#1e40af" : "#eff6ff", color: open ? "#fff" : "#1e40af", fontWeight:600,
        display:"inline-flex", alignItems:"center", gap:4,
      }}>
        <span style={{color: open ? "#fde68a" : starColor(ev.avg)}}>{starStr}</span>
        {ev.n > 0 && <span style={{opacity:.8}}>({ev.n})</span>}
        <span>{open ? "▲ hide" : `▼ ${label||"eval & tips"}`}</span>
      </button>
      {open && (
        <div style={{background:"#f8fafc", border:"1px solid #bfdbfe", borderRadius:6, padding:"8px 10px", marginTop:3, fontSize:11, lineHeight:1.55}}>
          {ev.note && <div style={{color:"#374151", marginBottom:6, fontStyle:"italic"}}>{ev.note}</div>}
          {ev.comments.map((c,i) => (
            <div key={i} style={{marginBottom:6, borderLeft:"2px solid #93c5fd", paddingLeft:7, color:"#1e3a8a"}}>
              "{c}"
            </div>
          ))}
          {ev.tips.length > 0 && <div style={{marginTop:4}}>
            <div style={{fontWeight:700, color:"#374151", marginBottom:3}}>📋 Exam / class tips:</div>
            {ev.tips.map((t,i) => <div key={i} style={{color:"#374151", marginBottom:3, paddingLeft:6, borderLeft:"2px solid #fbbf24"}}>"{t}"</div>)}
          </div>}
          {ev.bid.length > 0 && <div style={{marginTop:4}}>
            <div style={{fontWeight:700, color:"#374151", marginBottom:2}}>🎯 Bidding:</div>
            {ev.bid.map((b,i) => <div key={i} style={{color:"#6b7280", fontSize:10.5}}>{b}</div>)}
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
    evalId:"sugg_fedCourts", c:{bg:"#e0f2fe",bd:"#0284c7",tx:"#0c4a6e"},
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
    evalId:"clinicJudicial", c:{bg:"#ecfccb",bd:"#65a30d",tx:"#365314"},
    why:"Trial Work (hands-on)",
    pitch:"Judicial externship at a trial court in Boston (federal or state). 'Definitely one of my favorite classes at HLS.' You draft opinions and attend hearings/trials daily. Very easy H. Counts for pro bono. Directly on your trial track.",
  },
  {
    key:"sug_mass_media", name:"Mass Media Law", prof:"McCraw (NYT GC)", cr:3, term:"Fall",
    evalId:"sugg_massMedia", c:{bg:"#fef3c7",bd:"#d97706",tx:"#713f12"},
    why:"Entertainment + 1A",
    pitch:"Taught by the deputy GC of the New York Times with Pulitzer-winning guest speakers. Covers freedom of expression through real cases — prior restraint, national security, defamation, press access. 'War stories' + 1A doctrine. Sort of an easy H if you prepare the disclosed policy question.",
  },
  {
    key:"sug_comp_con", name:"Comparative Constitutional Law", prof:"Lessig", cr:3, term:"Spring",
    evalId:"sugg_compCon", c:{bg:"#fee2e2",bd:"#dc2626",tx:"#7f1d1d"},
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
  blue:   {bg:"#dbeafe",bd:"#2563eb",tx:"#1e3a8a"},
  green:  {bg:"#dcfce7",bd:"#16a34a",tx:"#14532d"},
  violet: {bg:"#ede9fe",bd:"#7c3aed",tx:"#4c1d95"},
  red:    {bg:"#fee2e2",bd:"#dc2626",tx:"#7f1d1d"},
  amber:  {bg:"#fef3c7",bd:"#d97706",tx:"#713f12"},
  orange: {bg:"#ffedd5",bd:"#ea580c",tx:"#7c2d12"},
  sky:    {bg:"#e0f2fe",bd:"#0284c7",tx:"#0c4a6e"},
  indigo: {bg:"#e0e7ff",bd:"#4338ca",tx:"#312e81"},
  gray:   {bg:"#f3f4f6",bd:"#6b7280",tx:"#1f2937"},
  pink:   {bg:"#fce7f3",bd:"#db2777",tx:"#831843"},
  lime:   {bg:"#ecfccb",bd:"#65a30d",tx:"#365314"},
  teal:   {bg:"#ccfbf1",bd:"#0d9488",tx:"#134e4a"},
  emerald:{bg:"#d1fae5",bd:"#059669",tx:"#064e3b"},
  rose:   {bg:"#ffe4e6",bd:"#e11d48",tx:"#881337"},
  cyan:   {bg:"#cffafe",bd:"#0891b2",tx:"#164e63"},
  yellow: {bg:"#fefce8",bd:"#ca8a04",tx:"#713f12"},
  fuchsia:{bg:"#fdf4ff",bd:"#a21caf",tx:"#4a044e"},
};

const DAYS=["Mon","Tue","Wed","Thu","Fri"];

// ── COURSES ───────────────────────────────────────────────────────────────────
const C = {
  ev_m:  {key:"ev_m",  name:"Evidence",     prof:"Medwed",    cr:3, days:["Thu","Fri"],      s:"10:30",e:"12:00", c:K.blue},
  ev_s:  {key:"ev_s",  name:"Evidence",     prof:"Schulman",  cr:4, days:["Mon","Tue"],       s:"8:00", e:"10:00", c:K.blue},
  ev_w:  {key:"ev_w",  name:"Evidence",     prof:"Whiting",   cr:4, days:["Mon","Tue"],       s:"10:15",e:"12:15", c:K.blue},
  co_sp: {key:"co_sp", name:"Corporations", prof:"Spaaman",   cr:4, days:["Wed","Thu","Fri"], s:"8:30", e:"9:50",  c:K.green},
  co_fr: {key:"co_fr", name:"Corporations", prof:"Fried",     cr:4, days:["Wed","Thu","Fri"], s:"13:30",e:"15:30", c:K.green},
  taw:   {key:"taw",   name:"Trial Advocacy Workshop", prof:"Harden", cr:3, days:DAYS, s:"14:00",e:"21:00", c:K.gray},
  f_adm: {key:"f_adm", name:"Admin Law",    prof:"Freeman",   cr:4, days:["Wed","Thu"],       s:"13:30",e:"15:30", c:K.red},
  f_bke: {key:"f_bke", name:"Bankruptcy",   prof:"Elias",     cr:4, days:["Mon","Tue"],       s:"10:15",e:"12:15", c:K.violet},
  f_1afe:{key:"f_1afe",name:"1st Amendment",prof:"Feldman",   cr:4, days:["Tue","Fri"],       s:"10:15",e:"12:15", c:K.indigo},
  f_1awe:{key:"f_1awe",name:"1st Amendment",prof:"Weinrib",   cr:4, days:["Mon","Tue"],       s:"13:30",e:"15:30", c:K.indigo},
  f_sex: {key:"f_sex", name:"Sex Equality", prof:"MacKinnon", cr:3, days:["Mon","Tue"],       s:"10:15",e:"11:45", c:K.pink},
  f_sexA:{key:"f_sexA",name:"Adv Sex Equality",prof:"MacKinnon",cr:2,days:["Mon","Tue"],      s:"13:30",e:"15:30", c:K.pink},
  f_fl:  {key:"f_fl",  name:"Facts & Lies", prof:"Saris",     cr:2, days:["Wed"],             s:"15:45",e:"17:45", c:K.orange},
  f_ec:  {key:"f_ec",  name:"Engaging China",prof:"Alford",   cr:2, days:["Mon","Tue"],       s:"18:00",e:"20:00", c:K.red},
  f_aa:  {key:"f_aa",  name:"Asian Am & Law",prof:"Lee",      cr:2, days:["Tue"],             s:"15:45",e:"17:45", c:K.amber},
  sp_adm_v:{key:"sp_adm_v",name:"Admin Law",prof:"Vermeule", cr:4, days:["Wed","Thu"],        s:"13:30",e:"15:30", c:K.red},
  sp_adm_b:{key:"sp_adm_b",name:"Admin Law",prof:"Block",    cr:3, days:["Tue","Wed"],        s:"15:45",e:"17:15", c:K.red},
  sp_bk: {key:"sp_bk", name:"Bankruptcy",   prof:"Roe",      cr:4, days:["Mon","Tue","Wed"],  s:"10:30",e:"11:50", c:K.violet},
  sp_cp: {key:"sp_cp", name:"Copyright",    prof:"Fisher",   cr:4, days:["Mon","Tue","Wed"],  s:"10:30",e:"11:50", c:K.sky},
  sp_col:{key:"sp_col",name:"Conflict of Laws",prof:"Sachs", cr:3, days:["Mon","Tue"],        s:"13:40",e:"15:10", c:K.emerald},
  sp_1a: {key:"sp_1a", name:"1st Amendment",prof:"Parker",  cr:4, days:["Mon","Tue"],         s:"15:45",e:"17:45", c:K.indigo},
};

const FALL_TBD=[
  {key:"f_cl",  name:"Complex Litigation",          prof:"Clary",      cr:2, c:K.cyan,   evalId:"f_cl"},
  {key:"f_ica", name:"Intl Commercial Arbitration", prof:"Banifatemi", cr:2, c:K.teal,   evalId:null},
  {key:"f_emp", name:"Employment Law",              prof:"Sachs",      cr:4, c:K.rose,   evalId:"f_emp"},
  {key:"f_cci", name:"Corporate Criminal Invest.",  prof:"Kahn/Tsao",  cr:2, c:K.fuchsia,evalId:"f_cci"},
  {key:"f_ctml",name:"Copyright & TM Litigation",  prof:"Cendali",    cr:2, c:K.sky,    evalId:"f_ctml"},
  {key:"f_ca",  name:"Class Actions",              prof:"Clary",      cr:2, c:K.cyan,   evalId:"f_ca"},
  {key:"f_cp",  name:"Criminal Procedure",         prof:"Fidler",     cr:3, c:K.amber,  evalId:null},
  {key:"f_bn",  name:"Business Negotiations",      prof:"Coakley",    cr:3, c:K.lime,   evalId:null},
  {key:"f_taxB",name:"Taxation",                   prof:"Brennan",    cr:4, c:K.yellow, evalId:"f_taxB"},
  {key:"f_taxD",name:"Taxation",                   prof:"Desai",      cr:4, c:K.yellow, evalId:"f_taxD"},
  {key:"f_gi",  name:"Gender Identity & Sex Orientation",prof:"Chen",cr:2, c:K.fuchsia, evalId:"f_gi"},
  {key:"f_dpl", name:"Drug Product Litigation",    prof:"Grossi",     cr:3, c:K.orange, evalId:null},
  {key:"f_bsl", name:"Business Strategy for Lawyers",prof:"Spier",   cr:3, c:K.teal,   evalId:"f_bsl"},
  {key:"f_sct", name:"U.S. Supreme Court",         prof:"Sunstein",   cr:2, c:K.violet, evalId:null},
];

const SP_TBD=[
  {key:"sp_chl",name:"Comparative Law: China",    prof:"Alford",    cr:4, c:K.red,    evalId:null},
  {key:"sp_a2j",name:"Access to Justice Lab",     prof:"Greiner",   cr:2, c:K.lime,   evalId:"sp_a2j"},
  {key:"sp_fam",name:"Family Law",                prof:"Gersen",    cr:4, c:K.pink,   evalId:null},
  {key:"sp_lab",name:"Labor Law",                 prof:"Sachs",     cr:4, c:K.rose,   evalId:null},
  {key:"sp_mus",name:"Music & Digital Media",     prof:"Bavitz",    cr:2, c:K.sky,    evalId:"sp_mus"},
  {key:"sp_awa",name:"Advanced Written Advocacy", prof:"Clary",     cr:2, c:K.cyan,   evalId:null},
  {key:"sp_imm",name:"Immigration Law",           prof:"Neuman",    cr:3, c:K.amber,  evalId:null},
  {key:"sp_aml",name:"Analytical Methods",        prof:"Spier",     cr:2, c:K.teal,   evalId:"sp_aml"},
  {key:"sp_lf", name:"Litigation Funding",        prof:"Steinitz",  cr:2, c:K.fuchsia,evalId:null},
  {key:"sp_crl",name:"Civil Rights Litigation",   prof:"Michelman", cr:3, c:K.indigo, evalId:"sp_crl"},
  {key:"sp_cdn",name:"Constitutional Dimensions", prof:"Jackson",   cr:1, c:K.violet, evalId:null},
  {key:"sp_oba",name:"The Obama Presidency",      prof:"Mack",      cr:1, c:K.teal,   evalId:null},
];

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
const CAL_S=7*60+30, CAL_E=21*60, CAL_H=560;
const yOf=m=>((toMin(m)-CAL_S)/(CAL_E-CAL_S))*CAL_H;
const hOf=(s,e)=>Math.max(((toMin(e)-toMin(s))/(CAL_E-CAL_S))*CAL_H,14);

function Calendar({courses,tawActive}){
  const byDay={};
  DAYS.forEach(d=>byDay[d]=[]);
  courses.forEach(c=>{c?.days?.forEach(d=>byDay[d]?.push(c))});
  const hrs=Array.from({length:14},(_,i)=>i+7);
  return(
    <div style={{display:"flex",height:CAL_H+22,fontSize:10.5,userSelect:"none",flexShrink:0}}>
      <div style={{width:24,position:"relative",flexShrink:0,paddingTop:20}}>
        {hrs.map(h=><div key={h} style={{position:"absolute",top:yOf(`${h}:30`)+20,right:2,color:"#9ca3af",fontSize:8.5}}>{h===12?"12p":h<12?h+"a":(h-12)+"p"}</div>)}
      </div>
      {DAYS.map(day=>(
        <div key={day} style={{flex:1,borderLeft:"1px solid #e5e7eb",position:"relative",minWidth:0,overflow:"hidden"}}>
          <div style={{textAlign:"center",fontWeight:700,color:"#374151",height:20,lineHeight:"20px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",fontSize:9.5}}>{day}</div>
          {tawActive&&<div style={{position:"absolute",top:yOf("14:00"),height:hOf("14:00","21:00"),left:0,right:0,background:"rgba(107,114,128,.05)",borderTop:"1px dashed #d1d5db",pointerEvents:"none"}}/>}
          {hrs.map(h=><div key={h} style={{position:"absolute",top:yOf(`${h}:00`),left:0,right:0,borderTop:h%2===0?"1px solid #f0f0f0":"1px dashed #fafafa"}}/>)}
          {byDay[day].map((c,i)=>(
            <div key={c.key+day+i} title={`${c.name} (${c.prof})\n${c.s}–${c.e}`}
              style={{position:"absolute",top:yOf(c.s),height:hOf(c.s,c.e),left:1,right:1,
                background:c.c.bg,borderLeft:`3px solid ${c.c.bd}`,borderRadius:3,
                padding:"2px 3px",overflow:"hidden",color:c.c.tx,boxShadow:"0 1px 2px rgba(0,0,0,.07)",cursor:"default"}}>
              <div style={{fontWeight:700,fontSize:8.5,lineHeight:1.2}}>{c.name}</div>
              <div style={{opacity:.7,fontSize:8}}>{c.prof}</div>
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
  const ev = E[evalId]; if(!ev) return null;
  const col = starColor(ev.avg);
  return <span style={{fontSize:9.5,fontWeight:700,color:col,marginLeft:4}}>{ev.avg?`★${ev.avg}`:"★?"}{ev.n>0?` (${ev.n})`:""}</span>;
}

function Option({type,value,cur,set,label,sub,c,evalId,warn,locked,noteKey}){
  const sel = type==="radio"?(cur===value):cur;
  const nk = noteKey !== undefined ? noteKey : (type==="radio" ? value : null);
  return(
    <div style={{marginBottom:4}}>
      <label style={{display:"flex",alignItems:"flex-start",gap:5,cursor:locked?"default":"pointer",
        padding:"4px 6px",borderRadius:5,
        background:sel?(warn?"#fff7ed":"#eff6ff"):"transparent",
        border:sel?(warn?"1px solid #fed7aa":"1px solid #bae6fd"):"1px solid transparent",
        opacity:locked?.45:1}}>
        {type==="radio"
          ? <input type="radio" checked={sel} onChange={()=>!locked&&set(value)} disabled={locked} style={{marginTop:2,flexShrink:0}}/>
          : <input type="checkbox" checked={sel} onChange={e=>!locked&&set(e.target.checked)} disabled={locked} style={{marginTop:2,flexShrink:0}}/>}
        {c&&<Dot c={c}/>}
        <span style={{fontSize:11.5}}>
          <span style={{fontWeight:600}}>{label}</span>
          {evalId && <StarBadge evalId={evalId}/>}
          {sub&&<><br/><span style={{color:warn?"#92400e":"#6b7280",fontSize:10.5}}>{sub}</span></>}
        </span>
      </label>
      {evalId && <EvalCard evalId={evalId}/>}
      {nk&&window.__hlsSetNote&&<NoteField courseKey={nk}/>}
    </div>
  );
}

function Sect({title,must,children}){
  return(
    <div style={{marginBottom:12,borderLeft:`3px solid ${must?"#f87171":"#e5e7eb"}`,paddingLeft:9}}>
      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
        <span style={{fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".06em"}}>{title}</span>
        {must&&<span style={{background:"#fca5a5",color:"#7f1d1d",borderRadius:10,padding:"1px 6px",fontSize:9,fontWeight:700}}>MUST</span>}
      </div>
      {children}
    </div>
  );
}

function CrBar({cr,min,max,label}){
  const over=cr>max,under=cr<min,col=over?"#dc2626":under?"#d97706":"#16a34a";
  return(
    <div style={{marginBottom:7}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:600,marginBottom:2}}>
        <span style={{color:col}}>{label}: <strong>{cr}cr</strong> {over?"⚠ OVER MAX":under?"⚠ under min":""}</span>
        <span style={{color:"#9ca3af"}}>req {min}–{max}cr</span>
      </div>
      <div style={{height:5,background:"#e5e7eb",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${Math.min(cr/max,1)*100}%`,background:col,transition:"width .3s"}}/>
      </div>
    </div>
  );
}

function ConflictBanner({conflicts,tawOk,tawHrs,tawActive}){
  const msgs=[...conflicts.map(([a,b])=>`${a.name} (${a.prof}) ↔ ${b.name} (${b.prof})`),
    ...(tawActive&&!tawOk?[`TAW overlap ${fmtHr(tawHrs)}hr/wk — exceeds 4hr limit`]:[])];
  if(!msgs.length) return <div style={{background:"#dcfce7",border:"1px solid #86efac",borderRadius:5,padding:"4px 9px",marginBottom:7,fontSize:11,color:"#166534"}}>✓ No schedule conflicts{tawActive?` · TAW overlap: ${fmtHr(tawHrs)}hr/wk`:""}</div>;
  return(
    <div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:5,padding:"6px 9px",marginBottom:7}}>
      <div style={{fontWeight:700,color:"#b91c1c",fontSize:11,marginBottom:2}}>⚠ {msgs.length} issue{msgs.length>1?"s":""}</div>
      {msgs.map((m,i)=><div key={i} style={{fontSize:10,color:"#b91c1c"}}>{m}</div>)}
    </div>
  );
}

function TBDGrid({opts,sel,toggle}){
  return(
    <div>
      <div style={{fontSize:9.5,color:"#6b7280",marginBottom:5,fontStyle:"italic"}}>Times TBD — credit count only. Check HELIOS after Apr 2026.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
        {opts.map(c=>{
          const on=sel.has(c.key);
          return(
            <div key={c.key} style={{borderRadius:4,background:on?"#eff6ff":"#f9fafb",border:on?"1px solid #bae6fd":"1px solid #e5e7eb",overflow:"hidden"}}>
              <label style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",padding:"3px 5px",fontSize:10.5,width:"100%",boxSizing:"border-box"}}>
                <input type="checkbox" checked={on} onChange={()=>toggle(c.key)} style={{flexShrink:0}}/>
                <Dot c={c.c} sz={6}/>
                <span style={{flex:1,lineHeight:1.3}}>
                  <span style={{fontWeight:600}}>{c.name}</span>
                  {c.evalId&&<StarBadge evalId={c.evalId}/>}
                  <br/><span style={{color:"#6b7280"}}>{c.prof} · </span><span style={{color:"#2563eb"}}>{c.cr}cr</span>
                </span>
              </label>
              {c.evalId&&<EvalCard evalId={c.evalId}/>}
              {window.__hlsSetNote&&<NoteField courseKey={c.key}/>}
            </div>
          );
        })}
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
        <button onClick={()=>setClinicId(null)} style={{padding:"2px 8px",borderRadius:10,fontSize:10.5,fontWeight:700,cursor:"pointer",background:!clinicId?"#374151":"#f3f4f6",color:!clinicId?"#fff":"#374151",border:"none"}}>None</button>
        {opts.map(cl=>(
          <button key={cl.id} onClick={()=>{setClinicId(cl.id);setFieldCr(cl.fMin);}}
            style={{padding:"2px 8px",borderRadius:10,fontSize:10.5,fontWeight:700,cursor:"pointer",background:clinicId===cl.id?cl.c.bd:"#f3f4f6",color:clinicId===cl.id?"#fff":"#374151",border:"none"}}>
            {cl.name}
          </button>
        ))}
      </div>
      {sel&&(
        <div style={{background:sel.c.bg,border:`1px solid ${sel.c.bd}`,borderRadius:6,padding:"7px 9px",fontSize:11}}>
          <div style={{fontWeight:700,color:sel.c.tx,marginBottom:3}}>{sel.name} Clinic {sel.evalId&&<StarBadge evalId={sel.evalId}/>}</div>
          <div style={{color:sel.c.tx,fontSize:10.5,marginBottom:5}}>{sel.note}</div>
          {sel.evalId&&<EvalCard evalId={sel.evalId} label="clinic eval"/>}
          {sel.id!=="mediation"&&sel.id!=="fedcourts"&&(
            <>
              <div style={{fontSize:10.5,fontWeight:600,color:sel.c.tx,marginBottom:3,marginTop:6}}>Fieldwork credits (+ {sel.semCr}cr seminar):</div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                {[sel.fMin,sel.fMin+1,sel.fMin+2].filter(n=>n<=sel.fMax).map(n=>(
                  <button key={n} onClick={()=>setFieldCr(n)} style={{padding:"2px 9px",borderRadius:10,fontSize:11,fontWeight:700,cursor:"pointer",background:fieldCr===n?sel.c.bd:"#fff",border:`2px solid ${fieldCr===n?sel.c.bd:sel.c.bd+"60"}`,color:fieldCr===n?"#fff":sel.c.tx}}>{n}cr</button>
                ))}
                <span style={{fontSize:10.5,color:sel.c.tx}}>= <strong>{fieldCr+sel.semCr}cr</strong> total</span>
              </div>
            </>
          )}
          {sel.id==="fedcourts"&&(
            <>
              <div style={{fontSize:10.5,fontWeight:600,color:sel.c.tx,marginBottom:3,marginTop:6}}>Spring fieldwork credits (+ 1cr seminar):</div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                {[2,3].map(n=>(
                  <button key={n} onClick={()=>setFieldCr(n)} style={{padding:"2px 9px",borderRadius:10,fontSize:11,fontWeight:700,cursor:"pointer",background:fieldCr===n?sel.c.bd:"#fff",border:`2px solid ${fieldCr===n?sel.c.bd:sel.c.bd+"60"}`,color:fieldCr===n?"#fff":sel.c.tx}}>{n}cr</button>
                ))}
                <span style={{fontSize:10.5,color:sel.c.tx}}>+ 2cr winter = <strong>{fieldCr+1+2}cr</strong> total</span>
              </div>
            </>
          )}
          {sel.id==="mediation"&&<div style={{fontSize:10.5,color:sel.c.tx,marginTop:3}}>Total: <strong>1cr</strong></div>}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const { notes, setNote } = useNotes();
  window.__hlsNotes   = notes;
  window.__hlsSetNote = setNote;

  const [tab,setTab]=useState("fall");
  const [fEv,setFEv]=useState("ev_m");
  const [fCo,setFCo]=useState("co_sp");
  const [fTAW,setFTAW]=useState(true);
  const [fAdm,setFAdm]=useState(false);
  const [fBk,setFBk]=useState(false);
  const [f1A,setF1A]=useState("none");
  const [fSex,setFSex]=useState(false);
  const [fSexA,setFSexA]=useState(false);
  const [fFl,setFFl]=useState(false);
  const [fEc,setFEc]=useState(false);
  const [fAa,setFAa]=useState(false);
  const [fTBD,setFTBD]=useState(new Set());
  const [fClinic,setFClinic]=useState(null);
  const [fField,setFField]=useState(3);
  const [wRepro,setWRepro]=useState(false);
  const [spAdm,setSpAdm]=useState("sp_adm_v");
  const [spMTC,setSpMTC]=useState("none");
  const [spCoL,setSpCoL]=useState(false);
  const [sp1A,setSp1A]=useState(false);
  const [spTBD,setSpTBD]=useState(new Set());
  const [spClinic,setSpClinic]=useState(null);
  const [spField,setSpField]=useState(3);
  const [evalSearch,setEvalSearch]=useState("");

  const clinicCrTotal=(clinicId,fieldCr)=>{
    const cl=CLINIC_OPTS.find(c=>c.id===clinicId);
    if(!cl) return 0;
    return cl.id==="mediation"?1:cl.id==="fedcourts"?fieldCr+cl.semCr:fieldCr+cl.semCr;
  };

  const fallTimed=useMemo(()=>{
    const l=[];
    if(C[fEv]) l.push(C[fEv]);
    if(C[fCo]) l.push(C[fCo]);
    if(fTAW) l.push(C.taw);
    if(fAdm) l.push(C.f_adm);
    if(fBk) l.push(C.f_bke);
    if(f1A==="feld") l.push(C.f_1afe);
    if(f1A==="wein") l.push(C.f_1awe);
    if(fSex) l.push(C.f_sex);
    if(fSexA) l.push(C.f_sexA);
    if(fFl) l.push(C.f_fl);
    if(fEc) l.push(C.f_ec);
    if(fAa) l.push(C.f_aa);
    return l;
  },[fEv,fCo,fTAW,fAdm,fBk,f1A,fSex,fSexA,fFl,fEc,fAa]);

  const fallNoTAW=fallTimed.filter(c=>c.key!=="taw");
  const fallConflicts=useMemo(()=>getConflicts(fallNoTAW),[fallNoTAW]);
  const fallTAWHrs=useMemo(()=>fTAW?fallNoTAW.reduce((s,c)=>s+tawOverlapHrsPerWeek(c),0):0,[fTAW,fallNoTAW]);
  const fallTAWOk=fallTAWHrs<=4;
  const fTBDCr=useMemo(()=>[...fTBD].reduce((s,k)=>{const c=FALL_TBD.find(x=>x.key===k);return s+(c?c.cr:0);},0),[fTBD]);
  const fClinicCr=clinicCrTotal(fClinic,fField);
  const fallCr=sumCr(fallTimed)+fTBDCr+fClinicCr;

  const useFedWinter=spClinic==="fedcourts";
  const winterCrCalc=useFedWinter?2:(!fTAW?3:(wRepro?2:0));

  const spTimed=useMemo(()=>{
    const l=[];
    if(C[spAdm]) l.push(C[spAdm]);
    if(spMTC!=="none"&&C[spMTC]) l.push(C[spMTC]);
    if(spCoL) l.push(C.sp_col);
    if(sp1A) l.push(C.sp_1a);
    return l;
  },[spAdm,spMTC,spCoL,sp1A]);

  const spConflicts=useMemo(()=>getConflicts(spTimed),[spTimed]);
  const spTBDCr=useMemo(()=>[...spTBD].reduce((s,k)=>{const c=SP_TBD.find(x=>x.key===k);return s+(c?c.cr:0);},0),[spTBD]);
  const spClinicCr=spClinic==="fedcourts"?(spField+1):clinicCrTotal(spClinic,spField);
  const springCr=sumCr(spTimed)+spTBDCr+spClinicCr;
  const annualCr=fallCr+winterCrCalc+springCr;

  const crCol=(cr,min,max)=>cr>max?"#dc2626":cr<min?"#d97706":"#16a34a";
  const TABS=["fall","winter","spring","summary","evals","suggest"];
  const TL={fall:"🍂 Fall",winter:"❄️ Winter",spring:"🌸 Spring",summary:"📋 Summary",evals:"★ Evals",suggest:"💡 Suggest"};
  const side={width:250,flexShrink:0,borderRight:"1px solid #e5e7eb",paddingRight:12,overflowY:"auto",maxHeight:"84vh"};

  const toggleF=k=>setFTBD(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});
  const toggleSp=k=>setSpTBD(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});

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

  return(
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",background:"#fff",minHeight:"100vh",padding:"10px 13px",boxSizing:"border-box"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:8}}>
        <div>
          <h2 style={{margin:0,fontSize:15,fontWeight:800,color:"#111"}}>HLS 2L Schedule Planner</h2>
          <div style={{fontSize:9,color:"#9ca3af"}}>Evidence · Corporations · Admin Law · TAW = must-take · ★ = peer rating · 📝 = your notes</div>
        </div>
        <div style={{marginLeft:"auto",textAlign:"right"}}>
          <span style={{fontSize:13,fontWeight:800,color:crCol(annualCr,24,35)}}>{annualCr}cr</span>
          <span style={{fontSize:9.5,color:"#9ca3af"}}> annual (24–35)</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"2px solid #e5e7eb",marginBottom:10,flexWrap:"wrap"}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"5px 10px",fontSize:11,fontWeight:700,border:"none",background:"none",cursor:"pointer",
            borderBottom:tab===t?"2px solid #2563eb":"2px solid transparent",
            color:tab===t?"#2563eb":"#6b7280",marginBottom:-2,display:"flex",alignItems:"center",gap:3}}>
            {TL[t]}
            {t==="fall"  &&<span style={{fontSize:9.5,fontWeight:900,color:crCol(fallCr,10,16)}}>{fallCr}</span>}
            {t==="winter"&&<span style={{fontSize:9.5,fontWeight:900,color:crCol(winterCrCalc,2,3)}}>{winterCrCalc}</span>}
            {t==="spring"&&<span style={{fontSize:9.5,fontWeight:900,color:crCol(springCr,10,16)}}>{springCr}</span>}
          </button>
        ))}
      </div>

      {/* ── FALL ── */}
      {tab==="fall"&&(
        <div style={{display:"flex",gap:11}}>
          <div style={side}>
            <Sect title="Evidence" must>
              <Option type="radio" value="ev_m" cur={fEv} set={setFEv} c={K.blue} label="Medwed · 3cr · ThF 10:30" evalId="ev_m" sub="Fun·not dry·1 cold call·recaps" noteKey="ev_m"/>
              <Option type="radio" value="ev_s" cur={fEv} set={setFEv} c={K.blue} label="Schulman · 4cr · MT 8am" evalId="ev_s" sub="Video clips·rules-focused·brutal exam" noteKey="ev_s"/>
              <Option type="radio" value="ev_w" cur={fEv} set={setFEv} c={K.blue} label="Whiting · 4cr · MT 10:15" evalId="ev_w" sub="Crim-focused·organized·hard exam" noteKey="ev_w"/>
            </Sect>
            <Sect title="Corporations" must>
              <Option type="radio" value="co_sp" cur={fCo} set={setFCo} c={K.green} label="Spaaman · 4cr · WThF 8:30" evalId="co_sp" sub="MC + essay · cold calls · not DE law" noteKey="co_sp"/>
              <Option type="radio" value="co_fr" cur={fCo} set={setFCo} c={K.green} label="Fried · 4cr · WThF 1:30" evalId="co_fr" sub="MC + policy · no cold calls · funny" noteKey="co_fr"/>
            </Sect>
            <Sect title="Trial Advocacy Workshop" must>
              <Option type="radio" value={true} cur={fTAW} set={setFTAW} c={K.gray} evalId="taw" noteKey="taw"
                label="Fall (M-F 2–9pm intensive)"
                sub={`Overlap w/ other courses: ${fmtHr(fallTAWHrs)}hr/wk · max 4hr/wk`}
                warn={!fallTAWOk}/>
              <Option type="radio" value={false} cur={fTAW} set={setFTAW} c={K.gray} label="Move to Winter" evalId={null} noteKey={null}/>
            </Sect>
            <Sect title="Admin Law — Freeman (fall)">
              <Option type="checkbox" cur={fAdm} set={setFAdm} c={K.red} label="Freeman · 4cr · WTh 1:30" evalId="sp_adm_v"
                sub={fCo==="co_fr"?"⚠ conflicts with Fried Corporations WThF":""} warn={fCo==="co_fr"} noteKey="f_adm"/>
            </Sect>
            <Sect title="Optional — Timed">
              <Option type="checkbox" cur={fBk} set={setFBk} c={K.violet} label="Bankruptcy (Elias) · 4cr · MT 10:15" evalId="f_bke" noteKey="f_bke"
                sub={(fEv==="ev_s"||fEv==="ev_w")?"⚠ conflicts with Evidence":"MT 10:15"} warn={fEv==="ev_s"||fEv==="ev_w"}/>
              <div style={{fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",margin:"5px 0 3px 0"}}>First Amendment</div>
              <Option type="radio" value="none" cur={f1A} set={setF1A} label="Skip (take Spring/Parker)" evalId={null} noteKey={null}/>
              <Option type="radio" value="feld" cur={f1A} set={setF1A} c={K.indigo} label="Feldman · 4cr · TF 10:15" evalId="f1a_fe" noteKey="f1a_fe"/>
              <Option type="radio" value="wein" cur={f1A} set={setF1A} c={K.indigo} label="Weinrib · 4cr · MT 1:30" evalId="f1a_we" noteKey="f1a_we"/>
              <div style={{fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",margin:"5px 0 3px 0"}}>MacKinnon</div>
              <Option type="checkbox" cur={fSex} set={setFSex} c={K.pink} label="Sex Equality · 3cr · condensed Sept–Oct" evalId="f_sex" noteKey="f_sex"
                sub={fSexA?"⚠ don't take both MacKinnon courses":""} warn={fSex&&fSexA}/>
              <Option type="checkbox" cur={fSexA} set={setFSexA} c={K.pink} label="Adv. Problems in Sex Equality · 2cr · MT 1:30" evalId={null} noteKey="f_sexA"
                sub={fSex?"⚠ don't take both MacKinnon courses":""} warn={fSex&&fSexA}/>
              <div style={{fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",margin:"5px 0 3px 0"}}>Seminars</div>
              <Option type="checkbox" cur={fFl} set={setFFl} c={K.orange} label="Facts & Lies (Saris) · 2cr · W 3:45" evalId="f_fl" noteKey="f_fl" sub="Prof writing req candidate"/>
              <Option type="checkbox" cur={fEc} set={setFEc} c={K.red}    label="Engaging China (Alford) · 2cr · MT 6pm" evalId={null} noteKey="f_ec"/>
              <Option type="checkbox" cur={fAa} set={setFAa} c={K.amber}  label="Asian Am & Law (Lee) · 2cr · T 3:45" evalId={null} noteKey="f_aa"/>
            </Sect>
            <Sect title="Clinic (Fall)">
              <ClinicSelector clinicId={fClinic} setClinicId={setFClinic} fieldCr={fField} setFieldCr={setFField} allowedTerms="fall"/>
            </Sect>
            <Sect title="TBD-Timed Courses">
              <TBDGrid opts={FALL_TBD} sel={fTBD} toggle={toggleF}/>
            </Sect>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <CrBar cr={fallCr} min={10} max={16} label="Fall"/>
            {fTAW&&<div style={{fontSize:11,background:fallTAWOk?"#eff6ff":"#fee2e2",border:`1px solid ${fallTAWOk?"#bae6fd":"#fca5a5"}`,borderRadius:5,padding:"3px 9px",marginBottom:6,color:fallTAWOk?"#1e40af":"#b91c1c"}}>
              TAW overlap: <strong>{fmtHr(fallTAWHrs)}hr/wk</strong> / 4hr max {fallTAWOk?"✓":"⚠ exceeded"}
            </div>}
            <ConflictBanner conflicts={fallConflicts} tawOk={fallTAWOk} tawHrs={fallTAWHrs} tawActive={fTAW}/>
            {fClinic&&<div style={{fontSize:10.5,background:"#ecfccb",border:"1px solid #a3e635",borderRadius:5,padding:"3px 8px",marginBottom:6,color:"#365314"}}>
              🏥 {CLINIC_OPTS.find(c=>c.id===fClinic)?.name} Clinic · {fClinicCr}cr · seminar time TBD
            </div>}
            {fTBD.size>0&&<div style={{fontSize:10.5,background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:5,padding:"3px 8px",marginBottom:6,color:"#0c4a6e"}}>
              📋 {fTBD.size} TBD course{fTBD.size>1?"s":""} · {fTBDCr}cr
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
            ? <div style={{background:"#ccfbf1",border:"1px solid #5eead4",borderRadius:7,padding:"10px 12px",fontSize:11}}>
                <div style={{fontWeight:700,color:"#0d9488",marginBottom:3}}>⚖️ Federal Courts Clinic — winter component</div>
                <div style={{color:"#134e4a"}}>2cr winter classroom · reserved for Fed Courts · no other winter courses</div>
                <EvalCard evalId="clinicFedCourts" label="clinic eval"/>
              </div>
            : <>
                {!fTAW&&<Sect title="Trial Advocacy Workshop" must>
                  <div style={{fontSize:11,padding:"5px 8px",background:"#f3f4f6",borderRadius:5,color:"#374151",fontWeight:600}}>TAW (Harden) · 3cr · fills winter slot</div>
                  <EvalCard evalId="taw"/>
                </Sect>}
                {fTAW&&<Sect title="Winter courses">
                  <Option type="checkbox" cur={wRepro} set={setWRepro} c={K.pink} label="Repro Rights After Dobbs (Spera) · 2cr" evalId={null} noteKey="w_repro"/>
                </Sect>}
              </>
          }
          <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:7,padding:"9px 11px",marginTop:8,fontSize:11}}>
            <strong>Winter rules:</strong> min 2cr · max 3cr · Fed Courts locks out other courses
            {winterCrCalc<2&&<span style={{color:"#dc2626"}}> ⚠ under minimum</span>}
            {winterCrCalc>3&&<span style={{color:"#dc2626"}}> ⚠ over maximum</span>}
            {winterCrCalc>=2&&winterCrCalc<=3&&<span style={{color:"#16a34a"}}> ✓</span>}
          </div>
        </div>
      )}

      {/* ── SPRING ── */}
      {tab==="spring"&&(
        <div style={{display:"flex",gap:11}}>
          <div style={side}>
            <Sect title="Admin Law" must>
              <Option type="radio" value="sp_adm_v" cur={spAdm} set={setSpAdm} c={K.red} label="Vermeule · 4cr · WTh 1:30" evalId="sp_adm_v" sub="In-class exam" noteKey="sp_adm_v"/>
              <Option type="radio" value="sp_adm_b" cur={spAdm} set={setSpAdm} c={K.red} label="Block · 3cr · TW 3:45–5:15" evalId="sp_adm_b" sub="Take-home exam · 2026-27 confirmed" noteKey="sp_adm_b"/>
            </Sect>
            <Sect title="MTW 10:30 — pick one">
              <div style={{fontSize:10,color:"#dc2626",background:"#fee2e2",borderRadius:4,padding:"2px 6px",marginBottom:4}}>Roe and Fisher share the same timeslot</div>
              <Option type="radio" value="none"  cur={spMTC} set={setSpMTC} label="Skip both" evalId={null} noteKey={null}/>
              <Option type="radio" value="sp_bk" cur={spMTC} set={setSpMTC} c={K.violet} label="Bankruptcy (Roe) · 4cr" evalId="sp_bk" noteKey="sp_bk"/>
              <Option type="radio" value="sp_cp" cur={spMTC} set={setSpMTC} c={K.sky}    label="Copyright (Fisher) · 4cr" evalId="sp_cp" noteKey="sp_cp"/>
            </Sect>
            <Sect title="Optional — Timed">
              <Option type="checkbox" cur={spCoL} set={setSpCoL} c={K.emerald} label="Conflict of Laws (Sachs) · 3cr · MT 1:40" evalId="sp_col" noteKey="sp_col" sub="No conflicts with other spring options"/>
              <Option type="checkbox" cur={sp1A} set={setSp1A} c={K.indigo}
                label="1st Amendment (Parker) · 4cr · MT 3:45" evalId="sp_1a" noteKey="sp_1a"
                sub={spAdm==="sp_adm_b"?"⚠ Block Admin TW 3:45 — Tue overlap":""}
                warn={spAdm==="sp_adm_b"}/>
            </Sect>
            <Sect title="Clinic (Spring)">
              {fClinic&&<div style={{fontSize:10.5,color:"#b91c1c",marginBottom:5}}>⚠ Already have fall clinic — max 1/term</div>}
              <ClinicSelector clinicId={spClinic} setClinicId={setSpClinic} fieldCr={spField} setFieldCr={setSpField} allowedTerms="spring"/>
            </Sect>
            <Sect title="TBD-Timed Courses">
              <TBDGrid opts={SP_TBD} sel={spTBD} toggle={toggleSp}/>
            </Sect>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <CrBar cr={springCr} min={10} max={16} label="Spring"/>
            <ConflictBanner conflicts={spConflicts} tawOk={true} tawHrs={0} tawActive={false}/>
            {spClinic&&<div style={{fontSize:10.5,background:"#ecfccb",border:"1px solid #a3e635",borderRadius:5,padding:"3px 8px",marginBottom:6,color:"#365314"}}>
              🏥 {CLINIC_OPTS.find(c=>c.id===spClinic)?.name} Clinic · {spClinicCr}cr · seminar time TBD
            </div>}
            {spTBD.size>0&&<div style={{fontSize:10.5,background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:5,padding:"3px 8px",marginBottom:6,color:"#0c4a6e"}}>
              📋 {spTBD.size} TBD course{spTBD.size>1?"s":""} · {spTBDCr}cr
            </div>}
            <Calendar courses={spTimed} tawActive={false}/>
          </div>
        </div>
      )}

      {/* ── SUMMARY ── */}
      {tab==="summary"&&(()=>{
        const fClinicObj=CLINIC_OPTS.find(c=>c.id===fClinic);
        const spClinicObj=CLINIC_OPTS.find(c=>c.id===spClinic);
        const fallItems=[C[fEv],C[fCo],fTAW?C.taw:null,fAdm?C.f_adm:null,fBk?C.f_bke:null,
          f1A==="feld"?C.f_1afe:f1A==="wein"?C.f_1awe:null,
          fSex?C.f_sex:null,fSexA?C.f_sexA:null,fFl?C.f_fl:null,fEc?C.f_ec:null,fAa?C.f_aa:null,
          ...[...fTBD].map(k=>FALL_TBD.find(x=>x.key===k)),
          fClinicObj?{...fClinicObj,name:fClinicObj.name+" Clinic",cr:fClinicCr}:null].filter(Boolean);
        const winterItems=[
          useFedWinter?{name:"Fed Courts (winter)",cr:2,c:K.teal}:null,
          !fTAW?C.taw:null,
          wRepro&&fTAW&&!useFedWinter?{name:"Repro Rights After Dobbs",cr:2,c:K.pink}:null].filter(Boolean);
        const spItems=[C[spAdm],spMTC!=="none"?C[spMTC]:null,spCoL?C.sp_col:null,sp1A?C.sp_1a:null,
          ...[...spTBD].map(k=>SP_TBD.find(x=>x.key===k)),
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
          ...(fSex&&fSexA?["Both MacKinnon courses selected — pick one"]:[]),
        ];
        const ok=!issues.length;
        return(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:11}}>
              {[{l:"🍂 Fall",cr:fallCr,min:10,max:16},{l:"❄️ Winter",cr:winterCrCalc,min:2,max:3},{l:"🌸 Spring",cr:springCr,min:10,max:16},{l:"📅 Annual",cr:annualCr,min:24,max:35}].map(({l,cr,min,max})=>{
                const ok2=cr>=min&&cr<=max;
                return(
                  <div key={l} style={{background:ok2?"#f0fdf4":"#fff7ed",border:`1px solid ${ok2?"#86efac":"#fed7aa"}`,borderRadius:7,padding:"9px",textAlign:"center"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:2}}>{l}</div>
                    <div style={{fontSize:22,fontWeight:900,color:ok2?"#16a34a":"#ea580c"}}>{cr}</div>
                    <div style={{fontSize:9,color:"#9ca3af"}}>req {min}–{max}cr</div>
                  </div>
                );
              })}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:11}}>
              {[{l:"🍂 Fall",items:fallItems},{l:"❄️ Winter",items:winterItems},{l:"🌸 Spring",items:spItems}].map(term=>(
                <div key={term.l} style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:7,padding:"9px"}}>
                  <div style={{fontWeight:800,fontSize:12,marginBottom:6}}>{term.l}</div>
                  {term.items.length===0?<div style={{color:"#9ca3af",fontSize:11}}>Nothing selected</div>
                   :term.items.map((c,i)=>(
                     <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3,fontSize:11}}>
                       <span style={{display:"flex",alignItems:"center",gap:3}}>
                         {c.c&&<span style={{width:6,height:6,borderRadius:"50%",background:c.c.bd,display:"inline-block",flexShrink:0}}/>}
                         {c.name}{c.prof?` · ${c.prof}`:""}
                       </span>
                       <span style={{color:"#6b7280",fontSize:10.5,flexShrink:0,marginLeft:3}}>{c.cr||c.credits}cr</span>
                     </div>
                   ))}
                </div>
              ))}
            </div>
            <div style={{background:ok?"#dcfce7":"#fee2e2",border:`1px solid ${ok?"#86efac":"#fca5a5"}`,borderRadius:7,padding:"9px 11px",marginBottom:11}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:ok?0:5,color:ok?"#166534":"#b91c1c"}}>
                {ok?"✓ Valid schedule":`⚠ ${issues.length} issue${issues.length>1?"s":""}`}
              </div>
              {issues.map((m,i)=><div key={i} style={{fontSize:11,color:"#b91c1c"}}>{m}</div>)}
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
              style={{flex:1,maxWidth:320,padding:"6px 10px",borderRadius:6,border:"1px solid #d1d5db",fontSize:12,outline:"none"}}/>
            <span style={{fontSize:11,color:"#6b7280"}}>{filteredEvals.length} courses</span>
          </div>
          <div style={{columns:2,columnGap:14}}>
            {filteredEvals.map(item=>{
              const ev=E[item.id];
              if(!ev) return null;
              const avg=ev.avg;
              const col=starColor(avg);
              return(
                <div key={item.id} style={{breakInside:"avoid",marginBottom:12,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:12,color:"#111"}}>{item.name}</span>
                    <span style={{fontSize:11,color:"#6b7280"}}>{item.prof}</span>
                    <span style={{marginLeft:"auto",fontWeight:700,fontSize:12,color:col}}>{avg?`★${avg}`:"★?"}</span>
                    {ev.n>0&&<span style={{fontSize:10,color:"#9ca3af"}}>n={ev.n}</span>}
                  </div>
                  {ev.note&&<div style={{fontSize:10.5,color:"#374151",fontStyle:"italic",marginBottom:5}}>{ev.note}</div>}
                  {ev.comments.map((c,i)=>(
                    <div key={i} style={{fontSize:10.5,color:"#1e3a8a",borderLeft:"2px solid #93c5fd",paddingLeft:7,marginBottom:5,lineHeight:1.5}}>
                      "{c}"
                    </div>
                  ))}
                  {ev.tips.length>0&&(
                    <div style={{marginTop:4}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#92400e",marginBottom:2}}>📋 Exam tips:</div>
                      {ev.tips.map((t,i)=><div key={i} style={{fontSize:10.5,color:"#374151",borderLeft:"2px solid #fbbf24",paddingLeft:7,marginBottom:3,lineHeight:1.5}}>"{t}"</div>)}
                    </div>
                  )}
                  {ev.bid.length>0&&(
                    <div style={{marginTop:3,fontSize:10,color:"#6b7280"}}>
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
          <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,padding:"10px 12px",marginBottom:14,fontSize:11}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>Based on your interests: litigation · trial work · gender issues · rule of law/democracy · entertainment · IP disputes</div>
            <div style={{color:"#374151"}}>These courses are not currently in your spreadsheet but are worth considering. Click "▼ eval & tips" to see direct peer quotes.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {SUGGESTIONS.map(s=>(
              <div key={s.key} style={{background:s.c.bg,border:`1px solid ${s.c.bd}`,borderRadius:8,padding:"10px 12px"}}>
                <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:3}}>
                  <span style={{fontWeight:700,fontSize:12,color:s.c.tx}}>{s.name}</span>
                  <span style={{fontSize:11,color:s.c.tx,opacity:.8}}>{s.prof}</span>
                  <span style={{marginLeft:"auto",fontSize:10,fontWeight:700,color:s.c.bd,background:"#fff",borderRadius:10,padding:"1px 6px"}}>{s.cr}cr · {s.term}</span>
                </div>
                <div style={{fontSize:10,fontWeight:700,color:s.c.bd,marginBottom:4}}>🎯 Why: {s.why}</div>
                <div style={{fontSize:11,color:s.c.tx,lineHeight:1.5,marginBottom:5}}>{s.pitch}</div>
                {s.evalId&&<EvalCard evalId={s.evalId} label="peer quotes"/>}
                {window.__hlsSetNote&&<NoteField courseKey={s.key}/>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
