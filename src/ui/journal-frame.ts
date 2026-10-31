import type { JournalPage } from '../content/types';

/** Matching chrome is shared with validation so it cannot supply a slot's article. */
export function journalFrame(page:JournalPage,situated:boolean):{back:string;section:string;dialog:string;overline:string;close:string} {
  return situated?{back:'←',section:'◇',dialog:'▤',overline:'◇',close:'×'}:{back:'← Les pages',section:page.kind==='grammar'?'LES LIENS':'LES MOTS',dialog:'Le carnet',overline:'CE QUE JE COMPRENDS',close:'Fermer'};
}
