
function toEmbed(url){try{const u=new URL(url);let id="";if(u.hostname.includes("youtu.be")) id=u.pathname.replace("/","");else if(u.searchParams.get("v")) id=u.searchParams.get("v");id=(id||"").split("?")[0].split("&")[0];return id?"https://www.youtube.com/embed/"+id+"?rel=0&modestbranding=1":"";}catch(e){return "";}}
document.querySelectorAll(".watch-video").forEach(btn=>{btn.addEventListener("click",()=>{const id=btn.dataset.video;const frame=document.getElementById("videoFrame");const player=document.getElementById("videoPlayer");frame.src="https://www.youtube.com/embed/"+id+"?rel=0&modestbranding=1";player.classList.add("show");player.scrollIntoView({behavior:"smooth",block:"center"});});});
document.querySelectorAll(".watch-playlist").forEach(btn=>{btn.addEventListener("click",()=>{const list=btn.dataset.list;const frame=document.getElementById("videoFrame");const player=document.getElementById("videoPlayer");frame.src="https://www.youtube.com/embed/videoseries?list="+list+"&rel=0&modestbranding=1";player.classList.add("show");player.scrollIntoView({behavior:"smooth",block:"center"});});});
(function(){let total=25*60,running=false;const timer=document.getElementById("focusTimer");function render(){if(timer){timer.textContent=String(Math.floor(total/60)).padStart(2,"0")+":"+String(total%60).padStart(2,"0");}}setInterval(()=>{if(running&&total>0){total--;render();}},1000);const start=document.getElementById("focusStart"),pause=document.getElementById("focusPause"),reset=document.getElementById("focusReset"),save=document.getElementById("focusSave"),input=document.getElementById("focusVideoUrl"),frame=document.getElementById("focusVideoFrame"),box=document.getElementById("focusVideoBox");if(input){input.value=localStorage.getItem("sezrFocusVideo")||"";}if(save){save.onclick=()=>{const e=toEmbed(input.value.trim());if(!e){alert("Geçerli YouTube linki yapıştır.");return;}localStorage.setItem("sezrFocusVideo",input.value.trim());frame.src=e;box.classList.add("show");box.scrollIntoView({behavior:"smooth",block:"center"});};}if(start){start.onclick=()=>{running=true;const url=(input&&input.value.trim())||localStorage.getItem("sezrFocusVideo");const e=toEmbed(url);if(e&&frame&&box){frame.src=e;box.classList.add("show");box.scrollIntoView({behavior:"smooth",block:"center"});}};}if(pause){pause.onclick=()=>running=false;}if(reset){reset.onclick=()=>{running=false;total=25*60;render();};}render();})();
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));}








