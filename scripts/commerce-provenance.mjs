// Non-secret build identity for preview acceptance: compare with the exact clean
// checkout uploaded by the release operator. Never include environment values.
import {createHash} from 'node:crypto';
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
let commit=process.env.COMMERCE_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA;
if(!commit){try{commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()}catch{throw Error('Set COMMERCE_COMMIT to the exact deployed commit')}}
if(!/^[a-f0-9]{40}$/.test(commit))throw Error('Invalid build commit');
const files=['package.json','package-lock.json','vercel.json','proxy.js','index.html','vite.config.js'];
async function collect(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+e.name;if(e.isDirectory())await collect(path);else if(!['server/fixtures.js','scripts/commerce-test-server.mjs'].includes(path))files.push(path)}}
for(const dir of ['src','server','api','migrations','scripts'])await collect(dir);
const hash=createHash('sha256');for(const path of files.sort()){hash.update(path+'\0');hash.update(await readFile(path));hash.update('\0')}
const result={commit,sourceSha256:hash.digest('hex'),scope:'application source/config; excludes QA, docs and unchanged approved image assets'};
await writeFile('dist/commerce-release.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
