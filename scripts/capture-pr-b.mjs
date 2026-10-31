import {chromium,expect} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

// Reproduce against a production preview. Fixture import unlocks existing
// travel only; test notes are typed through the normal annotation interface.
const output=process.env.BABELWAKE_CAPTURE_OUTPUT??'docs/pr-b';
const base=new URL(process.env.BABELWAKE_PREVIEW??'http://127.0.0.1:4184/');
const zoneIds=['atelier','marche','cafe','gare','maison','lettres'];
const sha256=value=>createHash('sha256').update(value).digest('hex');
const files=['src/content/lexicon.ts','src/main.ts','src/game/situated.ts','src/game/scenery.ts','src/ui/pictures.ts',...zoneIds.map(id=>`src/content/zones/${id}.ts`)];
const source={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim().length>0,sha256:Object.fromEntries(await Promise.all(files.map(async file=>[file,sha256(await readFile(file))])))};
await mkdir(output,{recursive:true});
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,serviceWorkers:'block'});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const url=new URL(base);url.searchParams.set('debug','1');
 await page.goto(url.href);await page.getByTestId('start').click();
 await expect(page.locator('.world-labels')).toHaveCSS('visibility','visible');
 await page.locator('#sound').click();
 const entrypoint=await page.locator('script[type="module"]').getAttribute('src');
 const entryUrl=new URL(entrypoint,base);assert.equal(entryUrl.origin,base.origin);
 const response=await page.request.get(entryUrl.href);assert(response.ok());
 const loadedBuild={entrypoint,sha256:sha256(await response.body())};
 const content=await page.evaluate(()=>window.__BABELWAKE__.content());
 const fixture=await page.evaluate(()=>window.__BABELWAKE__.getState());
 fixture.zone='lettres';fixture.encountered=[];fixture.confirmed=[];fixture.guesses={};
 fixture.solved=content.zones.filter(zone=>zone.id!=='lettres').map(zone=>zone.puzzle.legacyIds?.[0]??zone.puzzle.id);
 await page.locator('#menu').click();
 await page.locator('#import').setInputFiles({name:'capture-travel-fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
 await expect.poll(()=>page.evaluate(()=>window.__BABELWAKE__.getState().zone)).toBe('lettres');
 const records=[];
 async function saveMetrics(complete){
  const inventory=content.zones.map(zone=>({id:zone.id,design:zone.design,evidence:zone.evidence.length,objects:zone.scene?.length,pages:zone.pages.length,actions:zone.puzzle.world?.sequence.length}));
  await writeFile(`${output}/default-view-metrics.json`,JSON.stringify({complete,capturedAt:new Date().toISOString(),browser:browser.version(),viewport:{width:1440,height:900},preview:base.href,serviceWorkers:'blocked only for visual capture; offline verification is a separate production test',fixture:'Normal save import with legacy travel completion only; no new confirmations or translations. Notes typed through annotation UI.',source,loadedBuild,inventory,errors,records},null,2)+'\n');
 }
 async function focus(evidence){
  const before=await page.evaluate(()=>window.__BABELWAKE__.view().player);
  await page.evaluate(id=>window.__BABELWAKE__.encounter(id),evidence.id);
  const target=page.locator(`[data-evidence="${evidence.id}"]`);
  await expect(target).toBeVisible();
  // Wait for actual camera projection to settle, rather than a fixed sleep.
  await target.evaluate(element=>new Promise(resolve=>{
   let last='',stable=0,frames=0;
   const next=()=>{const box=element.getBoundingClientRect(),key=[box.x,box.y].map(value=>Math.round(value*10)).join(':');stable=key===last?stable+1:0;last=key;if(stable>=5||frames++>180)resolve();else requestAnimationFrame(next);};requestAnimationFrame(next);
  }));
  assert.deepEqual(await page.evaluate(()=>window.__BABELWAKE__.view().player),before,'Inspection displaced the avatar');
 }
 async function annotate(evidence,word,note){
  await focus(evidence);
  const before=await page.evaluate(()=>({player:window.__BABELWAKE__.view().player,physical:window.__BABELWAKE__.interactions()}));
  const token=page.locator(`[data-evidence="${evidence.id}"] [data-word="${word}"]`).first();
  await expect(token).toBeVisible();await token.click();
  await page.getByTestId('guess-input').fill(note);await page.getByTestId('guess-input').press('Enter');
  await expect(page.locator('#word-entry')).toHaveCount(0);
  assert.deepEqual(await page.evaluate(()=>({player:window.__BABELWAKE__.view().player,physical:window.__BABELWAKE__.interactions()})),before,'Annotation changed physical state');
 }
 async function capture(name,evidence){
  await focus(evidence);
  const metrics=await page.evaluate(()=>{
   const visible=element=>getComputedStyle(element).display!=='none'&&element.getClientRects().length>0;
   const view=window.__BABELWAKE__.view();
   return{...view,zone:window.__BABELWAKE__.getState().zone,captions:document.querySelectorAll('.evidence-panel,.world-label,.context-tabs,#mechanism,.puzzle-panel').length,
    frenchFontSizes:[...new Set([...document.querySelectorAll('.situated-text .word')].filter(visible).map(element=>parseFloat(getComputedStyle(element).fontSize)))],
    notes:[...document.querySelectorAll('.situated-text .word small')].filter(visible).map(element=>({text:element.textContent,size:parseFloat(getComputedStyle(element).fontSize)})),
    physicalObjects:window.__BABELWAKE__.physicalState().length,
   };
  });
  assert.equal(metrics.zoom,1);assert.equal(metrics.captions,0);assert(metrics.frenchFontSizes.length&&metrics.frenchFontSizes.every(size=>size>=18));assert(metrics.notes.length&&metrics.notes.every(note=>note.size>=12));
  const file=`${output}/${name}.png`;await page.screenshot({path:file,animations:'disabled',timeout:30000});
  records.push({name,file,evidence:evidence.id,...metrics});await saveMetrics(false);
  console.log(`Captured ${name}: zoom ${metrics.zoom}, ${metrics.notes.length} typed notes.`);
 }
 const preferred={atelier:['clé','key?'],marche:['pomme','apple?'],cafe:['café','coffee?'],gare:['billet','ticket?'],maison:['lettre','letter?'],lettres:['enveloppe','envelope?']};
 for(const id of zoneIds){
  await page.evaluate(id=>window.__BABELWAKE__.loadZone(id),id);
  const zone=content.zones.find(zone=>zone.id===id);assert(zone);
  const [word,note]=preferred[id];
  const observation=zone.evidence.find(e=>e.surface==='top'&&e.words.includes(word))??zone.evidence.find(e=>e.words.includes(word));assert(observation,`No ${id}/${word} context`);
  await annotate(observation,word,note);await capture(`${id}-world`,observation);
  const clue=zone.evidence.find(e=>e.id===zone.puzzle.world.clues[0]);assert(clue);
  await annotate(clue,'prendre','take?');await capture(`${id}-workorder`,clue);
  if(id==='lettres'){
   const memory=zone.evidence.find(e=>e.id==='lettres-v2-e-souvenir-1');assert(memory);
   await annotate(memory,'souvenir','memory?');await capture('lettres-memory',memory);
   const letter=zone.evidence.find(e=>e.id==='lettres-v2-e-luc-letter');assert(letter);
   await capture('lettres-correspondence',letter);
  }
 }
 assert.deepEqual(errors,[]);
 await saveMetrics(true);
}finally{await browser.close();}
