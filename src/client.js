(()=>{
  'use strict';
  document.documentElement.classList.add('js');
  const langBtn=document.querySelector('#language');
  const menu=document.querySelector('.menu-btn');
  const nav=document.querySelector('#navigation');
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let language='en',playing=false;
  const label=document.querySelector('#play-label'),icon=document.querySelector('#play-icon');
  const play=document.querySelector('#play'),slider=document.querySelector('#refinement'),output=document.querySelector('#progress');
  function playbackLabel(){
    label.textContent=playing?(language==='zh'?'暂停':'Pause'):(language==='zh'?'重新播放':'Replay');
    icon.textContent=playing?'Ⅱ':'↻';
    play.setAttribute('aria-label',playing?(language==='zh'?'暂停迭代动画':'Pause refinement animation'):(language==='zh'?'重新播放迭代动画':'Replay refinement animation'));
    play.setAttribute('aria-pressed',String(playing));
  }
  function setLang(lang){
    language=lang;
    document.documentElement.lang=lang==='zh'?'zh-CN':'en';
    document.querySelectorAll('[data-en]').forEach(el=>{el.textContent=el.dataset[lang]||el.dataset.en;});
    document.querySelectorAll('[data-en-html]').forEach(el=>{el.innerHTML=el.getAttribute('data-'+lang+'-html')||el.getAttribute('data-en-html');});
    document.querySelectorAll('[data-en-href]').forEach(el=>{el.setAttribute('href',el.getAttribute('data-'+lang+'-href')||el.getAttribute('data-en-href'));});
    langBtn.textContent=lang==='zh'?'EN':'中文';
    langBtn.setAttribute('aria-label',lang==='zh'?'Switch to English':'切换为中文');
    slider.setAttribute('aria-label',lang==='zh'?'共同迭代进度':'Refinement progress');
    document.querySelector('.field').setAttribute('aria-label',lang==='zh'?'多个状态共同迭代的概念示意':'Conceptual illustration of joint refinement');
    document.querySelector('#field-svg').setAttribute('aria-label',lang==='zh'?'多个连续状态共同迭代，形成四个词':'Multiple continuous token states are refined together into four words');
    nav.setAttribute('aria-label',lang==='zh'?'主导航':'Main navigation');
    playbackLabel();
    try{localStorage.setItem('polyadic-language',lang);}catch{}
  }
  langBtn.addEventListener('click',()=>setLang(language==='en'?'zh':'en'));
  try{if(localStorage.getItem('polyadic-language')==='zh')setLang('zh');}catch{}
  function closeMenu(){nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');}
  menu.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');menu.setAttribute('aria-expanded',String(open));});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
  document.querySelectorAll('.bib-toggle').forEach(button=>button.addEventListener('click',()=>{
    const box=document.getElementById(button.getAttribute('aria-controls'));box.hidden=!box.hidden;
    button.setAttribute('aria-expanded',String(!box.hidden));button.textContent=box.hidden?'BibTeX +':'BibTeX −';
  }));
  document.querySelectorAll('.contact-reveal').forEach(button=>button.addEventListener('click',()=>{
    const value=document.getElementById(button.getAttribute('aria-controls'));value.hidden=!value.hidden;button.setAttribute('aria-expanded',String(!value.hidden));
  }));
  // GIFs run only while their card is visible. A manual pause survives scrolling.
  const motionEntries=[];
  document.querySelectorAll('.paper-motion-toggle').forEach(button=>{
    const img=document.getElementById(button.getAttribute('aria-controls'));
    const animation=img.dataset.animation||img.getAttribute('src');
    const poster=img.dataset.poster||img.getAttribute('src');
    const target=img.closest('.paper-art'),bounds=target.getBoundingClientRect();
    const entry={button,img,poster,animation,visible:bounds.bottom>0&&bounds.top<window.innerHeight,mode:'auto',playing:img.getAttribute('src')===animation};
    function update(){
      const shouldPlay=entry.visible&&!document.hidden&&(entry.mode==='play'||(entry.mode==='auto'&&!reducedMotion.matches));
      if(entry.playing!==shouldPlay){img.src=shouldPlay?entry.animation:entry.poster;entry.playing=shouldPlay;}
      button.dataset.en=shouldPlay?'Pause animation':'Play animation';button.dataset.zh=shouldPlay?'暂停动图':'播放动图';
      button.textContent=language==='zh'?button.dataset.zh:button.dataset.en;
      button.setAttribute('aria-pressed',String(shouldPlay));
    }
    entry.update=update;button.hidden=false;
    button.addEventListener('click',()=>{entry.mode=entry.playing?'pause':'play';update();});
    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(items=>{entry.visible=items[0].isIntersecting;update();},{threshold:.1});observer.observe(target);
    }else{entry.visible=true;}
    update();motionEntries.push(entry);
  });
  const ns='http://www.w3.org/2000/svg',paths=[],circles=[];
  const streams=document.querySelector('#streams'),nodes=document.querySelector('#nodes');
  for(let i=0;i<56;i++){
    const path=document.createElementNS(ns,'path');path.setAttribute('stroke-width',i%7===0?'1.5':'.8');streams.append(path);paths.push(path);
    const circle=document.createElementNS(ns,'circle');nodes.append(circle);circles.push(circle);
  }
  function draw(value){
    const t=value/100;output.value=t.toFixed(2);output.textContent=t.toFixed(2);
    paths.forEach((path,i)=>{
      const target=125+(i%4)*250,sx=28+(i*137.13)%944,sy=12+(i*27.79)%46;
      const wander=Math.sin(i*3.71)*90*(1-t),ex=target+Math.cos(i*1.63)*(24*(1-t)+10),ey=235+Math.sin(i*1.7)*(20*(1-t)+5);
      const x1=sx+wander,y1=100,x2=ex+wander,y2=180;
      path.setAttribute('d',`M${sx},${sy} C${x1},${y1} ${x2},${y2} ${ex},${ey}`);
      const u=1-t,circle=circles[i];
      circle.setAttribute('cx',u*u*u*sx+3*u*u*t*x1+3*u*t*t*x2+t*t*t*ex);
      circle.setAttribute('cy',u*u*u*sy+3*u*u*t*y1+3*u*t*t*y2+t*t*t*ey);
      circle.setAttribute('r',i%7===0?'3.2':'1.9');circle.setAttribute('fill',i%4===0?'#0874d6':'#8870ca');circle.setAttribute('opacity',String(.25+t*.5));
    });
    document.querySelectorAll('.field-output span').forEach(el=>el.style.opacity=String(.3+.7*t));
  }
  let raf=null,autoStarted=false;
  function stop(){if(raf!==null)cancelAnimationFrame(raf);raf=null;playing=false;playbackLabel();}
  function start(){
    stop();autoStarted=true;
    if(reducedMotion.matches){slider.value='100';draw(100);return;}
    playing=true;playbackLabel();const startTime=performance.now(),duration=4200;slider.value='0';draw(0);
    function tick(now){const value=Math.min(100,(now-startTime)/duration*100);slider.value=String(value);draw(value);if(value<100)raf=requestAnimationFrame(tick);else stop();}
    raf=requestAnimationFrame(tick);
  }
  slider.addEventListener('input',()=>{autoStarted=true;stop();draw(Number(slider.value));});
  play.addEventListener('click',()=>playing?stop():start());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();motionEntries.forEach(entry=>entry.update());});
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){stop();slider.value='100';draw(100);}motionEntries.forEach(entry=>entry.update());});
  draw(Number(slider.value));playbackLabel();
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      const visible=entries[0].isIntersecting;
      if(visible&&!autoStarted&&!reducedMotion.matches)start();else if(!visible&&playing)stop();
    },{threshold:.25});observer.observe(document.querySelector('.field'));
  }
})();
