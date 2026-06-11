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
  examDate: data.examDate || (examDefaults[data.exam || "YKS"] || examDefaults.YKS).date
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

function render() {
  const today = ensureToday();
  $("#todayMin").textContent = today.min;
  $("#todayPom").textContent = today.pom;
  $("#streak").textContent = calcStreak();
  $("#score").textContent = Math.min(100, Math.round((today.min || 0) / 120 * 100)) + "%";
  $("#time").textContent = fmt(remain);
  $("#otime").textContent = fmt(remain);
  $("#ring").style.setProperty("--deg", ((total - remain) / total * 360) + "deg");
  renderTasks();
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
setExam(data.exam, data.examDate, false);
setInterval(updateExam, 1000);
render();
updateExam();