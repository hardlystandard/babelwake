import type { ZoneId } from './types';
/** Paths, the central clearing, and six neighbourhood pockets share these
 * coordinates with the cozy scenery. Evidence remains authored scene data. */
export interface VillageLayout { radius:number; sectors:number; columns:number; spacing:number; angle:number; }
export const villageLayouts:Record<ZoneId,VillageLayout>={
 atelier:{radius:9.5,sectors:6,columns:3,spacing:1.9,angle:-Math.PI/2},
 marche:{radius:10.5,sectors:6,columns:3,spacing:1.8,angle:-Math.PI/2},
 cafe:{radius:9.5,sectors:6,columns:3,spacing:1.9,angle:-Math.PI/2},
 gare:{radius:10,sectors:6,columns:3,spacing:1.9,angle:-Math.PI/2},
 maison:{radius:9.5,sectors:6,columns:3,spacing:1.9,angle:-Math.PI/2},
 lettres:{radius:9.5,sectors:6,columns:3,spacing:1.9,angle:-Math.PI/2},
};
export function stationPosition(index:number,total:number,zone:ZoneId):[number,number]{
 const layout=villageLayouts[zone],sector=index%layout.sectors,local=Math.floor(index/layout.sectors);
 const rows=Math.ceil(Math.ceil(total/layout.sectors)/layout.columns),a=layout.angle+sector*Math.PI*2/layout.sectors;
 const across=(local%layout.columns-(layout.columns-1)/2)*layout.spacing;
 const depth=(Math.floor(local/layout.columns)-(rows-1)/2)*layout.spacing;
 return [Math.cos(a)*(layout.radius+depth)-Math.sin(a)*across,Math.sin(a)*(layout.radius+depth)+Math.cos(a)*across];
}
