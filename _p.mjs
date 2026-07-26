import { chromium } from 'playwright-core';
const exe='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const S='/tmp/claude-0/-home-user-MARIA/cd3dde04-3f18-5155-9174-04352c20d5f5/scratchpad';
const b=await chromium.launch({executablePath:exe,args:['--no-sandbox']});
try {
  const c=await b.newContext({viewport:{width:1000,height:523},deviceScaleFactor:2,colorScheme:'light'});
  const p=await c.newPage();
  await p.goto('http://localhost:3263/modal-test',{waitUntil:'networkidle'});
  await p.waitForTimeout(600);
  const res=await p.evaluate(()=>{
    const d=document.querySelector('[role=dialog]');
    d.removeAttribute('class');
    if(d.children[1]) d.children[1].removeAttribute('class');
    const dr=d.getBoundingClientRect();
    const h=d.querySelector('h2').getBoundingClientRect();
    return {dlgH:Math.round(dr.height), vpH:window.innerHeight, tituloVisible:h.top>=-1, cabe:dr.height<=window.innerHeight+1};
  });
  console.log('RESULT SIN CLASES =>', JSON.stringify(res));
  await p.screenshot({path:`${S}/inline_proof.png`});
} catch(e){ console.log('ERR', e.message); }
await b.close();
