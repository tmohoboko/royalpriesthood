import {spawnSync} from 'node:child_process';
const r=spawnSync('node',['node_modules/@playwright/test/cli.js','test','--config=qa/rp-v2.1.1/hosted.config.js'],{env:{...process.env,FRONTEND_HOSTED:'1'},stdio:'inherit'});process.exit(r.status??1);
