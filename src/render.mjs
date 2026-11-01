import { readFileSync } from 'node:fs';
import path from 'node:path';
import { escapeHtml as esc, translated as t, localized, languageAttrs, languageText, assetData, assetPath } from './content.mjs';

const external = 'target="_blank" rel="noopener noreferrer"';
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';
const byDate = (a,b) => (b.date || '').localeCompare(a.date || '') || a.id.localeCompare(b.id);
const byPaperOrder = (a,b) => {
  const aOrder=a.order ?? Infinity,bOrder=b.order ?? Infinity;
  return aOrder===bOrder?byDate(a,b):aOrder-bOrder;
};
export function visiblePapers(papers) { return papers.filter(p=>p.published!==false).toSorted(byPaperOrder); }
export function visibleResearch(data) {
  return [...data.papers.map(p=>({...p,type:'paper'})),...(data.posts || []).map(p=>({...p,type:'post'}))]
    .filter(p=>p.published!==false).toSorted(byPaperOrder);
}

function dateCopy(value) {
  const date=new Date(value+'T00:00:00Z');
  return {en:date.toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).toUpperCase(),zh:`${date.getUTCFullYear()} 年 ${date.getUTCMonth()+1} 月`};
}

function contacts(contact,prefix) {
  return `<button class="contact-reveal" type="button" aria-expanded="false" aria-controls="${prefix}-email">${t('span',{en:'Email',zh:'邮箱'},'class="color-word"')}</button><span class="contact-value" id="${prefix}-email" hidden>: <a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></span>${t('span',{en:' or ',zh:' 或 '})}<button class="contact-reveal" type="button" aria-expanded="false" aria-controls="${prefix}-wechat">${t('span',{en:'WeChat',zh:'微信'},'class="color-word"')}</button><span class="contact-value" id="${prefix}-wechat" hidden>: ${esc(contact.wechat)}</span>${t('span',{en:'.',zh:'。'})}`;
}

export function renderPeople(people,root) {
  return people.filter(p=>p.visible!==false).map(p=>{
    const initials=p.initials || p.name.split(/\s+/).map(x=>x[0]).slice(0,2).join('');
    const avatar=p.photo ? `<img class="person-photo" src="${assetData(root,p.photo)}" alt="${esc(p.name)}" loading="lazy">` : `<div class="initials" aria-hidden="true">${esc(initials)}</div>`;
    const name=p.website ? `<a href="${esc(p.website)}" ${external}>${esc(p.name)} <span class="arrow person-arrow" aria-hidden="true">↗</span></a>`:esc(p.name);
    const profile=p.website && p.showProfileLink ? t('a',{en:'Personal website ↗',zh:'个人主页 ↗'},`class="profile" href="${esc(p.website)}" ${external}`):'';
    return `<article class="person" id="person-${p.id}">${avatar}<h3>${name}</h3>${p.role?t('p',p.role,'class="role"'):''}${t('p',p.bio,p.role?'':'class="bio-without-role"')}${profile}</article>`;
  }).join('\n');
}

function cover(p,root) {
  const c=p.cover || {kind:'text',title:localized(p.title).en,eyebrow:''};
  if(c.kind==='image'){
    const imageId=`cover-${p.id}`;
    const poster=c.poster?` data-poster="${assetData(root,c.poster)}"`:'';
    const toggle=c.poster?t('button',{en:'Pause animation',zh:'暂停动图'},`class="paper-motion-toggle" type="button" aria-controls="${imageId}" hidden`):'';
    return `<div class="paper-art paper-art--image"><img id="${imageId}" src="${assetData(root,c.image)}"${poster} alt="${esc(c.alt)}" loading="lazy" decoding="async">${toggle}</div>`;
  }
  const diagram=c.kind==='architecture'?'<div class="arch"><div class="arch-col"><div class="arch-cell">z₁</div><div class="arch-cell">z₂</div><div class="arch-cell">z₃</div></div><span class="arch-arrow">→</span><div class="arch-col"><div class="arch-cell dark">Norm</div><div class="arch-cell dark">Attn</div><div class="arch-cell dark">FFN</div></div><span class="arch-arrow">→</span><div class="arch-col"><div class="arch-cell">p(x₁)</div><div class="arch-cell">p(x₂)</div><div class="arch-cell">p(x₃)</div></div></div>':'';
  return `<div class="paper-art" aria-hidden="true"><div><p class="eyebrow">${esc(c.eyebrow)}</p><div class="art-title" style="margin-top:20px">${esc(c.title)}</div></div>${diagram}${c.captionLines?.length?`<p class="art-caption">${c.captionLines.map(esc).join('<br>')}</p>`:''}</div>`;
}

