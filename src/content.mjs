import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function richText(value) {
  // Homepage copy may use these small, explicitly supported formatting tags.
  for (const tag of String(value).match(/<[^>]*>/g) || []) {
    if (!/^<(?:br\s*\/?|\/?(?:em|strong)|\/span|span class=["']color-word(?: color-word--(?:teal|warm))?["'])>$/.test(tag)) {
      throw new Error(`Unsupported rich-text tag: ${tag}. Use span.color-word, em, strong or br.`);
    }
  }
  return String(value);
}

export function localized(value) {
  if (typeof value === 'string') return { en: value, zh: value };
  return { ...value, zh: value.zh || value.en };
}
export function languageAttrs(value) {
  const v = localized(value), suffix = v.html ? '-html' : '';
  return `data-en${suffix}="${escapeHtml(v.en)}" data-zh${suffix}="${escapeHtml(v.zh)}"`;
}
export function languageText(value) {
  const v = localized(value);
  return v.html ? richText(v.en) : escapeHtml(v.en);
}
export function translated(tag, value, attrs = '') {
  return `<${tag}${attrs ? ' '+attrs : ''} ${languageAttrs(value)}>${languageText(value)}</${tag}>`;
}

export function assetPath(root, value) {
  if (typeof value !== 'string' || !/^assets\//.test(value) || value.includes('\\') || value.split('/').some(part => part === '..' || part === '.')) {
    throw new Error(`Asset path must stay inside assets/: ${value}`);
  }
  const absolute = path.resolve(root, value);
  if (!absolute.startsWith(path.resolve(root, 'assets')+path.sep)) throw new Error(`Invalid asset: ${value}`);
  if (!existsSync(absolute) || !statSync(absolute).isFile()) throw new Error(`Missing asset: ${value}`);
  return absolute;
}
const imageMime = {'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};
export function assetData(root, value) {
  const file = assetPath(root, value);
  const mime = imageMime[path.extname(file).toLowerCase()];
  if (!mime) throw new Error(`Unsupported image: ${value}`);
  return `data:${mime};base64,${readFileSync(file).toString('base64')}`;
}

export function loadContent(root) {
  const json = file => {
    try { return JSON.parse(readFileSync(path.join(root, file), 'utf8')); }
    catch (error) { throw new Error(`${file}: ${error.message}`); }
  };
  return {
    site: json('content/site.json'), home: json('content/home.json'),
    people: json('content/people.json'), news: json('content/news.json'),
    papers: readdirSync(path.join(root,'content/papers')).filter(name => name.endsWith('.json')).sort()
      .map(name => ({...json(`content/papers/${name}`), _file: `content/papers/${name}`}))
  };
}

export function validateContent(data, root) {
  const errors = [];
  const fail = (at, message) => errors.push(`${at}: ${message}`);
  const text = (value, at, optional=false) => {
    if (optional && (value === undefined || value === '')) return;
    if (typeof value !== 'string' || !value.trim()) fail(at, 'must be a nonempty string');
  };
  const array = (value, at, nonempty=false) => {
    if (!Array.isArray(value)) { fail(at, 'must be an array'); return []; }
    if (nonempty && !value.length) fail(at, 'must have at least one item');
    return value;
  };
  const bi = (value, at) => {
    if (typeof value === 'string') { text(value,at); return; }
    if (!value || typeof value !== 'object' || Array.isArray(value)) { fail(at,'use a string or {"en": "...", "zh": "..."}'); return; }
    text(value.en,`${at}.en`); if (value.zh !== undefined) text(value.zh,`${at}.zh`,true);
    if (value.html !== undefined && typeof value.html !== 'boolean') fail(at+'.html','must be true or false');
    if (value.html) for (const lang of ['en','zh']) if (value[lang]) {
      try { richText(value[lang]); } catch(error) { fail(`${at}.${lang}`,error.message); }
    }
  };
  const plainBi = (value, at) => { bi(value,at); if (value?.html) fail(at,'rich HTML is only supported in home.json'); };
  const bool = (value, at) => { if (value !== undefined && typeof value !== 'boolean') fail(at,'must be true or false'); };
  const id = (value, at) => { if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) fail(at,'use a unique lowercase slug, e.g. langdit-2026'); };
  const date = (value, at) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value) fail(at,'use a real date in YYYY-MM-DD format');
  };
  const asset = (value,at) => { try { assetPath(root,value); } catch(error) { fail(at,error.message); } };
  const image = (value,at) => { asset(value,at); if(typeof value==='string' && !imageMime[path.extname(value).toLowerCase()])fail(at,'use GIF, WebP, PNG, JPG or SVG'); };
  const url = (value, at, optional=false, local=false) => {
    if (optional && !value) return;
    if (local && typeof value==='string' && value.startsWith('assets/')) { asset(value,at); return; }
    try { const parsed = new URL(value); if (!['http:','https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error(); }
    catch { fail(at,'use an http(s) URL'+(local?' or an existing assets/ path':'')); }
  };
  const unique = (items, at) => { const seen=new Set(); for(const item of items) { if(seen.has(item.id)) fail(at,`duplicate id: ${item.id}`); seen.add(item.id); } };
  const site = data.site || {}, home=data.home || {};
  for (const key of ['title','description','socialDescription','name','brandName','brandSubtitle']) text(site[key],`site.${key}`);
  asset(site.logo,'site.logo'); if (!site.logo?.endsWith('.svg')) fail('site.logo','choose an SVG asset');
  if (!Number.isInteger(site.copyrightYear)) fail('site.copyrightYear','must be an integer');
  if (!/^[^\s<>"@]+@[^\s<>"@]+\.[^\s<>"@]+$/.test(site.contact?.email || '')) fail('site.contact.email','invalid email address');
  text(site.contact?.wechat,'site.contact.wechat');
  for(const [key,value] of Object.entries(home.copy || {})) bi(value,`home.copy.${key}`);
  array(home.heroBullets,'home.heroBullets',true).forEach((b,i)=>{bi(b.text,`home.heroBullets[${i}].text`);bool(b.showContacts,`home.heroBullets[${i}].showContacts`);});
  for (const key of ['topics','openSourceGoals','joinPaths']) array(home[key],`home.${key}`).forEach((entry,i)=>{
    bi(entry.title,`home.${key}[${i}].title`); bi(entry.description,`home.${key}[${i}].description`);
    if (entry.tagLines) array(entry.tagLines,`home.${key}[${i}].tagLines`).forEach((v,j)=>text(v,`home.${key}[${i}].tagLines[${j}]`));
  });
  const people=array(data.people,'people'); unique(people,'people');
  people.forEach((p,i)=>{const at=`people[${i}] (${p.id || '?'})`;id(p.id,at+'.id');text(p.name,at+'.name');text(p.initials,at+'.initials',true);if(p.role)plainBi(p.role,at+'.role');plainBi(p.bio,at+'.bio');url(p.website,at+'.website',true);bool(p.visible,at+'.visible');bool(p.showProfileLink,at+'.showProfileLink');if(p.photo)asset(p.photo,at+'.photo');});
  const papers=array(data.papers,'papers'); unique(papers,'papers');
  papers.forEach(p=>{
    const at=p._file || `paper ${p.id}`; id(p.id,at+'.id');bool(p.published,at+'.published');date(p.date,at+'.date');plainBi(p.title,at+'.title');plainBi(p.summary,at+'.summary');plainBi(p.status,at+'.status');
    if(p._file && path.basename(p._file)!==p.id+'.json')fail(at,'filename must match id + .json');
    array(p.authors,at+'.authors',p.published!==false).forEach((a,i)=>text(a,`${at}.authors[${i}]`));
    array(p.links,at+'.links',p.published!==false).forEach((l,i)=>{plainBi(l.label,`${at}.links[${i}].label`);url(l.url,`${at}.links[${i}].url`,false,true);});
    text(p.bibtex,at+'.bibtex',true);
    if(p.cover){
      if(!['text','architecture','image'].includes(p.cover.kind))fail(at+'.cover.kind','use text, architecture or image');
      if(p.cover.kind==='image'){
        image(p.cover.image,at+'.cover.image');text(p.cover.alt,at+'.cover.alt');
        if(p.cover.poster!==undefined){
          image(p.cover.poster,at+'.cover.poster');
          if(typeof p.cover.poster==='string' && /\.gif$/i.test(p.cover.poster))fail(at+'.cover.poster','use a still PNG, JPG, WebP or SVG');
        }
      }
      else {text(p.cover.title,at+'.cover.title');text(p.cover.eyebrow,at+'.cover.eyebrow',true);}
      if(p.cover.captionLines)array(p.cover.captionLines,at+'.cover.captionLines').forEach((s,i)=>text(s,`${at}.cover.captionLines[${i}]`));
    }
    if(p.results){const r=p.results;plainBi(r.summary,at+'.results.summary');plainBi(r.caption,at+'.results.caption');plainBi(r.note,at+'.results.note');const columns=array(r.columns,at+'.results.columns',true);columns.forEach((v,i)=>plainBi(v,`${at}.results.columns[${i}]`));array(r.rows,at+'.results.rows').forEach((row,i)=>{if(array(row,at+'.results.rows['+i+']').length!==columns.length)fail(at+'.results.rows['+i+']','cell count must match columns');});}
  });
  const news=array(data.news,'news');unique(news,'news');news.forEach((n,i)=>{id(n.id,`news[${i}].id`);date(n.date,`news[${i}].date`);plainBi(n.text,`news[${i}].text`);bool(n.visible,`news[${i}].visible`);if(n.url)url(n.url,`news[${i}].url`,false,true);});
  if(errors.length) throw new Error('Content validation failed:\n'+errors.map(e=>'  • '+e).join('\n'));
  return data;
}