/* SEZR FOCUS MP3 + GÖRSEL SEÇİM JS */
(function(){
  const timer=document.getElementById("focusTimer"), status=document.getElementById("focusStatus"), pill=document.getElementById("focusSessionPill"), title=document.getElementById("focusModeTitle"), now=document.getElementById("focusNowPlaying"), input=document.getElementById("focusVideoUrl"), frame=document.getElementById("focusVideoFrame"), screen=document.getElementById("focusMainScreen"), visual=document.getElementById("focusVisualLayer"), ring=document.getElementById("focusTimerRing"), quote=document.getElementById("focusQuote"), audio=document.getElementById("focusAudio"), audioNote=document.getElementById("focusAudioNote"), screenTimer=document.getElementById("focusScreenTimer"), rain=document.getElementById("focusWindowRain");
  if(!timer||!visual)return;
  let work=25, brk=5, total=work*60, running=false;
  let selectedAudio="focus-piano.mp3", selectedSound="piano";
  const quotes=["Bir soru daha çöz.","Telefonu bırak, hedefe bak.","Bugünün emeği yarının gücü.","Zor soru yok, eksik tekrar var.","5 dakika daha dayan."];

  function embed(url){try{const u=new URL(url);let id="";if(u.hostname.includes("youtu.be"))id=u.pathname.replace("/","");else if(u.searchParams.get("v"))id=u.searchParams.get("v");else if(u.pathname.includes("/embed/"))id=u.pathname.split("/embed/")[1];id=(id||"").split("?")[0].split("&")[0];return id?"https://www.youtube.com/embed/"+id+"?rel=0&modestbranding=1&playsinline=1":"";}catch(e){return"";}}
  function render(){const val=String(Math.floor(total/60)).padStart(2,"0")+":"+String(total%60).padStart(2,"0");timer.textContent=val;if(screenTimer)screenTimer.textContent=val;if(pill)pill.textContent=work+" / "+brk;}
  function stopAudio(reset){if(audio){audio.pause();if(reset)audio.currentTime=0;}}
  function setSession(w,b){work=Number(w);brk=Number(b);total=work*60;running=false;stopAudio(false);if(status)status.textContent="Süre seçildi";render();}
  function setBg(bg,img,t){visual.classList.remove("bg-desk","bg-rain","bg-space","bg-minimal");visual.classList.add("bg-"+bg);if(img)visual.style.setProperty("--focus-bg-img",'url("'+img+'")');if(screen)screen.classList.remove("video-on");if(now)now.textContent=(t||"Çalışma atmosferi")+" seçildi";if(rain){rain.classList.toggle("active",bg==="rain");}}
  function setView(v){if(!ring)return;ring.classList.remove("view-compact","view-large","view-clean");if(v!=="circle")ring.classList.add("view-"+v);}
  function playAudio(){if(!audio||!selectedAudio)return;audio.src=selectedAudio;audio.loop=true;audio.currentTime=0;audio.play().then(()=>{if(audioNote)audioNote.textContent="Müzik çalışma süresi boyunca çalacak.";}).catch(()=>{if(audioNote)audioNote.textContent="Müziği başlatmak için tekrar Başlat'a dokunman gerekebilir.";});}
  function loadVideo(url,label){const e=embed(url);if(!e){alert("Geçerli bir YouTube linki yapıştır.");return false;}if(frame)frame.src=e;if(screen)screen.classList.add("video-on");localStorage.setItem("sezrFocusVideo",url);if(now)now.textContent=label||"YouTube çalışma videosu";return true;}
  function start(){running=true;if(status)status.textContent="Odak modu aktif";if(quote)quote.textContent=quotes[Math.floor(Math.random()*quotes.length)];if(selectedSound==="youtube"){const url=(input&&input.value.trim())||localStorage.getItem("sezrFocusVideo");if(url)loadVideo(url,"YouTube Focus");stopAudio(true);}else{if(screen)screen.classList.remove("video-on");playAudio();}}
  setInterval(()=>{if(running&&total>0){total--;render();if(total===0){running=false;stopAudio(true);if(status)status.textContent="Mola zamanı 🎉";}}},1000);
  if(input)input.value=localStorage.getItem("sezrFocusVideo")||"";
  const fs=document.getElementById("focusStart"), fp=document.getElementById("focusPause"), fr=document.getElementById("focusReset"), fsave=document.getElementById("focusSave");
  if(fs)fs.onclick=start;if(fp)fp.onclick=()=>{running=false;stopAudio(false);if(status)status.textContent="Duraklatıldı";};if(fr)fr.onclick=()=>{running=false;total=work*60;stopAudio(true);if(status)status.textContent="Odak modu hazır";render();};if(fsave)fsave.onclick=()=>{if(input&&input.value.trim()){selectedSound="youtube";document.querySelectorAll(".focus-sound-choice").forEach(b=>b.classList.remove("active"));loadVideo(input.value.trim(),"YouTube Focus");}};
  document.querySelectorAll(".focus-choice").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".focus-choice").forEach(b=>b.classList.remove("active"));btn.classList.add("active");setSession(btn.dataset.work,btn.dataset.break);});
  document.querySelectorAll(".focus-sound-choice").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".focus-sound-choice").forEach(b=>b.classList.remove("active"));btn.classList.add("active");selectedSound=btn.dataset.sound;selectedAudio=btn.dataset.audio||"";stopAudio(true);if(audioNote)audioNote.textContent=selectedAudio?"Seçilen müzik sayaç bitene kadar döngüde çalar.":"Sessiz odak modu seçildi.";if(status)status.textContent=btn.textContent+" seçildi";});
  document.querySelectorAll(".focus-view-choice").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".focus-view-choice").forEach(b=>b.classList.remove("active"));btn.classList.add("active");setView(btn.dataset.view);});
  document.querySelectorAll(".atmo-card").forEach(card=>card.onclick=()=>{document.querySelectorAll(".atmo-card").forEach(c=>c.classList.remove("active"));card.classList.add("active");setBg(card.dataset.bg,card.dataset.img,card.dataset.title);});
  document.querySelectorAll(".focus-mode-card").forEach(card=>card.onclick=()=>{document.querySelectorAll(".focus-mode-card").forEach(c=>c.classList.remove("active"));card.classList.add("active");if(card.dataset.work && card.dataset.break){setSession(card.dataset.work,card.dataset.break);}setBg(card.dataset.bg||"desk",card.dataset.img||"focus-desk.png",card.dataset.title);if(title)title.textContent=card.dataset.title||"Odak Modu";selectedAudio=card.dataset.audio||"";selectedSound=card.dataset.sound||"silent";document.querySelectorAll(".focus-sound-choice").forEach(b=>b.classList.remove("active"));const m=document.querySelector('.focus-sound-choice[data-audio="'+selectedAudio+'"]')||document.querySelector('.focus-sound-choice[data-sound="'+selectedSound+'"]');if(m)m.classList.add("active");if(status)status.textContent=(card.dataset.title||"Mod")+" seçildi";});
  setBg("desk","focus-desk.png","Loş Masa");render();
})();