export function renderPaper(p,root,{featured=false}={}) {
  const dateLabel=dateCopy(p.date);
  const title=p.links[0]?t('a',p.title,`href="${esc(p.links[0].url)}" ${external}`):t('span',p.title);
  const links=p.links.map(l=>`<a class="text-link" href="${esc(l.url)}" ${external}>${t('span',l.label)} ${arrow}</a>`).join('');
  const bibId=`bib-${p.id}`;
  const bibButton=p.bibtex?`<button class="bib-toggle" type="button" aria-expanded="false" aria-controls="${bibId}">BibTeX +</button>`:'';
  let results='';
  if(p.results){const r=p.results;results=`<details class="paper-extra">${t('summary',r.summary)}<div class="metrics-scroll"><table class="metrics">${t('caption',r.caption,'class="metric-caption"')}<thead><tr>${r.columns.map(c=>t('th',c,'scope="col"')).join('')}</tr></thead><tbody>${r.rows.map(row=>'<tr>'+row.map(v=>`<td>${esc(v)}</td>`).join('')+'</tr>').join('')}</tbody></table></div>${t('p',r.note,'class="metric-note"')}</details>`;}
  const abstract=`<details class="paper-abstract"${featured?' open':''}>${t('summary',{en:'Abstract',zh:'研究摘要'})}${t('p',p.summary,'class="paper-description"')}</details>`;
  return `<article class="paper${featured?' paper--featured':''}" id="paper-${p.id}">${cover(p,root)}<div class="paper-content"><div class="paper-meta">${t('time',dateLabel,`datetime="${p.date}"`)}${t('span',p.status,'class="tag"')}</div><h3>${title}</h3><p class="authors">${p.authors.map(esc).join(', ')}</p>${abstract}<div class="paper-actions">${links}${bibButton}</div>${p.bibtex?`<pre class="bib" id="${bibId}" hidden>${esc(p.bibtex)}</pre>`:''}${results}</div></article>`;
}

export function renderPost(p,root,{featured=false}={}) {
  const href=`posts/${p.id}/index.html`;
  const chineseHref=p.chineseSource?`posts/${p.id}/zh.html`:href;
  const linkAttrs=`href="${href}"`+(p.chineseSource?` data-en-href="${href}" data-zh-href="${chineseHref}"`:'');
  const date=p.date?t('time',dateCopy(p.date),`datetime="${p.date}"`):'';
  const reading=p.readingMinutes?t('span',{en:`${p.readingMinutes} min read`,zh:`阅读约 ${p.readingMinutes} 分钟`}):'';
  const linkLabel=p.linkLabel || {en:'Read the post',zh:'阅读全文'};
  const authors=p.authors?.length?`<p class="authors">${p.authors.map(esc).join(', ')}</p>`:'';
  const series=p.series?t('span',{en:`Part ${p.series.part} of ${p.series.total}`,zh:`第 ${p.series.part} 篇 / 共 ${p.series.total} 篇`}):'';
  const alternate=p.chineseSource?`<a class="text-link" href="${chineseHref}" data-en-href="${chineseHref}" data-zh-href="${href}">${t('span',{en:'Read in Chinese',zh:'English version'})} ${arrow}</a>`:'';
  return `<article class="paper post${featured?' paper--featured':''}" id="post-${p.id}">${cover(p,root)}<div class="paper-content"><div class="paper-meta">${t('span',p.status,'class="tag"')}${series}${reading}${date}</div><h3>${t('a',p.title,linkAttrs)}</h3>${authors}${t('p',p.summary,'class="paper-description post-description"')}<div class="paper-actions"><a class="text-link" ${linkAttrs}>${t('span',linkLabel)} ${arrow}</a>${alternate}</div></div></article>`;
}

