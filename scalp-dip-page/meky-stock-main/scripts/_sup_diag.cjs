'use strict';
const fs=require('fs');const path=require('path');
const env={};
for(const l of fs.readFileSync(path.join(__dirname,'..','.env'),'utf8').split('\n')){const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].replace(/^\"|\"$/g,'');}
const {Pool}=require('pg');
const p=new Pool({connectionString:env.DATABASE_URL});
(async()=>{
  const jobs=await p.query(`SELECT jobid, jobname, command FROM cron.job ORDER BY jobname`);
  for(const j of jobs.rows){
    if(/scalp|outcome|midday|eod/i.test(j.jobname)){
      console.log('=== '+j.jobname+' (id='+j.jobid+')');
      console.log(j.command.slice(0,3000));
      console.log('');
    }
  }
  await p.end();
})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
