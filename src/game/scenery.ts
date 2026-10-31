import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Zone } from '../content/types';

/** A little French village, made entirely from shared geometric pieces. */
export const cozyPalette = {
  grass: '#4c6849', grassLight: '#657a50', grassDark: '#334e39', earth: '#806147',
  cream: '#d8c7a4', plaster: '#b7a184', coral: '#ad7054', roof: '#874e3b',
  roofLight: '#a16a4b', blue: '#5b7c80', teal: '#4d7264', wood: '#806044',
  darkWood: '#5a4434', water: '#42696e', butter: '#bc9348', pink: '#9f655a',
  lilac: '#77677f', ink: '#32483f', white: '#d8d1b7', leaf: '#597b4e',
};

type Mat = THREE.MeshStandardMaterial;
type Point = [number, number];

export function createScenery(zone: Zone): THREE.Group {
  const root = new THREE.Group();
  root.name = `cozy-village-${zone.id}`;
  const materials = new Map<string, Mat>();
  const geometries = new Map<string, THREE.BufferGeometry>();
  const mat = (name: string, color: string, roughness = .9): Mat => {
    const found = materials.get(name); if (found) return found;
    const next = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
    next.name = name; materials.set(name, next); return next;
  };
  const geo = (key: string, create: () => THREE.BufferGeometry): THREE.BufferGeometry => {
    let found = geometries.get(key); if (!found) { found = create(); geometries.set(key, found); } return found;
  };
  const sphere = geo('soft-sphere', () => new THREE.IcosahedronGeometry(1, 2));
  const petalSphere = geo('small-soft-sphere', () => new THREE.IcosahedronGeometry(1, 1));
  const cylinder = geo('cylinder', () => new THREE.CylinderGeometry(1, 1, 1, 10));
  const ball = (parent: THREE.Object3D, material: Mat, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) => add(parent, Math.max(sx, sy, sz) <= .35 ? petalSphere : sphere, material, x, y, z, sx, sy, sz);
  const add = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: Mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1): THREE.Mesh => {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const rounded = (parent: THREE.Object3D, material: Mat, x: number, y: number, z: number, width: number, height: number, depth: number, radius = .12): THREE.Mesh => {
    const key = `rounded:${width}:${height}:${depth}:${radius}`;
    return add(parent, geo(key, () => new RoundedBoxGeometry(width, height, depth, 2, Math.min(radius, width / 3, height / 3, depth / 3))), material, x, y, z);
  };
  const grass = mat('meadow', cozyPalette.grass), edge = mat('island-earth', cozyPalette.earth);
  const path = mat('warm-path', '#a79573'), rim = mat('shoreline', '#977c57');
  const wood = mat('warm-wood', cozyPalette.wood), darkWood = mat('old-wood', cozyPalette.darkWood);
  const cream = mat('cream-trim', cozyPalette.cream), white = mat('petal-white', cozyPalette.white);
  const leaf = mat('garden-leaf', cozyPalette.leaf), darkLeaf = mat('garden-dark-leaf', '#3d6040');
  const flowerPink = mat('petal-rust', cozyPalette.pink), flowerLilac = mat('petal-lilac', cozyPalette.lilac);
  const yellow = mat('flower-centre', cozyPalette.butter);

  // A gently raised meadow with a warm, visible shore, sitting in slate blue water.
  add(root, geo('island-core', () => new THREE.CylinderGeometry(25, 24.45, .95, 64)), edge, 0, -.5, 0);
  add(root, geo('island-meadow', () => new THREE.CylinderGeometry(25, 25, .12, 64)), grass, 0, -.045, 0);
  add(root, geo('island-shore', () => new THREE.CylinderGeometry(25.45, 25.65, .22, 64)), rim, 0, -.91, 0);
  const sea = add(root, geo('surrounding-water', () => new THREE.CircleGeometry(180, 64)), mat('surrounding-water', '#48656b', .65), 0, -1.055, 0);
  sea.rotation.x = -Math.PI / 2; sea.castShadow = false;

  /** Ground ribbons are curved on purpose; they never create a navigation wall. */
  function ribbon(points: Point[], width: number, material = path, elevation = .025): void {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, elevation, z)));
    const positions: number[] = []; const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const p = curve.getPoint(i / steps), tangent = curve.getTangent(i / steps);
      const nx = -tangent.z * width / 2, nz = tangent.x * width / 2;
      positions.push(p.x + nx, p.y, p.z + nz, p.x - nx, p.y, p.z - nz);
    }
    const indices: number[] = [];
    for (let i = 0; i < steps; i++) { const n = i * 2; indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const mesh = add(root, geometry, material); mesh.castShadow = false;
    // Round the ends so a path always meets the grass softly.
    for (const [x, z] of [points[0], points[points.length - 1]]) {
      const disk = add(root, geo('path-cap', () => new THREE.CircleGeometry(1, 16)), material, x, elevation + .002, z, width / 2, width / 2, 1);
      disk.rotation.x = -Math.PI / 2; disk.castShadow = false;
    }
  }
  const ring: Point[] = Array.from({ length: 13 }, (_, i) => [Math.sin(i * Math.PI / 6) * 10.3, Math.cos(i * Math.PI / 6) * 10.3]);
  ribbon(ring, 1.55);
  ribbon([[0, 18], [-.8, 12], [1.1, 6], [0, 0], [.6, -7], [0, -15.7]], 2.7);
  ribbon([[-20, -8], [-14, -6], [-9, -3], [-4, 0], [0, 0], [6, 2], [12, 6], [20, 7]], 2.15);
  ribbon([[-18, 13], [-13, 11], [-8, 6], [-3, 2], [0, 0], [5, -3], [12, -9], [17, -13]], 1.8);
  const clearing = add(root, geo('clearing', () => new THREE.CircleGeometry(3.25, 32)), path, 0, .032, 0);
  clearing.rotation.x = -Math.PI / 2; clearing.castShadow = false;

  function arch(width: number, height: number, thickness: number): THREE.BufferGeometry {
    const key = `arch:${width}:${height}:${thickness}`;
    return geo(key, () => {
      const radius = width / 2, shape = new THREE.Shape();
      shape.moveTo(-radius, 0); shape.lineTo(radius, 0); shape.lineTo(radius, height - radius);
      shape.absarc(0, height - radius, radius, 0, Math.PI, false); shape.lineTo(-radius, 0);
      return new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 2, steps: 1, curveSegments: 12 });
    });
  }
  function flower(parent: THREE.Object3D, x: number, z: number, color: Mat, size = 1, y = 0): void {
    const stem = add(parent, cylinder, leaf, x, y + .17 * size, z, .025 * size, .34 * size, .025 * size); stem.castShadow = false;
    ball(parent, leaf, x + .1 * size, y + .13 * size, z, .13 * size, .045 * size, .065 * size).rotation.z = -.45;
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      ball(parent, color, x + Math.cos(a) * .105 * size, y + .38 * size, z + Math.sin(a) * .105 * size, .1 * size, .065 * size, .1 * size);
    }
    ball(parent, yellow, x, y + .415 * size, z, .065 * size, .045 * size, .065 * size);
  }
  function windowBox(parent: THREE.Object3D, x: number, y: number, z: number, shutters: Mat): void {
    rounded(parent, cream, x, y, z, 1.35, 1.4, .16, .1);
    rounded(parent, mat('window-glass', '#668c8b'), x, y, z + .1, 1.08, 1.14, .06, .07);
    rounded(parent, cream, x, y, z + .15, .08, 1.15, .05, .02);
    rounded(parent, cream, x, y, z + .15, 1.1, .08, .05, .02);
    for (const side of [-1, 1]) {
      rounded(parent, shutters, x + side * .91, y, z + .02, .38, 1.34, .13, .06);
      for (const dy of [-.34, 0, .34]) rounded(parent, cream, x + side * .91, y + dy, z + .1, .31, .045, .025, .008);
    }
    rounded(parent, wood, x, y - .83, z + .22, 1.55, .34, .48, .07);
    for (let i = 0; i < 5; i++) flower(parent, x - .55 + i * .27, z + .25, i % 2 ? flowerPink : flowerLilac, .56, y - .68);
  }
  function cottage(x: number, z: number, rotation: number, scale: number, wallColor: string, shutterColor: string, roofColor: string): void {
    const home = new THREE.Group(); home.position.set(x, .025, z); home.rotation.y = rotation; home.scale.setScalar(scale); root.add(home);
    const walls = mat(`plaster-${wallColor}`, wallColor), shutters = mat(`shutter-${shutterColor}`, shutterColor);
    const roof = mat(`roof-${roofColor}`, roofColor), roofTile = mat(`roof-tile-${roofColor}`, new THREE.Color(roofColor).lerp(new THREE.Color('#b48660'), .18).getStyle());
    rounded(home, mat('foundation', '#a18f6e'), 0, .19, 0, 6.65, .38, 4.9, .17);
    rounded(home, walls, 0, 1.99, 0, 6.4, 3.65, 4.65, .18);
    // Bevelled terracotta gable, a chimney, and overlapping rows of rounded tiles.
    const roofGeometry = geo('cottage-gable', () => {
      const shape = new THREE.Shape(); shape.moveTo(-3.6, 0); shape.lineTo(3.6, 0); shape.lineTo(0, 1.85); shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 5.35, bevelEnabled: true, bevelSize: .11, bevelThickness: .11, bevelSegments: 2, steps: 1 }); geometry.translate(0, 0, -2.675); return geometry;
    });
    add(home, roofGeometry, roof, 0, 3.73, 0);
    const slope = Math.atan2(1.85, 3.6);
    for (const side of [-1, 1]) for (let row = 0; row < 3; row++) for (let column = 0; column < 5; column++) {
      const tx = side * (.68 + row * 1.1), ty = 5.62 - Math.abs(tx) * 1.85 / 3.6;
      const tile = rounded(home, (row + column) % 3 ? roof : roofTile, tx, ty, -2.18 + column * 1.08, 1.25, .12, 1.14, .08); tile.rotation.z = -side * slope;
    }
    rounded(home, walls, 1.75, 5.05, -.7, .75, 2.05, .8, .1);
    rounded(home, roof, 1.75, 6.02, -.7, .98, .22, 1.05, .07);
    add(home, arch(1.58, 2.52, .13), cream, 0, .34, 2.37);
    add(home, arch(1.25, 2.26, .1), shutters, 0, .38, 2.53);
    rounded(home, wood, 0, .82, 2.67, .91, .69, .045, .08);
    ball(home, mat('door-brass', '#a6813f'), .39, 1.37, 2.69, .075);
    rounded(home, cream, 0, .15, 2.96, 2.1, .26, 1.0, .12);
    windowBox(home, -2.02, 2.07, 2.4, shutters); windowBox(home, 2.02, 2.07, 2.4, shutters);
    const loft = add(home, geo('loft-window', () => new THREE.CylinderGeometry(.38, .38, .1, 24)), mat('window-glass', '#668c8b'), 0, 4.48, 2.78); loft.rotation.x = Math.PI / 2;
    add(home, geo('loft-trim', () => new THREE.TorusGeometry(.41, .07, 6, 24)), cream, 0, 4.48, 2.85);
    // A tiny doorstep garden is part of the cottage rather than another landmark.
    for (const side of [-1, 1]) {
      rounded(home, mat('planter-clay', '#976349'), side * 2.73, .32, 3.0, .65, .61, .65, .15);
      ball(home, darkLeaf, side * 2.73, .83, 3.0, .47, .56, .47);
      flower(home, side * 2.73, 3.0, flowerPink, .8, .87);
    }
    // Daylight smoke is three soft puffs; no particle system or remote texture.
    for (let i = 0; i < 3; i++) ball(home, mat('chimney-smoke', '#aca998'), 1.75 + i * .12, 6.58 + i * .39, -.7 - i * .12, .23 + i * .09, .29 + i * .09, .23 + i * .09);
  }
  const themeRoof = zone.id === 'maison' || zone.id === 'lettres' ? '#915b48' : zone.id === 'gare' ? '#66746c' : cozyPalette.roof;
  cottage(0, -18.4, 0, 1.04, '#bca47e', '#577663', themeRoof);
  cottage(-17.6, -12.6, .36, .88, '#c3ad8b', '#637b84', '#945d47');
  cottage(17.6, -12.9, -.39, .92, '#af8f79', '#486c57', '#82503c');
  cottage(12.7, 16.4, Math.PI + .2, .72, '#b6a078', '#5b737c', '#985f47');

  function tree(x: number, z: number, size = 1, type = 0): void {
    const crown = [mat('tree-sage', '#476c43'), mat('tree-light', '#6c7e4a'), mat('tree-forest', '#547659')][type % 3];
    add(root, cylinder, darkWood, x, 1.35 * size, z, .23 * size, 2.7 * size, .23 * size);
    const branch = add(root, cylinder, darkWood, x + .34 * size, 2.0 * size, z, .11 * size, 1.05 * size, .11 * size); branch.rotation.z = -.58;
    ball(root, crown, x, 3.18 * size, z, 1.51 * size, 1.6 * size, 1.47 * size);
    ball(root, crown, x - .82 * size, 2.84 * size, z + .17 * size, 1.13 * size, 1.18 * size, 1.1 * size);
    ball(root, crown, x + .83 * size, 2.84 * size, z + .12 * size, 1.11 * size, 1.2 * size, 1.12 * size);
    if (type === 0) for (const [dx, dy, dz] of [[-.6, 3.4, 1.12], [.65, 3.0, 1.11], [.88, 3.65, .75], [-1.12, 2.8, .62]]) ball(root, mat('apple-red', '#9b5339'), x + dx * size, dy * size, z + dz * size, .17 * size);
  }
  const trees: [number, number, number, number][] = [[-21,-8,1.12,1],[-20,-15,.94,2],[-12,-20,1.12,0],[-8,-20,.88,1],[8,-20,1.04,2],[20,-7,1.06,0],[22,-2,.89,1],[20,13,1.1,2],[17,18,.96,0],[7,21,1.04,1],[-3,21,.92,2],[-11,19,1.13,0],[-20,14,.93,2],[-23,3,.86,1]];
  for (const [x,z,size,type] of trees) tree(x,z,size,type);

  function fence(points: Point[]): void {
    for (let i = 0; i < points.length; i++) {
      const [x,z] = points[i]; rounded(root, cream, x, .62, z, .15, 1.24, .15, .05);
      if (!i) continue; const [px,pz] = points[i-1], dx=x-px, dz=z-pz, length=Math.hypot(dx,dz);
      for (const h of [.44,.87]) { const rail=rounded(root,cream,(x+px)/2,h,(z+pz)/2,length,.12,.09,.035); rail.rotation.y=-Math.atan2(dz,dx); }
    }
  }
  fence([[-22,-11],[-21,-9],[-20,-7],[-19,-5]]);
  fence([[14,-18],[16,-18],[18,-17],[20,-16]]);
  fence([[8,18],[6,19],[4,19.5]]);

  function vegetablePatch(x: number, z: number): void {
    rounded(root, mat('garden-soil', '#75593f'), x, .065, z, 5.2, .12, 3.4, .28);
    for (const dx of [-2.62,2.62]) rounded(root, wood, x+dx, .16, z, .14, .28, 3.65, .045);
    for (const dz of [-1.77,1.77]) rounded(root, wood, x, .16, z+dz, 5.4, .28, .14, .045);
    for (let row=0;row<3;row++) for (let col=0;col<6;col++) {
      const px=x-2.05+col*.81, pz=z-1.04+row*1.02;
      if (row===0) { ball(root,mat('pumpkin-orange','#b4823f'),px,.27,pz,.29,.25,.28); for(let k=0;k<4;k++){const a=k*Math.PI/2;ball(root,leaf,px+Math.cos(a)*.14,.53,pz+Math.sin(a)*.14,.17,.07,.08);} }
      else if(row===1) { ball(root,mat('cabbage-light','#758650'),px,.29,pz,.27,.27,.27); ball(root,darkLeaf,px-.12,.2,pz,.2,.1,.24); ball(root,leaf,px+.12,.21,pz,.2,.1,.24); }
      else { ball(root,mat('carrot-orange','#a7753c'),px,.13,pz,.11,.14,.11); for(let k=0;k<3;k++){const blade=ball(root,leaf,px+(k-1)*.07,.35,pz,.055,.25,.045);blade.rotation.z=(k-1)*.38;} }
    }
    fence([[x-2.65,z-2.15],[x-.9,z-2.15],[x+.9,z-2.15],[x+2.65,z-2.15]]);
    rounded(root, mat('watering-can', '#527b7b'), x+3.2, .34, z+1.0, .55,.61,.48,.15);
    const spout=add(root,cylinder,mat('watering-can','#527b7b'),x+3.59,.5,z+1,.07,.55,.07);spout.rotation.z=-.8;
    const handle=add(root,geo('can-handle',()=>new THREE.TorusGeometry(.25,.055,5,12)),mat('watering-can','#527b7b'),x+2.89,.48,z+1);handle.rotation.y=Math.PI/2;
  }
  vegetablePatch(-11.2,-17.3);

  function pond(): void {
    const water=mat('pond-water',cozyPalette.water,.3), pondShape=new THREE.Shape();
    pondShape.moveTo(-3.6,-1.8);pondShape.bezierCurveTo(-4.9,.2,-3.7,2.9,-1.2,2.8);pondShape.bezierCurveTo(1.7,3.7,4.7,1.8,4.0,-.3);pondShape.bezierCurveTo(3.7,-2.1,1.4,-3.4,-.3,-2.7);pondShape.bezierCurveTo(-1.5,-2.2,-2.7,-3.1,-3.6,-1.8);
    const geometry=geo('pond-outline',()=>new THREE.ShapeGeometry(pondShape,24));
    const shore=add(root,geometry,mat('pond-shore','#8f8056'),-17,.03,6,1.09,1.09,1);shore.rotation.x=-Math.PI/2;shore.castShadow=false;
    const surface=add(root,geometry,water,-17,.047,6);surface.rotation.x=-Math.PI/2;surface.castShadow=false;
    for(const [dx,dz]of[[-2.5,-1.2],[-1.7,1.6],[2.2,.4],[2.7,1.2]]){
      const pad=add(root,geo('lily-pad',()=>new THREE.CircleGeometry(.38,12)),mat('lily-pad','#51744e'),-17+dx,.066,6+dz);pad.rotation.x=-Math.PI/2;pad.castShadow=false;
      if(dx>2)flower(root,-17+dx,6+dz,flowerPink,.52,.06);
    }
    for(let i=0;i<9;i++){const x=-20.65+i*.27,z=4.45+Math.sin(i*.8)*.19;const stem=add(root,cylinder,darkLeaf,x,.42,z,.025,.81,.025);stem.rotation.z=(i%3-1)*.1;ball(root,mat('reeds','#6a583a'),x,.84,z,.055,.17,.055);}
    // A small footbridge, with individual curved deck boards and rounded rails.
    for(let i=0;i<13;i++){const z=3.25+i*.46,y=.22+Math.sin(i*Math.PI/12)*.39;rounded(root,wood,-17,y,z,2.05,.15,.43,.07);}
    for(const side of[-1,1]){
      for(const z of[3.3,6,8.7])rounded(root,cream,-17+side*1.02,1.0,z,.12,1.25,.12,.045);
      const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-17+side*1.02,1.52,3.3),new THREE.Vector3(-17+side*1.02,1.72,6),new THREE.Vector3(-17+side*1.02,1.52,8.7)]);
      add(root,new THREE.TubeGeometry(curve,16,.065,6,false),cream);
    }
    for(const [dx,dz,angle]of[[2.3,-1.5,.5],[-2.4,.5,-.4]]){
      const duck=new THREE.Group();duck.position.set(-17+dx,.11,6+dz);duck.rotation.y=angle;root.add(duck);
      ball(duck,white,0,.16,0,.29,.22,.42);ball(duck,white,0,.47,.24,.19,.2,.2);ball(duck,yellow,0,.44,.44,.12,.065,.15);
      ball(duck,mat('duck-eye','#2d3b30'),.15,.52,.32,.025);ball(duck,mat('duck-eye','#2d3b30'),-.15,.52,.32,.025);
    }
  }
  pond();

  // Hand-placed meadow clusters keep the central evidence paths clear.
  const flowerBeds: [number,number,number][]=[[-14,14,0],[-9,17,1],[-5,18,2],[2,18,0],[17,2,1],[19,-3,2],[-21,-2,1],[-13,-12,0],[8,-17,2],[18,11,0]];
  for(const[x,z,color]of flowerBeds)for(let i=0;i<7;i++){const a=i*2.4,r=.3+Math.floor(i/3)*.32;flower(root,x+Math.cos(a)*r,z+Math.sin(a)*r,[white,flowerPink,flowerLilac][color],.85+(i%3)*.1);}
  for(const[x,z]of[[-16,15],[-7,19],[19,4],[17,-5],[-20,-4],[10,-20]]){
    for(let i=0;i<3;i++)ball(root,[leaf,darkLeaf,mat('hedge-light','#637c48')][i],x+(i-1)*.46,.45,z,.6,.6,.57);
  }
  for(const[x,z,s]of[[-22,9,.5],[-21,11,.35],[21,-10,.55],[19,17,.4],[-6,-21,.45]])ball(root,mat('river-stone','#858d76'),x,.2,z,s,.26,s*.78);

  function umbrella(x:number,z:number,color:string):void{
    const cover=mat(`umbrella-${color}`,color);add(root,cylinder,cream,x,1.8,z,.055,3.6,.055);
    add(root,geo('umbrella-cone',()=>new THREE.ConeGeometry(2.05,.72,10)),cover,x,3.61,z);
    ball(root,cream,x,4.01,z,.12);
    rounded(root,wood,x,.87,z,1.8,.12,1.8,.28);add(root,cylinder,cream,x,.45,z,.09,.82,.09);
    for(const[dx,dz]of[[-1.25,0],[1.25,0],[0,1.25]]){rounded(root,mat('cafe-seat','#687d61'),x+dx,.46,z+dz,.57,.12,.57,.13);add(root,cylinder,cream,x+dx,.22,z+dz,.055,.43,.055);}
    add(root,geo('little-cup',()=>new THREE.CylinderGeometry(.13,.11,.22,10)),cream,x+.29,1.03,z+.1);
  }
  function stall(x:number,z:number,color:string,produce:string):void{
    const frame=new THREE.Group();frame.position.set(x,0,z);root.add(frame);
    for(const px of[-1.5,1.5])for(const pz of[-.82,.82])rounded(frame,cream,px,1.43,pz,.11,2.86,.11,.03);
    rounded(frame,wood,0,.72,0,3.25,1.24,1.8,.12);rounded(frame,cream,0,1.39,0,3.42,.16,1.93,.08);
    for(let i=0;i<8;i++){const strip=rounded(frame,i%2?cream:mat(`awning-${color}`,color),-1.54+i*.44,2.86,0,.45,.14,2.21,.055);strip.rotation.x=.075;rounded(frame,i%2?cream:mat(`awning-${color}`,color),-1.54+i*.44,2.65,1.07,.45,.4,.08,.07);}
    for(let i=0;i<3;i++){rounded(frame,darkWood,-1+i,.1+1.42,0,.85,.15,1.3,.05);for(let k=0;k<5;k++)ball(frame,mat(`produce-${produce}`,produce),-1+i+(k%2-.5)*.24,1.7+Math.floor(k/2)*.035,(Math.floor(k/2)-1)*.28,.15,.14,.15);}
  }
  function laundry():void{
    for(const x of[16.1,21.2])rounded(root,wood,x,1.45,10.7,.12,2.9,.12,.035);
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(16.1,2.75,10.7),new THREE.Vector3(18.65,2.42,10.7),new THREE.Vector3(21.2,2.75,10.7)]);
    add(root,new THREE.TubeGeometry(curve,20,.025,4,false),cream);
    for(let i=0;i<4;i++){const x=16.9+i*1.15,y=2.0+Math.abs(i-1.5)*.06;rounded(root,[cream,mat('laundry-clay','#9d7569'),mat('laundry-blue','#687e83'),cream][i],x,y,10.7,.76,.95,.035,.05);for(const dx of[-.27,.27])rounded(root,darkWood,x+dx,y+.49,10.7,.06,.14,.08,.014);}
    rounded(root,wood,18.6,.23,12,.9,.45,.65,.16);
  }
  function trainStop():void{
    ribbon([[12,-18],[15,-17],[20,-16]],1.4,mat('platform-gravel','#8d8a75'));
    for(const dz of[-.45,.45])rounded(root,darkWood,18,.15,-16+dz,11,.12,.1,.03);
    for(let i=0;i<18;i++)rounded(root,wood,12.7+i*.62,.08,-16,.17,.12,1.35,.025);
    const station=new THREE.Group();station.position.set(17.6,0,-17.4);root.add(station);
    rounded(station,cream,0,.32,0,6.5,.56,2.7,.14);
    for(const x of[-2.7,2.7])rounded(station,cream,x,1.88,-.4,.15,3.1,.15,.04);
    rounded(station,mat('station-roof','#506a64'),0,3.41,-.35,6.8,.25,2.6,.13);
    for(const x of[-.55,.55]){rounded(station,wood,x,.94,-.1,.12,1.2,.1,.02);}rounded(station,wood,0,1.33,-.1,1.75,.13,.43,.035);
    add(station,geo('station-clock',()=>new THREE.CylinderGeometry(.4,.4,.12,24)),cream,0,2.63,.86).rotation.x=Math.PI/2;
    rounded(station,darkWood,.07,2.69,.94,.045,.31,.035,.008).rotation.z=-.8;
  }
  if(zone.id==='marche'){
    stall(16.5,-3.8,'#a5774c','#9b5c42');stall(18.4,1.6,'#617457','#b28a3f');
    rounded(root,wood,15.1,.4,2.9,.95,.8,.8,.1);ball(root,leaf,15.1,.95,2.9,.45,.32,.4);
  }else if(zone.id==='cafe'){
    umbrella(16.6,-3.4,'#a7805b');umbrella(18,2.6,'#627c68');
    rounded(root,mat('menu-board','#3d5c4b'),15.1,.8,.0,.7,1.5,.09,.06).rotation.y=-.3;
  }else if(zone.id==='gare'){
    trainStop();umbrella(19,4.0,'#687d61');
  }else if(zone.id==='maison'){
    laundry();vegetablePatch(18.1,-3.5);
  }else if(zone.id==='lettres'){
    umbrella(17.5,1,'#9e7468');laundry();
    const mailbox=rounded(root,mat('mailbox-teal','#4b6d60'),15,.99,6.1,.72,.84,.62,.2);mailbox.rotation.y=-.2;add(root,cylinder,wood,15,.42,6.1,.07,.84,.07);
  }else{
    laundry();
    rounded(root,wood,17,.85,-1.4,3.3,.19,1.25,.1);for(const dx of[-1.2,1.2])for(const dz of[-.4,.4])rounded(root,cream,17+dx,.42,-1.4+dz,.13,.85,.13,.03);
    for(let i=0;i<3;i++){const pot=add(root,geo('paint-pot',()=>new THREE.CylinderGeometry(.23,.2,.45,12)),[mat('paint-coral','#aa694b'),mat('paint-blue','#547889'),yellow][i],16.35+i*.58,1.14,-1.4);pot.castShadow=true;}
  }

  // Deterministic scenic geometry is baked by material: many small details,
  // a handful of draw calls. Nothing here is an interactive evidence target.
  root.updateMatrixWorld(true);
  const batches = new Map<Mat, THREE.BufferGeometry[]>();
  root.traverse(child=>{
    if(!(child instanceof THREE.Mesh)||!(child.material instanceof THREE.MeshStandardMaterial))return;
    const copy=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();copy.applyMatrix4(child.matrixWorld);copy.deleteAttribute('uv');copy.deleteAttribute('uv1');
    if(!copy.getAttribute('normal'))copy.computeVertexNormals();
    const list=batches.get(child.material)??[];list.push(copy);batches.set(child.material,list);
  });
  const baked = new THREE.Group();baked.name=root.name;
  for(const [material,parts]of batches){const merged=mergeGeometries(parts,false);if(merged){const mesh=new THREE.Mesh(merged,material);mesh.castShadow=!['surrounding-water','meadow','warm-path','pond-water','pond-shore'].includes(material.name);mesh.receiveShadow=true;baked.add(mesh);}for(const part of parts)part.dispose();}
  const originals=new Set<THREE.BufferGeometry>();root.traverse(child=>{if(child instanceof THREE.Mesh)originals.add(child.geometry);});for(const geometry of originals)geometry.dispose();
  baked.userData.backgroundOnly=true;
  return baked;
}

