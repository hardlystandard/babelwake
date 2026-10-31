import * as THREE from 'three';
import type { Evidence, Picture, Puzzle, Zone } from '../content/types';
import { createScenery, createSituatedScenery } from './scenery';
import { SituatedLayer, type SituatedInteractionState } from './situated';

type Anchor = { evidence: Evidence; root: THREE.Group; label: HTMLButtonElement; height: number };
const colors = { cream: '#d8c7a4', wood: '#806044', brown: '#5a4434', leaf: '#59744b', coral: '#a96950', sage: '#59765d', ink: '#334e43', gold: '#b28e46' };
const frenchColors: Record<string, string> = { rouge:'#ad5540', bleu:'#52748c', bleue:'#52748c', jaune:'#c5a04d', vert:'#54754b', verte:'#54754b', blanc:'#e5ddc7', blanche:'#e5ddc7', noir:'#273a34', noire:'#273a34' };

/** Cozy orthographic exploration: a visible traveler, village paths, and readable French. */
export class World {
  private renderer?: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-20, 20, 12.5, -12.5, .1, 160);
  private readonly cameraOffset = new THREE.Vector3(18, 25, 22);
  private readonly cameraTarget = new THREE.Vector3(0, 0, 4);
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly labels = document.createElement('div');
  private readonly anchors: Anchor[] = [];
  private readonly keys = new Set<string>();
  private readonly disposers: (() => void)[] = [];
  private readonly materials = new Map<string, THREE.MeshStandardMaterial>();
  private readonly geometries = new Map<string, THREE.BufferGeometry>();
  private player = new THREE.Group();
  private playerBody = new THREE.Group();
  private legs: THREE.Object3D[] = [];
  private arms: THREE.Object3D[] = [];
  private door?: THREE.Group;
  private zone?: Zone;
  private seen = new Set<string>();
  private controls: Record<string, string> = {};
  private wordRenderer?: (text: string, evidence?:Evidence) => string;
  private wordRevision = 0;
  private readonly stationScenes = new Map<string, string[]>();
  private destination?: THREE.Vector3;
  private pointerDown?: { x: number; y: number };
  private hovered?: Anchor;
  private paused = true;
  private mechanism = false;
  private returnPosition?: THREE.Vector3;
  private gamepadPressed = false;
  private frame = 0;
  private last = 0;
  private walking = false;
  private walkPhase = 0;
  private destroyed = false;
  private readonly resizeObserver: ResizeObserver;
  private situated?: SituatedLayer;
  private focusTarget?: THREE.Vector3;
  private targetZoom = 1;

  constructor(private readonly host: HTMLElement, private readonly onInteract: (id: string) => void) {
    host.style.position = 'relative';
    host.style.overflow = 'hidden';
    host.dataset.view = 'top-down';
    host.dataset.camera = 'orthographic';
    this.labels.className = 'world-labels';
    Object.assign(this.labels.style, { position:'absolute', inset:'0', pointerEvents:'none', overflow:'hidden' });
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = .95;
      const canvas = this.renderer.domElement;
      canvas.dataset.view = 'top-down';
      canvas.dataset.camera = 'orthographic';
      canvas.setAttribute('aria-label', 'Babelwake');
      Object.assign(canvas.style, { display:'block', touchAction:'none' });
      host.append(canvas);
    } catch {
      host.classList.add('world-fallback');
      host.style.background = 'radial-gradient(ellipse at 70% 60%, #526f4c 0 24%, transparent 25%), radial-gradient(ellipse at 20% 30%, #3f5e4d 0 19%, transparent 20%), #61724e';
    }
    host.append(this.labels);
    this.listen(window, 'keydown', (event: KeyboardEvent) => {
      if (this.paused || this.isTyping()) return;
      this.keys.add(event.code);
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code)) event.preventDefault();
      if (!event.repeat && (event.code === (this.controls.interact || 'KeyE') || event.code === 'Enter')) this.interactNearest();
    });
    this.listen(window, 'keyup', (event: KeyboardEvent) => this.keys.delete(event.code));
    this.listen(window, 'blur', () => { this.keys.clear(); this.destination = undefined; });
    this.listen(host, 'pointerdown', (event: PointerEvent) => {
      if (this.paused || (event.target as HTMLElement).closest('button')) return;
      this.pointerDown = { x:event.clientX, y:event.clientY };
    });
    this.listen(host, 'pointermove', (event: PointerEvent) => {
      this.updatePointer(event);
      if (!this.paused) this.updateHover();
    });
    this.listen(host, 'pointerup', (event: PointerEvent) => {
      if (this.paused || (event.target as HTMLElement).closest('button')) { this.pointerDown = undefined; return; }
      if (this.pointerDown && Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y) < 8) {
        this.updatePointer(event);
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const targets: THREE.Object3D[] = this.situated ? this.situated.targets : this.anchors.map(anchor => anchor.root);
        if (this.door && !this.mechanism) targets.push(this.door);
        const hit = this.raycaster.intersectObjects(targets, true)[0];
        if (hit) {
          let node: THREE.Object3D | null = hit.object;
          while (node && !node.userData.evidenceId) node = node.parent;
          if (node?.userData.evidenceId) this.onInteract(node.userData.evidenceId as string);
        } else {
          const point = new THREE.Vector3();
          if (this.raycaster.ray.intersectPlane(this.ground, point)) {
            point.x = THREE.MathUtils.clamp(point.x, -20, 20);
            point.z = THREE.MathUtils.clamp(point.z, -20, 20);
            this.destination = point;
          }
        }
      }
      this.pointerDown = undefined;
    });
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.frame = requestAnimationFrame(this.tick);
  }

  private listen<T extends Event>(target: EventTarget, name: string, callback: (event: T) => void): void {
    target.addEventListener(name, callback as EventListener);
    this.disposers.push(() => target.removeEventListener(name, callback as EventListener));
  }
  private isTyping(): boolean { return document.activeElement instanceof HTMLElement && ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName); }
  private updatePointer(event: PointerEvent): void {
    const rect = this.host.getBoundingClientRect();
    this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
  }

  setZone(zone: Zone, seen = new Set<string>()): void {
    this.clearScene();
    this.zone = zone; this.seen = seen; this.mechanism = false;
    this.returnPosition = undefined; this.destination = undefined; this.hovered = undefined;
    this.scene.background = new THREE.Color('#566457');
    this.scene.add(new THREE.HemisphereLight('#d8cdb2', '#52644e', 1.7));
    const sun = new THREE.DirectionalLight('#e1c69b', 2);
    sun.position.set(-10, 25, 14); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left:-29, right:29, top:29, bottom:-29, far:90 });
    sun.shadow.normalBias = .05; sun.shadow.bias = -.0002;
    this.scene.add(sun);
    this.scene.add(zone.design==='situated'?createSituatedScenery(zone):createScenery(zone));
    if(zone.design!=='situated')this.buildGate();
    this.focusTarget=undefined;this.targetZoom=1;this.camera.zoom=1;
    this.player = new THREE.Group(); this.playerBody = new THREE.Group();
    this.player.add(this.playerBody); this.legs = []; this.arms = [];
    this.buildPerson(this.playerBody, '#a56647', true);
    this.player.position.set(0, 0, 4); this.scene.add(this.player);
    this.cameraTarget.copy(this.player.position); this.placeCamera();
    this.stationScenes.clear();
    for (const evidence of zone.evidence) {
      const station=evidence.station||evidence.id;
      this.stationScenes.set(station,[...(this.stationScenes.get(station)||[]),evidence.id]);
    }
    if(zone.design==='situated'){
      this.situated=new SituatedLayer(this.scene,this.labels,zone,this.onInteract);
      if(this.wordRenderer)this.situated.setWordRenderer(this.wordRenderer,this.wordRevision);
      this.situated.setPaused(this.paused);
    }else{
      const stations = new Set<string>();
      for (const [index, evidence] of zone.evidence.entries()) {
        const station = evidence.station || evidence.id;
        if (!stations.has(station)) { stations.add(station); this.addEvidence(evidence, index); }
      }
    }
    this.updateSeen(seen); this.resize();
  }

  private material(color: string): THREE.MeshStandardMaterial {
    let material = this.materials.get(color);
    if (!material) { material = new THREE.MeshStandardMaterial({ color, roughness:1, metalness:0 }); this.materials.set(color, material); }
    return material;
  }
  private geometry(key: string, build: () => THREE.BufferGeometry): THREE.BufferGeometry {
    let geometry = this.geometries.get(key);
    if (!geometry) { geometry = build(); this.geometries.set(key, geometry); }
    return geometry;
  }
  private mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: string, position: [number,number,number], scale: [number,number,number] = [1,1,1]): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, this.material(color));
    mesh.position.set(...position); mesh.scale.set(...scale); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  private box(parent: THREE.Object3D, size: [number,number,number], position: [number,number,number], color: string, rotation = 0): THREE.Mesh {
    const mesh = this.mesh(parent, this.geometry('box', () => new THREE.BoxGeometry(1,1,1)), color, position, size); mesh.rotation.y = rotation; return mesh;
  }
  private ball(parent: THREE.Object3D, radius: number, position: [number,number,number], color: string, scale: [number,number,number] = [1,1,1]): THREE.Mesh {
    return this.mesh(parent, this.geometry('sphere', () => new THREE.SphereGeometry(1, 12, 8)), color, position, scale.map(v => v * radius) as [number,number,number]);
  }
  private cylinder(parent: THREE.Object3D, radius: number, height: number, position: [number,number,number], color: string, topScale = 1): THREE.Mesh {
    const key = `cylinder-${topScale}`;
    return this.mesh(parent, this.geometry(key, () => new THREE.CylinderGeometry(topScale, 1, 1, 12)), color, position, [radius,height,radius]);
  }
  private torus(parent: THREE.Object3D, radius: number, tube: number, position: [number,number,number], color: string): THREE.Mesh {
    return this.mesh(parent, this.geometry(`torus-${tube/radius}`, () => new THREE.TorusGeometry(1,tube/radius,6,16)), color, position, [radius,radius,radius]);
  }

  private buildPerson(parent: THREE.Group, color: string, traveler = false, seed = 0): void {
    const body = this.ball(parent, .37, [0,.82,0], color, [1,1.32,.78]);
    if (traveler) body.scale.y *= 1.05;
    for (const side of [-1,1]) {
      const leg = new THREE.Group(); leg.position.set(side * .15,.55,0); parent.add(leg);
      this.cylinder(leg,.09,.42,[0,-.19,0], '#435b50');
      this.ball(leg,.12,[0,-.4,.045], '#514033', [1,.65,1.4]);
      const arm = new THREE.Group(); arm.position.set(side * .32,1.02,0); parent.add(arm);
      this.cylinder(arm,.085,.38,[side * .035,-.16,0],color);
      this.ball(arm,.09,[side * .035,-.36,0],'#bc8f6c');
      if (traveler) { this.legs.push(leg); this.arms.push(arm); }
    }
    this.ball(parent,.31,[0,1.37,.015],'#c99b76',[1,1.08,.97]);
    this.ball(parent,.32,[0,1.52,-.055],seed % 2 ? '#805e43' : '#514031',[1,.7,1]);
    for (const x of [-.1,.1]) this.ball(parent,.025,[x,1.39,.29],'#303b31');
    this.ball(parent,.05,[0,1.3,.3],'#b37a63',[1,.55,.5]);
    if (traveler || seed % 3 === 0) {
      this.cylinder(parent,.41,.065,[0,1.67,0],traveler ? '#b69454' : '#708157');
      this.cylinder(parent,.27,.19,[0,1.78,0],traveler ? '#b69454' : '#708157',.82);
      this.cylinder(parent,.277,.035,[0,1.71,0],traveler ? '#9b6c47' : '#536e49');
    }
    if (traveler) {
      this.ball(parent,.26,[0,.89,-.32],'#a08045',[.85,1.15,.6]);
      this.box(parent,[.14,.13,.05],[0,1.06,-.48],'#7e6039');
      const ring = this.torus(parent,.43,.025,[0,.04,0],'#c2b378'); ring.rotation.x = Math.PI / 2;
    }
  }

  private buildGate(): void {
    this.door = new THREE.Group(); this.door.position.set(0,0,-15); this.door.userData.evidenceId = '__door'; this.scene.add(this.door);
    for (const x of [-.95,.95]) {
      this.box(this.door,[.18,2.4,.18],[x,1.2,0],colors.cream);
      this.ball(this.door,.16,[x,2.45,0],colors.gold);
    }
    this.box(this.door,[2.3,.17,.28],[0,2.35,0],colors.cream);
    this.box(this.door,[1.7,.15,.17],[0,.5,0],colors.sage);
    this.box(this.door,[1.7,.15,.17],[0,1.15,0],colors.sage);
    for (let i=-3;i<=3;i++) this.box(this.door,[.12,1.35,.12],[i*.25,.8,0],colors.sage);
    for (let i=0;i<8;i++) this.ball(this.door,.19,[-1.1 + i*.32,2.46,0],i%2 ? '#9b6656' : '#61794a');
  }

  private addEvidence(evidence: Evidence, index: number): void {
    const root = new THREE.Group(); root.position.set(evidence.position[0],0,evidence.position[1]); root.userData.evidenceId = evidence.id; this.scene.add(root);
    const kind = evidence.picture.kind.toLowerCase();
    const color = frenchColors[evidence.picture.color || ''] || ['#667c5e','#b47755','#5f7d8d','#a88b52'][index % 4];
    const detail = evidence.picture.detail || '';
    let height = 1.8;
    if (evidence.kind === 'person' || /person|family|grammar|action|polite|question|negation/.test(kind)) {
      this.buildPerson(root,color,false,index);
      if (/family/.test(kind)) { const friend = new THREE.Group(); friend.position.set(.65,0,.25); friend.scale.setScalar(.75); root.add(friend); this.buildPerson(friend,'#716e83',false,index+1); }
      this.ball(root,.1,[.45,2.05,0],'#d6c8a7'); this.ball(root,.075,[.62,2.18,0],'#d6c8a7');
      height = 2.35;
    } else if (/flower|garden|tree/.test(kind)) {
      this.box(root,[1.35,.18,.95],[0,.1,0],'#8e6b45');
      this.box(root,[1.2,.08,.8],[0,.2,0],'#57452f');
      for (let i=0;i<5;i++) {
        const x=Math.cos(i*2.4)*.4,z=Math.sin(i*2.4)*.27;
        this.cylinder(root,.025,.4,[x,.43,z],'#517044');
        for(let j=0;j<4;j++)this.ball(root,.1,[x+Math.cos(j*Math.PI/2)*.09,.67,z+Math.sin(j*Math.PI/2)*.09],i%2?'#b78d46':'#936d78',[1,.65,1]);
      }
      height=1.2;
    } else if (/letter/.test(kind) || evidence.kind === 'note') {
      this.cylinder(root,.08,.8,[0,.4,0],colors.wood);
      this.box(root,[.68,.5,.55],[0,1.05,0],color);
      this.ball(root,.34,[0,1.28,0],color,[1,.65,.82]);
      this.box(root,[.38,.045,.035],[0,1.1,.3],colors.ink);
      this.box(root,[.04,.38,.04],[.39,1.35,0],colors.brown);
      this.box(root,[.24,.13,.035],[.49,1.48,0],colors.coral);
      this.box(root,[.36,.02,.25],[.05,.04,.3],colors.cream,-.2); height=1.9;
    } else if (/book/.test(kind)) {
      this.bookStand(root,color); height=1.65;
    } else if (/coffee|tea|water|milk|soup|bread|apple|food|cheese|fruit/.test(kind)) {
      this.marketBasket(root,kind,color,index); height=1.7;
    } else if (/color|pencil|shirt|bag/.test(kind)) {
      for(const x of [-.45,.45]) { const leg=this.box(root,[.08,1.45,.08],[x,.72,0],colors.wood); leg.rotation.z=x>0?-.1:.1; }
      this.box(root,[1.05,.9,.1],[0,1.22,0],colors.wood);
      this.box(root,[.91,.76,.12],[0,1.22,.02],colors.cream);
      if(/color|pencil/.test(kind)) {
        for(let i=0;i<4;i++) this.ball(root,.13,[-.3+i*.2,1.23,.1],['#ad6248','#52748c','#c5a04d','#54754b'][i],[.8,1,.15]);
      } else this.box(root,[.42,.48,.05],[0,1.22,.12],color);
      this.box(root,[1.2,.1,.32],[0,.72,.12],colors.wood); height=1.95;
    } else if (/box/.test(kind)) {
      this.box(root,[1,.55,.78],[0,.3,0],color);
      this.cylinder(root,.39,.95,[0,.62,0],color).rotation.z=Math.PI/2;
      for(const x of [-.33,.33])this.box(root,[.09,.5,.82],[x,.32,0],colors.gold);
      this.box(root,[.13,.16,.04],[0,.46,.42],colors.gold); height=1.4;
    } else if (/key/.test(kind)) {
      this.cylinder(root,.42,.52,[0,.26,0],colors.wood,1.1);
      this.cylinder(root,.38,.045,[0,.54,0],colors.cream);
      const key=this.torus(root,.16,.047,[-.16,.62,0],colors.gold); key.rotation.x=Math.PI/2;
      this.box(root,[.55,.08,.08],[.17,.62,0],colors.gold);
      this.box(root,[.08,.08,.2],[.38,.62,.07],colors.gold); height=1.2;
    } else if (/door|window|house|station/.test(kind)) {
      this.box(root,[1.3,1.35,.2],[0,.68,0],colors.cream);
      this.box(root,[.9,1.13,.24],[0,.6,.03],color);
      for(const x of [-.58,.58]) this.box(root,[.12,1.6,.27],[x,.8,0],colors.wood);
      this.box(root,[1.5,.16,.35],[0,1.55,0],colors.wood);
      this.ball(root,.065,[.3,.7,.2],colors.gold); height=2;
    } else if (/table|chair/.test(kind)) {
      this.picnic(root,color); this.book(root,0,.8,0,'#708161'); height=1.5;
    } else if (/cat/.test(kind)) {
      this.ball(root,.5,[0,.16,0],'#a77c67',[1,.35,.8]);
      this.ball(root,.28,[0,.35,0],'#ad8c5e',[1.3,.7,.8]);
      this.ball(root,.18,[.24,.46,.12],'#ad8c5e');
      this.box(root,[.1,.14,.1],[.17,.62,.1],'#ad8c5e');this.box(root,[.1,.14,.1],[.34,.62,.1],'#ad8c5e');height=1.1;
    } else if (/quantity/.test(kind)) {
      this.box(root,[1.15,.36,.75],[0,.3,0],colors.wood);
      for(let i=0;i<3;i++)this.book(root,-.34+i*.32,.58,0,['#687c5c','#a5745d','#5c788b'][i]);
      for(const x of [-.55,.55])this.cylinder(root,.18,.08,[x,.13,0],colors.brown).rotation.z=Math.PI/2;
      height=1.4;
    } else {
      this.noticeboard(root,color,/clock|time/.test(kind),detail); height=2.05;
    }
    // Small feet of grass tie each station into the village without display plinths.
    if(index%3===0)for(let i=0;i<3;i++)this.ball(root,.09,[.63+i*.07,.08,-.3+i*.12],'#6b814d',[.8,1.5,.6]);
    const label = document.createElement('button'); label.type='button'; label.className='world-label'; label.dataset.evidence=evidence.id;
    label.title=evidence.title; label.setAttribute('aria-label',evidence.title);
    Object.assign(label.style,{position:'absolute',left:'0',top:'0',pointerEvents:'auto',transform:'translate(-50%, -100%)',border:'1px solid #928265',color:'#30483a',background:'rgba(224,212,185,.97)',borderRadius:'12px',padding:'7px 11px',fontSize:'.7rem',fontFamily:'inherit',cursor:'pointer',whiteSpace:'nowrap',boxShadow:'0 3px 10px #3e4d3415',transition:'opacity .18s ease'});
    label.addEventListener('click',event=>{event.stopPropagation();if(this.paused)return;const word=(event.target as Element).closest<HTMLElement>('[data-word]');if(word?.dataset.word)this.onInteract(`__word:${word.dataset.word}`);else this.onInteract(evidence.id);});
    this.labels.append(label); this.anchors.push({evidence,root,label,height});
  }

  private book(parent: THREE.Object3D,x:number,y:number,z:number,color:string): void {
    this.box(parent,[.5,.09,.38],[x,y,z],color);
    this.box(parent,[.46,.055,.35],[x,y+.02,z+.01],colors.cream);
    this.box(parent,[.035,.06,.36],[x,y+.05,z],color);
  }
  private bookStand(parent: THREE.Object3D,color:string): void {
    for(const x of [-.28,.28])this.box(parent,[.09,.85,.09],[x,.43,0],colors.wood);
    const top=new THREE.Group();top.position.set(0,.94,0);top.rotation.x=.24;parent.add(top);
    this.box(top,[1.05,.11,.8],[0,0,0],colors.wood);
    this.box(top,[.82,.08,.6],[0,.09,0],color);
    for(const x of [-.2,.2])this.box(top,[.37,.025,.54],[x,.15,.015],colors.cream);
    this.box(top,[.02,.03,.55],[0,.17,.015],colors.wood);
  }
  private marketBasket(parent: THREE.Object3D,kind:string,color:string,index:number): void {
    const base=index%2===0?.75:.3;
    if(index%2===0) {
      this.box(parent,[1.35,.12,.85],[0,.69,0],colors.wood);
      for(const x of [-.52,.52])this.box(parent,[.12,.66,.6],[x,.33,0],colors.wood);
      for(const x of [-.62,.62])this.cylinder(parent,.035,1.4,[x,1.4,-.3],colors.wood);
      this.box(parent,[1.5,.1,1],[0,2.07,-.05],color);
      for(let i=0;i<5;i++)this.box(parent,[.14,.11,1.04],[-.59+i*.29,2.08,-.05],colors.cream);
    } else {
      this.cylinder(parent,.48,.3,[0,.17,0],colors.wood,1.15);
      const handle=this.torus(parent,.45,.035,[0,.52,0],colors.wood); handle.scale.z=.7;
    }
    if(/coffee|tea|soup/.test(kind)) {
      for(const x of [-.25,.25]){
        this.cylinder(parent,.2,.035,[x,base+.04,0],colors.cream);
        this.cylinder(parent,.13,.21,[x,base+.15,0],colors.cream,1.2);
        this.cylinder(parent,.13,.01,[x,base+.265,0],/soup/.test(kind)?'#ad803d':'#5f4933');
        this.torus(parent,.07,.02,[x+.15,base+.16,0],colors.cream);
      }
    } else if(/milk|water/.test(kind)) {
      for(const x of [-.25,.25]){
        this.cylinder(parent,.13,.42,[x,base+.23,0],/milk/.test(kind)?'#ddd2b8':'#628b95');
        this.cylinder(parent,.055,.18,[x,base+.51,0],/milk/.test(kind)?'#ddd2b8':'#628b95');
        this.cylinder(parent,.065,.04,[x,base+.61,0],colors.wood);
      }
    } else if(/bread/.test(kind)) {
      for(const x of [-.23,.23])this.ball(parent,.28,[x,base+.18,0],'#b68d50',[.6,.5,1.5]);
    } else if(/cheese/.test(kind)) {
      this.cylinder(parent,.3,.18,[0,base+.13,0],'#c19c47',.95);
    } else for(let i=0;i<5;i++)this.ball(parent,.16,[Math.cos(i*2.4)*.3,base+.13,Math.sin(i*2.4)*.24],i%2?'#aa704d':'#8d884b');
  }
  private picnic(parent:THREE.Object3D,color:string):void {
    this.box(parent,[1.35,.12,.8],[0,.73,0],colors.wood);
    for(const x of [-.45,.45])this.box(parent,[.12,.7,.65],[x,.35,0],colors.wood);
    for(const z of [-.66,.66]){
      this.box(parent,[1.3,.1,.3],[0,.4,z],color);
      for(const x of [-.4,.4])this.box(parent,[.1,.35,.18],[x,.2,z],colors.wood);
    }
  }
  private noticeboard(parent:THREE.Object3D,color:string,clock:boolean,_detail:string):void {
    for(const x of [-.4,.4])this.box(parent,[.1,1.6,.1],[x,.8,0],colors.wood);
    this.box(parent,[1.25,1.05,.12],[0,1.35,0],colors.wood);
    this.box(parent,[1.1,.9,.14],[0,1.35,.01],color);
    if(clock) {
      const face=this.cylinder(parent,.36,.04,[0,1.38,.11],colors.cream);face.rotation.x=Math.PI/2;
      this.box(parent,[.035,.23,.035],[0,1.46,.15],colors.ink);
      this.box(parent,[.2,.035,.035],[.08,1.36,.15],colors.ink);
    } else {
      this.box(parent,[.38,.47,.025],[-.23,1.4,.1],colors.cream,-.08);
      this.box(parent,[.37,.36,.025],[.25,1.28,.11],'#bdaa80',.12);
      this.ball(parent,.035,[-.23,1.6,.14],colors.coral);
      this.ball(parent,.035,[.25,1.4,.15],colors.coral);
    }
    this.box(parent,[1.4,.12,.3],[0,1.94,0],colors.wood);
  }

  setMechanism(puzzle:Puzzle,stepIndex:number,answers:string[]):void {
    const step=puzzle.steps[stepIndex];if(!step)return;
    if(!this.mechanism)this.returnPosition=this.player.position.clone();
    this.mechanism=true;this.destination=undefined;
    for(const anchor of this.anchors){this.scene.remove(anchor.root);anchor.label.remove();}
    this.anchors.length=0;this.hovered=undefined;
    this.player.position.set(0,0,5);this.cameraTarget.set(0,0,1);this.placeCamera();
    const mapping:[RegExp,string][]=[[/boîte/i,'box'],[/clé/i,'key'],[/lettre/i,'letter'],[/livre/i,'book'],[/porte/i,'door'],[/café/i,'coffee'],[/thé/i,'tea'],[/eau/i,'water'],[/lait/i,'milk'],[/pain/i,'bread'],[/pomme/i,'apple'],[/fromage/i,'cheese'],[/soupe/i,'soup'],[/heure|[0-9] h/i,'clock'],[/table/i,'table'],[/chaise/i,'chair'],[/fleur/i,'flower'],[/maison|gare/i,'house'],[/jardin/i,'garden'],[/chat/i,'cat'],[/sac/i,'bag']];
    step.choices.forEach((choice,index)=>{
      const kind=mapping.find(([pattern])=>pattern.test(choice))?.[1]||step.picture.kind;
      const color=Object.keys(frenchColors).find(candidate=>choice.toLowerCase().includes(candidate));
      const picture:Picture={...step.picture,kind,...(color?{color}:{})};
      const columns=Math.min(4,step.choices.length);
      this.addEvidence({id:`__action:${index}`,title:choice,text:choice,words:[],picture,position:[(index%columns-(columns-1)/2)*3.5,-1-Math.floor(index/columns)*3.5],kind:'object'},index);
      const anchor=this.anchors[this.anchors.length-1];anchor.label.dataset.action=String(index);
      anchor.label.style.fontSize='.77rem';anchor.label.style.maxWidth='250px';
      if(answers[stepIndex]===choice){anchor.label.style.borderWidth='3px';anchor.label.style.borderColor='#9b6c47';}
    });
    this.updateSeen(this.seen);
  }
  clearMechanism():void {
    if(!this.mechanism||!this.zone)return;
    const previous=this.returnPosition?.clone();this.setZone(this.zone,this.seen);
    if(previous){this.player.position.copy(previous);this.cameraTarget.copy(previous);this.placeCamera();}
  }
  updateSeen(seen:Set<string>):void {
    this.seen=seen;
    for(const anchor of this.anchors) {
      let inspect=anchor.label.querySelector<HTMLSpanElement>('.world-inspect');
      if(!inspect) {
        inspect=document.createElement('span');inspect.dataset.inspect=anchor.evidence.id;inspect.className='world-inspect';inspect.title=this.mechanism?'Choisir':'Observer';
        Object.assign(inspect.style,{marginRight:'.4em',display:'inline-block',color:'#5c6d40'});
        const title=document.createElement('span');title.className='world-label-title';
        anchor.label.replaceChildren(inspect,title);
      }
      if(anchor.label.dataset.wordRevision!==String(this.wordRevision)) {
        const title=anchor.label.querySelector<HTMLSpanElement>('.world-label-title')!;
        if(this.wordRenderer)title.innerHTML=this.wordRenderer(anchor.evidence.title);else title.textContent=anchor.evidence.title;
        anchor.label.dataset.wordRevision=String(this.wordRevision);
      }
      anchor.label.style.whiteSpace=this.mechanism?'normal':'nowrap';
      const station=anchor.evidence.station??anchor.evidence.id;
      const members=this.stationScenes.get(station)||[anchor.evidence.id];
      const count=members.filter(id=>seen.has(id)).length;
      inspect.textContent=this.mechanism?'◉':`◉ ${count}/${members.length}`;
      const completed=count===members.length;
      anchor.label.style.borderColor=completed?'#617b4f':'#8c7752';
      anchor.label.dataset.complete=String(completed);
    }
  }
  setWordRenderer(renderer:(text:string,evidence?:Evidence)=>string):void{this.wordRenderer=renderer;this.wordRevision++;this.situated?.setWordRenderer(renderer,this.wordRevision);this.updateSeen(this.seen);}
  setAnnotations(_annotations:Record<string,string>):void{this.updateSeen(this.seen);}
  setControls(controls:Record<string,string>):void{this.controls=controls;this.situated?.invalidateTextMetrics();}
  setContrast(enabled:boolean):void{this.host.classList.toggle('world-high-contrast',enabled);if(this.renderer)this.renderer.toneMappingExposure=enabled?1.05:.95;}
  setPaused(paused:boolean):void{this.paused=paused;this.keys.clear();this.destination=undefined;this.walking=false;this.labels.style.visibility=paused?'hidden':'visible';this.situated?.setPaused(paused);if(document.pointerLockElement)document.exitPointerLock();}
  /** Kept for saved settings compatibility; this view never captures the pointer. */
  requestPointerLock():void{if(document.pointerLockElement)document.exitPointerLock();}
  focusEvidence(id:string):void{
    if(this.situated){const target=this.situated.focusEvidence(id);if(target){this.focusTarget=target;this.targetZoom=1;this.destination=undefined;}return;}
    const evidence=this.zone?.evidence.find(e=>e.id===id);const anchor=this.anchors.find(a=>a.evidence.id===id||a.evidence.station===evidence?.station);
    if(!anchor)return;this.player.position.set(anchor.root.position.x,0,anchor.root.position.z+2);this.destination=undefined;this.cameraTarget.copy(this.player.position);this.placeCamera();
  }
  clearFocus():void{this.focusTarget=undefined;this.targetZoom=1;this.situated?.clearFocus();}
  focusEntity(id:string):void{const target=this.situated?.focusEntity(id);if(target){this.focusTarget=target;this.targetZoom=1;this.destination=undefined;}}
  setInteractionState(state:SituatedInteractionState):void{this.situated?.setInteractionState(state);}
  physicalState(){return this.situated?.physicalState()??[];}
  getPlayerPosition():{x:number;z:number}{return{x:this.player.position.x,z:this.player.position.z};}
  getViewState():{mode:'top-down';player:{x:number;z:number};zoom:number;focused:boolean}{return{mode:'top-down',player:this.getPlayerPosition(),zoom:this.camera.zoom,focused:!!this.focusTarget};}
  resize():void{
    const width=Math.max(1,this.host.clientWidth),height=Math.max(1,this.host.clientHeight),aspect=width/height;
    const extent=aspect<1.15?14:12.5;
    this.camera.left=-extent*aspect;this.camera.right=extent*aspect;this.camera.top=extent;this.camera.bottom=-extent;this.camera.updateProjectionMatrix();this.renderer?.setSize(width,height);
  }
  private placeCamera():void{this.camera.position.copy(this.cameraTarget).add(this.cameraOffset);this.camera.lookAt(this.cameraTarget);this.camera.updateMatrixWorld();}
  private interactNearest():void{
    if(this.situated){const id=this.situated.nearest(this.player.position);if(id)this.onInteract(`__entity:${id}`);return;}
    if(this.door&&!this.mechanism&&this.player.position.distanceTo(this.door.position)<3){this.onInteract('__door');return;}
    const nearest=[...this.anchors].sort((a,b)=>a.root.position.distanceToSquared(this.player.position)-b.root.position.distanceToSquared(this.player.position))[0];
    if(nearest&&nearest.root.position.distanceTo(this.player.position)<3.5)this.onInteract(nearest.evidence.id);
  }
  private updateHover():void{
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects(this.situated?this.situated.targets:this.anchors.map(a=>a.root),true);
    if(this.situated){this.host.style.cursor=hits.length?'pointer':'default';return;}
    this.hovered=hits.length?this.anchors.find(a=>{let node:THREE.Object3D|null=hits[0].object;while(node){if(node===a.root)return true;node=node.parent;}return false;}):undefined;
    this.host.style.cursor=this.hovered?'pointer':'default';
  }
  private move(dt:number):void{
    let x=0,z=0;
    if(this.keys.has(this.controls.forward||'KeyW')||this.keys.has('ArrowUp'))z-=1;
    if(this.keys.has(this.controls.backward||this.controls.back||'KeyS')||this.keys.has('ArrowDown'))z+=1;
    if(this.keys.has(this.controls.left||'KeyA')||this.keys.has('ArrowLeft'))x-=1;
    if(this.keys.has(this.controls.right||'KeyD')||this.keys.has('ArrowRight'))x+=1;
    const pad=navigator.getGamepads?.().find(candidate=>candidate?.connected);
    if(pad){const dead=(value:number)=>Math.abs(value)>.17?value:0;x+=dead(pad.axes[0]||0);z+=dead(pad.axes[1]||0);const pressed=pad.buttons[0]?.pressed||false;if(pressed&&!this.gamepadPressed)this.interactNearest();this.gamepadPressed=pressed;}
    let direction=new THREE.Vector3();
    if(Math.abs(x)+Math.abs(z)>.01){
      this.clearFocus();this.destination=undefined;
      const right=new THREE.Vector3(this.cameraOffset.z,0,-this.cameraOffset.x).normalize();
      const down=new THREE.Vector3(this.cameraOffset.x,0,this.cameraOffset.z).normalize();
      direction.copy(right).multiplyScalar(x).addScaledVector(down,z);
    }else if(this.destination){this.clearFocus();direction.copy(this.destination).sub(this.player.position);direction.y=0;if(direction.length()<.14){this.destination=undefined;direction.set(0,0,0);}}
    this.walking=direction.lengthSq()>.001;
    if(!this.walking)return;
    direction.normalize();
    const speed=(this.keys.has('ShiftLeft')?5.5:3.7)*dt;
    this.player.position.addScaledVector(direction,speed);
    this.player.position.x=THREE.MathUtils.clamp(this.player.position.x,-20,20);this.player.position.z=THREE.MathUtils.clamp(this.player.position.z,-20,20);
    const turn=Math.atan2(direction.x,direction.z)-this.playerBody.rotation.y;
    this.playerBody.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*Math.min(1,dt*14);
    const obstaclePositions=this.situated?this.situated.entityPositions():this.anchors.map(anchor=>anchor.root.position);
    for(const position of obstaclePositions){
      const delta=this.player.position.clone().sub(position);delta.y=0;const length=delta.length();
      if(length<.62&&length>.001){this.player.position.copy(position).add(delta.multiplyScalar(.62/length));this.player.position.y=0;}
    }
  }
  private positionLabels():void{
    if(this.paused||!this.zone)return;
    const width=this.host.clientWidth,height=this.host.clientHeight;
    if(this.situated){this.situated.positionText(this.camera,width,height,this.player.position);return;}
    if(!this.renderer){this.anchors.forEach((anchor,index)=>{anchor.label.style.display=index<16?'block':'none';anchor.label.style.left=`${14+index%4*24}%`;anchor.label.style.top=`${28+Math.floor(index/4)*17}%`;});return;}
    const visible=this.anchors.map(anchor=>{const screen=new THREE.Vector3(anchor.root.position.x,anchor.height,anchor.root.position.z).project(this.camera);return{anchor,screen,distance:anchor.root.position.distanceTo(this.player.position)};}).filter(item=>Math.abs(item.screen.x)<.94&&Math.abs(item.screen.y)<.85).sort((a,b)=>a.distance-b.distance);
    this.anchors.forEach(anchor=>{anchor.label.style.display='none';});
    const occupied:{x:number;y:number;width:number;height:number}[]=[];
    let count=0;
    for(const item of visible){
      if(count>=(this.mechanism?8:6))break;
      if(!this.mechanism&&item.distance>10&&item.anchor!==this.hovered)continue;
      const x=(item.screen.x*.5+.5)*width,y=(-item.screen.y*.5+.5)*height;
      const bounds={x:x-85,y:y-30,width:170,height:42};
      if(!this.mechanism&&occupied.some(other=>Math.abs(other.x-bounds.x)<Math.max(other.width,bounds.width)*.85&&Math.abs(other.y-bounds.y)<40))continue;
      item.anchor.label.style.display='block';item.anchor.label.style.left=`${x}px`;item.anchor.label.style.top=`${y}px`;item.anchor.label.style.zIndex=String(100-Math.floor(item.distance));item.anchor.label.style.opacity='1';occupied.push(bounds);count++;
    }
  }
  private tick=(time:number):void=>{
    if(this.destroyed)return;
    const elapsed=Math.min((time-this.last)/1000,.4);const dt=Math.min(elapsed,.05);this.last=time;
    if(!this.paused&&!this.isTyping())this.move(dt);else this.walking=false;
    if(this.walking)this.walkPhase+=dt*10;
    const swing=this.walking?Math.sin(this.walkPhase)*.5:0;
    this.legs.forEach((leg,index)=>{leg.rotation.x=swing*(index?1:-1);});this.arms.forEach((arm,index)=>{arm.rotation.x=swing*(index?-1:1);});
    this.playerBody.position.y=this.walking?Math.abs(Math.sin(this.walkPhase))*.045:Math.sin(time*.0015)*.015;
    this.situated?.update(this.player.position);
    if(!this.mechanism)this.cameraTarget.lerp(this.focusTarget||this.player.position,1-Math.exp(-elapsed*4));
    const zoom=THREE.MathUtils.lerp(this.camera.zoom,this.targetZoom,1-Math.exp(-elapsed*5));
    if(Math.abs(zoom-this.camera.zoom)>.0001){this.camera.zoom=zoom;this.camera.updateProjectionMatrix();}
    this.placeCamera();this.positionLabels();this.renderer?.render(this.scene,this.camera);this.frame=requestAnimationFrame(this.tick);
  };
  private clearScene():void{
    this.situated?.dispose();this.situated=undefined;
    this.scene.traverse(node=>{if(node instanceof THREE.Mesh){if(![...this.geometries.values()].includes(node.geometry))node.geometry.dispose();const materials=Array.isArray(node.material)?node.material:[node.material];for(const material of materials)if(![...this.materials.values()].includes(material as THREE.MeshStandardMaterial))material.dispose();}});
    this.scene.clear();this.anchors.length=0;this.labels.replaceChildren();this.door=undefined;
  }
  dispose():void{this.destroyed=true;cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.disposers.forEach(dispose=>dispose());this.clearScene();this.geometries.forEach(geometry=>geometry.dispose());this.materials.forEach(material=>material.dispose());this.renderer?.dispose();this.renderer?.domElement.remove();this.labels.remove();}
}
