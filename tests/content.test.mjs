import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, rmSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { loadContent, validateContent, assetData } from '../src/content.mjs';
import { renderPage, visiblePapers } from '../src/render.mjs';
import { build, projectRoot } from '../scripts/build.mjs';

const paper = (id,date='2026-10-24')=>({id,date,published:true,title:`Paper ${id}`,authors:['A & B'],status:{en:'PREPRINT',zh:'预印本'},summary:{en:'English summary',zh:'中文摘要'},links:[{label:'Paper',url:'https://example.org/paper'}],bibtex:`@misc{${id}, title={Sample}}`,cover:{kind:'text',title:id}});
const base = ()=>({...loadContent(projectRoot),papers:[paper('first')],people:[],news:[]});

test('new papers sort by date, draft papers stay out, and BibTeX targets are independent',()=>{
  const data=base();data.papers=[paper('older','2025-02-01'),{...paper('draft'),published:false},paper('newer')];
  validateContent(data,projectRoot);
  assert.deepEqual(visiblePapers(data.papers).map(p=>p.id),['newer','older']);
  const html=renderPage(data,projectRoot);
  assert.ok(html.indexOf('id="paper-newer"')<html.indexOf('id="paper-older"'));
  assert.ok(!html.includes('id="paper-draft"'));
  for(const id of ['newer','older']){assert.ok(html.includes(`aria-controls="bib-${id}"`));assert.ok(html.includes(`id="bib-${id}" hidden`));}
  assert.ok(html.includes('A &amp; B'));
});

test('people updates preserve roster order, links, optional roles, and visibility',()=>{
  const data=base();
  data.people=[{id:'z-person',name:'Z Person',role:null,bio:{en:'New affiliation',zh:'新单位'},website:'https://example.org/z'},{id:'hidden',name:'Hidden Person',bio:'Hidden biography',visible:false},{id:'a-person',name:'A Person',role:'Contributor',bio:'Biography'}];
  const html=renderPage(validateContent(data,projectRoot),projectRoot);
  assert.ok(html.indexOf('person-z-person')<html.indexOf('person-a-person'));
  assert.ok(!html.includes('Hidden Person'));assert.ok(!html.includes('Hidden biography'));
  assert.ok(html.includes('href="https://example.org/z"'));assert.ok(html.includes('data-zh="新单位"'));
});

test('plain content is escaped and unsafe or broken content is rejected before publication',()=>{
  const data=base();data.papers[0].title='<script>alert("x")</script>';
  assert.ok(renderPage(validateContent(data,projectRoot),projectRoot).includes('&lt;script&gt;'));
  const duplicate=base();duplicate.papers.push(paper('first'));
  assert.throws(()=>validateContent(duplicate,projectRoot),/duplicate id/);
  const unsafe=base();unsafe.papers[0].links[0].url='javascript:alert(1)';
  assert.throws(()=>validateContent(unsafe,projectRoot),/http\(s\)/);
  const invalidDate=base();invalidDate.papers[0].date='2026-02-30';
  assert.throws(()=>validateContent(invalidDate,projectRoot),/real date/);
  const missing=base();missing.site={...missing.site,logo:'assets/missing-logo.svg'};
  assert.throws(()=>validateContent(missing,projectRoot),/Missing asset/);
  const markup=base();markup.home.copy.heroTitle={en:'<img src=x onerror=alert(1)>',html:true};
  assert.throws(()=>validateContent(markup,projectRoot),/Unsupported rich-text/);
});

test('optional paper content, empty collections and missing Chinese translations remain usable',()=>{
  const data=base();delete data.papers[0].bibtex;delete data.papers[0].cover;data.papers[0].summary={en:'English only'};
  const html=renderPage(validateContent(data,projectRoot),projectRoot);
  assert.ok(!html.includes('aria-controls="bib-first"'));
  assert.ok(html.includes('data-zh="English only"'));
  data.papers=[];assert.ok(renderPage(data,projectRoot).includes('New research will be shared here.'));
});

