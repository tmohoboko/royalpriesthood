import {readFile} from 'node:fs/promises';
import {database,transaction} from '../server/db.js';
const mode=process.argv[2],branch=process.argv[3];
if(!['apply','reverse'].includes(mode)||branch!=='br-calm-rice-b7mcxqw7'||process.env.VERCEL_ENV==='production'||process.env.PAYFAST_MODE!=='sandbox')
 throw Error('Usage: PAYFAST_MODE=sandbox node scripts/commerce-uat211.mjs apply|reverse br-calm-rice-b7mcxqw7. Isolated Preview only.');
const sql=await readFile(new URL(`./commerce-uat211-${mode==='apply'?'seed':'reverse'}.sql`,import.meta.url),'utf8');
if(process.argv.includes('--print-sql')){process.stdout.write(sql);process.exit(0);}
const db=await database();
try{await transaction(db,async tx=>{await tx.query("SELECT set_config('app.rp_uat_target',$1,true)",[branch]);await tx.query(sql)});console.log(`RP211-UAT-1 ${mode} complete; existing stock/order records preserved.`)}finally{await db.end()}
