const $=q=>document.querySelector(q);
const $$=q=>document.querySelectorAll(q);

const examDates={
  YKS:"2026-06-20",
  LGS:"2026-06-14",
  KPSS:"2026-07-19",
  DGS:"2026-07-12"
};

let total=1500;
let remain=1500;
let run=false;
let timer=null;

let data;
try{
  data=JSON.parse(localStorage.getItem("sezr_focus_clean")||"{}");
}catch(e){
  data={};
}

data={
  tasks:Array.isArray(data.tasks)?data.tasks:[],
  min:Number(data.min)||0,
  pom:Number(data.pom)||0,
  exam:data.exam||"YKS",
  examDate:data.examDate||examDates[data.exam||"YKS"]
};

function save(){
  localStorage.setItem("sezr_focus_clean",JSON.stringify(data));
}

function fmt(x){
  x=Math.max(0,Number(x)||0);
  const m=Math.floor(x/60);
  const s=x%60;
  return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
}

function render(){
  $("#todayMin").textContent=data.min;
  $("#todayPom").textContent=data.pom;
  $("#streak").textContent=data.min?1:0;
  $("#score").textContent=Math.min(100,Math.round((data.min||0)/60*100))+"%";

  $("#time").textContent=fmt(remain);
  $("#otime").textContent=fmt(remain);
  $("#ring").style.setProperty("--deg",((total-remain)/total*360)+"deg");

  const list=$("#tasks");
  list.innerHTML="";
  data.tasks.forEach((task,index)=>{
    const item=document.createElement("div");
    item.className="item";
    const span=document.createElement("span");
    span.textContent=task;
    const btn=document.createElement("button");
    btn.textContent="Sil";
    btn.onclick=()=>removeTask(index);
    item.append(span,btn);
    list.appendChild(item);
  });

  const pct=data.tasks.length?100:0;
  $("#taskProg").style.width=pct+"%";
  $("#taskText").textContent="Görev ilerlemesi: %"+pct;
}

window.removeTask=index=>{
  data.tasks.splice(index,1);
  save();
  render();
};

function tick(){
  if(!run)return;
  remain--;
  if(remain<=0){
    run=false;
    clearInterval(timer);
    data.min+=Math.round(total/60);
    data.pom+=1;
    save();
    remain=total;
    $("#toggle").textContent="Başlat";
    $("#status").textContent="Tamamlandı";
    $("#overlayStatus").textContent="Tamamlandı";
  }
  render();
}

$("#toggle").onclick=()=>{
  run=!run;
  $("#toggle").textContent=run?"Duraklat":"Başlat";
  $("#status").textContent=run?"Çalışıyor":"Duraklatıldı";
  $("#overlayStatus").textContent=run?"Odaklan":"Duraklatıldı";
  if(run){
    clearInterval(timer);
    timer=setInterval(tick,1000);
  }
};

$("#reset").onclick=()=>{
  run=false;
  clearInterval(timer);
  remain=total;
  $("#toggle").textContent="Başlat";
  $("#status").textContent="Hazır";
  $("#overlayStatus").textContent="Odaklan";
  render();
};

$$(".modes button").forEach(btn=>{
  btn.onclick=()=>{
    $$(".modes button").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    total=Number(btn.dataset.min)*60;
    remain=total;
    run=false;
    clearInterval(timer);
    $("#toggle").textContent="Başlat";
    $("#status").textContent="Hazır";
    render();
  };
});

$("#add").onclick=()=>{
  const value=$("#task").value.trim();
  if(!value)return;
  data.tasks.push(value);
  $("#task").value="";
  save();
  render();
};

$("#task").addEventListener("keydown",e=>{
  if(e.key==="Enter")$("#add").click();
});

$("#full").onclick=()=>$("#overlay").classList.add("show");
$("#oclose").onclick=()=>$("#overlay").classList.remove("show");

function setExam(examName, dateValue){
  const selected=examDates[examName]?examName:"YKS";
  data.exam=selected;
  data.examDate=dateValue||examDates[selected];
  $("#exam").value=selected;
  $("#examDate").value=data.examDate;
  $("#examChip").textContent=selected;
  save();
  updateExam();
}

$("#exam").addEventListener("change",e=>{
  const selected=e.target.value;
  setExam(selected,examDates[selected]);
});

$("#examDate").addEventListener("change",e=>{
  setExam($("#exam").value,e.target.value||examDates[$("#exam").value]);
});

function updateExam(){
  const targetValue=$("#examDate").value||examDates[$("#exam").value]||examDates.YKS;
  let diff=new Date(targetValue+"T00:00:00").getTime()-Date.now();
  if(Number.isNaN(diff)||diff<0)diff=0;
  const sec=Math.floor(diff/1000);
  $("#d").textContent=Math.floor(sec/86400);
  $("#h").textContent=Math.floor((sec%86400)/3600);
  $("#m").textContent=Math.floor((sec%3600)/60);
  $("#s").textContent=sec%60;
}

setExam(data.exam,data.examDate);
setInterval(updateExam,1000);
render();
updateExam();
