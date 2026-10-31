import * as THREE from 'three';
import type { Evidence, SceneObject, WorldAction, Zone } from '../content/types';
import { pictureSvg } from '../ui/pictures';

export interface SituatedInteractionState {
  held: string | null;
  placements: Record<string, { target: string; relation: 'in' | 'on' | 'under' }>;
  opened: string[];
  delivered: Record<string, string>;
  combined?: [string, string][];
  history?: WorldAction[];
}
type Entity = { data: SceneObject; root: THREE.Group; hinge?: THREE.Group; height: number; original: THREE.Vector3; originalRotation: THREE.Quaternion };
type Surface = { width: number; measuredHeight: number; id: string; evidence?: Evidence; entity?: Entity; element: HTMLDivElement; position: THREE.Vector3; offset: THREE.Vector3; height: number; surface: string; revision: number };
const palette = { paper:'#d8c7a4', wood:'#806044', dark:'#5a4434', brass:'#b28e46', ink:'#334e43' };
const colors: Record<string,string> = {rouge:'#ad5540',bleu:'#52748c',bleue:'#52748c',jaune:'#c5a04d',vert:'#54754b',verte:'#54754b',blanc:'#e5ddc7',blanche:'#e5ddc7',noir:'#273a34',noire:'#273a34'};

/** Authored props and their own physical writing, separate from the legacy exhibit mode. */
export class SituatedLayer {
  readonly targets: THREE.Group[] = [];
  private readonly entities = new Map<string,Entity>();
  private readonly surfaces: Surface[] = [];
  private readonly materialCache = new Map<string,THREE.MeshStandardMaterial>();
  private readonly printedTextures = new Set<THREE.Texture>();
  private disposed=false;
  private snapshot: SituatedInteractionState = {held:null,placements:{},opened:[],delivered:{}};
  private focused?: string;
  private renderWords?: (text:string,evidence?:Evidence)=>string;
  private revision=0;
  private paused=true;
  private readonly activeSpeech=new Map<string,string>();
  private activeDemo?:{actor:string;action:WorldAction;started:number;origin:THREE.Vector3};
  private activeTravel?:{actor:string;target:string;companions:string[];started:number;origins:Map<string,THREE.Vector3>};

