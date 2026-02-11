import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const files=execSync('git ls-files -z').toString('utf8').split('\0').filter(Boolean);
let bom=0, rep=0; const bomFiles=[], repFiles=[];
for(const f of files){
  const buf=readFileSync(f);
  if(buf.length>=3 && buf[0]===0xEF && buf[1]===0xBB && buf[2]===0xBF){ bom++; bomFiles.push(f); }
  const s=buf.toString('utf8');
  if(s.includes('\uFFFD')){ rep++; repFiles.push(f); }
}
console.log(JSON.stringify({bom,rep,bomFiles,repFiles},null,2));
