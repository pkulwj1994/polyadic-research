import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, watch } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { build, projectRoot } from './build.mjs';

const args=process.argv.slice(2);
const option=(name,fallback)=>{const index=args.indexOf(name);return index<0?fallback:args[index+1];};
const port=Number(option('--port',process.env.PORT || 4173));
const host=option('--host',process.env.HOST || (process.env.SITES_MANAGED_LINUX_CONTAINER==='1'?'0.0.0.0':'127.0.0.1'));
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Choose a valid port with --port 4173.');
build();
let revision=0,buildError='';
const listeners=new Set();
const mime={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.pdf':'application/pdf'};
const liveReload='<script>const updates=new EventSource("/__events");updates.addEventListener("change",()=>location.reload());</script>';
const dist=path.join(projectRoot,'dist');
const server=createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  if(req.url==='/__events'){
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
    res.write(`event: ready\ndata: ${revision}\n\n`);listeners.add(res);req.on('close',()=>listeners.delete(res));return;
  }
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(dist,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(dist+path.sep)||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
    if(buildError && path.extname(file)==='.html'){
      res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end('Build failed. Fix the content file, then refresh.\n\n'+buildError);return;
    }
    let bytes=readFileSync(file);
    if(path.extname(file)==='.html')bytes=bytes.toString().replace('</body>',liveReload+'</body>');
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(400);res.end('Bad request');}
});
let timer;
const rebuild=()=>{
  clearTimeout(timer);timer=setTimeout(()=>{
    try{const result=execFileSync(process.execPath,[path.join(projectRoot,'scripts/build.mjs')],{encoding:'utf8',stdio:['ignore','pipe','pipe']});buildError='';revision++;console.log(result.trim());}
    catch(error){buildError=error.stderr?.toString() || error.message;console.error(buildError);}
    for(const response of listeners)response.write(`event: change\ndata: ${revision}\n\n`);
  },150);
};
const watchers=['content','src','assets'].map(dir=>watch(path.join(projectRoot,dir),{recursive:true},rebuild));
const heartbeat=setInterval(()=>{for(const response of listeners)response.write(': keepalive\n\n');},20000);
server.on('error',error=>{console.error(error.message);process.exit(1);});
server.listen(port,host,()=>console.log(`Polyadic preview: http://${host==='0.0.0.0'?'localhost':host}:${port}/\nEdit content/ to rebuild and reload. Ctrl+C to stop.`));
function stop(){clearInterval(heartbeat);clearTimeout(timer);watchers.forEach(w=>w.close());listeners.forEach(r=>r.end());server.close(()=>process.exit(0));}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