export function renderPage(data,root) {
  const {site,home}=data;
  const originalLogo=readFileSync(assetPath(root,site.logo),'utf8').trim();
  // Namespacing keeps logo gradients/labels separate from the interactive figure.
  const logo=originalLogo.replace(/<\?xml[^>]*\?>/g,'').replace(/\b(?:role|aria-labelledby|aria-label)="[^"]*"/g,'')
    .replace('<svg ','<svg aria-hidden="true" focusable="false" ')
    .replace(/id="([^"]+)"/g,'id="brand-$1"').replace(/url\(#([^)]+)\)/g,'url(#brand-$1)');
  const papers=visiblePapers(data.papers);
  const research=visibleResearch(data);
  const latestPaper=papers.toSorted(byDate)[0];
  const slots={
    styles:readFileSync(path.join(root,'src/styles.css'),'utf8'),
    client:readFileSync(path.join(root,'src/client.js'),'utf8'),
    logo, favicon:'data:image/svg+xml,'+encodeURIComponent(originalLogo),
    pageTitle:esc(site.title),description:esc(site.description),socialDescription:esc(site.socialDescription),siteName:esc(site.name),brandName:esc(site.brandName),brandSubtitle:esc(site.brandSubtitle),copyrightYear:site.copyrightYear,
    email:esc(site.contact.email),wechat:esc(site.contact.wechat),
    heroBullets:home.heroBullets.map((b,i)=>`<li>${t('span',b.text)}${b.showContacts?contacts(site.contact,`hero-${i}`):''}</li>`).join('\n'),
    latestPaperHref:latestPaper?`#paper-${latestPaper.id}`:'#publications',
    aboutIntroduction:home.heroBullets.slice(0,2).map(b=>t('p',b.text)).join('\n'),
    peopleContext:home.heroBullets[2]?t('p',home.heroBullets[2].text):'',
    participationWelcome:home.heroBullets.slice(3).map((b,i)=>`<p>${t('span',b.text)}${b.showContacts?contacts(site.contact,`welcome-${i}`):''}</p>`).join('\n'),
    topics:home.topics.map(r=>`<article class="research-row"><div class="topic-symbol" aria-hidden="true"><i></i><i></i><i></i><i></i></div>${t('h3',r.title)}${t('p',r.description)}<span class="research-tag">${(r.tagLines||[]).map(esc).join(' ')}</span></article>`).join('\n'),
    openSourceGoals:home.openSourceGoals.map(g=>`<div class="agenda-step">${t('h3',g.title)}${t('p',g.description)}</div>`).join(''),
    joinPaths:home.joinPaths.map(g=>`<article>${t('h3',g.title)}${t('p',g.description)}</article>`).join(''),
    people:renderPeople(data.people,root),
    papers:research.length?research.map((p,i)=>p.type==='post'?renderPost(p,root,{featured:i===0}):renderPaper(p,root,{featured:i===0})).join('\n'):t('p',{en:'New research will be shared here.',zh:'新的研究成果将在这里发布。'},'class="muted"'),
    news:data.news.filter(n=>n.visible!==false).toSorted(byDate).map(n=>`<div class="news-line" id="news-${n.id}"><time class="news-date" datetime="${n.date}">${n.date.replaceAll('-','.')}</time><p>${n.url?t('a',n.text,`href="${esc(n.url)}" ${external}`):t('span',n.text)}</p></div>`).join('\n')
  };
  const template=readFileSync(path.join(root,'src/template.html'),'utf8');
  const output=template.replace(/\{\{(?:(attrs|text):)?([A-Za-z][\w]*)\}\}/g,(_,mode,key)=>{
    if(mode){const value=home.copy[key];if(!value)throw new Error(`Missing home.copy.${key}`);return mode==='attrs'?languageAttrs(value):languageText(value);}
    if(!(key in slots))throw new Error(`Unknown template slot: ${key}`);return slots[key];
  });
  return output.replace('<!doctype html>','<!doctype html>\n<!-- Generated by npm run build. Edit content/ and src/, not this file. -->');
}
