import * as THREE from 'three';
import type { Evidence, SceneObject, WorldAction, Zone } from '../content/types';

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
  private snapshot: SituatedInteractionState = {held:null,placements:{},opened:[],delivered:{}};
  private focused?: string;
  private renderWords?: (text:string)=>string;
  private revision=0;
  private paused=true;
  private readonly activeSpeech=new Map<string,string>();
  private activeDemo?:{actor:string;action:WorldAction;started:number;origin:THREE.Vector3};

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

  private createEntity(data:SceneObject):void {
    const root=new THREE.Group();root.position.set(data.position[0],0,data.position[1]);root.rotation.y=data.rotation||0;root.userData.evidenceId=`__entity:${data.id}`;root.userData.entityId=data.id;this.scene.add(root);this.targets.push(root);
    const color=colors[data.color||'']||data.color||'#7b8a64';
    const kind=data.kind;let height=1;let hinge:THREE.Group|undefined;
    if(/key/.test(kind)) {
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
    } else if(/person|npc|guardian|neighbor/.test(kind)) {
      for(const x of[-.18,.18]){this.cylinder(root,.1,.65,[x,.37,0],'#435b50');this.ball(root,.14,[x,.1,.08],palette.dark,[1,.6,1.3]);}
      this.ball(root,.4,[0,1.05,0],color,[1,1.4,.8]);
      for(const x of[-.43,.43]){const arm=this.cylinder(root,.09,.57,[x,.98,0],color);const hand=this.ball(root,.1,[x,.66,.03],'#bc8f6c');if(x>0){arm.name='right-arm';hand.name='right-hand';}}
      this.ball(root,.33,[0,1.76,.02],'#c99b76');this.ball(root,.34,[0,1.92,-.05],'#514031',[1,.65,1]);
      if(/female|woman/.test(kind)){this.ball(root,.22,[0,1.78,-.3],'#514031');const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.26,.5,.6,12),this.material(color));skirt.position.set(0,.7,0);skirt.castShadow=true;root.add(skirt);}
      for(const x of[-.1,.1])this.ball(root,.025,[x,1.8,.32],'#303b31');
      if(!/female|woman/.test(kind)){this.cylinder(root,.45,.08,[0,2.07,0],'#b69454');this.cylinder(root,.29,.18,[0,2.18,0],'#b69454');}height=2.3;
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
    if(typeof data.size==='number')root.scale.setScalar(data.size);else if(Array.isArray(data.size))root.scale.set(...data.size);
    height*=root.scale.y;
    const entity={data,root,hinge,height,original:root.position.clone(),originalRotation:root.quaternion.clone()};this.entities.set(data.id,entity);
  }

  /** Model support surfaces are distinct from an entity's visible silhouette height. */
  private supportPoint(target:Entity,relation:'in'|'on'|'under'):THREE.Vector3 {
    const point=target.root.position.clone();
    if(relation==='in'&&/door|gate/.test(target.data.kind)){const keyhole=target.root.getObjectByName('keyhole');if(keyhole){target.root.updateWorldMatrix(true,true);return keyhole.getWorldPosition(point);}}
    if(relation==='under'){point.y+=.1;point.z+=/chair/.test(target.data.kind)?.07:.28;}
    else if(relation==='on')point.y+=/chair/.test(target.data.kind)?.73*target.root.scale.y+.03:target.height+.12;
    else point.y+=/box|crate|chest/.test(target.data.kind)?.8*target.root.scale.y:.27;
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
  setWordRenderer(renderer:(text:string)=>string,revision:number):void {this.renderWords=renderer;this.revision=revision;this.refreshText();}
  private refreshText():void {for(const surface of this.surfaces){if(surface.revision===this.revision)continue;const content=surface.element.querySelector<HTMLElement>('.situated-words')!;if(this.renderWords)content.innerHTML=this.renderWords(content.dataset.text||'');else content.textContent=content.dataset.text||'';for(const word of content.querySelectorAll<HTMLElement>('.word')){word.style.fontSize='inherit';word.style.lineHeight='1.3';word.style.padding='0 1px';}for(const note of content.querySelectorAll<HTMLElement>('.word small')){note.style.fontSize='max(12px, calc(12px * var(--text-scale, 1)))';note.style.lineHeight='1.2';note.style.color='#253c31';note.style.background='#ded1b2';note.style.padding='1px 3px';note.style.borderRadius='1px';note.style.textShadow='none';note.style.opacity='1';}surface.revision=this.revision;const display=surface.element.style.display;surface.element.style.display='block';surface.element.style.visibility='hidden';surface.width=surface.element.offsetWidth;surface.measuredHeight=surface.element.offsetHeight;surface.element.style.display=display;surface.element.style.visibility='';}}
  setPaused(paused:boolean):void {this.paused=paused;}
  invalidateTextMetrics():void {for(const surface of this.surfaces)surface.revision=-1;}
  focusEvidence(id:string):THREE.Vector3|undefined {const surface=this.surfaces.find(item=>item.id===id);if(!surface)return;this.focused=id;if(surface.surface==='speech'&&surface.evidence?.anchor)this.activeSpeech.set(surface.evidence.anchor,id);this.setInteractionState(this.snapshot);this.applyPoses();const demo=(surface.evidence as Evidence & {demonstration?:{actor:string;action:WorldAction}})?.demonstration;this.activeDemo=demo?{...demo,started:performance.now()/1000,origin:this.entities.get(demo.action.object)?.root.position.clone()||new THREE.Vector3()}:undefined;return(surface.entity?.root.position||surface.position).clone();}
  focusEntity(id:string):THREE.Vector3|undefined {this.clearFocus();return this.entities.get(id)?.root.position.clone();}
  clearFocus():void {const restore=!!this.activeDemo||!!this.zone.evidence.find(e=>e.id===this.focused)?.actorPoses;this.focused=undefined;if(restore){this.activeDemo=undefined;this.setInteractionState(this.snapshot);}}
  setInteractionState(snapshot:SituatedInteractionState):void {
    this.activeDemo=undefined;
    this.snapshot=snapshot;
    for(const entity of this.entities.values()) {
      entity.root.position.copy(entity.original);entity.root.quaternion.copy(entity.originalRotation);entity.root.visible=true;
      if(entity.hinge){const open=snapshot.opened.includes(entity.data.id);if(/door|gate/.test(entity.data.kind))entity.hinge.rotation.y=open?-1.3:0;else if(/book/.test(entity.data.kind))entity.hinge.rotation.z=open?-2.7:0;else entity.hinge.rotation.x=open?-1.3:0;}
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
        entity.root.position.copy(this.supportPoint(target,relation));
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
      if(rightArm)rightArm.visible=!pose?.pointsTo;if(rightHand)rightHand.visible=!pose?.pointsTo;
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
  update(player:THREE.Vector3,time=performance.now()/1000):void {
    if(this.snapshot.held){const held=this.entities.get(this.snapshot.held);if(held){held.root.visible=true;held.root.position.copy(player).add(new THREE.Vector3(.65,.85,.2));}}
    for(const [first,second]of this.snapshot.combined||[]){const a=this.entities.get(first),b=this.entities.get(second);if(a&&b){b.root.visible=a.root.visible;b.root.position.copy(a.root.position).add(new THREE.Vector3(.38,.1,0));}}
    this.positionFocusedObjects();
    const demo=this.activeDemo;if(!demo)return;const actor=this.entities.get(demo.actor);if(!actor)return;
    const phase=(time-demo.started)%4;const amount=THREE.MathUtils.smoothstep(phase,.35,1.65);const action=demo.action;
    const object=this.entities.get(action.object);if(!object)return;
    if(action.kind==='operate'&&object.hinge){const opened=action.operation==='open'?amount:1-amount;if(/door|gate/.test(object.data.kind))object.hinge.rotation.y=-1.3*opened;else if(/book/.test(object.data.kind))object.hinge.rotation.z=-2.7*opened;else object.hinge.rotation.x=-1.3*opened;}
    else {
      const hand=actor.root.position.clone().add(new THREE.Vector3(.6,.95,.3));
      let from=demo.origin.clone(),to=hand;
      if(action.kind==='deliver'||action.kind==='place'||action.kind==='combine'){
        const target=this.entities.get(action.target);if(!target)return;from=hand;to=target.root.position.clone();
        if(action.kind==='deliver')to.add(new THREE.Vector3(.55,.95,.3));
        else if(action.kind==='place')to=this.supportPoint(target,action.relation);
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
  entityPositions():THREE.Vector3[]{return[...this.entities.values()].filter(entity=>entity.root.visible&&entity.data.id!==this.snapshot.held).map(entity=>entity.root.position);}
  dispose():void {for(const surface of this.surfaces)surface.element.remove();this.surfaces.length=0;}
}