/** The authored atelier is a cutaway room, so relationships remain visible from above. */
export function createWorkshopScenery(): THREE.Group {
  const group = new THREE.Group(); group.name='situated-atelier-room';
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (color:string) => { let value=materials.get(color);if(!value){value=new THREE.MeshStandardMaterial({color,roughness:1});materials.set(color,value);}return value; };
  const box = (size:[number,number,number],position:[number,number,number],color:string):THREE.Mesh => {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(color));mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
  };
  const ball = (radius:number,position:[number,number,number],color:string,scale:[number,number,number]=[1,1,1]):THREE.Mesh => {
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,12,8),mat(color));mesh.position.set(...position);mesh.scale.set(...scale);mesh.castShadow=true;group.add(mesh);return mesh;
  };
  box([54,.3,54],[0,-.4,0],'#4c6849');
  box([27,.35,24],[0,-.18,1],'#5a4434');
  // Matte boards and broad, clear aisles make small keys and spatial demonstrations readable.
  for(let row=0;row<24;row++)for(let column=0;column<9;column++){
    box([2.94,.06,.97],[-12+column*3,.025,-10.5+row],(row+column)%3===0?'#8a6c4b':'#806044');
  }
  box([27,4,.35],[0,2,-11],'#b7a184');
  box([.35,4,24],[-13.5,2,.8],'#a58e71');
  for(const x of [-13,0,13])box([.22,4.2,.48],[x,2.1,-10.8],'#5a4434');
  box([27.5,.3,.7],[0,4.1,-11],'#5a4434');
  box([.7,.3,24],[-13.5,4.1,1],'#5a4434');
  for(const x of [-8,7]) {
    box([3.1,2.1,.18],[x,2.6,-10.77],'#5a4434');
    box([2.75,1.8,.2],[x,2.6,-10.65],'#5b7c80');
    box([.1,1.85,.12],[x,2.6,-10.48],'#d8c7a4');
    box([2.8,.1,.12],[x,2.6,-10.48],'#d8c7a4');
    box([3.4,.17,.65],[x,1.5,-10.5],'#806044');
  }
  box([9,.07,2.1],[0,.09,12.7],'#a79573');
  box([9,.2,.7],[0,-.04,13.5],'#806147');
  // Unlabelled set dressing stays at the margins, away from the evidence displays.
  for(const [x,z] of [[-12,-9],[12,-9],[-12,10],[12,10]]){
    box([.7,.65,.7],[x,.36,z],'#874e3b');
    ball(.5,[x,1.1,z],'#597b4e',[.9,1.2,.9]);
    ball(.38,[x-.25,1.25,z+.1],'#476c43');
  }
  const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();group.updateMatrixWorld(true);
  group.traverse(child=>{if(!(child instanceof THREE.Mesh))return;const geometry=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();geometry.applyMatrix4(child.matrixWorld);geometry.deleteAttribute('uv');const material=child.material as THREE.Material;const parts=batches.get(material)||[];parts.push(geometry);batches.set(material,parts);});
  const baked=new THREE.Group();baked.name=group.name;
  for(const [material,parts]of batches){const geometry=mergeGeometries(parts,false);if(geometry){const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;baked.add(mesh);}parts.forEach(part=>part.dispose());}
  group.traverse(child=>{if(child instanceof THREE.Mesh)child.geometry.dispose();});return baked;
}
