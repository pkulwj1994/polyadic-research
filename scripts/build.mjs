import { mkdirSync, writeFileSync, cpSync, rmSync, renameSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent, validateContent, postSourcePath } from '../src/content.mjs';
import { renderPage, visiblePapers } from '../src/render.mjs';

export const projectRoot = fileURLToPath(new URL('../',import.meta.url));
export function build(root=projectRoot) {
  const data=validateContent(loadContent(root),root);
  const html=renderPage(data,root);
  const dist=path.join(root,'dist');mkdirSync(dist,{recursive:true});
  // Replace only generated assets, so removed source assets cannot survive in a release.
  rmSync(path.join(dist,'assets'),{recursive:true,force:true});
  cpSync(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});
  const posts=data.posts.filter(p=>p.published!==false);
  rmSync(path.join(dist,'posts'),{recursive:true,force:true});
  for(const post of posts){
    const source=postSourcePath(root,post.source),target=path.join(dist,'posts',post.id);
    mkdirSync(target,{recursive:true});
    const sourceAssets=path.join(path.dirname(source),'assets');
    if(existsSync(sourceAssets))cpSync(sourceAssets,path.join(target,'assets'),{recursive:true});
    const targetHome=path.relative(target,path.join(dist,'index.html')).split(path.sep).join('/');
    const pages=[{source,file:'index.html'}];
    if(post.chineseSource)pages.push({source:postSourcePath(root,post.chineseSource,'zh.html'),file:'zh.html'});
    for(const page of pages){
      const sourceHome=path.relative(path.dirname(page.source),path.join(dist,'index.html')).split(path.sep).join('/');
      const postHtml=readFileSync(page.source,'utf8').replaceAll(`href="${sourceHome}`,`href="${targetHome}`);
      writeFileSync(path.join(target,page.file),postHtml);
    }
  }
  writeFileSync(path.join(dist,'index.html.tmp'),html);
  renameSync(path.join(dist,'index.html.tmp'),path.join(dist,'index.html'));
  writeFileSync(path.join(dist,'.nojekyll'),'');
  return {html,papers:visiblePapers(data.papers).length,posts:posts.length,people:data.people.filter(p=>p.visible!==false).length};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {const result=build();console.log(`Built dist/index.html — ${result.papers} paper(s), ${result.posts} post(s), ${result.people} people.`);}
  catch(error){console.error(error.message);process.exitCode=1;}
}
