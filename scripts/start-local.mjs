import { spawn } from 'node:child_process';
import { mkdirSync, openSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const url='http://127.0.0.1:5173';
async function isReady(){
 try{const response=await fetch(url,{signal:AbortSignal.timeout(800)});return response.ok&&(await response.text()).includes('<title>Smart Concept Designer</title>');}
 catch{return false;}
}
if(await isReady()){
 console.log(`Garden Studio is already running: ${url}`);
}else{
 mkdirSync(path.join(root,'test-results'),{recursive:true});
 const log=openSync(path.join(root,'test-results','dev-server.log'),'a');
 const errorLog=openSync(path.join(root,'test-results','dev-server-error.log'),'a');
 const child=spawn(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5173','--strictPort'],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',log,errorLog]});
 let startError;
 child.on('error',error=>{startError=error;});
 child.unref();closeSync(log);closeSync(errorLog);
 let ready=false;
 for(let i=0;i<40;i++){
  if(startError)throw startError;
  if(await isReady()){ready=true;break;}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 if(!ready)throw Error('Garden Studio did not start. Check test-results/dev-server-error.log.');
 console.log(`Garden Studio running in background (PID ${child.pid}): ${url}`);
}
