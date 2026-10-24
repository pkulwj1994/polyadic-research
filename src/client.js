(()=>{
    'use strict';
    const langBtn=document.querySelector('#language');
    const menu=document.querySelector('.menu-btn');
    const nav=document.querySelector('#navigation');
    function setLang(lang){
      document.documentElement.lang=lang==='zh'?'zh-CN':'en';
      document.querySelectorAll('[data-en]').forEach(el=>{el.textContent=el.dataset[lang]||el.dataset.en;});
      document.querySelectorAll('[data-en-html]').forEach(el=>{el.innerHTML=el.getAttribute('data-'+lang+'-html')||el.getAttribute('data-en-html');});
      langBtn.textContent=lang==='zh'?'EN':'中文';langBtn.setAttribute('aria-label',lang==='zh'?'Switch to English':'切换为中文');
      document.querySelector('#refinement').setAttribute('aria-label',lang==='zh'?'共同迭代进度':'Refinement progress');
      document.querySelector('#play').setAttribute('aria-label',lang==='zh'?'播放迭代动画':'Play refinement animation');
      try{localStorage.setItem('polyadic-language',lang);}catch{}
    }
    langBtn.addEventListener('click',()=>setLang(document.documentElement.lang==='en'?'zh':'en'));
    try{if(localStorage.getItem('polyadic-language')==='zh')setLang('zh');}catch{}
    menu.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');menu.setAttribute('aria-expanded',String(open));});
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');}});
    document.querySelectorAll('.bib-toggle').forEach(button=>button.addEventListener('click',()=>{const box=document.getElementById(button.getAttribute('aria-controls'));box.hidden=!box.hidden;button.setAttribute('aria-expanded',String(!box.hidden));button.textContent=box.hidden?'BibTeX +':'BibTeX −';}));
    document.querySelectorAll('.contact-reveal').forEach(button=>button.addEventListener('click',()=>{const value=document.getElementById(button.getAttribute('aria-controls'));value.hidden=!value.hidden;button.setAttribute('aria-expanded',String(!value.hidden));}));
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
    document.querySelectorAll('.paper-motion-toggle').forEach(button=>{
      const img=document.getElementById(button.getAttribute('aria-controls'));
      const poster=img.getAttribute('src'),animation=img.dataset.animation;
      let playing=false;
      function showMotion(shouldPlay){
        playing=shouldPlay;img.src=playing?animation:poster;
        button.dataset.en=playing?'Pause animation':'Play animation';
        button.dataset.zh=playing?'暂停动图':'播放动图';
        button.textContent=document.documentElement.lang==='zh-CN'?button.dataset.zh:button.dataset.en;
      }
      button.hidden=false;showMotion(!reducedMotion.matches);
      button.addEventListener('click',()=>showMotion(!playing));
      reducedMotion.addEventListener('change',event=>{if(event.matches)showMotion(false);});
    });
    const ns='http://www.w3.org/2000/svg',paths=[],circles=[];
    for(let i=0;i<48;i++){const p=document.createElementNS(ns,'path');p.setAttribute('stroke-width',i%5===0?'1.4':'.75');document.querySelector('#streams').append(p);paths.push(p);const c=document.createElementNS(ns,'circle');document.querySelector('#nodes').append(c);circles.push(c);}
    const slider=document.querySelector('#refinement'),output=document.querySelector('#progress'),play=document.querySelector('#play');let raf=null,playing=false;
    function draw(value){const t=value/100;output.value=t.toFixed(2);output.textContent=t.toFixed(2);paths.forEach((path,i)=>{const group=i%4,target=80+group*112;const sx=34+(i*73.13)%430,sy=22+(i*19.79)%50;const wander=Math.sin(i*3.71)*84*(1-t);const ex=target+Math.cos(i*1.63)*(27*(1-t)+7),ey=255+Math.sin(i*1.7)*(29*(1-t)+4);path.setAttribute('d',`M${sx.toFixed(2)},${sy.toFixed(2)} C${(sx+wander).toFixed(2)},${110-t*15} ${(ex+wander).toFixed(2)},${180+t*35} ${ex.toFixed(2)},${ey.toFixed(2)}`);const x=sx+(ex-sx)*t+Math.sin(t*Math.PI)*wander,y=sy+(ey-sy)*t;const c=circles[i];c.setAttribute('cx',x.toFixed(2));c.setAttribute('cy',y.toFixed(2));c.setAttribute('r',i%4===0?'3.2':'2');c.setAttribute('fill',i%4===0?'#2642d5':'#7f927a');c.setAttribute('opacity',String(.35+t*.55));});document.querySelectorAll('.field-output span').forEach(el=>el.style.opacity=String(.15+.85*t));}
    function stop(){if(raf!==null)cancelAnimationFrame(raf);raf=null;playing=false;play.textContent='▶';play.setAttribute('aria-pressed','false');}
    slider.addEventListener('input',()=>{stop();draw(Number(slider.value));});
    play.addEventListener('click',()=>{if(playing){stop();return;}playing=true;play.textContent='Ⅱ';play.setAttribute('aria-pressed','true');const start=performance.now(),duration=5000;slider.value='0';draw(0);function tick(now){const v=Math.min(100,(now-start)/duration*100);slider.value=String(v);draw(v);if(v<100)raf=requestAnimationFrame(tick);else stop();}raf=requestAnimationFrame(tick);});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});draw(Number(slider.value));
  })();
