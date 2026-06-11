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

const badges = [
  { id: "first", title: "İlk Odak", icon: "🎯", desc: "1 seans", test: s => s.totalPom >= 1 },
  { id: "hour", title: "60 Dakika", icon: "⏱️", desc: "Toplam 60 dk", test: s => s.totalMin >= 60 },
  { id: "goal", title: "Hedef Tamam", icon: "✅", desc: "Günlük hedef", test: s => s.todayMin >= s.goal },
  { id: "streak3", title: "3 Gün Seri", icon: "🔥", desc: "3 gün üst üste", test: s => s.streak >= 3 },
  { id: "task10", title: "Görev Ustası", icon: "📌", desc: "10 görev", test: s => s.doneTasks >= 10 },
  { id: "xp1000", title: "1000 XP", icon: "🏆", desc: "1000 puan", test: s => s.xp >= 1000 }
];

let total = 1500;
let remain = 1500;
let run = false;
let timer = null;
let data;

try {
  data = JSON.parse(localStorage.getItem("sezr_focus_clean") || "{}");
} catch (e) {
  data = {};
}

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function makeTask(text, done = false) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    text: String(text || "").trim(),
    done: Boolean(done)
  };
}

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) return [];
  return tasks
    .map(task => {
      if (typeof task === "string") return makeTask(task, false);
      return makeTask(task.text || task.title || "", task.done || task.completed);
    })
    .filter(task => task.text);
}

function normalizeDaily(daily) {
  return daily && typeof daily === "object" && !Array.isArray(daily) ? daily : {};
}

data = {
  tasks: normalizeTasks(data.tasks),
  daily: normalizeDaily(data.daily),
  exam: data.exam || "YKS",
  examDate: data.examDate || (examDefaults[data.exam || "YKS"] || examDefaults.YKS).date,
  goal: Number(data.goal) || 120,
  soundMode: data.soundMode || "soft",
  theme: data.theme || "dark"
};

function ensureToday() {
  const key = todayKey();
  if (!data.daily[key]) data.daily[key] = { min: 0, pom: 0 };
  data.daily[key].min = Number(data.daily[key].min) || 0;
  data.daily[key].pom = Number(data.daily[key].pom) || 0;
  return data.daily[key];
}

function save() {
  localStorage.setItem("sezr_focus_clean", JSON.stringify(data));
}

