import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { projectRoot } from './build.mjs';

const [kind,id]=process.argv.slice(2);
try{
  if(!['paper','person'].includes(kind)||!id||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))throw new Error('Usage: npm run add:paper -- my-paper  /  npm run add:person -- first-last');
  const example=JSON.parse(readFileSync(path.join(projectRoot,`examples/${kind}.json`),'utf8'));
  example.id=id;
  if(kind==='paper'){
    const target=path.join(projectRoot,`content/papers/${id}.json`);
    if(existsSync(target))throw new Error(`Paper already exists: ${id}`);
    example.date=new Date().toISOString().slice(0,10);
    writeFileSync(target,JSON.stringify(example,null,2)+'\n');
    console.log(`Created content/papers/${id}.json. Fill in the fields, then set published to true.`);
  }else{
    const target=path.join(projectRoot,'content/people.json');
    const people=JSON.parse(readFileSync(target,'utf8'));
    if(people.some(p=>p.id===id))throw new Error(`Person already exists: ${id}`);
    people.push(example);writeFileSync(target,JSON.stringify(people,null,2)+'\n');
    console.log(`Added ${id} to content/people.json. Fill in the fields, then set visible to true.`);
  }
}catch(error){console.error(error.message);process.exitCode=1;}
