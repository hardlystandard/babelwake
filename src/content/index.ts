import type { Content, Lexeme, Zone, ZoneId } from './types';
import { lexicon } from './lexicon';
import {stationPosition} from './layout';
export { lexicon };
export const zoneIds: ZoneId[]=['atelier','marche','cafe','gare','maison','lettres'];
const normalize=(s:string)=>s.normalize('NFC').replace(/[’`]/g,"'").toLocaleLowerCase('fr');
function occurs(text:string,form:string):boolean {
 const escaped=normalize(form).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}${normalize(form).endsWith("'")?'':'(?![\\p{L}\\p{N}])'}`,'iu').test(normalize(text));
}
/** Index only visible French. Authored word tags never grant invisible encounters. */
export function prepareZone(zone:Zone):Zone {
 const stationFor=(id:string)=>id.replace(/-[012]$/,'');
 const stations=[...new Set(zone.evidence.map(e=>e.station??stationFor(e.id)))];
 return {...zone,evidence:zone.evidence.map(e=>{const station=e.station??stationFor(e.id),i=stations.indexOf(station);return {...e,station,position:stationPosition(i,stations.length,zone.id),words:lexicon.filter(w=>w.forms.some(f=>occurs(e.title+' '+e.text,f))).map(w=>w.id)};}),puzzle:{...zone.puzzle,steps:zone.puzzle.steps.map(s=>({...s,id:`${zone.id}-${s.id}`}))}};
}
const loaders:Record<ZoneId,()=>Promise<{default:Zone}>>={
 atelier:()=>import('./zones/atelier'),marche:()=>import('./zones/marche'),cafe:()=>import('./zones/cafe'),gare:()=>import('./zones/gare'),maison:()=>import('./zones/maison'),lettres:()=>import('./zones/lettres')
};
const supplements:Record<ZoneId,()=>Promise<{supplement:(zone:Zone)=>Zone}>>={
 atelier:()=>import('./supplements/atelier'),marche:()=>import('./supplements/marche'),cafe:()=>import('./supplements/cafe'),gare:()=>import('./supplements/gare'),maison:()=>import('./supplements/maison'),lettres:()=>import('./supplements/lettres')
};
export async function loadZone(id:ZoneId):Promise<Zone> {const [module,extra]=await Promise.all([loaders[id](),supplements[id]()]);return prepareZone(extra.supplement(module.default));}
export async function loadContent():Promise<Content> {return {lexicon,zones:await Promise.all(zoneIds.map(loadZone))};}

/** Resolve form-specific grammar cards to the canonical journal annotation. */
export function canonicalLexemeId(id:string):string {
 const word=lexicon.find(entry=>entry.id===id);
 if(!word) return id;
 return lexicon.find(entry=>entry.id===word.lemma)?.id ?? word.id;
}
