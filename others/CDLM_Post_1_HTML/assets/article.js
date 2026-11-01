(() => {
  'use strict';
  const chinese=document.documentElement.lang.toLowerCase().startsWith('zh');
  const text=(en,zh)=>chinese?zh:en;
  document.querySelectorAll('[data-language-switch]').forEach(link=>link.addEventListener('click',()=>{
    const target=new URL(link.getAttribute('href'),window.location.href);
    target.hash=window.location.hash;
    link.href=target.href;
    try{localStorage.setItem('polyadic-language',link.hreflang.startsWith('zh')?'zh':'en');}catch{}
  }));
  const progress = document.querySelector('.reading-progress span');
  const sections = [...document.querySelectorAll('.article-section')];
  const tocLinks = [...document.querySelectorAll('.contents-details a')];
  const details = document.querySelector('.contents-details');
  const mobile = window.matchMedia('(max-width: 960px)');
  let busy = false;
  function updateReadingPosition() {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (available > 0 ? Math.min(100,Math.max(0,window.scrollY / available * 100)) : 100) + '%';
    let current = sections[0];
    for (const section of sections) if (section.getBoundingClientRect().top <= 170) current = section;
    tocLinks.forEach(link => {
      if (current && link.hash === '#' + current.id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    busy = false;
  }
  function onScroll() {
    if (!busy) { busy = true; requestAnimationFrame(updateReadingPosition); }
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  if (details) {
    details.open = !mobile.matches;
    mobile.addEventListener('change',() => { details.open = !mobile.matches; });
    tocLinks.forEach(link => link.addEventListener('click',() => { if (mobile.matches) details.open = false; }));
    document.querySelector('.header-actions a[href="#contents"]')?.addEventListener('click',() => { if (mobile.matches) details.open = true; });
  }
  document.querySelector('#print-article')?.addEventListener('click',()=>window.print());
  updateReadingPosition();
  const dialog = document.querySelector('#image-viewer');
  const dialogImage = dialog?.querySelector('img');
  const caption = dialog?.querySelector('.viewer-caption');
  document.querySelectorAll('.source-figure .figure-image').forEach((image,index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'figure-zoom';
    button.setAttribute('aria-label',text('Enlarge figure ','放大图 ') + (index + 1));
    button.innerHTML = text('Enlarge figure','放大图片') + ' <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2H2v4m8-4h4v4M2 10v4h4m8-4v4h-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
    image.insertAdjacentElement('afterend',button);
    button.addEventListener('click',() => {
      dialogImage.src = image.src;
      dialogImage.alt = image.alt;
      caption.textContent = image.closest('figure').querySelector('figcaption')?.textContent || '';
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else window.open(image.src,'_blank','noopener');
    });
  });
  document.querySelector('#close-viewer')?.addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('click',event => {
    if (event.target === dialog) {
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    }
  });
})();