  constructor(private readonly scene:THREE.Scene,private readonly labels:HTMLElement,private readonly zone:Zone,private readonly interact:(id:string)=>void) {
    for(const object of zone.scene||[])this.createEntity(object);
    for(const evidence of zone.evidence)if(evidence.surface==='speech'&&evidence.anchor&&!this.activeSpeech.has(evidence.anchor))this.activeSpeech.set(evidence.anchor,evidence.id);
    for(const evidence of zone.evidence)this.createSurface(evidence.id,evidence.text,evidence.surface||'sign',evidence.anchor,evidence.offset,evidence);
    for(const object of zone.scene||[]) {
      const attached=zone.evidence.filter(e=>e.anchor===object.id).map(e=>e.text);
      if(object.label&&!attached.includes(object.label))this.createSurface(`entity-${object.id}`,object.label,'top',object.id);
      for(const [index,label]of(object.labels||[]).entries())if(!attached.includes(label.text))this.createSurface(`entity-${object.id}-${index}`,label.text,label.surface,object.id,label.offset);
    }
    this.snapshot.opened=(zone.scene||[]).filter(object=>object.open).map(object=>object.id);
    this.setInteractionState(this.snapshot);
    this.applyPoses();
  }
  private material(color:string):THREE.MeshStandardMaterial {let m=this.materialCache.get(color);if(!m){m=new THREE.MeshStandardMaterial({color,roughness:1});this.materialCache.set(color,m);}return m;}
  private box(parent:THREE.Object3D,size:[number,number,number],position:[number,number,number],color:string):THREE.Mesh {const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),this.material(color));mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  private ball(parent:THREE.Object3D,radius:number,position:[number,number,number],color:string,scale:[number,number,number]=[1,1,1]):THREE.Mesh {const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,12,8),this.material(color));mesh.position.set(...position);mesh.scale.set(...scale);mesh.castShadow=true;parent.add(mesh);return mesh;}
  private cylinder(parent:THREE.Object3D,radius:number,height:number,position:[number,number,number],color:string):THREE.Mesh {const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,12),this.material(color));mesh.position.set(...position);mesh.castShadow=true;parent.add(mesh);return mesh;}
  private torus(parent:THREE.Object3D,radius:number,tube:number,position:[number,number,number],color:string):THREE.Mesh {const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,6,18),this.material(color));mesh.position.set(...position);parent.add(mesh);return mesh;}

  /** Ink is printed on actual coins, tickets and faces, rather than an evidence card. */
  private printed(parent:THREE.Object3D,text:string,width:number,depth:number,position:[number,number,number],background=palette.paper,ink=palette.ink):THREE.Mesh {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
    const context=canvas.getContext('2d')!;context.fillStyle=background;context.fillRect(0,0,512,256);
    context.fillStyle=ink;context.font='bold 100px serif';context.textAlign='center';context.textBaseline='middle';context.fillText(text,256,135,480);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;this.printedTextures.add(texture);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
    face.rotation.x=-Math.PI/2;face.position.set(...position);parent.add(face);return face;
  }
  private stroke(parent:THREE.Object3D,from:[number,number,number],to:[number,number,number],color:string,radius=.025):THREE.Mesh {
    const start=new THREE.Vector3(...from),end=new THREE.Vector3(...to),delta=end.clone().sub(start);
    const mesh=this.cylinder(parent,radius,delta.length(),[...start.add(end).multiplyScalar(.5).toArray()] as [number,number,number],color);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;
  }
  private arrow(parent:THREE.Object3D,from:[number,number,number],to:[number,number,number],color=palette.ink):void {
    this.stroke(parent,from,to,color,.035);
    const direction=new THREE.Vector3(...to).sub(new THREE.Vector3(...from)).normalize();
    const sideways=new THREE.Vector3(-direction.z,0,direction.x);
    const base=new THREE.Vector3(...to).addScaledVector(direction,-.2);
    for(const sign of[-1,1])this.stroke(parent,to,base.clone().addScaledVector(sideways,.13*sign).toArray() as [number,number,number],color,.035);
  }
  private steam(parent:THREE.Object3D,x=0,y=.9,z=0):void {
    for(const shift of[-.17,.12]){
      this.stroke(parent,[x+shift,y,z],[x+shift-.05,y+.2,z-.02],'#c9c7b2',.016);
      this.stroke(parent,[x+shift-.05,y+.2,z-.02],[x+shift+.04,y+.39,z],'#c9c7b2',.014);
    }
  }
  private thermometer(parent:THREE.Object3D,hot:boolean):void {
    this.cylinder(parent,.035,.9,[.65,.58,0],'#b6c8bf');this.ball(parent,.09,[.65,.14,0],'#a55843');
    const length=hot?.73:.15;this.cylinder(parent,.021,length,[.65,.2+length/2,0],'#a55843');
    for(const y of[.35,.55,.75,.95])this.stroke(parent,[.69,y,0],[.77,y,0],palette.ink,.012);
  }
  private miniaturePerson(parent:THREE.Object3D,x:number,z:number,scale:number,female=false,color='#8a9b83'):THREE.Group {
    const person=new THREE.Group();person.position.set(x,.08,z);person.scale.setScalar(scale);parent.add(person);
    this.ball(person,.19,[0,.82,0],'#c99b76');this.ball(person,.2,[0,.92,-.02],female?'#655043':'#8d8274',[1,.55,1]);
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.16,female?.29:.2,.51,10),this.material(color));body.position.y=.46;person.add(body);
    for(const side of[-1,1]){
      this.stroke(person,[side*.12,.25,0],[side*.13,.02,.03],palette.dark,.05);
      this.stroke(person,[side*.17,.63,0],[side*.29,.32,.04],'#c99b76',.045);
    }
    return person;
  }
  private smallFood(parent:THREE.Object3D,kind:string,color:string,detail=''):number {
    const stale=detail.includes('stale');
    if(detail.includes('half')){
      const half=new THREE.Group();half.scale.set(.52,1,1);half.position.x=-.24;parent.add(half);
      this.smallFood(half,kind,color,detail.replace('half',''));
      // The visible cut face and the corresponding missing half are physical,
      // rather than a different French label on an otherwise identical prop.
      const cut=this.cylinder(parent,/apple/.test(kind)?.28:.22,.035,[.04,.28,0],/apple/.test(kind)?'#e6d8ad':'#dcca9c');cut.rotation.z=Math.PI/2;
      this.printed(parent,'½',.32,.25,[-.3,.58,.1],palette.paper);return .6;
    }
    if(/bread/.test(kind)){
      this.ball(parent,.45,[0,.25,0],stale?'#826b43':'#bc9055',[1.55,.6,.62]);
      for(const x of[-.36,0,.36])this.stroke(parent,[x-.09,.5,-.13],[x+.08,.5,.13],stale?'#695b42':'#e7d1a0',.045);
      if(detail.includes('fresh'))this.steam(parent,0,.58,0);return .55;
    }
    if(/apple|fruit/.test(kind)){
      this.ball(parent,.36,[-.06,.34,0],color==='\u00237b8a64'?'#a9533b':color,[1,.92,.9]);
      this.ball(parent,.32,[.09,.34,0],color==='\u00237b8a64'?'#a9533b':color,[1,.92,.9]);
      this.stroke(parent,[0,.58,0],[.04,.83,0],palette.dark,.035);this.ball(parent,.12,[.16,.72,0],'#59774a',[1.3,.2,.55]);return .8;
    }
    if(/pear/.test(kind)){
      this.ball(parent,.36,[0,.29,0],'#b2b563',[1,.95,.8]);this.ball(parent,.22,[0,.6,0],'#b2b563',[.85,1.3,.8]);
      this.stroke(parent,[0,.78,0],[.07,.94,0],palette.dark,.03);return .95;
    }
    if(/cheese/.test(kind)){
      const shape=new THREE.Shape();shape.moveTo(-.5,-.32);shape.lineTo(.5,-.32);shape.lineTo(-.5,.4);shape.closePath();
      const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.33,bevelEnabled:false}),this.material(stale?'#9c9568':'#d1b362'));mesh.rotation.x=-Math.PI/2;mesh.position.y=.1;parent.add(mesh);
      for(const [x,z]of[[-.24,-.17],[-.3,.14],[.1,-.17]])this.cylinder(parent,.065,.015,[x,.445,z],stale?'#70774b':'#a88543');
      if(detail.includes('fresh'))this.ball(parent,.05,[.4,.7,0],'#e8dca4');return .45;
    }
    if(/egg/.test(kind)){this.ball(parent,.3,[0,.37,0],'#e4d8b8',[.85,1.24,.85]);return .75;}
    if(/fish/.test(kind)){
      const fishColor=stale?'#768277':color==='#7b8a64'?'#8faaa6':color;
      this.ball(parent,.4,[0,.24,0],fishColor,[1.65,.55,.75]);
      const tail=new THREE.Mesh(new THREE.ConeGeometry(.32,.5,3),this.material(fishColor));tail.rotation.z=Math.PI/2;tail.position.set(-.7,.24,0);parent.add(tail);
      this.ball(parent,.04,[.44,.38,.14],palette.ink);this.ball(parent,.15,[0,.35,0],'#527c7b',[1,.9,.2]);
      if(detail.includes('fresh')){this.box(parent,[1.9,.08,1],[0,.03,0],'#b6ceca');this.ball(parent,.05,[.6,.65,-.2],'#e5e9dd');}return .55;
    }
    if(/carrot|vegetable/.test(kind)){
      const body=new THREE.Mesh(new THREE.ConeGeometry(.22,.95,10),this.material('#bb7945'));body.rotation.z=-Math.PI/2;body.position.set(-.05,.25,0);parent.add(body);
      for(const dz of[-.15,0,.15])this.stroke(parent,[.4,.25,0],[.72,.5,dz],'#648343',.045);return .55;
    }
    return .6;
  }
  private storyItem(parent:THREE.Group,kind:string):void {
    if(kind==='key'){
      this.torus(parent,.2,.06,[-.18,.05,0],palette.brass).rotation.x=Math.PI/2;this.box(parent,[.6,.08,.1],[.15,.05,0],palette.brass);this.box(parent,[.08,.08,.2],[.35,.05,.06],palette.brass);
    }else if(kind==='book'){
      this.box(parent,[.9,.16,.7],[0,.13,0],'#718e83');this.box(parent,[.84,.08,.64],[0,.2,.02],palette.paper);this.stroke(parent,[0,.25,-.3],[0,.25,.3],palette.wood,.018);
    }else if(kind==='photo'){
      this.box(parent,[1.1,.05,.8],[0,.07,0],palette.dark);this.box(parent,[.95,.025,.65],[0,.11,0],palette.paper);this.ball(parent,.12,[0,.16,-.1],'#c99b76',[1,.25,1]);this.box(parent,[.3,.025,.24],[0,.14,.1],'#78978f');
    }else if(kind==='train'||kind==='house'){
      const model=new THREE.Group();model.scale.setScalar(kind==='train'?.16:.28);parent.add(model);this.villageProp(model,{id:'memory-model',kind:kind==='house'?'station':'train',position:[0,0]},'#78978f');
      if(kind==='house')this.box(model,[.4,.4,.4],[.65,2.4,0],palette.wood);
    }else if(kind==='ticket')this.villageProp(parent,{id:'memory-ticket',kind:'ticket',position:[0,0],detail:'12:00 · 3'},palette.paper);
    else if(kind==='envelope')this.villageProp(parent,{id:'memory-envelope',kind:'envelope',position:[0,0]},palette.paper);
    else{
      this.box(parent,[.9,.025,.6],[0,.06,0],palette.paper);
      for(const z of[-.13,0,.13])this.stroke(parent,[-.27,.08,z],[.27,.08,z],palette.wood,.014);
      if(kind==='letter')this.ball(parent,.065,[.32,.1,-.17],'#a15e4a',[1,.2,1]);
    }
  }
  /** All quantities are rendered; metadata alone cannot invent a visual contrast. */
  private villageProp(root:THREE.Group,data:SceneObject,color:string):number|undefined {
    const kind=data.kind,detail=data.detail??'';
    if(/^(bread|apple|pear|fruit|cheese|egg|fish|carrot|vegetable)(-|$)/.test(kind)){
      const amount=Math.max(1,Math.min(100,Math.round(data.quantity??1))),cols=Math.ceil(Math.sqrt(amount));
      root.userData.renderedPieces=amount;
      const spacing=amount>1?.65:1;const unit=amount>1?.55:1;
      for(let n=0;n<amount;n++){
        const food=new THREE.Group();food.position.set(((n%cols)-(cols-1)/2)*spacing,0,(Math.floor(n/cols)-(Math.ceil(amount/cols)-1)/2)*spacing);food.scale.setScalar(unit);root.add(food);this.smallFood(food,kind,color,detail);
      }
      return amount>1?.55:.95;
    }
    if(/^(money|coin)(-|$)/.test(kind)){
      const units=data.quantity?Array(Math.max(1,Math.min(100,Math.round(data.quantity)))).fill(1) as number[]:[];
      if(!units.length){let remaining=Math.max(1,Math.round(data.value??1));for(const denomination of detail==='twenties'?[20,10,5,2,1]:detail==='tens'?[10,5,2,1]:[100,50,20,10,5,2,1])while(remaining>=denomination){units.push(denomination);remaining-=denomination;}}
      root.userData.renderedPieces=units.length;
      const cols=Math.min(5,Math.ceil(Math.sqrt(units.length)));
      units.forEach((value,i)=>{
        const x=((i%cols)-(cols-1)/2)*.6,z=(Math.floor(i/cols)-(Math.ceil(units.length/cols)-1)/2)*.57;
        if(value>=5){this.box(root,[.65,.035,.36],[x,.08,z],value>=50?'#b6aa82':value>=20?'#9cbaad':'#b2ba86');this.printed(root,String(value),.6,.3,[x,.105,z],value>=50?'#b6aa82':value>=20?'#9cbaad':'#b2ba86');}
        else{this.cylinder(root,.24,.065,[x,.08,z],palette.brass);this.printed(root,String(value),.3,.25,[x,.12,z],palette.brass);}
      });return .17;
    }
    if(/^(basket|bag)(-|$)/.test(kind)){
      if(kind.startsWith('basket')){
        const shell=new THREE.Mesh(new THREE.CylinderGeometry(.69,.53,.64,12,1,true),this.material('#b49159'));shell.position.y=.36;root.add(shell);
        this.cylinder(root,.54,.05,[0,.06,0],palette.wood);
        for(const y of[.15,.33,.52,.68])this.torus(root,.58+(y-.15)*.18,.025,[0,y,0],palette.dark).rotation.x=Math.PI/2;
        const handle=this.torus(root,.64,.055,[0,.74,0],palette.wood);handle.scale.y=.8;
      }else{
        this.box(root,[1.05,.76,.58],[0,.42,0],data.color?color:'#b5a173');this.torus(root,.28,.045,[0,.95,0],palette.dark).scale.x=1.2;
        this.box(root,[.93,.04,.49],[0,.82,0],palette.dark);
      }
      if(!detail.includes('empty')&&/food|full/.test(detail)){const food=new THREE.Group();food.position.set(0,.68,0);food.scale.setScalar(.55);root.add(food);this.smallFood(food,'bread',color);}
      return 1.35;
    }
    if(/^(cup|tasse|glass|verre|coffee|tea)(-|$)/.test(kind)){
      const glass=/glass|verre/.test(kind),liquid=detail.includes('milk')?/tea|coffee/.test(kind)?'#bea67c':'#e2dbc3':/tea/.test(kind)||detail.includes('tea')?'#8f6339':/water/.test(kind)||glass?'#8caaa6':'#5f4733';
      const shell=new THREE.Mesh(new THREE.CylinderGeometry(glass?.29:.39,glass?.25:.29,glass?.8:.61,16,1,true),this.material(glass?'#b7c7bd':data.color?color:'#e2d4b8'));shell.position.y=glass?.45:.35;root.add(shell);
      this.cylinder(root,glass?.25:.29,.04,[0,.055,0],glass?'#9bb4ae':'#d0c4aa');
      if(!glass)this.torus(root,.23,.055,[.43,.36,0],data.color?color:'#e2d4b8');
      if(!detail.includes('empty'))this.cylinder(root,glass?.275:.35,.025,[0,glass?.68:.61,0],liquid);
      if(detail.includes('hot'))this.steam(root,0,.8,0);
      if(detail==='very-hot'){this.steam(root,-.23,1,-.1);this.steam(root,.2,1.15,.1);this.thermometer(root,true);}
      if(detail.includes('cold'))for(const [x,z]of detail==='very-cold'?[[-.13,-.12],[.13,.12],[-.13,.12],[.13,-.12]]:[[-.1,-.07],[.12,.08]])this.box(root,[.18,.14,.17],[x,glass?.73:.66,z],'#d2e1d8');
      if(detail==='very-cold')this.thermometer(root,false);
      if(detail.includes('spill')){this.ball(root,.5,[.3,.02,.15],liquid,[1,.035,.7]);root.rotation.z=.55;}
      return detail==='very-hot'?1.75:detail.includes('hot')?1.25:detail==='very-cold'?1.1:glass?.9:.7;
    }
    if(/^(water|milk|bottle-water|bottle-milk)(-|$)/.test(kind)){
      const milk=kind.includes('milk');this.cylinder(root,.3,.65,[0,.36,0],milk?'#d6d3b9':'#8ba8a7');this.cylinder(root,.12,.3,[0,.81,0],milk?'#d6d3b9':'#8ba8a7');this.cylinder(root,.135,.08,[0,1,0],milk?'#9a6f51':'#52748c');
      // Transparent-water family and opaque dairy family retain distinct contents.
      this.box(root,[.44,.28,.03],[0,.42,.3],milk?'#e9dfc9':'#c2d6d2');
      if(detail.includes('hot'))this.steam(root,0,1.15,0);
      if(detail==='very-hot'){this.steam(root,.15,1.3,.08);this.thermometer(root,true);}
      if(detail.includes('cold'))for(const [x,z]of detail==='very-cold'?[[-.35,-.3],[.35,.3],[-.35,.3],[.35,-.3]]:[[-.35,-.25],[.35,.25]])this.box(root,[.19,.16,.19],[x,.09,z],'#c7dad6');
      if(detail==='very-cold')this.thermometer(root,false);return detail.includes('hot')?1.8:1.1;
    }
    if(/^(plate|assiette|tray)(-|$)/.test(kind)){
      if(kind.startsWith('tray')){this.box(root,[2.1,.08,1.25],[0,.08,0],data.color?color:palette.wood);for(const x of[-1.03,1.03])this.box(root,[.08,.16,1.25],[x,.16,0],palette.dark);for(const z of[-.61,.61])this.box(root,[2.1,.16,.07],[0,.16,z],palette.dark);return .24;}
      this.cylinder(root,.62,.07,[0,.06,0],'#e2d6bc');this.torus(root,.52,.04,[0,.1,0],data.color?color:'#b3b99b').rotation.x=Math.PI/2;return .15;
    }
    if(/^(spoon|cuillere|cuillère|sugar)(-|$)/.test(kind)){
      if(kind.startsWith('sugar')){this.box(root,[.25,.25,.25],[0,.15,0],'#e7dfc9');return .3;}
      this.ball(root,.18,[0,.08,-.34],'#abb3a7',[.75,.2,1]);this.box(root,[.08,.04,.72],[0,.08,.15],'#abb3a7');return .12;
    }
    if(/^(stamp|timbre)(-|$)/.test(kind)){
      this.box(root,[.48,.03,.6],[0,.05,0],'#e6dcc3');this.box(root,[.37,.015,.48],[0,.075,0],data.color?color:'#8c9e8c');
      for(const x of[-.23,.23])for(const z of[-.25,-.12,0,.12,.25])this.cylinder(root,.025,.02,[x,.085,z],palette.paper);
      this.printed(root,String(data.value??1),.26,.28,[0,.09,0],data.color?color:'#8c9e8c');return .1;
    }
    if(kind==='pencil'||kind==='crayon'){
      const shaft=this.cylinder(root,.055,.95,[0,.08,0],data.color?color:'#c3a15c');shaft.rotation.z=Math.PI/2;
      const point=new THREE.Mesh(new THREE.ConeGeometry(.055,.22,8),this.material('#cbb68c'));point.rotation.z=-Math.PI/2;point.position.set(.57,.08,0);root.add(point);
      this.ball(root,.025,[.69,.08,0],palette.dark);const eraser=this.cylinder(root,.06,.13,[-.53,.08,0],'#b77764');eraser.rotation.z=Math.PI/2;return .16;
    }
    if(/^(envelope|enveloppe|address|adresse)(-|$)/.test(kind)){
      this.box(root,[1.15,.035,.75],[0,.05,0],data.color?color:palette.paper);
      if(/address|adresse/.test(kind)){
        for(const z of[-.1,.04,.18])this.stroke(root,[-.25,.08,z],[.25,.08,z],palette.ink,.014);
        this.box(root,[.19,.012,.24],[.4,.085,-.19],'#8c9e8c');
      }else if(data.open){
        const flap=new THREE.BufferGeometry();flap.setAttribute('position',new THREE.Float32BufferAttribute([-.57,.075,-.35,.57,.075,-.35,0,.55,-.65],3));flap.computeVertexNormals();
        root.add(new THREE.Mesh(flap,new THREE.MeshStandardMaterial({color:data.color?color:palette.paper,roughness:1,side:THREE.DoubleSide})));
        this.stroke(root,[-.55,.08,.35],[-.15,.08,.02],palette.wood,.015);this.stroke(root,[.55,.08,.35],[.15,.08,.02],palette.wood,.015);
      }else{
        this.stroke(root,[-.55,.08,-.35],[0,.08,.03],palette.wood,.015);this.stroke(root,[0,.08,.03],[.55,.08,-.35],palette.wood,.015);
        this.stroke(root,[-.55,.08,.35],[-.15,.08,.02],palette.wood,.015);this.stroke(root,[.55,.08,.35],[.15,.08,.02],palette.wood,.015);
      }
      return data.open?.6:.1;
    }
    if(/^(receipt|ticket)(-|$)/.test(kind)){
      const paper=data.color?color:palette.paper;
      this.box(root,[1.2,.025,.65],[0,.04,0],paper);
      this.printed(root,detail||String(data.value??0),1.12,.56,[0,.06,0],paper,data.color&&!/jaune|blanc/.test(data.color)?'#e5ddc7':palette.ink);return .09;
    }
    if(kind==='menu'){
      this.box(root,[1.45,.05,1.65],[0,.05,0],palette.dark);this.box(root,[1.3,.02,1.52],[0,.085,0],palette.paper);
      const cup=new THREE.Group();cup.position.set(-.28,.1,-.38);cup.scale.setScalar(.37);root.add(cup);this.villageProp(cup,{id:'printed-cup',kind:'cup-coffee',position:[0,0]},'#e2d4b8');
      this.printed(root,`${data.value??2} €`,.65,.3,[.25,.11,-.38]);
      for(const z of[.12,.42]){this.stroke(root,[-.48,.11,z],[.12,.11,z],palette.ink,.015);this.printed(root,z===.12?'3 €':'5 €',.4,.2,[.4,.12,z]);}return .38;
    }
    if(/^(clock)(-|$)/.test(kind)){
      const explicit=/^(\d{1,2}):(\d{2})$/.exec(detail);
      const value=data.value??1200,hour=explicit?Number(explicit[1]):value>=100?Math.floor(value/100):Math.floor(value),minute=explicit?Number(explicit[2]):value>=100?value%100:Math.round((value%1)*60);
      this.cylinder(root,1,.12,[0,.11,0],palette.dark);this.cylinder(root,.91,.025,[0,.185,0],palette.paper);
      for(let i=0;i<12;i++){const angle=i*Math.PI/6;this.stroke(root,[Math.sin(angle)*.76,.21,-Math.cos(angle)*.76],[Math.sin(angle)*.84,.21,-Math.cos(angle)*.84],palette.ink,.018);}
      const hand=(angle:number,length:number,radius:number)=>this.stroke(root,[0,.24,0],[Math.sin(angle)*length,.24,-Math.cos(angle)*length],palette.ink,radius);
      hand((hour%12+minute/60)*Math.PI/6,.49,.045);hand(minute*Math.PI/30,.7,.025);this.cylinder(root,.07,.025,[0,.26,0],palette.brass);
      this.printed(root,`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,1.1,.28,[0,.21,.46]);
      const skyDetail=detail.replace(/^standing-/,'');
      if(['matin','soir','midi'].includes(skyDetail)){
        const marker=new THREE.Group();marker.position.set(0,.08,-1.25);root.add(marker);
        this.box(marker,[1.3,.025,.65],[0,.03,0],skyDetail==='soir'?'#67788b':'#a6beb3');
        const sx=skyDetail==='matin'?-.37:skyDetail==='soir'?.37:0,sz=skyDetail==='midi'?-.12:.15;
        this.cylinder(marker,.17,.025,[sx,.075,sz],skyDetail==='soir'?'#c69162':'#dfbf68');
        this.box(marker,[1.3,.035,.2],[0,.09,.26],'#617749');
        if(skyDetail==='midi')for(const [dx,dz]of[[-.3,0],[.3,0],[0,-.3]])this.stroke(marker,[sx+dx*.75,.09,sz+dz*.75],[sx+dx,.09,sz+dz],palette.brass,.018);
        this.arrow(marker,[sx,.11,skyDetail==='soir'?.01:.3],[sx,.11,skyDetail==='soir'?.29:-.08],palette.ink);
      }
      if(detail.startsWith('standing-')){const dial=new THREE.Group();for(const child of[...root.children])dial.add(child);dial.rotation.x=Math.PI/2;dial.position.y=1.8;root.add(dial);this.box(root,[.18,1.8,.18],[0,.9,0],palette.wood);this.box(root,[.85,.12,.6],[0,.06,0],palette.dark);return 3.4;}
      return .3;
    }
    if(kind==='journey'||kind==='route'){
      this.box(root,[3.2,.06,1.9],[0,.05,0],palette.paper);
      const arrival=detail==='arrival',building=new THREE.Group();building.scale.setScalar(.28);building.position.set(arrival?.9:-.9,.1,-.15);root.add(building);this.villageProp(building,{id:'mini-station',kind:'station',position:[0,0]},color);
      const train=new THREE.Group();train.scale.setScalar(.2);train.position.set(arrival?-.85:.85,.1,.12);root.add(train);this.villageProp(train,{id:'mini-train',kind:'train',position:[0,0]},color);
      this.arrow(root,[arrival?-.5:-.35,.14,.7],[arrival?.5:.65,.14,.7],palette.brass);
      // Distinct arrows connect the vehicle to/from the same station; the
      // arrival scene ends at the building, departure starts at the building.
      return .85;
    }
    if(/^(platform)(-|$)/.test(kind)){
      this.box(root,[7,.4,2.2],[0,.2,0],'#9b9987');this.box(root,[7,.025,.14],[0,.415,-.85],'#c4a657');
      if(detail)this.printed(root,detail,1,.65,[-2.1,.43,0]);return .43;
    }
    if(/^(train)(-|$)/.test(kind)){
      const carriage=data.color?color:'#6f9189';
      this.box(root,[6.3,.22,1.65],[0,.4,0],carriage);this.box(root,[6.4,.22,1.85],[0,1.92,0],palette.dark);
      this.box(root,[6.3,1.43,.12],[0,1.12,-.78],carriage);
      this.box(root,[2.72,1.43,.12],[-1.79,1.12,.78],carriage);this.box(root,[2.76,1.43,.12],[1.77,1.12,.78],carriage);
      for(const x of[-3.1,3.1])this.box(root,[.1,1.43,1.56],[x,1.12,0],carriage);
      for(const x of[-2.2,-.8,.8,2])for(const z of[-.84,.84])this.box(root,[.85,.6,.035],[x,1.28,z],'#bad0c5');
      this.box(root,[.45,.72,1.1],[3.28,.89,0],palette.brass);this.box(root,[.04,.5,1.3],[3.18,1.45,0],'#b6cdcb');
      const door=new THREE.Group();door.name='vehicle-door';door.position.set(-.43,.45,.85);root.add(door);this.box(door,[.82,1.25,.08],[.41,.63,0],data.color?color:'#6f9189');this.box(door,[.62,.53,.035],[.41,.88,.05],'#bad0c5');
      for(const x of[-2,1.8])for(const z of[-.83,.83]){const wheel=this.cylinder(root,.37,.2,[x,.38,z],palette.dark);wheel.rotation.x=Math.PI/2;}
      for(const z of[-.65,.65]){this.box(root,[7.3,.08,.1],[0,.035,z],'#6e7269');for(const x of[-3,-2,-1,0,1,2,3])this.box(root,[.12,.055,1.75],[x,.03,0],palette.dark);}
      return 2.1;
    }
    if(/^(station)(-|$)/.test(kind)){
      this.box(root,[3,1.9,2],[0,.95,0],'#c0af89');this.box(root,[3.6,.2,2.6],[0,2.06,0],'#8c5e46');
      this.box(root,[.75,1.4,.08],[0,.7,1.03],palette.dark);for(const x of[-1,1])this.box(root,[.6,.7,.1],[x,1.07,1.04],'#83a4a4');
      this.printed(root,'↔',1.2,.5,[0,2.18,0]);return 2.2;
    }
    if(/^(bridge)(-|$)/.test(kind)){
      this.box(root,[3.1,.19,1.4],[0,.48,0],palette.wood);for(const z of[-.65,.65]){this.box(root,[3.1,.09,.07],[0,1,z],palette.dark);for(const x of[-1.4,0,1.4])this.box(root,[.1,1.05,.1],[x,.53,z],palette.dark);}return 1.1;
    }
    if(/^(street|plaza)(-|$)/.test(kind)){
      this.box(root,kind.startsWith('plaza')?[3.5,.035,3.5]:[4,.035,1.2],[0,.03,0],'#a39d86');
      for(let x=-1.5;x<=1.5;x+=.5)this.box(root,[.025,.01,kind.startsWith('plaza')?3.4:1.15],[x,.055,0],'#7e816f');return .07;
    }
    if(/^(direction)(-|$)/.test(kind)){
      const angle=detail==='gauche'?-Math.PI/2:detail==='droite'?Math.PI/2:detail==='sud'?Math.PI:0;
      const marker=new THREE.Group();marker.rotation.y=angle;root.add(marker);this.arrow(marker,[0,.09,.8],[0,.09,-.8]);
      if(detail==='nord'||detail==='sud')this.printed(root,detail==='nord'?'N':'S',.5,.35,[.65,.09,0]);return .15;
    }
    if(/^(map|route-map)(-|$)/.test(kind)){
      this.box(root,[3.2,.06,2.4],[0,.06,0],palette.paper);
      this.arrow(root,[1.25,.11,-.25],[1.25,.11,-.93]);this.printed(root,'N',.35,.3,[1.25,.12,-1]);
      this.stroke(root,[-1.15,.11,.8],[-.7,.11,.05],'#ad5540',.05);this.stroke(root,[-.7,.11,.05],[.2,.11,-.1],'#ad5540',.05);this.stroke(root,[.2,.11,-.1],[.65,.11,detail.includes('south')?.8:-.8],'#ad5540',.05);
      this.box(root,[.16,.025,2.2],[0,.095,0],'#6e9da3');
      this.box(root,[.65,.08,.35],[0,.15,-.1],palette.wood);for(const z of[-.25,.05])this.box(root,[.65,.08,.04],[0,.23,z],palette.dark);
      this.box(root,[.42,.25,.32],[.65,.23,detail.includes('south')?.8:-.8],'#a9956a');this.box(root,[.51,.06,.4],[.65,.4,detail.includes('south')?.8:-.8],'#8c5e46');return .45;
    }
    if(/^(bed)(-|$)/.test(kind)){
      this.box(root,[1.65,.45,2.6],[0,.35,0],palette.wood);this.box(root,[1.55,.3,2.45],[0,.69,0],palette.paper);this.box(root,[1.5,.1,1.65],[0,.89,.36],data.color?color:'#718e83');this.box(root,[1.17,.18,.5],[0,.95,-.84],'#e6dac1');this.box(root,[1.7,1.2,.15],[0,.65,-1.3],palette.dark);return 1.3;
    }
    if(kind==='room'){
      this.box(root,[4.7,.035,3.5],[0,.03,0],detail==='cuisine'?'#a5a78d':detail==='chambre'?'#b4a58e':'#a4afa1');
      for(const z of[-1.7,1.7])this.box(root,[4.7,.08,.07],[0,.07,z],palette.wood);return .09;
    }
    if(kind==='stove'){
      this.box(root,[1.6,1.1,1.2],[0,.6,0],'#80928a');this.box(root,[1.7,.09,1.3],[0,1.2,0],palette.dark);
      for(const x of[-.43,.43])for(const z of[-.32,.32]){this.torus(root,.23,.035,[x,1.26,z],'#b5b9a9').rotation.x=Math.PI/2;this.cylinder(root,.1,.025,[x,1.255,z],palette.dark);}
      this.box(root,[1.2,.6,.07],[0,.6,.62],palette.dark);this.box(root,[.95,.4,.025],[0,.6,.665],'#485f60');this.box(root,[1,.07,.09],[0,.98,.7],palette.brass);return 1.3;
    }
    if(kind==='sofa'){
      const fabric=data.color?color:'#9a9e7e';this.box(root,[2.6,.48,1.15],[0,.38,0],fabric);this.box(root,[2.6,.88,.25],[0,.95,-.5],fabric);
      for(const x of[-1.2,1.2])this.box(root,[.27,.72,1.2],[x,.7,0],fabric);
      for(const x of[-.55,.55])this.box(root,[.95,.15,.9],[x,.69,.1],fabric);return 1.4;
    }
    if(/^(coat|shirt)(-|$)/.test(kind)){
      const garment=new THREE.Group();garment.rotation.x=-Math.PI/2;root.add(garment);
      this.box(garment,[.8,kind.startsWith('coat')?1.35:.95,.12],[0,0,0],data.color?color:'#7b8a64');
      for(const sign of[-1,1]){const sleeve=this.box(garment,[.35,.85,.12],[sign*.53,.15,0],data.color?color:'#7b8a64');sleeve.rotation.z=sign*.38;}
      this.stroke(garment,[0,-.5,.08],[0,.48,.08],palette.dark,.02);
      for(const y of[-.3,0,.3])this.ball(garment,.035,[.09,y,.09],palette.brass);
      if(detail.includes('worn')){this.box(garment,[.22,.27,.02],[-.15,-.25,.09],'#a18c70');this.stroke(garment,[.18,.29,.1],[.3,.12,.1],palette.paper,.018);}
      if(detail.includes('beautiful'))for(const x of[-.28,.28])this.stroke(garment,[x,-.5,.1],[x,.5,.1],palette.brass,.025);
      return .18;
    }
    if(/^(flower|tree|garden)(-|$)/.test(kind)){
      if(kind.startsWith('tree')){this.cylinder(root,.2,2.4,[0,1.2,0],palette.wood);this.ball(root,1,[0,2.8,0],'#617749',[1.3,1.1,1.1]);return 4;}
      const amount=kind.startsWith('garden')?5:Math.max(1,data.quantity??1);
      root.userData.renderedPieces=amount;
      if(kind.startsWith('garden'))this.box(root,[2.2,.12,1.6],[0,.05,0],'#6f684b');
      for(let i=0;i<amount;i++){const x=amount>1?(i%3-1)*.56:0,z=amount>1?(Math.floor(i/3)-.5)*.65:0;this.stroke(root,[x,.1,z],[x,.65,z],'#55783f',.03);for(let p=0;p<5;p++){const angle=p*Math.PI*2/5;this.ball(root,.12,[x+Math.sin(angle)*.16,.75,z+Math.cos(angle)*.16],data.color?color:'#b96e55',[1,.5,1]);}this.ball(root,.09,[x,.78,z],'#c4aa59');}return .9;
    }
    if(/^(calendar)(-|$)/.test(kind)){
      this.box(root,[1.65,.08,1.95],[0,.08,0],palette.paper);this.box(root,[1.65,.03,.36],[0,.13,-.76],'#a15e4a');
      this.printed(root,String(data.value??15),1.3,1.2,[0,.14,.05]);
      for(const x of[-.47,.47])this.torus(root,.08,.025,[x,.16,-.84],palette.dark).rotation.x=Math.PI/2;
      if(detail==='hier')this.arrow(root,[.55,.17,.8],[-.55,.17,.8]);else if(detail==='demain')this.arrow(root,[-.55,.17,.8],[.55,.17,.8]);else this.cylinder(root,.06,.03,[0,.17,.8],palette.brass);return .23;
    }
    if(/^(family)(-|$)/.test(kind)){
      this.box(root,[3,.08,2.8],[0,.05,0],palette.dark);this.box(root,[2.8,.035,2.6],[0,.11,0],palette.paper);
      for(const x of[-.7,.7])this.stroke(root,[x,.14,-.5],[x,.14,.03],palette.ink,.025);this.stroke(root,[-.7,.14,-.12],[.7,.14,-.12],palette.ink,.025);
      for(const x of[-.55,.55])this.stroke(root,[0,.14,-.12],[x,.14,.8],palette.ink,.025);
      const members:[string,number,number,number,boolean,string][]=[['père',-.7,-.7,.8,false,'#78978f'],['mère',.7,-.7,.8,true,'#b2856e'],['fils',-.55,.7,.58,false,'#8d9b63'],['fille',.55,.7,.58,true,'#a58d9c']];
      const highlight=(name:string)=>detail===name||detail==='famille'||detail==='parent'&&(name==='père'||name==='mère')||detail==='enfant'&&(name==='fils'||name==='fille')||detail==='frère'&&name==='fils'||detail==='sœur'&&name==='fille';
      for(const [name,x,z,size,female,shirt]of members){this.miniaturePerson(root,x,z,size,female,shirt);if(highlight(name)){this.torus(root,.36,.035,[x,.16,z],palette.brass).rotation.x=Math.PI/2;}}
      if(detail==='sœur'||detail==='frère')this.arrow(root,[detail==='sœur'?-.4:.4,.2,.7],[detail==='sœur'?.35:-.35,.2,.7],palette.brass);
      return 1;
    }
    if(/^(timeline)(-|$)/.test(kind)){
      const [action,itemKind='letter',focus]=detail.split(':');
      if(['drink','eat','open'].includes(action)){
        this.box(root,[4.5,.08,2.1],[0,.05,0],palette.dark);this.box(root,[4.3,.025,1.9],[0,.11,0],palette.paper);
        for(const [i,x]of[-1.4,0,1.4].entries()){
          const panel=new THREE.Group();panel.position.set(x,.12,0);root.add(panel);
          const actor=this.miniaturePerson(panel,-.28,-.1,.62,false,'#78978f');
          if(action==='open'){
            this.box(panel,[.07,.95,.07],[.25,.5,0],palette.wood);this.box(panel,[.07,.95,.07],[.91,.5,0],palette.wood);this.box(panel,[.73,.07,.09],[.58,.99,0],palette.wood);
            const door=new THREE.Group();door.position.set(.29,.12,0);door.rotation.y=-i*.65;panel.add(door);this.box(door,[.58,.8,.06],[.29,.4,0],'#a58d6a');this.ball(door,.035,[.51,.4,.05],palette.brass);
          }else{
            const prop=new THREE.Group();prop.scale.setScalar(.46);panel.add(prop);
            prop.position.set(i===1?-.1:.42,i===1?.92:.2,i===1?-.02:.25);
            if(action==='drink'){this.villageProp(prop,{id:'memory-cup',kind:`cup-${itemKind}`,position:[0,0],detail:i===2?'empty':''},'#e2d4b8');if(i===1)prop.rotation.x=.55;}
            else if(i<2)this.smallFood(prop,'bread','#bc9055',i===1?'half':'');
            else for(const [cx,cz]of[[.18,.1],[-.1,-.1],[.3,-.2]])this.ball(prop,.05,[cx,.1,cz],'#bc9055');
            if(i===1)this.stroke(panel,[-.1,.65,-.1],[-.05,.94,.06],'#c99b76',.04);
            actor.rotation.y=i===1?-.3:0;
          }
          this.printed(panel,String(i+1),.3,.25,[0,.15,.77]);
          if(focus===['before','now','after'][i])this.torus(panel,.64,.035,[0,.14,0],palette.brass).rotation.x=Math.PI/2;
        }
        for(const x of[-.72,.72])this.arrow(root,[x-.2,.17,.75],[x+.2,.17,.75],palette.brass);
        return 1.4;
      }
      this.box(root,[3.3,.08,2],[0,.05,0],palette.dark);this.box(root,[3.12,.025,1.82],[0,.11,0],palette.paper);
      for(const [i,x]of[-.85,.85].entries()){
        const person=this.miniaturePerson(root,x,-.15,.65,false,'#78978f');
        const item=new THREE.Group();root.add(item);item.scale.setScalar(.35);
        const hasItem=action==='take'||action==='find'?i===1:action==='give'||action==='lose'?i===0:false;
        item.position.set(x+(hasItem?.27:.45),hasItem?.62:.18,hasItem?-.15:.5);
        this.storyItem(item,itemKind);
        if(action==='read'||action==='write'){
          item.position.set(x+.23,i===0?.62:.18,i===0?-.1:.45);
          if(action==='write'&&i===0)this.stroke(root,[x+.15,.72,-.1],[x+.42,.64,-.08],palette.dark,.015);
          if(action==='write'&&i===1)for(const z of[-.03,.04,.1])this.stroke(root,[x+.15,.23,z+.42],[x+.3,.23,z+.42],palette.ink,.01);
          if(action==='read'&&i===0)person.rotation.y=-.3;
        }
        if(action==='give'){
          this.miniaturePerson(root,x+.45,.25,.5,true,'#b2856e');if(i===1)item.position.set(x+.58,.53,.25);
          this.arrow(root,[x+.1,.2,.55],[x+.5,.2,.55],palette.brass);
        }
        if(action==='find'&&i===0){this.box(root,[.65,.3,.55],[x+.4,.2,.55],palette.wood);item.position.y=.04;}
        if(action==='lose'&&i===1)this.printed(root,'?',.4,.4,[x+.4,.2,.5]);
        if(action==='see'){
          person.rotation.y=Math.PI/4;this.stroke(root,[x+.03,.66,-.1],[x+.4,.25,.4],palette.brass,.018);
          if(i===1){item.position.set(x+.34,.25,.35);this.torus(root,.23,.02,[x+.34,.2,.35],palette.brass).rotation.x=Math.PI/2;}
        }
        this.printed(root,String((data.value??15)-1+i),.35,.25,[x,.14,.76]);
      }
      this.arrow(root,[-.3,.17,.65],[.3,.17,.65],palette.brass);return .95;
    }
    if(/^(photo|picture-frame|frame)(-|$)/.test(kind)&&data.picture){
      this.box(root,[2.2,.09,1.8],[0,.05,0],palette.wood);
      // Rasterize the self-contained SVG before GPU upload. Direct SVG image
      // textures can upload black despite a successful image decode in Chromium.
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=384;
      const context=canvas.getContext('2d')!;context.fillStyle=palette.paper;context.fillRect(0,0,canvas.width,canvas.height);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;this.printedTextures.add(texture);
      texture.userData.printReady=false;
      const source=new Image();source.onload=()=>{if(this.disposed)return;context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(source,0,0,canvas.width,canvas.height);texture.needsUpdate=true;texture.userData.printReady=true;};
      source.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(pictureSvg(data.picture).replace('<svg ','<svg width="512" height="384" '))}`;
      const image=new THREE.Mesh(new THREE.PlaneGeometry(2,1.6),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));image.rotation.x=-Math.PI/2;image.position.y=.11;root.add(image);return .15;
    }
    return undefined;
  }

  private decorateActor(root:THREE.Group,data:SceneObject,color:string):void {
    const detail=data.detail??'';
    if(detail.includes('server')){
      this.box(root,[.43,.73,.06],[0,.96,.31],'#d9cbaa');this.stroke(root,[-.16,1.29,.33],[.16,1.29,.33],palette.dark,.02);
      this.box(root,[.3,.15,.025],[0,.82,.35],palette.paper);
    }
    const action=['drink','eat','talk','greet','thanks','request','spill','pleased','refuse'].find(candidate=>detail.includes(candidate));
    if(!action)return;
    const gesture=new THREE.Group();gesture.name='detail-gesture';root.add(gesture);root.userData.semanticGesture=action;
    const rightArm=root.getObjectByName('right-arm'),rightHand=root.getObjectByName('right-hand');if(rightArm)rightArm.visible=false;if(rightHand)rightHand.visible=false;
    const hand=(x:number,y:number,z:number)=>{this.stroke(gesture,[.39,1.23,0],[x,y,z],color,.09);this.ball(gesture,.11,[x,y,z],'#c99b76');};
    if(action==='drink'||action==='eat'){
      hand(.24,1.58,.42);const item=new THREE.Group();item.name='gesture-item';item.position.set(.22,1.46,.4);item.scale.setScalar(.44);gesture.add(item);
      const referent=new RegExp(`\\b${action}:([a-z-]+)`).exec(detail)?.[1];
      if(action==='drink'){
        const drink=referent??'coffee',vessel=drink==='water'||drink==='milk'?`glass-${drink}`:`cup-${drink}`;
        this.villageProp(item,{id:'sip',kind:vessel,position:[0,0],detail:drink==='milk'||detail.includes(':milk')?'milk':''},'#dfd3b9');item.rotation.x=.35;
      }else this.smallFood(item,referent??'bread','#7b8a64');
    }else if(action==='refuse'||action==='greet'){
      hand(.59,1.61,.08);this.box(gesture,[.18,.27,.075],[.59,1.76,.08],'#c99b76');
      for(const x of[.54,.59,.64])this.stroke(gesture,[x,1.79,.08],[x,1.95,.08],'#c99b76',.025);
      if(action==='refuse')this.stroke(gesture,[-.2,1.57,.32],[.2,1.57,.32],palette.dark,.018);
    }else if(action==='request'){
      hand(.59,1.12,.52);this.ball(gesture,.13,[.6,1.13,.58],'#c99b76',[1,.35,1]);
    }else if(action==='thanks'){
      hand(.05,1.2,.38);this.stroke(gesture,[-.39,1.23,0],[.05,1.2,.38],color,.09);
      this.stroke(gesture,[-.1,1.56,.31],[0,1.52,.35],palette.dark,.018);this.stroke(gesture,[0,1.52,.35],[.1,1.56,.31],palette.dark,.018);
    }else if(action==='pleased'){
      hand(.58,1.22,.1);this.stroke(gesture,[.59,1.24,.1],[.6,1.44,.1],'#c99b76',.04);
      this.stroke(gesture,[-.11,1.6,.32],[0,1.54,.35],palette.dark,.018);this.stroke(gesture,[0,1.54,.35],[.11,1.6,.32],palette.dark,.018);
    }else if(action==='talk'){
      hand(.65,1.2,.28);this.ball(gesture,.055,[0,1.58,.34],palette.dark,[1,.65,.25]);
      for(const [i,x]of[.7,.92,1.14].entries())this.ball(gesture,.035,[x,1.75+i*.04,.2],palette.paper);
    }else if(action==='spill'){
      hand(.58,.9,.4);const cup=new THREE.Group();cup.position.set(.66,.04,.55);cup.scale.setScalar(.6);gesture.add(cup);this.villageProp(cup,{id:'spill',kind:'cup-coffee',position:[0,0],detail:'spill'},'#dfd3b9');
    }
  }

  private createEntity(data:SceneObject):void {
    const root=new THREE.Group();root.position.set(data.position[0],0,data.position[1]);root.rotation.y=data.rotation||0;root.userData.evidenceId=`__entity:${data.id}`;root.userData.entityId=data.id;this.scene.add(root);this.targets.push(root);
    const color=colors[data.color||'']||data.color||'#7b8a64';
    const kind=data.kind;let height=1;let hinge:THREE.Group|undefined;
    const villageHeight=this.villageProp(root,data,color);
    if(villageHeight!==undefined){height=villageHeight;if(kind==='train')hinge=root.getObjectByName('vehicle-door') as THREE.Group|undefined;}
    else if(/key/.test(kind)) {
      this.torus(root,.25,.075,[-.35,.18,0],color).rotation.x=Math.PI/2;
      this.box(root,[.95,.13,.13],[.25,.18,0],color);
      for(const x of [.45,.7])this.box(root,[.13,.13,.3],[x,.18,.12],color);
      height=.25;
    } else if(/box|crate|chest/.test(kind)) {
      // A coffer on feet leaves a real, visible space underneath it.
      for(const x of[-.6,.6])for(const z of[-.45,.45])this.box(root,[.14,.6,.14],[x,.3,z],palette.dark);
      const body=new THREE.Group();body.position.y=.6;root.add(body);
      this.box(body,[1.5,.15,1.25],[0,.1,0],color);
      this.box(body,[1.5,.7,.14],[0,.47,-.56],color);this.box(body,[1.5,.7,.14],[0,.47,.56],color);
      for(const x of[-.68,.68])this.box(body,[.14,.7,1.2],[x,.47,0],color);
      hinge=new THREE.Group();hinge.position.set(0,1.45,-.6);root.add(hinge);
      this.box(hinge,[1.58,.16,1.32],[0,0,.6],color);this.box(hinge,[.18,.17,.06],[0,-.05,1.29],palette.brass);
      height=1.55;
    } else if(/door|gate/.test(kind)) {
      for(const x of[-1.2,1.2])this.box(root,[.18,3.5,.24],[x,1.75,0],palette.wood);
      this.box(root,[2.6,.22,.3],[0,3.5,0],palette.wood);
      hinge=new THREE.Group();hinge.position.set(-1.1,0,0);root.add(hinge);
      this.box(hinge,[2.2,3.25,.17],[1.1,1.65,0],color);
      for(const y of[.75,2.35])this.box(hinge,[1.8,.08,.06],[1.1,y,.12],palette.wood);
      this.ball(hinge,.09,[1.93,1.6,.18],palette.brass).name='keyhole';height=3.6;
    } else if(/table|bench|counter|shelf/.test(kind)) {
      this.box(root,[3,.18,1.8],[0,1.17,0],data.color?color:palette.wood);
      for(const x of[-1.2,1.2])for(const z of[-.65,.65])this.box(root,[.17,1.15,.17],[x,.58,z],palette.dark);
      if(/shelf/.test(kind))this.box(root,[3,.14,1.8],[0,.45,0],palette.wood);
      height=1.3;
    } else if(/book/.test(kind)) {
      this.box(root,[1.1,.19,.85],[0,.15,0],color);
      this.box(root,[1.02,.1,.8],[0,.2,.02],palette.paper);
      for(const x of[-.27,.27])this.box(root,[.5,.04,.76],[x,.28,.02],palette.paper);this.box(root,[.04,.06,.78],[0,.28,.02],palette.wood);
      hinge=new THREE.Group();hinge.position.set(-.55,.31,0);root.add(hinge);this.box(hinge,[1.1,.05,.85],[.55,0,0],color);height=.35;
      if(data.detail?.includes('worn')){this.box(hinge,[.23,.015,.25],[.16,.045,.2],'#a18c70');this.stroke(hinge,[.81,.05,-.32],[1,.05,-.15],palette.paper,.018);}
      if(data.detail?.includes('beautiful'))for(const z of[-.31,.31])this.stroke(hinge,[.1,.05,z],[1,.05,z],palette.brass,.02);
      if(/menu/.test(kind)){const marking=new THREE.Group();marking.position.set(.55,.07,0);marking.scale.setScalar(.3);hinge.add(marking);this.villageProp(marking,{id:'cup-mark',kind:'cup-coffee',position:[0,0]},'#ded0b2');}
    } else if(/person|npc|guardian|neighbor/.test(kind)) {
      for(const x of[-.18,.18]){this.cylinder(root,.1,.65,[x,.37,0],'#435b50');this.ball(root,.14,[x,.1,.08],palette.dark,[1,.6,1.3]);}
      this.ball(root,.4,[0,1.05,0],color,[1,1.4,.8]);
      for(const x of[-.43,.43]){const arm=this.cylinder(root,.09,.57,[x,.98,0],color);const hand=this.ball(root,.1,[x,.66,.03],'#bc8f6c');if(x>0){arm.name='right-arm';hand.name='right-hand';}}
      this.ball(root,.33,[0,1.76,.02],'#c99b76');this.ball(root,.34,[0,1.92,-.05],'#514031',[1,.65,1]);
      if(/female|woman/.test(kind)){this.ball(root,.22,[0,1.78,-.3],'#514031');const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.26,.5,.6,12),this.material(color));skirt.position.set(0,.7,0);skirt.castShadow=true;root.add(skirt);}
      for(const x of[-.1,.1])this.ball(root,.025,[x,1.8,.32],'#303b31');
      if(!/female|woman/.test(kind)){this.cylinder(root,.45,.08,[0,2.07,0],'#b69454');this.cylinder(root,.29,.18,[0,2.18,0],'#b69454');}height=2.3;
      this.decorateActor(root,data,color);
    } else if(/letter|note|paper/.test(kind)) {
      this.box(root,[.9,.035,.65],[0,.07,0],data.color?color:palette.paper);
      this.box(root,[.6,.02,.025],[0,.1,-.1],palette.wood);this.ball(root,.09,[0,.11,.13],'#874e3b',[1,.3,1]);height=.15;
    } else if(/bottle|pot|paint/.test(kind)) {
      this.cylinder(root,.3,.65,[0,.33,0],color);this.cylinder(root,.11,.3,[0,.8,0],color);this.cylinder(root,.13,.08,[0,.98,0],palette.wood);height=1.1;
    } else if(/chair/.test(kind)) {
      this.box(root,[1,.16,.85],[0,.65,0],color);this.box(root,[1,.85,.14],[0,1.15,-.36],color);
      for(const x of[-.37,.37])for(const z of[-.27,.27])this.box(root,[.12,.64,.12],[x,.32,z],palette.wood);height=1.7;
    } else if(/window/.test(kind)) {
      this.box(root,[2,2,.15],[0,1.3,0],palette.wood);this.box(root,[1.7,1.7,.18],[0,1.3,.02],'#5b7c80');
      for(const size of[[.08,1.8,.1],[1.8,.08,.1]] as [number,number,number][])this.box(root,size,[0,1.3,.15],palette.paper);height=2.4;
      if(data.detail==='night'){
        this.box(root,[1.6,1.6,.03],[0,1.3,.13],'#37485b');this.ball(root,.22,[.4,1.76,.18],'#e2d4ae',[1,1,.1]);this.ball(root,.2,[.48,1.81,.2],'#37485b',[1,1,.1]);
        for(const [x,y]of[[-.45,1.8],[-.1,1.36],[.42,.92]])this.ball(root,.035,[x,y,.18],'#e0d5b9',[1,1,.2]);
      }
    } else if(/mat|floor/.test(kind)) {
      this.box(root,[2.6,.04,1.5],[0,.03,0],color);height=.07;
    } else if(/notice/.test(kind)) {
      if(data.rotation===undefined)root.rotation.y=Math.atan2(18,22);
      for(const x of[-2.7,2.7])this.box(root,[.16,3.6,.16],[x,1.8,0],palette.wood);
      this.box(root,[6,2.25,.18],[0,2.35,0],palette.dark);
      this.box(root,[5.7,1.95,.2],[0,2.35,.03],palette.paper);height=3.6;
    } else {
      // Signs are physical board-and-post fixtures; their text is authored separately.
      this.box(root,[.13,1.7,.13],[0,.85,0],palette.wood);
      this.box(root,[2.6,.85,.15],[0,1.65,0],palette.dark);
      this.box(root,[2.4,.68,.18],[0,1.65,.02],palette.paper);height=2.1;
    }
    // Plural books, clothes and containers remain real collections. Kinds with
    // their own packing/denominations have already rendered every piece.
    const packed=/^(bread|apple|pear|fruit|cheese|egg|fish|carrot|vegetable|money|coin|flower|garden)(-|$)/.test(kind);
    if(!packed&&data.quantity&&data.quantity>1){
      const count=Math.min(20,Math.round(data.quantity)),cols=Math.ceil(Math.sqrt(count));
      root.userData.renderedPieces=count;
      const model=new THREE.Group();for(const child of[...root.children])model.add(child);
      for(let i=0;i<count;i++){const piece=i===0?model:model.clone(true);piece.position.set(((i%cols)-(cols-1)/2)*2.1,0,(Math.floor(i/cols)-(Math.ceil(count/cols)-1)/2)*2.1);root.add(piece);}
    }
    if(typeof data.size==='number')root.scale.setScalar(data.size);else if(Array.isArray(data.size))root.scale.set(...data.size);
    height*=root.scale.y;
    const entity={data,root,hinge,height,original:root.position.clone(),originalRotation:root.quaternion.clone()};this.entities.set(data.id,entity);
  }

  /** Model support surfaces are distinct from an entity's visible silhouette height. */
  private supportPoint(target:Entity,relation:'in'|'on'|'under',childId?:string):THREE.Vector3 {
    const point=target.root.position.clone();
    if(relation==='in'&&/door|gate/.test(target.data.kind)){const keyhole=target.root.getObjectByName('keyhole');if(keyhole){target.root.updateWorldMatrix(true,true);return keyhole.getWorldPosition(point);}}
    if(relation==='under'){point.y+=.1;point.z+=/chair/.test(target.data.kind)?.07:.28;}
    else if(relation==='on')point.y+=/chair/.test(target.data.kind)?.73*target.root.scale.y+.03:target.height+.12;
    else point.y+=/box|crate|chest/.test(target.data.kind)?.8*target.root.scale.y:.27;
    if(target.data.kind==='tray'&&relation==='on'&&childId){
      const siblings=[...this.entities.values()].filter(entity=>this.snapshot.placements[entity.data.id]?.target===target.data.id&&this.snapshot.placements[entity.data.id]?.relation==='on');
      // Pack the actual scaled footprints, including a cup's projecting handle.
      // Equal center spacing lets wide bread overlap a cup and is insufficient.
      const footprints=siblings.map(entity=>{const bounds=new THREE.Box3().setFromObject(entity.root);return{entity,width:bounds.max.x-bounds.min.x,depth:bounds.max.z-bounds.min.z,minX:bounds.min.x-entity.root.position.x,minZ:bounds.min.z-entity.root.position.z};});
      const gap=.04,innerWidth=1.92*target.root.scale.x,rows:typeof footprints[]=[];
      for(const footprint of footprints){let row=rows.at(-1);if(!row||row.reduce((sum,item)=>sum+item.width+gap,0)+footprint.width>innerWidth){row=[];rows.push(row);}row.push(footprint);}
      const rowDepths=rows.map(row=>Math.max(...row.map(item=>item.depth))),totalDepth=rowDepths.reduce((sum,depth)=>sum+depth,0)+gap*Math.max(0,rows.length-1);
      let z=-totalDepth/2;
      for(const [rowIndex,row]of rows.entries()){
        let x=-(row.reduce((sum,item)=>sum+item.width,0)+gap*Math.max(0,row.length-1))/2;
        for(const item of row){if(item.entity.data.id===childId){point.x+=x-item.minX;point.z+=z+(rowDepths[rowIndex]-item.depth)/2-item.minZ;}x+=item.width+gap;}
        z+=rowDepths[rowIndex]+gap;
      }
    }
    return point;
  }
  private attachKeyToDoor(entity:Entity,target:Entity):boolean {
    if(!/key/.test(entity.data.kind)||!/door|gate/.test(target.data.kind))return false;
    const keyhole=target.root.getObjectByName('keyhole');if(!keyhole)return false;
    target.root.updateWorldMatrix(true,true);
    keyhole.getWorldPosition(entity.root.position);
    keyhole.getWorldQuaternion(entity.root.quaternion);
    entity.root.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2));
    return true;
  }
  private createSurface(id:string,text:string,surface:string,anchorId?:string,offset?:[number,number,number],evidence?:Evidence):void {
    if(!text.trim())return;
    const entity=anchorId?this.entities.get(anchorId):undefined;
    const height=surface==='speech'?(entity?.height||1.8)+.55:surface==='floor'||surface==='mat'?.06:surface==='note'&&entity&&/notice|sign/.test(entity.data.kind)?entity.height*.65:surface==='top'||surface==='note'?(entity?.height||.15)+.06:surface==='awning'?2.5:Math.max(1.15,(entity?.height||1.8)*.7);
    const element=document.createElement('div');element.className=`situated-text situated-${surface}`;element.dataset.evidence=id;if(anchorId)element.dataset.anchor=anchorId;
    Object.assign(element.style,{position:'absolute',left:'0',top:'0',transform:'translate(-50%, -50%)',pointerEvents:'auto',fontSize:'max(18px, calc(18px * var(--text-scale, 1)))',lineHeight:'1.3',fontFamily:'inherit',fontWeight:'600',whiteSpace:surface==='speech'||surface==='note'?'normal':'nowrap',maxWidth:surface==='speech'?'260px':surface==='note'?'220px':'300px',color:'#273c30',textAlign:'center',zIndex:'30'});
    if(surface==='speech'){Object.assign(element.style,{background:'#e0d3b6',padding:'9px 12px',border:'1px solid #7d7058',borderRadius:'12px',boxShadow:'0 3px 8px #26372c20'});const tail=document.createElement('span');tail.className='speech-tail';Object.assign(tail.style,{position:'absolute',bottom:'-7px',left:'50%',width:'12px',height:'12px',background:'#e0d3b6',transform:'translateX(-50%) rotate(45deg)',borderRight:'1px solid #7d7058',borderBottom:'1px solid #7d7058'});element.append(tail);}
    else if(surface==='sign'||surface==='notice'){Object.assign(element.style,{background:'#d8c7a4',padding:'5px 8px',border:'4px solid #806044',borderRadius:'1px',boxShadow:'0 2px 4px #26372c20'});}
    else if(surface==='note'){Object.assign(element.style,{background:'#d8c7a4',padding:'5px 7px',borderRadius:'1px',fontWeight:'500'});}
    else if(surface==='floor'||surface==='mat'){element.style.color='#ded4b9';element.style.textShadow='0 1px 2px #33432c';}
    else if(surface==='awning'){element.style.color='#e4d7bb';element.style.textShadow='0 1px 2px #33432c';}
    else {Object.assign(element.style,{background:'transparent',padding:'0',borderRadius:'0'});this.setSurfaceInk(element,entity);}
    const content=document.createElement('span');content.className='situated-words';content.textContent=text;content.dataset.text=text;element.prepend(content);
    // Projected writing is UI: annotating it must never also hit a prop behind it.
    element.addEventListener('pointerdown',event=>event.stopPropagation());
    element.addEventListener('pointerup',event=>event.stopPropagation());
    if(!evidence&&entity&&id===`entity-${anchorId}`&&/person|npc|guardian|neighbor/.test(entity.data.kind)){
      const talk=document.createElement('button');talk.type='button';talk.className='situated-talk';talk.dataset.talk=entity.data.id;talk.textContent='…';talk.setAttribute('aria-label','…');
      Object.assign(talk.style,{display:'inline-flex',alignItems:'center',justifyContent:'center',marginLeft:'5px',width:'22px',height:'21px',padding:'0 0 3px',fontSize:'18px',lineHeight:'1',color:'#253c31',background:'#ded1b2',border:'1px solid #806044',borderRadius:'5px',verticalAlign:'middle',cursor:'pointer'});
      talk.addEventListener('click',event=>{event.stopPropagation();if(!this.paused)this.interact(`__talk:${entity.data.id}`);});
      talk.addEventListener('keydown',event=>{if(event.code==='Enter'||event.code==='Space')event.stopPropagation();});
      element.append(talk);element.dataset.talkActor=entity.data.id;
    }
    element.addEventListener('click',event=>{event.stopPropagation();if(this.paused)return;const word=(event.target as Element).closest<HTMLElement>('[data-word]');if(word?.dataset.word){if(evidence)this.interact(evidence.id);this.interact(`__word:${word.dataset.word}`);}else if(evidence)this.interact(evidence.id);else if(anchorId)this.interact(`__entity:${anchorId}`);});
    this.labels.append(element);
    this.surfaces.push({width:0,measuredHeight:0,id,evidence,entity,element,position:new THREE.Vector3(evidence?.position[0]||0,0,evidence?.position[1]||0),offset:new THREE.Vector3(...(offset||[0,0,0])),height,surface,revision:-1});
  }
  private setSurfaceInk(element:HTMLElement,entity?:Entity):void {
    const data=entity?.data;
    const openBook=!!data&&/book/.test(data.kind)&&this.snapshot.opened.includes(data.id);
    const paper=!!data&&/note|paper/.test(data.kind)||!!data&&/letter/.test(data.kind)&&!data.color;
    const substrate=new THREE.Color(data?.color?(colors[data.color]||data.color):palette.wood);
    const luminance=substrate.r*.2126+substrate.g*.7152+substrate.b*.0722;
    const darkInk=openBook||paper||luminance>.32;
    element.style.color=darkInk?'#253c31':'#eee3c9';
    element.style.textShadow=darkInk?'-1px 0 0 #e4d7bb, 1px 0 0 #e4d7bb, 0 -1px 0 #e4d7bb, 0 1px 0 #e4d7bb':'0 1px 2px #182c21, 0 0 1px #182c21';
  }
  setWordRenderer(renderer:(text:string,evidence?:Evidence)=>string,revision:number):void {this.renderWords=renderer;this.revision=revision;this.refreshText();}
  private refreshText():void {for(const surface of this.surfaces){if(surface.revision===this.revision)continue;const content=surface.element.querySelector<HTMLElement>('.situated-words')!;if(this.renderWords)content.innerHTML=this.renderWords(content.dataset.text||'',surface.evidence);else content.textContent=content.dataset.text||'';for(const word of content.querySelectorAll<HTMLElement>('.word')){word.style.fontSize='inherit';word.style.lineHeight='1.3';word.style.padding='0 1px';}for(const note of content.querySelectorAll<HTMLElement>('.word small')){note.style.fontSize='max(12px, calc(12px * var(--text-scale, 1)))';note.style.lineHeight='1.2';note.style.color='#253c31';note.style.background='#ded1b2';note.style.padding='1px 3px';note.style.borderRadius='1px';note.style.textShadow='none';note.style.opacity='1';}surface.revision=this.revision;const display=surface.element.style.display;surface.element.style.display='block';surface.element.style.visibility='hidden';surface.width=surface.element.offsetWidth;surface.measuredHeight=surface.element.offsetHeight;surface.element.style.display=display;surface.element.style.visibility='';}}
  setPaused(paused:boolean):void {this.paused=paused;}
  invalidateTextMetrics():void {for(const surface of this.surfaces)surface.revision=-1;}
  focusEvidence(id:string):THREE.Vector3|undefined {const surface=this.surfaces.find(item=>item.id===id);if(!surface)return;this.focused=id;if(surface.surface==='speech'&&surface.evidence?.anchor)this.activeSpeech.set(surface.evidence.anchor,id);this.setInteractionState(this.snapshot);this.applyPoses();const demo=surface.evidence?.demonstration;this.activeDemo=demo?{...demo,started:performance.now()/1000,origin:this.entities.get(demo.action.object)?.root.position.clone()||new THREE.Vector3()}:undefined;const travel=surface.evidence?.travel;if(travel){const participants=[travel.actor,...(travel.companions??[])];this.activeTravel={...travel,companions:travel.companions??[],started:performance.now()/1000,origins:new Map(participants.flatMap(actor=>{const entity=this.entities.get(actor);return entity?[[actor,entity.root.position.clone()] as const]:[];}))};}return(surface.entity?.root.position||surface.position).clone();}
  focusEntity(id:string):THREE.Vector3|undefined {this.clearFocus();return this.entities.get(id)?.root.position.clone();}
  clearFocus():void {const restore=!!this.activeDemo||!!this.activeTravel||!!this.zone.evidence.find(e=>e.id===this.focused)?.actorPoses;this.focused=undefined;if(restore){this.activeDemo=undefined;this.activeTravel=undefined;this.setInteractionState(this.snapshot);}}
  setInteractionState(snapshot:SituatedInteractionState):void {
    this.activeDemo=undefined;
    this.activeTravel=undefined;
    this.snapshot=snapshot;
    for(const entity of this.entities.values()) {
      entity.root.position.copy(entity.original);entity.root.quaternion.copy(entity.originalRotation);entity.root.visible=true;
      if(entity.hinge){const open=snapshot.opened.includes(entity.data.id);if(/door|gate|train/.test(entity.data.kind))entity.hinge.rotation.y=open?-1.3:0;else if(/book/.test(entity.data.kind))entity.hinge.rotation.z=open?-2.7:0;else entity.hinge.rotation.x=open?-1.3:0;}
    }
    const placed=new Set<string>();
    const resolve=(entity:Entity,chain=new Set<string>()):void=>{
      if(placed.has(entity.data.id)||chain.has(entity.data.id))return;chain.add(entity.data.id);
      const authored=entity.data.placement;
      const place=snapshot.placements[entity.data.id]||authored;
      const initial=entity.data.containedBy;
      const deliveredTo=snapshot.delivered[entity.data.id];
      const targetId=deliveredTo||place?.target||initial;
      const target=targetId?this.entities.get(targetId):undefined;
      if(target){
        resolve(target,chain);
        const relation=deliveredTo?'in':place?.relation||(/table|shelf|counter|bench/.test(target.data.kind)?'on':'in');
        entity.root.position.copy(this.supportPoint(target,relation,entity.data.id));
        if(relation==='in')this.attachKeyToDoor(entity,target);
        const offset=(place as {offset?:[number,number,number]}|undefined)?.offset||(!deliveredTo&&authored&&place?.target===authored.target&&place.relation===authored.relation?authored.offset:undefined);if(offset)entity.root.position.add(new THREE.Vector3(...offset));
        if(relation==='in'&&target.data.container&&!snapshot.opened.includes(target.data.id))entity.root.visible=false;
        if(!target.root.visible)entity.root.visible=false;
        if(/person|npc|guardian|neighbor/.test(target.data.kind))entity.root.position.add(new THREE.Vector3(.55,.75,.3));
      }
      placed.add(entity.data.id);
    };
    for(const entity of this.entities.values())resolve(entity);
    this.applyPoses();
    for(const surface of this.surfaces)if(surface.surface==='top')this.setSurfaceInk(surface.element,surface.entity);
  }
  private applyPoses():void {
    for(const actor of this.entities.values()) {
      const lineId=this.activeSpeech.get(actor.data.id);
      const line=this.zone.evidence.find(e=>e.id===lineId);
      const focusedPose=this.zone.evidence.find(e=>e.id===this.focused)?.actorPoses?.[actor.data.id];
      const ordinaryPose=line?.pose||actor.data.pose;
      const pose=focusedPose?{...ordinaryPose,...focusedPose}:ordinaryPose;
      const previous=actor.root.getObjectByName('pointing-arm');if(previous){actor.root.remove(previous);previous.traverse(node=>{if(node instanceof THREE.Mesh)node.geometry.dispose();});}
      const rightArm=actor.root.getObjectByName('right-arm'),rightHand=actor.root.getObjectByName('right-hand');
      if(rightArm)rightArm.visible=!pose?.pointsTo&&!actor.root.userData.semanticGesture;if(rightHand)rightHand.visible=!pose?.pointsTo&&!actor.root.userData.semanticGesture;
      const detailGesture=actor.root.getObjectByName('detail-gesture');if(detailGesture)detailGesture.visible=!pose?.pointsTo;
      if(pose?.holds&&pose.holds!==this.snapshot.held&&!this.snapshot.delivered[pose.holds]&&!this.snapshot.history?.some(action=>action.object===pose.holds)){
        const held=this.entities.get(pose.holds);if(held){held.root.visible=true;held.root.position.copy(actor.root.position).add(new THREE.Vector3(.6,.95,.3));}
      }
      const target=pose?.pointsTo?this.entities.get(pose.pointsTo):undefined;
      if(target){
        const shoulder=new THREE.Vector3(.4,1.2,0);const local=target.root.position.clone().sub(actor.root.position);local.y=.25;local.normalize();
        const end=shoulder.clone().addScaledVector(local,.85);const middle=shoulder.clone().add(end).multiplyScalar(.5);
        const pointing=new THREE.Group();pointing.name='pointing-arm';actor.root.add(pointing);
        const arm=this.cylinder(pointing,.085,.85,[middle.x,middle.y,middle.z],colors[actor.data.color||'']||actor.data.color||'#7b8a64');
        arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(shoulder).normalize());
        this.ball(pointing,.1,[end.x,end.y,end.z],'#bc8f6c');
      }
    }
  }
  private positionFocusedObjects():void {
    const poses=this.zone.evidence.find(e=>e.id===this.focused)?.actorPoses;
    for(const [actorId,pose]of Object.entries(poses||{})){const actor=this.entities.get(actorId),held=pose.holds?this.entities.get(pose.holds):undefined;if(actor&&held){held.root.visible=true;held.root.position.copy(actor.root.position).add(new THREE.Vector3(.6,.95,.3));}}
  }
  /** Loose items retain their real support while a loaded tray is carried. */
  private followPlacedEntities():void {
    const visited=new Set<string>();
    const follow=(entity:Entity,chain=new Set<string>()):void=>{
      const id=entity.data.id;if(visited.has(id)||chain.has(id)||id===this.snapshot.held||id===this.activeDemo?.action.object)return;chain.add(id);
      const placement=this.snapshot.placements[id];const delivered=this.snapshot.delivered[id];const targetId=delivered??placement?.target;
      const target=targetId?this.entities.get(targetId):undefined;
      if(target){
        follow(target,chain);const relation=delivered?'in':placement!.relation;
        entity.root.position.copy(this.supportPoint(target,relation,id));
        if(relation==='in')this.attachKeyToDoor(entity,target);
        const authored=entity.data.placement;if(!delivered&&authored?.target===placement?.target&&authored?.relation===placement?.relation&&authored.offset)entity.root.position.add(new THREE.Vector3(...authored.offset));
        if(/person|npc|guardian|neighbor/.test(target.data.kind))entity.root.position.add(new THREE.Vector3(.55,.75,.3));
        entity.root.visible=target.root.visible&&!(relation==='in'&&target.data.container&&!this.snapshot.opened.includes(target.data.id));
      }
      visited.add(id);
    };
    for(const entity of this.entities.values())follow(entity);
  }
  update(player:THREE.Vector3,time=performance.now()/1000):void {
    const travel=this.activeTravel;
    if(travel){
      const actor=this.entities.get(travel.actor),target=this.entities.get(travel.target),origin=travel.origins.get(travel.actor);
      if(actor&&target&&origin){
        const direction=target.root.position.clone().sub(origin);direction.y=0;const distance=direction.length();direction.normalize();
        const destination=origin.clone().addScaledVector(direction,Math.max(0,distance-1.45));
        const phase=(time-travel.started)%6,amount=THREE.MathUtils.smoothstep(phase,.45,3.8),offset=destination.sub(origin).multiplyScalar(amount);
        for(const id of[travel.actor,...travel.companions]){const entity=this.entities.get(id),start=travel.origins.get(id);if(!entity||!start)continue;entity.root.position.copy(start).add(offset);if(amount>0&&amount<1)entity.root.position.y+=Math.abs(Math.sin(phase*8))*.045;entity.root.rotation.y=Math.atan2(direction.x,direction.z);}
      }
    }
    if(this.snapshot.held){const held=this.entities.get(this.snapshot.held);if(held){held.root.visible=true;held.root.position.copy(player).add(new THREE.Vector3(.65,.85,.2));}}
    this.followPlacedEntities();
    for(const [first,second]of this.snapshot.combined||[]){const a=this.entities.get(first),b=this.entities.get(second);if(a&&b){b.root.visible=a.root.visible;b.root.position.copy(a.root.position).add(new THREE.Vector3(.38,.1,0));}}
    this.positionFocusedObjects();
    const demo=this.activeDemo;if(!demo)return;const actor=this.entities.get(demo.actor);if(!actor)return;
    const phase=(time-demo.started)%4;const amount=THREE.MathUtils.smoothstep(phase,.35,1.65);const action=demo.action;
    const object=this.entities.get(action.object);if(!object)return;
    if(action.kind==='operate'&&object.hinge){const opened=action.operation==='open'?amount:1-amount;if(/door|gate|train/.test(object.data.kind))object.hinge.rotation.y=-1.3*opened;else if(/book/.test(object.data.kind))object.hinge.rotation.z=-2.7*opened;else object.hinge.rotation.x=-1.3*opened;}
    else {
      const hand=actor.root.position.clone().add(new THREE.Vector3(.6,.95,.3));
      let from=demo.origin.clone(),to=hand;
      if(action.kind==='deliver'||action.kind==='place'||action.kind==='combine'){
        const target=this.entities.get(action.target);if(!target)return;from=hand;to=target.root.position.clone();
        if(action.kind==='deliver')to.add(new THREE.Vector3(.55,.95,.3));
        else if(action.kind==='place')to=this.supportPoint(target,action.relation,object.data.id);
        else to.add(new THREE.Vector3(.4,.12,0));
      }
      object.root.visible=true;object.root.position.copy(from).lerp(to,amount);
    }
  }
  positionText(camera:THREE.Camera,width:number,height:number,player:THREE.Vector3):void {
    this.refreshText();
    const candidates=this.surfaces.map(surface=>{const origin=(surface.entity?.root.position||surface.position).clone();origin.y+=surface.height;origin.add(surface.offset);return{surface,world:origin,screen:origin.clone().project(camera),distance:(surface.entity?.root.position||surface.position).distanceTo(player)};}).sort((a,b)=>Number(b.surface.id===this.focused)-Number(a.surface.id===this.focused)||a.distance-b.distance);
    const occupied:{left:number;top:number;right:number;bottom:number}[]=[];
    for(const {surface,world,screen,distance}of candidates){const element=surface.element;element.style.display='none';if(this.paused||surface.evidence?.actorPoses&&surface.id!==this.focused||surface.surface==='speech'&&surface.evidence?.anchor&&this.activeSpeech.get(surface.evidence.anchor)!==surface.id||surface.entity&&!surface.entity.root.visible||Math.abs(screen.x)>.95||Math.abs(screen.y)>.87||screen.z>1||distance>14&&surface.id!==this.focused)continue;
      const talkSurface=!!element.dataset.talkActor;
      const x=(screen.x*.5+.5)*width,y=(-screen.y*.5+.5)*height+(talkSurface?34:0);
      if(!talkSurface&&['top','floor','mat','note'].includes(surface.surface)&&!(surface.surface==='note'&&surface.entity&&/notice|sign/.test(surface.entity.data.kind))){const axis=world.clone().add(new THREE.Vector3(1,0,0)).project(camera);const angle=Math.atan2(-(axis.y-screen.y)*height,(axis.x-screen.x)*width)*180/Math.PI;element.style.transform=`translate(-50%, -50%) rotate(${angle}deg)`;}else element.style.transform='translate(-50%, -50%)';
      const ew=surface.width||Math.min(300,(element.textContent?.length||1)*10+20),eh=surface.measuredHeight||38;const bounds={left:x-ew/2-4,top:y-eh/2-4,right:x+ew/2+4,bottom:y+eh/2+4};
      if(!talkSurface&&surface.id!==this.focused&&occupied.some(other=>bounds.left<other.right&&bounds.right>other.left&&bounds.top<other.bottom&&bounds.bottom>other.top))continue;
      element.style.display='block';element.style.left=`${x}px`;element.style.top=`${y}px`;occupied.push(bounds);
    }
  }
  nearest(player:THREE.Vector3):string|undefined {const entity=[...this.entities.values()].filter(entity=>entity.root.visible).sort((a,b)=>a.root.position.distanceToSquared(player)-b.root.position.distanceToSquared(player))[0];return entity&&entity.root.position.distanceTo(player)<3.5?entity.data.id:undefined;}
  entityPositions():THREE.Vector3[]{
    const carried=new Set<string>(this.snapshot.held?[this.snapshot.held]:[]);
    let added=true;while(added){added=false;for(const [id,placement]of Object.entries(this.snapshot.placements))if(carried.has(placement.target)&&!carried.has(id)){carried.add(id);added=true;}for(const [object,target]of this.snapshot.combined??[])if(carried.has(object)&&!carried.has(target)){carried.add(target);added=true;}}
    return[...this.entities.values()].filter(entity=>entity.root.visible&&!carried.has(entity.data.id)).map(entity=>entity.root.position);
  }
  /** Read-only render evidence for browser regressions; this cannot alter a puzzle. */
  physicalState():{id:string;kind:string;position:[number,number,number];bounds:{min:[number,number,number];max:[number,number,number]};visible:boolean;pieces:number;meshes:number;hinge?:[number,number,number]}[]{return[...this.entities.values()].map(entity=>{let meshes=0;entity.root.traverse(object=>{if(object instanceof THREE.Mesh)meshes++;});const bounds=new THREE.Box3().setFromObject(entity.root);return{id:entity.data.id,kind:entity.data.kind,position:entity.root.position.toArray() as [number,number,number],bounds:{min:bounds.min.toArray() as [number,number,number],max:bounds.max.toArray() as [number,number,number]},visible:entity.root.visible,pieces:entity.root.userData.renderedPieces??1,meshes,...(entity.hinge?{hinge:[entity.hinge.rotation.x,entity.hinge.rotation.y,entity.hinge.rotation.z] as [number,number,number]}:{})};});}
  dispose():void {this.disposed=true;for(const surface of this.surfaces)surface.element.remove();this.surfaces.length=0;for(const texture of this.printedTextures)texture.dispose();this.printedTextures.clear();}
}
