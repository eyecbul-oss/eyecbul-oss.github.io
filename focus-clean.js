const $ = q => document.querySelector(q);
const $$ = q => document.querySelectorAll(q);

const examDefaults = {
  YKS: { date: "2026-06-20", note: "YKS için varsayılan tarih: 20 Haziran 2026. TYT/AYT takvimi değişirse buradan düzenleyebilirsin." },
  TYT: { date: "2026-06-20", note: "TYT için varsayılan tarih: 20 Haziran 2026. Açıklanan takvime göre düzenlenebilir." },
  AYT: { date: "2026-06-21", note: "AYT için varsayılan tarih: 21 Haziran 2026. Açıklanan takvime göre düzenlenebilir." },
  LGS: { date: "2026-06-14", note: "LGS için varsayılan tarih: 14 Haziran 2026. Tarih alanı düzenlenebilir." },
  KPSS: { date: "2026-07-19", note: "KPSS Lisans için varsayılan tarih: 19 Temmuz 2026. ÖSYM takvimine göre düzenlenebilir." },
  KPSS_OABT: { date: "2026-08-02", note: "KPSS ÖABT için varsayılan tarih: 2 Ağustos 2026. ÖSYM takvimine göre düzenlenebilir." },
  DGS: { date: "2026-07-12", note: "DGS için varsayılan tarih: 12 Temmuz 2026. ÖSYM takvimine göre düzenlenebilir." },
  ALES_1: { date: "2026-04-19", note: "ALES/1 için varsayılan tarih: 19 Nisan 2026. Bu tarih geçmiş olabilir; alanı güncelleyebilirsin." },
  ALES_2: { date: "2026-09-20", note: "ALES/2 için varsayılan tarih: 20 Eylül 2026. Takvime göre düzenlenebilir." },
  YDS_1: { date: "2026-04-12", note: "YDS/1 için varsayılan tarih: 12 Nisan 2026. Bu tarih geçmiş olabilir; alanı güncelleyebilirsin." },
  YDS_2: { date: "2026-10-18", note: "YDS/2 için varsayılan tarih: 18 Ekim 2026. Takvime göre düzenlenebilir." }
};
function isFutureDate(value) { const date = new Date(`${value}T23:59:59`); return Boolean(value) && !Number.isNaN(date.getTime()) && date.getTime() >= Date.now(); }
function defaultExamDate(exam) { const candidate = (examDefaults[exam] || examDefaults.YKS).date; return isFutureDate(candidate) ? candidate : ""; }
const defaultSubjects = ["Matematik", "Geometri", "Fizik", "Kimya", "Biyoloji", "Türkçe", "TYT Genel", "AYT Genel"];
const levelNames = ["Başlangıç", "Düzenli Çalışan", "Odaklı", "Planlı", "Kararlı", "Usta Odakçı", "Şampiyon"];
const badges = [
  { title: "İlk Odak", icon: "🎯", desc: "1 seans", test: s => s.totalPom >= 1 },
  { title: "60 Dakika", icon: "⏱️", desc: "Toplam 60 dk", test: s => s.totalMin >= 60 },
  { title: "Hedef Tamam", icon: "✅", desc: "Günlük hedef", test: s => s.todayMin >= s.goal },
  { title: "3 Gün Seri", icon: "🔥", desc: "3 gün üst üste", test: s => s.streak >= 3 },
  { title: "Görev Ustası", icon: "📌", desc: "10 görev", test: s => s.doneTasks >= 10 },
  { title: "Ders Uzmanı", icon: "📚", desc: "3 derste çalışma", test: s => Object.keys(s.subjectTotals).length >= 3 },
  { title: "1000 XP", icon: "🏆", desc: "1000 puan", test: s => s.xp >= 1000 },
  { title: "YKS Disiplini", icon: "🧠", desc: "Soru hedefi", test: s => s.yksDone >= s.yksGoal && s.yksGoal > 0 }
];
let total = 1500, remain = 1500, run = false, timer = null, data;
try { data = JSON.parse(localStorage.getItem("sezr_focus_clean") || "{}"); } catch (e) { data = {}; }
function todayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function makeTask(text, done = false) { return { id: Date.now().toString(36)+Math.random().toString(36).slice(2,7), text: String(text||"").trim(), done: Boolean(done) }; }
function normalizeTasks(tasks) { return Array.isArray(tasks) ? tasks.map(t => typeof t === "string" ? makeTask(t) : makeTask(t.text || t.title || "", t.done || t.completed)).filter(t => t.text) : []; }
function normalizeDaily(daily) { return daily && typeof daily === "object" && !Array.isArray(daily) ? daily : {}; }
function normalizeSubjectStats(stats) { return stats && typeof stats === "object" && !Array.isArray(stats) ? stats : {}; }
data = {
  tasks: normalizeTasks(data.tasks),
  daily: normalizeDaily(data.daily),
  subjectStats: normalizeSubjectStats(data.subjectStats),
  exam: data.exam || "YKS",
  examDate: isFutureDate(data.examDate) ? data.examDate : defaultExamDate(data.exam || "YKS"),
  goal: Number(data.goal) || 120,
  soundMode: data.soundMode || "soft",
  theme: data.theme || "dark",
  selectedSubject: data.selectedSubject || "Matematik",
  subjects: Array.isArray(data.subjects) && data.subjects.length ? data.subjects : defaultSubjects,
  yks: { questionGoal: Number(data.yks?.questionGoal) || 120, questionDone: Number(data.yks?.questionDone) || 0, trialCount: Number(data.yks?.trialCount) || 0 }
};
function ensureToday() { const key=todayKey(); if(!data.daily[key]) data.daily[key]={min:0,pom:0}; data.daily[key].min=Number(data.daily[key].min)||0; data.daily[key].pom=Number(data.daily[key].pom)||0; return data.daily[key]; }
function ensureSubject(name) { if(!data.subjectStats[name]) data.subjectStats[name]={min:0,pom:0}; return data.subjectStats[name]; }
function save() { localStorage.setItem("sezr_focus_clean", JSON.stringify(data)); }
function fmt(x) { x=Math.max(0,Number(x)||0); return String(Math.floor(x/60)).padStart(2,"0")+":"+String(x%60).padStart(2,"0"); }
function calcStreak() { let streak=0, cursor=new Date(); for(let i=0;i<365;i++){ const key=todayKey(cursor); if((data.daily[key]?.min||0)>0){streak++; cursor.setDate(cursor.getDate()-1);} else break; } return streak; }
function weekDays() { const days=[], now=new Date(); for(let i=6;i>=0;i--){ const d=new Date(now); d.setDate(now.getDate()-i); days.push({key:todayKey(d), label:d.toLocaleDateString("tr-TR",{weekday:"short"})}); } return days; }
function lastDays(n) { const days=[], now=new Date(); for(let i=n-1;i>=0;i--){ const d=new Date(now); d.setDate(now.getDate()-i); days.push({key:todayKey(d), label:d.toLocaleDateString("tr-TR",{day:"2-digit",month:"2-digit"})}); } return days; }
function subjectTotals() { return Object.fromEntries(Object.entries(data.subjectStats).filter(([,v]) => (Number(v.min)||0)>0 || (Number(v.pom)||0)>0)); }
function levelFromXp(xp) { const level=Math.max(1, Math.floor(xp/500)+1); const current=(level-1)*500, next=level*500; return { level, title: levelNames[Math.min(level-1, levelNames.length-1)], current, next, pct: Math.min(100, Math.round((xp-current)/(next-current)*100)) }; }
function summary(){ const today=ensureToday(); const totalMin=Object.values(data.daily).reduce((s,d)=>s+(Number(d.min)||0),0); const totalPom=Object.values(data.daily).reduce((s,d)=>s+(Number(d.pom)||0),0); const doneTasks=data.tasks.filter(t=>t.done).length; const subjects=subjectTotals(); const yksGoal=Number(data.yks.questionGoal)||0, yksDone=Number(data.yks.questionDone)||0; const xp=totalMin*5+totalPom*20+doneTasks*30+calcStreak()*50+yksDone; return {todayMin:today.min,totalMin,totalPom,doneTasks,streak:calcStreak(),goal:data.goal,subjectTotals:subjects,yksGoal,yksDone,xp}; }
function playDoneSound(){ if(data.soundMode==="silent") return; try{ const audio=new (window.AudioContext||window.webkitAudioContext)(); const tones={soft:440,classic:660,alarm:880}; const gain=audio.createGain(), osc=audio.createOscillator(); osc.frequency.value=tones[data.soundMode]||440; osc.type=data.soundMode==="alarm"?"square":"sine"; gain.gain.setValueAtTime(.001,audio.currentTime); gain.gain.exponentialRampToValueAtTime(.14,audio.currentTime+.02); gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.45); osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime+.5); }catch(e){} }
function renderSubjectSelect(){ const sel=$("#subjectSelect"); sel.innerHTML=""; data.subjects.forEach(s=>{ const opt=document.createElement("option"); opt.value=s; opt.textContent=s; sel.appendChild(opt); }); sel.value=data.selectedSubject; }
function renderTasks(){ const list=$("#tasks"); list.innerHTML=""; data.tasks.forEach((task,index)=>{ const item=document.createElement("div"); item.className="item"+(task.done?" done":""); const check=document.createElement("button"); check.className="task-check"; check.type="button"; check.textContent=task.done?"✓":"○"; check.onclick=()=>toggleTask(index); const span=document.createElement("span"); span.textContent=task.text; const del=document.createElement("button"); del.className="task-delete"; del.type="button"; del.textContent="Sil"; del.onclick=()=>removeTask(index); item.append(check,span,del); list.appendChild(item); }); const done=data.tasks.filter(t=>t.done).length; const pct=data.tasks.length?Math.round(done/data.tasks.length*100):0; $("#taskProg").style.width=pct+"%"; $("#taskText").textContent=`Görev ilerlemesi: %${pct} (${done}/${data.tasks.length})`; }
function renderWeek(stats){ const grid=$("#weekStats"), days=weekDays(); const max=Math.max(data.goal,...days.map(d=>Number(data.daily[d.key]?.min)||0),1); grid.innerHTML=""; days.forEach(day=>{ const min=Number(data.daily[day.key]?.min)||0; const card=document.createElement("div"); card.className="week-day"; card.innerHTML=`<b>${min}</b><span>${day.label}</span><i style="height:${Math.max(8,Math.round(min/max*100))}%"></i>`; grid.appendChild(card); }); $("#weekText").textContent=`Haftalık toplam: ${days.reduce((s,d)=>s+(Number(data.daily[d.key]?.min)||0),0)} dk • Toplam seans: ${stats.totalPom}`; }
function renderHeatmap(){ const box=$("#heatmap"), days=lastDays(30); const max=Math.max(...days.map(d=>Number(data.daily[d.key]?.min)||0),1); box.innerHTML=""; days.forEach(day=>{ const min=Number(data.daily[day.key]?.min)||0; const cell=document.createElement("span"); cell.className="heat level-"+Math.min(4,Math.ceil(min/max*4)); cell.title=`${day.label}: ${min} dk`; box.appendChild(cell); }); }
function renderSubjectStats(){ const box=$("#subjectStats"); const entries=Object.entries(data.subjectStats).sort((a,b)=>(b[1].min||0)-(a[1].min||0)); box.innerHTML=""; if(!entries.length){ box.innerHTML='<p class="muted">İlk seans tamamlandığında ders istatistiği burada görünecek.</p>'; return; } const max=Math.max(...entries.map(([,v])=>Number(v.min)||0),1); entries.forEach(([name,val])=>{ const pct=Math.round((Number(val.min)||0)/max*100); const row=document.createElement("div"); row.className="subject-row"; row.innerHTML=`<div><b>${name}</b><span>${val.min||0} dk • ${val.pom||0} seans</span></div><em style="width:${pct}%"></em>`; box.appendChild(row); }); }
function renderBadges(stats){ const box=$("#badges"); box.innerHTML=""; badges.forEach(b=>{ const earned=b.test(stats); const item=document.createElement("div"); item.className="achievement"+(earned?" earned":""); item.innerHTML=`<strong>${b.icon}</strong><b>${b.title}</b><span>${b.desc}</span>`; box.appendChild(item); }); $("#xpText").textContent=`${stats.xp} XP • ${badges.filter(b=>b.test(stats)).length}/${badges.length} rozet açıldı.`; }
function renderLevel(stats){ const lv=levelFromXp(stats.xp); $("#levelNo").textContent=lv.level; $("#levelChip").textContent="Lv "+lv.level; $("#levelTitle").textContent=lv.title; $("#levelText").textContent=`Sonraki seviye için ${Math.max(0,lv.next-stats.xp)} XP kaldı.`; $("#levelProg").style.width=lv.pct+"%"; }
function renderYks(){ const goal=Number(data.yks.questionGoal)||0, done=Number(data.yks.questionDone)||0; const pct=goal?Math.min(100,Math.round(done/goal*100)):0; $("#questionGoal").value=goal; $("#questionDone").value=done; $("#trialCount").value=Number(data.yks.trialCount)||0; $("#questionProg").style.width=pct+"%"; $("#yksText").textContent=`Bugünkü soru hedefi: ${done}/${goal} • Haftalık deneme: ${data.yks.trialCount}`; }
function applyTheme(){ document.body.dataset.theme=data.theme; $("#themeMode").value=data.theme; }
function render(){ const today=ensureToday(), stats=summary(), goalPct=Math.min(100,Math.round((today.min||0)/data.goal*100)); $("#todayMin").textContent=today.min; $("#todayPom").textContent=today.pom; $("#streak").textContent=stats.streak; $("#score").textContent=goalPct+"%"; $("#xp").textContent=stats.xp; $("#dailyGoal").value=data.goal; $("#soundMode").value=data.soundMode; $("#goalText").textContent=`Bugünkü hedef: ${data.goal} dk • Tamamlanma: %${goalPct}`; $("#goalProg").style.width=goalPct+"%"; $("#time").textContent=fmt(remain); $("#otime").textContent=fmt(remain); $("#ring").style.setProperty("--deg",((total-remain)/total*360)+"deg"); renderSubjectSelect(); renderTasks(); renderWeek(stats); renderHeatmap(); renderSubjectStats(); renderLevel(stats); renderYks(); renderBadges(stats); applyTheme(); }
function toggleTask(i){ data.tasks[i].done=!data.tasks[i].done; save(); render(); }
function removeTask(i){ data.tasks.splice(i,1); save(); render(); }
function completeSession(){ const today=ensureToday(), minutes=Math.round(total/60); today.min+=minutes; today.pom+=1; const s=ensureSubject(data.selectedSubject); s.min=(Number(s.min)||0)+minutes; s.pom=(Number(s.pom)||0)+1; save(); playDoneSound(); }
function tick(){ if(!run) return; remain--; if(remain<=0){ run=false; clearInterval(timer); completeSession(); remain=total; $("#toggle").textContent="Başlat"; $("#status").textContent="Tamamlandı"; $("#overlayStatus").textContent="Tamamlandı"; } render(); }
$("#toggle").onclick=()=>{ run=!run; $("#toggle").textContent=run?"Duraklat":"Başlat"; $("#status").textContent=run?"Çalışıyor":"Duraklatıldı"; $("#overlayStatus").textContent=run?"Odaklan":"Duraklatıldı"; clearInterval(timer); if(run) timer=setInterval(tick,1000); };
$("#reset").onclick=()=>{ run=false; clearInterval(timer); remain=total; $("#toggle").textContent="Başlat"; $("#status").textContent="Hazır"; $("#overlayStatus").textContent="Odaklan"; render(); };
$$(".modes button").forEach(btn=>btn.onclick=()=>{ $$(".modes button").forEach(x=>x.classList.remove("active")); btn.classList.add("active"); total=Number(btn.dataset.min)*60; remain=total; run=false; clearInterval(timer); $("#toggle").textContent="Başlat"; $("#status").textContent="Hazır"; render(); });
$("#add").onclick=()=>{ const v=$("#task").value.trim(); if(!v) return; data.tasks.push(makeTask(v)); $("#task").value=""; save(); render(); };
$("#task").addEventListener("keydown",e=>{ if(e.key==="Enter") $("#add").click(); });
$("#dailyGoal").addEventListener("change",e=>{ data.goal=Math.max(10,Math.min(600,Number(e.target.value)||120)); save(); render(); });
$("#soundMode").addEventListener("change",e=>{ data.soundMode=e.target.value; save(); render(); });
$("#themeMode").addEventListener("change",e=>{ data.theme=e.target.value; save(); render(); });
$("#subjectSelect").addEventListener("change",e=>{ data.selectedSubject=e.target.value; save(); render(); });
["questionGoal","questionDone","trialCount"].forEach(id=>$("#"+id).addEventListener("change",e=>{ const key=id==="questionGoal"?"questionGoal":id==="questionDone"?"questionDone":"trialCount"; data.yks[key]=Math.max(0,Number(e.target.value)||0); save(); render(); }));
function downloadFile(name,type,content){ const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url); }
$("#exportCsv").onclick=()=>{ const rows=[["date","minutes","sessions"]]; Object.keys(data.daily).sort().forEach(k=>rows.push([k,data.daily[k].min||0,data.daily[k].pom||0])); downloadFile("sezr-focus-istatistik.csv","text/csv;charset=utf-8",rows.map(r=>r.map(c=>`"${String(c).replaceAll('"','""')}"`).join(",")).join("\n")); };
$("#exportJson").onclick=()=>downloadFile("sezr-focus-yedek.json","application/json;charset=utf-8",JSON.stringify(data,null,2));
$("#importJsonBtn").onclick=()=>$("#importJson").click();
$("#importJson").addEventListener("change",e=>{ const file=e.target.files?.[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ try{ const imported=JSON.parse(reader.result); data={...data,...imported,tasks:normalizeTasks(imported.tasks),daily:normalizeDaily(imported.daily),subjectStats:normalizeSubjectStats(imported.subjectStats),yks:{...data.yks,...(imported.yks||{})}}; save(); render(); alert("Focus yedeği içe aktarıldı."); }catch(err){ alert("JSON dosyası okunamadı."); } }; reader.readAsText(file); });
$("#full").onclick=()=>$("#overlay").classList.add("show"); $("#oclose").onclick=()=>$("#overlay").classList.remove("show");
function setExam(examName,dateValue,forceDefault=false){ const selected=examDefaults[examName]?examName:"YKS"; data.exam=selected; data.examDate=forceDefault?defaultExamDate(selected):(dateValue||defaultExamDate(selected)); $("#exam").value=selected; $("#examDate").value=data.examDate; $("#examChip").textContent=selected.replace("_"," "); save(); updateExam(); }
$("#exam").addEventListener("change",e=>setExam(e.target.value,null,true)); $("#examDate").addEventListener("change",e=>setExam($("#exam").value,e.target.value,false));
function updateExam(){ const current=$("#exam").value||"YKS", targetValue=$("#examDate").value; if(!isFutureDate(targetValue)){ $("#examNote").textContent="Güncel sınav tarihi henüz eklenmedi. ÖSYM takvimi açıklandığında tarih alanından seçebilirsin."; ["#d","#h","#m","#s"].forEach(id=>$(id).textContent="—"); return; } const target=new Date(targetValue+"T00:00:00").getTime(); const diff=Math.max(0,target-Date.now()); const note=examDefaults[current]?.note||"Tarih alanı düzenlenebilir."; $("#examNote").textContent=note; const sec=Math.floor(diff/1000); $("#d").textContent=Math.floor(sec/86400); $("#h").textContent=Math.floor((sec%86400)/3600); $("#m").textContent=Math.floor((sec%3600)/60); $("#s").textContent=sec%60; }
ensureToday(); save(); applyTheme(); setExam(data.exam,data.examDate,false); setInterval(updateExam,1000); render(); updateExam();
