
/* SezR Premium V3 */

(function(){

const stats=document.querySelectorAll(".stat b");

stats.forEach(function(el){

const raw=el.textContent.trim();

if(raw==="1:1" || raw==="PDF" || raw==="2026") return;

});

document.querySelectorAll(".card,.premium-mini").forEach(function(card){

card.addEventListener("mousemove",function(e){

const rect=card.getBoundingClientRect();
const x=e.clientX-rect.left;
const y=e.clientY-rect.top;

card.style.background=
`radial-gradient(circle at ${x}px ${y}px,
rgba(250,204,21,.12),
rgba(255,255,255,.05) 40%)`;

});

card.addEventListener("mouseleave",function(){

card.style.background="";

});

});

})();
