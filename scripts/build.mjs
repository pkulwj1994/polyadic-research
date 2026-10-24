import { mkdirSync, writeFileSync, cpSync, rmSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent, validateContent } from '../src/content.mjs';
import { renderPage, visiblePapers } from '../src/render.mjs';

export const projectRoot = fileURLToPath(new URL('../',import.meta.url));
export function build(root=projectRoot) {
  const data=validateContent(loadContent(root),root);
  const html=renderPage(data,root);
  const dist=path.join(root,'dist');mkdirSync(dist,{recursive:true});
  // Replace only generated assets, so removed source assets cannot survive in a release.
  rmSync(path.join(dist,'assets'),{recursive:true,force:true});
  cpSync(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});
  writeFileSync(path.join(dist,'index.html.tmp'),html);
  renameSync(path.join(dist,'index.html.tmp'),path.join(dist,'index.html'));
  writeFileSync(path.join(dist,'.nojekyll'),'');
  return {html,papers:visiblePapers(data.papers).length,people:data.people.filter(p=>p.visible!==false).length};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {const result=build();console.log(`Built dist/index.html — ${result.papers} paper(s), ${result.people} people.`);}
  catch(error){console.error(error.message);process.exitCode=1;}
}
