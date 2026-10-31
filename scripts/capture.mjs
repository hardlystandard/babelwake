import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const folder='artifacts/pr-a';
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const url=new URL(process.env.BABELWAKE_PREVIEW??'http://127.0.0.1:4173/');url.searchParams.set('debug','1');
  await page.goto(url.href);await page.getByTestId('start').click();
  await expect(page.locator('.world-labels')).toHaveCSS('visibility','visible');
  await page.locator('#sound').click();
  const zone=await page.evaluate(async()=>(await window.__BABELWAKE__.content()).zones[0]);
  const settle=()=>page.evaluate(()=>new Promise(resolve=>{let frames=12;const next=()=>--frames?requestAnimationFrame(next):resolve();requestAnimationFrame(next);}));
  async function annotate(id,guess){
    await settle();
    let word=page.locator(`.situated-text [data-word="${id}"]:visible`).first();
    if(!await word.count()){
      const context=zone.evidence.find(e=>e.surface==='top'&&e.words.includes(id));assert(context,`No physical context for ${id}`);
      await page.evaluate(id=>window.__BABELWAKE__.encounter(id),context.id);
    }
    await word.click();await page.getByTestId('guess-input').fill(guess);await page.getByTestId('guess-input').press('Enter');
  }
  const records=[];
  async function capture(name){
    await settle();
    const metrics=await page.evaluate(()=>{
      const visible=element=>getComputedStyle(element).display!=='none'&&element.getClientRects().length>0;
      return{...window.__BABELWAKE__.view(),words:[...document.querySelectorAll('.situated-text .word')].filter(visible).map(e=>parseFloat(getComputedStyle(e).fontSize)),notes:[...document.querySelectorAll('.situated-text .word small')].filter(visible).map(e=>({text:e.textContent,size:parseFloat(getComputedStyle(e).fontSize)})),captions:document.querySelectorAll('.evidence-panel,.world-label').length};
    });
    assert(Math.abs(metrics.zoom-1)<.01,'Screenshot must use default zoom');assert.equal(metrics.captions,0);assert(metrics.words.length>0);assert(metrics.words.every(size=>size>=18));assert(metrics.notes.length>0);assert(metrics.notes.every(note=>note.size>=12));
    try {await page.screenshot({path:`${folder}/${name}.png`,animations:'disabled',timeout:30000});}
    catch(error){
      if(error.name!=='TimeoutError')throw error;
      // Freeze the already-rendered frame only for a still capture on software GL.
      // Queue callbacks and resume both normal animation loops immediately afterward.
      await page.evaluate(()=>{window.__BABELWAKE_CAPTURE_RAF__=window.requestAnimationFrame;window.__BABELWAKE_CAPTURE_QUEUE__=[];window.requestAnimationFrame=callback=>{window.__BABELWAKE_CAPTURE_QUEUE__.push(callback);return 0;};});
      try{await page.screenshot({path:`${folder}/${name}.png`,animations:'disabled',timeout:30000});}
      finally{await page.evaluate(()=>{const original=window.__BABELWAKE_CAPTURE_RAF__;window.requestAnimationFrame=original;for(const callback of window.__BABELWAKE_CAPTURE_QUEUE__)original(callback);delete window.__BABELWAKE_CAPTURE_RAF__;delete window.__BABELWAKE_CAPTURE_QUEUE__;});}
    }
    records.push({name,...metrics});
  }
  await annotate('clé','key?');await page.locator('#leave-focus').click();await settle();
  await annotate('boîte','box?');await page.locator('#leave-focus').click();
  assert.equal(await page.evaluate(()=>window.__BABELWAKE__.interactions().history.length),0,'Annotating must not pick up objects');
  await capture('atelier-world');
  // Select the same authored observations available through normal scene interactions.
  // The hook cannot change a save or supply guesses, confirmations or translations.
  await page.evaluate(ids=>{for(const id of ids)window.__BABELWAKE__.encounter(id);},zone.encounterOrder);
  const workOrder=zone.evidence.find(e=>e.id===zone.puzzle.world.clues[3]);
  await page.evaluate(id=>window.__BABELWAKE__.encounter(id),workOrder.id);
  await capture('atelier-workorder');
  const recipient=zone.evidence.find(e=>e.id===zone.puzzle.world.clues[5]);
  await page.evaluate(id=>window.__BABELWAKE__.encounter(id),recipient.id);
  await annotate('elle','she?');
  await capture('atelier-conversation');
  assert.deepEqual(errors,[]);
  await writeFile(`${folder}/metrics.json`,JSON.stringify({viewport:{width:1440,height:900},errors,records},null,2));
  console.log('Captured three actual atelier views at zoom 1: 18px French, 12px player-typed notes, no caption cards or page errors.');
}finally{await browser.close();}