function fmt(x) {
  x = Math.max(0, Number(x) || 0);
  const m = Math.floor(x / 60);
  const s = x % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function calcStreak() {
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const key = todayKey(cursor);
    if ((data.daily[key]?.min || 0) > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function weekDays() {
  const days = [];
  const cursor = new Date();
  for (let i = 6; i >= 0; i--) {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() - i);
    days.push({ key: todayKey(day), label: day.toLocaleDateString("tr-TR", { weekday: "short" }) });
  }
  return days;
}

function summary() {
  const today = ensureToday();
  const totalMin = Object.values(data.daily).reduce((sum, day) => sum + (Number(day.min) || 0), 0);
  const totalPom = Object.values(data.daily).reduce((sum, day) => sum + (Number(day.pom) || 0), 0);
  const doneTasks = data.tasks.filter(task => task.done).length;
  const xp = totalMin * 5 + totalPom * 20 + doneTasks * 30 + calcStreak() * 50;
  return { todayMin: today.min, totalMin, totalPom, doneTasks, streak: calcStreak(), goal: data.goal, xp };
}

function playDoneSound() {
  if (data.soundMode === "silent") return;
  try {
    const audio = new (window.AudioContext || window.webkitAudioContext)();
    const tones = { soft: 440, classic: 660, alarm: 880 };
    const gain = audio.createGain();
    const osc = audio.createOscillator();
    osc.frequency.value = tones[data.soundMode] || 440;
    osc.type = data.soundMode === "alarm" ? "square" : "sine";
    gain.gain.setValueAtTime(0.001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, audio.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.45);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.5);
  } catch (e) {}
}

function renderTasks() {
  const list = $("#tasks");
  list.innerHTML = "";
  data.tasks.forEach((task, index) => {
    const item = document.createElement("div");
    item.className = "item" + (task.done ? " done" : "");

    const check = document.createElement("button");
    check.className = "task-check";
    check.type = "button";
    check.textContent = task.done ? "✓" : "○";
    check.title = task.done ? "Tamamlandı" : "Tamamla";
    check.onclick = () => toggleTask(index);

    const span = document.createElement("span");
    span.textContent = task.text;

    const del = document.createElement("button");
    del.className = "task-delete";
    del.type = "button";
    del.textContent = "Sil";
    del.onclick = () => removeTask(index);

    item.append(check, span, del);
    list.appendChild(item);
  });

  const done = data.tasks.filter(task => task.done).length;
  const pct = data.tasks.length ? Math.round(done / data.tasks.length * 100) : 0;
  $("#taskProg").style.width = pct + "%";
  $("#taskText").textContent = `Görev ilerlemesi: %${pct} (${done}/${data.tasks.length})`;
}

function renderWeek(stats) {
  const grid = $("#weekStats");
  const days = weekDays();
  const max = Math.max(data.goal, ...days.map(day => Number(data.daily[day.key]?.min) || 0), 1);
  grid.innerHTML = "";
  days.forEach(day => {
    const min = Number(data.daily[day.key]?.min) || 0;
    const card = document.createElement("div");
    card.className = "week-day";
    card.innerHTML = `<b>${min}</b><span>${day.label}</span><i style="height:${Math.max(8, Math.round(min / max * 100))}%"></i>`;
    grid.appendChild(card);
  });
  $("#weekText").textContent = `Haftalık toplam: ${days.reduce((sum, day) => sum + (Number(data.daily[day.key]?.min) || 0), 0)} dk • Toplam seans: ${stats.totalPom}`;
}

function renderBadges(stats) {
  const box = $("#badges");
  box.innerHTML = "";
  badges.forEach(badge => {
    const earned = badge.test(stats);
    const item = document.createElement("div");
    item.className = "achievement" + (earned ? " earned" : "");
    item.innerHTML = `<strong>${badge.icon}</strong><b>${badge.title}</b><span>${badge.desc}</span>`;
    box.appendChild(item);
  });
  $("#xpText").textContent = `${stats.xp} XP • ${badges.filter(b => b.test(stats)).length}/${badges.length} rozet açıldı.`;
}

function applyTheme() {
  document.body.dataset.theme = data.theme;
  $("#themeMode").value = data.theme;
}

function render() {
  const today = ensureToday();
  const stats = summary();
  const goalPct = Math.min(100, Math.round((today.min || 0) / data.goal * 100));
  $("#todayMin").textContent = today.min;
  $("#todayPom").textContent = today.pom;
  $("#streak").textContent = stats.streak;
  $("#score").textContent = goalPct + "%";
  $("#xp").textContent = stats.xp;
  $("#goalStat").textContent = data.goal;
  $("#dailyGoal").value = data.goal;
  $("#soundMode").value = data.soundMode;
  $("#goalText").textContent = `Bugünkü hedef: ${data.goal} dk • Tamamlanma: %${goalPct}`;
  $("#goalProg").style.width = goalPct + "%";
  $("#time").textContent = fmt(remain);
  $("#otime").textContent = fmt(remain);
  $("#ring").style.setProperty("--deg", ((total - remain) / total * 360) + "deg");
  renderTasks();
  renderWeek(stats);
  renderBadges(stats);
  applyTheme();
}

function toggleTask(index) {
  data.tasks[index].done = !data.tasks[index].done;
  save();
  render();
}

function removeTask(index) {
  data.tasks.splice(index, 1);
  save();
  render();
}

function completeSession() {
  const today = ensureToday();
  today.min += Math.round(total / 60);
  today.pom += 1;
  save();
  playDoneSound();
}

function tick() {
  if (!run) return;
  remain--;
  if (remain <= 0) {
    run = false;
    clearInterval(timer);
    completeSession();
    remain = total;
    $("#toggle").textContent = "Başlat";
    $("#status").textContent = "Tamamlandı";
    $("#overlayStatus").textContent = "Tamamlandı";
  }
  render();
}

$("#toggle").onclick = () => {
  run = !run;
  $("#toggle").textContent = run ? "Duraklat" : "Başlat";
  $("#status").textContent = run ? "Çalışıyor" : "Duraklatıldı";
  $("#overlayStatus").textContent = run ? "Odaklan" : "Duraklatıldı";
  if (run) {
    clearInterval(timer);
    timer = setInterval(tick, 1000);
  } else {
    clearInterval(timer);
  }
};

$("#reset").onclick = () => {
  run = false;
  clearInterval(timer);
  remain = total;
  $("#toggle").textContent = "Başlat";
  $("#status").textContent = "Hazır";
  $("#overlayStatus").textContent = "Odaklan";
  render();
};

$$(".modes button").forEach(btn => {
  btn.onclick = () => {
    $$(".modes button").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    total = Number(btn.dataset.min) * 60;
    remain = total;
    run = false;
    clearInterval(timer);
    $("#toggle").textContent = "Başlat";
    $("#status").textContent = "Hazır";
    render();
  };
});

$("#add").onclick = () => {
  const value = $("#task").value.trim();
  if (!value) return;
  data.tasks.push(makeTask(value));
  $("#task").value = "";
  save();
  render();
};

$("#task").addEventListener("keydown", e => {
  if (e.key === "Enter") $("#add").click();
});

$("#dailyGoal").addEventListener("change", e => {
  data.goal = Math.max(10, Math.min(600, Number(e.target.value) || 120));
  save();
  render();
});

$("#soundMode").addEventListener("change", e => {
  data.soundMode = e.target.value;
  save();
  render();
});

$("#themeMode").addEventListener("change", e => {
  data.theme = e.target.value;
  save();
  render();
});

$("#exportCsv").onclick = () => {
  const rows = [["date", "minutes", "sessions"]];
  Object.keys(data.daily).sort().forEach(key => rows.push([key, data.daily[key].min || 0, data.daily[key].pom || 0]));
  const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sezr-focus-istatistik.csv";
  a.click();
  URL.revokeObjectURL(url);
};

$("#full").onclick = () => $("#overlay").classList.add("show");
$("#oclose").onclick = () => $("#overlay").classList.remove("show");

function setExam(examName, dateValue, forceDefault = false) {
  const selected = examDefaults[examName] ? examName : "YKS";
  data.exam = selected;
  data.examDate = forceDefault ? examDefaults[selected].date : (dateValue || examDefaults[selected].date);
  $("#exam").value = selected;
  $("#examDate").value = data.examDate;
  $("#examChip").textContent = selected.replace("_", " ");
  save();
  updateExam();
}

$("#exam").addEventListener("change", e => setExam(e.target.value, null, true));
$("#examDate").addEventListener("change", e => setExam($("#exam").value, e.target.value, false));

function updateExam() {
  const current = $("#exam").value || "YKS";
  const targetValue = $("#examDate").value || (examDefaults[current] || examDefaults.YKS).date;
  const target = new Date(targetValue + "T00:00:00").getTime();
  let diff = target - Date.now();
  const note = examDefaults[current]?.note || "Tarih alanı düzenlenebilir.";

  if (Number.isNaN(diff)) diff = 0;
  if (diff < 0) {
    diff = 0;
    $("#examNote").textContent = note + " Bu seçili tarih tamamlandı/geçmişte kaldı.";
  } else {
    $("#examNote").textContent = note;
  }

  const sec = Math.floor(diff / 1000);
  $("#d").textContent = Math.floor(sec / 86400);
  $("#h").textContent = Math.floor((sec % 86400) / 3600);
  $("#m").textContent = Math.floor((sec % 3600) / 60);
  $("#s").textContent = sec % 60;
}

ensureToday();
save();
applyTheme();
setExam(data.exam, data.examDate, false);
setInterval(updateExam, 1000);
render();
updateExam();
