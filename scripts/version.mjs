import { writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
let commit=process.env.GITHUB_SHA||'local';
if(commit==='local')try{commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{/* Local previews can precede the first commit. */}
await writeFile('public/version.json',JSON.stringify({project:'LUMEN L–01',commit,builtAt:new Date().toISOString()},null,2));