/* FOCUS SES FALLBACK + ORTA SAYAÇ KAPALI */
(function(){
  const audio=document.getElementById("focusAudio");
  const audioNote=document.getElementById("focusAudioNote");
  if(!audio) return;
  const fallbackList=["focus-piano.mp3","focus-relax.mp3","focus-jazz.mp3"];
  let failCount=0;
  audio.addEventListener("error",function(){
    failCount++;
    if(failCount<=fallbackList.length){
      const next=fallbackList[failCount-1];
      audio.src=next;
      audio.loop=true;
      audio.play().catch(function(){});
      if(audioNote) audioNote.textContent="Seçilen dosya bulunamadı, yedek müzik deneniyor.";
    }else{
      if(audioNote) audioNote.textContent="Bu müzik dosyası bulunamadı. MP3 adlarını kontrol et.";
    }
  });
  document.querySelectorAll(".focus-sound-choice,.focus-mode-card").forEach(function(btn){
    btn.addEventListener("click",function(){failCount=0;});
  });
})();

/* FOCUS TAM EKRAN + HIZLI SES BAŞLATMA */
(function(){
  const stage=document.querySelector(".focus-stage-card");
  const btn=document.getElementById("focusFullscreenBtn");
  const timer=document.getElementById("focusTimer");
  const audio=document.getElementById("focusAudio");
  const warm=document.getElementById("focusAudioWarmup");

  if(stage&&timer){
    function sync(){stage.setAttribute("data-fullscreen-time",timer.textContent||"25:00");}
    sync();
    new MutationObserver(sync).observe(timer,{childList:true,subtree:true,characterData:true});
  }
  if(btn&&stage){
    btn.addEventListener("click",function(){
      const active=stage.classList.toggle("focus-fullscreen-active");
      document.body.classList.toggle("focus-lock-scroll",active);
      btn.textContent=active?"✕ Kapat":"⛶ Tam Ekran";
      if(active&&stage.requestFullscreen){stage.requestFullscreen().catch(function(){});}
      else if(!active&&document.fullscreenElement&&document.exitFullscreen){document.exitFullscreen().catch(function(){});}
    });
    document.addEventListener("fullscreenchange",function(){
      if(!document.fullscreenElement&&stage.classList.contains("focus-fullscreen-active")){
        stage.classList.remove("focus-fullscreen-active");
        document.body.classList.remove("focus-lock-scroll");
        btn.textContent="⛶ Tam Ekran";
      }
    });
  }
  function warmAudio(src){if(!warm||!src)return;try{warm.src=src;warm.load();}catch(e){}}
  document.querySelectorAll(".focus-sound-choice,.focus-mode-card").forEach(function(el){
    el.addEventListener("click",function(){warmAudio(el.dataset.audio||"");});
  });
  const start=document.getElementById("focusStart");
  if(start&&audio){start.addEventListener("click",function(){try{if(audio.src)audio.load();}catch(e){}},true);}
})();


/* FOCUS TAM EKRAN BİLGİ ÇUBUĞU OTOMATİK GİZLE */
(function(){
  const stage = document.querySelector(".focus-stage-card");
  const topbar = stage ? stage.querySelector(".focus-stage-top") : null;
  const fullscreenBtn = document.getElementById("focusFullscreenBtn");

  if(!stage || !topbar) return;

  let hideTimer = null;

  function isFull(){
    return stage.classList.contains("focus-fullscreen-active");
  }

  function showFsUi(){
    if(!isFull()) return;
    clearTimeout(hideTimer);
    topbar.classList.remove("fs-ui-hidden");
    topbar.classList.add("fs-ui-visible");
    stage.classList.remove("fs-clean");

    hideTimer = setTimeout(function(){
      if(isFull()){
        topbar.classList.remove("fs-ui-visible");
        topbar.classList.add("fs-ui-hidden");
        stage.classList.add("fs-clean");
      }
    }, 3000);
  }

  function stopFsUi(){
    clearTimeout(hideTimer);
    topbar.classList.remove("fs-ui-hidden","fs-ui-visible");
    stage.classList.remove("fs-clean");
  }

  document.addEventListener("fullscreenchange", function(){
    if(document.fullscreenElement){
      showFsUi();
    }else{
      stopFsUi();
    }
  });

  if(fullscreenBtn){
    fullscreenBtn.addEventListener("click", function(){
      setTimeout(function(){
        if(isFull()) showFsUi();
      }, 250);
    });
  }

  ["mousemove","touchstart","click"].forEach(function(evt){
    stage.addEventListener(evt, function(){
      if(isFull()) showFsUi();
    }, {passive:true});
  });

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape") stopFsUi();
  });
})();


/* GENEL SON TARAMA KORUMA KATMANI */
(function(){
  document.querySelectorAll('a[href="#"],a[href=""]').forEach(function(a){
    a.addEventListener("click",function(e){e.preventDefault();});
  });
  const audio=document.getElementById("focusAudio");
  const note=document.getElementById("focusAudioNote");
  if(audio&&note&&!audio.dataset.guardReady){
    audio.dataset.guardReady="1";
    audio.addEventListener("error",function(){
      note.textContent="Müzik dosyası bulunamadı. MP3 dosyasının adı GitHub’da doğru olmalı.";
    });
  }
  if("serviceWorker" in navigator && navigator.serviceWorker.getRegistration){
    navigator.serviceWorker.getRegistration().then(function(reg){if(reg)reg.update().catch(function(){});});
  }
})();