test('animated covers preserve GIF bytes and get independent still-image controls',()=>{
  const data=base();
  const animated=JSON.parse(readFileSync(path.join(projectRoot,'examples/animated-cover.json')));
  data.papers=[{...paper('motion-one'),cover:animated},{...paper('motion-two'),cover:{...animated,poster:undefined}}];
  const html=renderPage(validateContent(data,projectRoot),projectRoot);
  const gif=assetData(projectRoot,animated.image);
  assert.match(gif,/^data:image\/gif;base64,/);
  assert.deepEqual(Buffer.from(gif.split(',')[1],'base64'),readFileSync(path.join(projectRoot,animated.image)));
  assert.ok(html.includes('id="cover-motion-one" src="data:image/png;base64,'));
  assert.ok(html.includes(`data-animation="${gif}"`));
  assert.ok(html.includes('aria-controls="cover-motion-one" hidden'));
  assert.ok(html.includes('id="cover-motion-two" src="data:image/gif;base64,'));
  assert.ok(!html.includes('aria-controls="cover-motion-two"'));
  data.papers[0].cover={...animated,poster:'assets/papers/absent.png'};
  assert.throws(()=>validateContent(data,projectRoot),/cover.poster: Missing asset/);
  data.papers[0].cover={...animated,poster:animated.image};
  assert.throws(()=>validateContent(data,projectRoot),/still PNG/);
});

test('rich bilingual headings have intact translation attributes after building',()=>{
  const data=base(),html=renderPage(data,projectRoot);
  for(const id of ['hero-title','open-title']){
    const opening=html.match(new RegExp('<h[12] id="'+id+'"([^>]+)>'));
    assert.ok(opening,`${id} exists`);
    assert.match(opening[1],/data-en-html="[^"]+"/);
    assert.match(opening[1],/data-zh-html="[^"]+"/);
    assert.ok(!opening[1].includes('<'));
  }
});

test('scaffolding, editing and building new content works end to end without modifying source files',()=>{
  const temp=mkdtempSync(path.join(tmpdir(),'polyadic-test-'));
  try{
    for(const dir of ['src','scripts','content','assets','examples'])cpSync(path.join(projectRoot,dir),path.join(temp,dir),{recursive:true});
    execFileSync(process.execPath,[path.join(temp,'scripts/add.mjs'),'paper','qa-paper']);
    execFileSync(process.execPath,[path.join(temp,'scripts/add.mjs'),'person','qa-person']);
    assert.ok(!build(temp).html.includes('id="paper-qa-paper"'));
    assert.ok(!build(temp).html.includes('id="person-qa-person"'));
    const created=JSON.parse(readFileSync(path.join(temp,'content/papers/qa-paper.json')));
    created.published=true;created.title='New research added through data';created.links=[{label:'Paper',url:'https://example.org/new'}];
    writeFileSync(path.join(temp,'content/papers/qa-paper.json'),JSON.stringify(created));
    const people=JSON.parse(readFileSync(path.join(temp,'content/people.json')));people.at(-1).visible=true;people.at(-1).name='New Researcher';
    writeFileSync(path.join(temp,'content/people.json'),JSON.stringify(people));
    const result=build(temp);assert.ok(result.html.includes('New research added through data'));assert.ok(result.html.includes('New Researcher'));
    assert.equal(result.html,build(temp).html);
    assert.ok(!existsSync(path.join(temp,'dist/content')));
    assert.deepEqual(readdirSync(path.join(temp,'dist')).sort(),['.nojekyll','assets','index.html']);
    assert.notEqual(spawnSync(process.execPath,[path.join(temp,'scripts/add.mjs'),'paper','qa-paper']).status,0);
    assert.notEqual(spawnSync(process.execPath,[path.join(temp,'scripts/add.mjs'),'paper','../escape']).status,0);
    // Logo selection is a data edit, including SVG gradient identifiers.
    const site=JSON.parse(readFileSync(path.join(temp,'content/site.json')));site.logo='assets/H3-triad-hex-gradient.svg';
    writeFileSync(path.join(temp,'content/site.json'),JSON.stringify(site));
    const gradient=build(temp).html;assert.ok(gradient.includes('id="brand-polyadic-h3-gradient"'));assert.ok(gradient.includes('url(#brand-polyadic-h3-gradient)'));
  }finally{rmSync(temp,{recursive:true,force:true});}
});
