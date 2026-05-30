/* ===== Pitwall · conmutador de plataforma (Móvil / Web) ===== */
(function(){
  var root=document.documentElement;
  function getV(){try{return localStorage.getItem('pitwall-view');}catch(e){return null;}}
  function setV(v){try{localStorage.setItem('pitwall-view',v);}catch(e){}}

  // vista inicial: guardada, o por tamaño de pantalla
  var view=getV()||(window.innerWidth>=1024?'web':'phone');
  root.setAttribute('data-view',view);

  function sync(v){
    var btns=document.querySelectorAll('.plat-toggle button');
    for(var i=0;i<btns.length;i++) btns[i].classList.toggle('on',btns[i].getAttribute('data-v')===v);
  }
  function apply(v){ root.setAttribute('data-view',v); setV(v); sync(v); }

  function ensureSideBrand(){
    var ni=document.querySelector('.nav-inner');
    if(ni && !ni.querySelector('.side-brand')){
      var d=document.createElement('div');
      d.className='side-brand';
      d.innerHTML='<span class="brand-tab"></span>PITWALL';
      ni.insertBefore(d, ni.firstChild);
    }
  }
  function buildToggle(){
    var right=document.querySelector('.topbar-right');
    if(!right || right.querySelector('.plat-toggle')) return;
    var wrap=document.createElement('div');
    wrap.className='plat-toggle';
    wrap.innerHTML=
      '<button data-v="phone" aria-label="Vista móvil" title="Móvil"><svg viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2.6"/><path d="M10.5 18.5h3"/></svg></button>'+
      '<button data-v="web" aria-label="Vista web" title="Web"><svg viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg></button>';
    right.insertBefore(wrap, right.firstChild);
    wrap.addEventListener('click',function(e){
      var b=e.target.closest('button'); if(!b) return;
      apply(b.getAttribute('data-v'));
    });
    sync(root.getAttribute('data-view'));
  }

  function init(){ buildToggle(); ensureSideBrand(); }
  if(document.readyState!=='loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
