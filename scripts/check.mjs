import { loadContent, validateContent } from '../src/content.mjs';
import { renderPage } from '../src/render.mjs';
import { projectRoot } from './build.mjs';
try {
  const data=validateContent(loadContent(projectRoot),projectRoot);
  const html=renderPage(data,projectRoot);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  for(const [,value] of html.matchAll(/data-(?:en|zh)(?:-html)?="([^"]*)"/g))if(/[<>]/.test(value))throw new Error('Translation attribute contains unescaped markup; check template.html.');
  if(new Set(ids).size!==ids.length)throw new Error('Generated page contains duplicate element IDs.');
  for(const [,id] of html.matchAll(/aria-controls="([^"]+)"/g))if(!ids.includes(id))throw new Error(`aria-controls points to missing #${id}`);
  console.log('Content, assets, template, unique IDs and toggle targets are valid.');
}catch(error){console.error(error.message);process.exitCode=1;}
