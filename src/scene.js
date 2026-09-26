import * as THREE from 'three/webgpu';
import {publicUrl} from './public-url.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildCustomerGarden, CUSTOMER, CUSTOMER_BOUNDARY, insidePolygon, customerSurface, customerPlaceable } from './customer-garden.js';
import { createFurniture } from './furniture.js';
import {VegetationBatches} from './vegetation-batches.js';
import {SurfaceLibrary} from './surface-library.js';
import {Daylight} from './daylight.js';

export class GardenScene {
 constructor(container,callbacks){this.container=container;this.cb=callbacks;this.items=new Map();this.cache=new Map();this.mobile=matchMedia('(max-width: 760px)').matches;this.dirty=1;this.ready=false;this.frameCount=0;this.fpsStart=performance.now();this.dragStart=null;}
 async init(){
  this.scene=new THREE.Scene();this.vegetation=new VegetationBatches(this.scene,this.items);this.surfaces=new SurfaceLibrary();this.scene.background=new THREE.Color('#738a8b');this.scene.fog=new THREE.Fog('#738a8b',38,100);
  this.camera=new THREE.PerspectiveCamera(this.mobile?52:39,1,.1,150);this.camera.position.set(-11,10,14);
  this.renderer=new THREE.WebGPURenderer({antialias:!this.mobile,alpha:false,forceWebGL:new URLSearchParams(location.search).has('webgl')});
  await this.renderer.init();this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.mobile?1.25:1.75));this.renderer.shadowMap.enabled=!this.mobile;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
  this.container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','Scena 3D — przeciągnij, aby obracać widok');this.renderer.domElement.tabIndex=0;
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(-1,.4,-.5);this.controls.enableDamping=true;this.controls.dampingFactor=.08;this.controls.minDistance=3;this.controls.maxDistance=42;this.controls.maxPolarAngle=Math.PI*.485;this.controls.update();
  this.transform=new TransformControls(this.camera,this.renderer.domElement);this.transform.setSpace('world');this.transform.setSize(this.mobile?.85:.8);this.scene.add(this.transform.getHelper());
  this.transform.addEventListener('dragging-changed',e=>{this.controls.enabled=!e.value;if(e.value)this.cb.beforeChange();else this.cb.changed(this.readTransforms());});
  this.transform.addEventListener('objectChange',()=>{if(this.selection)this.selection.update();this.cb.live(this.readTransforms());});
  this.ambient=new THREE.HemisphereLight('#e4f5ff','#596542',2.4);this.scene.add(this.ambient);
  this.sun=new THREE.DirectionalLight('#fff2db',3.6);this.sun.position.set(-7,14,9);this.sun.castShadow=!this.mobile;this.sun.shadow.mapSize.setScalar(this.mobile?512:2048);Object.assign(this.sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:.5,far:50});this.sun.shadow.bias=-.001;this.sun.shadow.normalBias=.06;this.scene.add(this.sun);
  const pmrem=new THREE.PMREMGenerator(this.renderer);const room=new RoomEnvironment();this.env=pmrem.fromScene(room,.04);this.scene.environment=this.env.texture;this.scene.environmentIntensity=.45;room.dispose();pmrem.dispose();
  this.environment=new THREE.Group();this.scene.add(this.environment);
  this.grid=new THREE.GridHelper(40,40,'#b3c6b6','#82968a');this.grid.position.y=.006;this.grid.material.transparent=true;this.grid.material.opacity=.22;this.scene.add(this.grid);
  this.loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
  const canvas=this.renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{
   this.down=[e.clientX,e.clientY];
   if(this.environmentEdit||e.button!==0||this.mode!=='select')return;
   const object=this.pick(e);if(!object)return;
   this.cb.select(object.userData.instanceId);this.controls.enabled=false;
   const point=this.groundPoint(e,object.position.y);if(!point)return;
   this.drag={id:e.pointerId,object,start:[e.clientX,e.clientY],offset:object.position.clone().sub(point),moved:false};
   canvas.setPointerCapture(e.pointerId);e.stopImmediatePropagation();
  },true);
  canvas.addEventListener('pointermove',e=>{
   const drag=this.drag;if(!drag||drag.id!==e.pointerId)return;
   if(!drag.moved&&Math.hypot(e.clientX-drag.start[0],e.clientY-drag.start[1])<5)return;
   const point=this.groundPoint(e,drag.object.position.y);if(!point)return;
   if(!drag.moved){this.cb.beforeChange();drag.moved=true;}
   point.add(drag.offset);if(this.snap){point.x=Math.round(point.x*4)/4;point.z=Math.round(point.z*4)/4;}
   const size=new THREE.Box3().setFromObject(drag.object).getSize(new THREE.Vector3());
   if(this.customer&&!this.canPlace(point.x,point.z,size.x/2,size.z/2))return;
   drag.object.position.set(point.x,this.surfaceAt(point.x,point.z),point.z);this.selection?.update();this.cb.live(this.readTransforms());e.stopImmediatePropagation();
  },true);
  const endDrag=e=>{if(!this.drag||this.drag.id!==e.pointerId)return;const moved=this.drag.moved;this.drag=null;this.controls.enabled=true;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(moved)this.cb.changed(this.readTransforms());e.stopImmediatePropagation();};
  canvas.addEventListener('pointerup',endDrag,true);canvas.addEventListener('pointercancel',endDrag,true);
  canvas.addEventListener('pointerup',e=>{if(this.environmentEdit||!this.down||this.transform.dragging||this.transform.axis||Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])>5)return;const r=canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hit=this.raycaster.intersectObjects([...this.items.values()],true)[0];let o=hit?.object;while(o&&!o.userData.instanceId)o=o.parent;this.cb.select(o?.userData.instanceId??null);});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.container);this.resize();
  this.daylight=new Daylight(this);this.ready=true;this.renderer.setAnimationLoop(t=>this.tick(t));this.cb.renderer(this.renderer.backend.isWebGPUBackend?'WebGPU':'WebGL');return this;
 }
 pick(e){const r=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);let object=this.raycaster.intersectObjects([...this.items.values()],true)[0]?.object;while(object&&!object.userData.instanceId)object=object.parent;return object;}
 groundPoint(e,height=0){const r=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);return this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-height),new THREE.Vector3());}
 surfaceAt(x,z){if(this.customer&&Object.keys(this.environmentEdits||{}).length){const ray=new THREE.Raycaster(new THREE.Vector3(x,20,z),new THREE.Vector3(0,-1,0));const parts=['patio','deck','lawn','driveway'].map(id=>this.customer.parts.get(id)).filter(o=>o?.visible);return ray.intersectObjects(parts,true)[0]?.point.y??0;}return this.customer?customerSurface(x/this.customer.root.scale.x,z/this.customer.root.scale.z):0;}
 canPlace(x,z,hx=0,hz=0){if(this.customer&&Object.keys(this.environmentEdits||{}).length){const s=this.customer.root.scale;if([[x-hx,z-hz],[x+hx,z-hz],[x+hx,z+hz],[x-hx,z+hz]].some(([a,b])=>!insidePolygon(a/s.x,b/s.z,CUSTOMER_BOUNDARY)))return false;const rect=new THREE.Box3(new THREE.Vector3(x-hx,-1,z-hz),new THREE.Vector3(x+hx,10,z+hz));return !['house','room','tank'].some(id=>{const o=this.customer.parts.get(id);return o?.visible&&rect.intersectsBox(new THREE.Box3().setFromObject(o));});}return !this.customer||customerPlaceable(x/this.customer.root.scale.x,z/this.customer.root.scale.z,hx/this.customer.root.scale.x,hz/this.customer.root.scale.z);}
 async findPlacement(asset){
  if(!this.customer)return {x:2+(this.items.size%3)*.4,z:2};
  const template=await this.loadAsset(asset),size=new THREE.Box3().setFromObject(template).getSize(new THREE.Vector3());
  const candidates=[];for(let z=-15;z<3;z+=.75)for(let x=-10;x<11;x+=.75){if(!this.canPlace(x,z,size.x/2+.15,size.z/2+.15))continue;const rect=new THREE.Box3(new THREE.Vector3(x-size.x/2,-.1,z-size.z/2),new THREE.Vector3(x+size.x/2,10,z+size.z/2));if([...this.items.values()].some(item=>rect.intersectsBox(new THREE.Box3().setFromObject(item).expandByScalar(.2))))continue;candidates.push({x,z,score:Math.hypot(x+4,z+2)+(this.surfaceAt(x,z)>0?0:4)});}
  candidates.sort((a,b)=>a.score-b.score);if(!candidates.length)throw Error('Brak wolnego miejsca. Przesuń lub usuń jeden z obiektów.');return candidates[0];
 }
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);}
 tick(t){if(document.hidden)return;const interval=this.lastWeather?.quality==='eco'?1000/30:1000/60;if(this.lastRenderAt&&t-this.lastRenderAt<interval-1)return;this.lastRenderAt=t;this.controls.update();if(this.selection)this.selection.update();this.vegetation.sync();this.renderer.render(this.scene,this.camera);this.renderStats={calls:this.renderer.info.render.drawCalls,triangles:this.renderer.info.render.triangles};this.frameCount++;if(t-this.fpsStart>1500){const fps=Math.round(this.frameCount*1000/(t-this.fpsStart));this.cb.fps(fps);if(fps<35&&this.renderer.getPixelRatio()>1){this.renderer.setPixelRatio(Math.max(1,this.renderer.getPixelRatio()-.2));this.resize();}this.frameCount=0;this.fpsStart=t;}}
 async loadAsset(asset){
  if(this.cache.has(asset.id))return this.cache.get(asset.id);
  const promise=(async()=>{
    if(asset.procedural)return asset.id.startsWith('premium-')?createPremiumFurniture(asset.id):createFurniture(asset.id);
   const gltf=asset.buffer?await this.loader.parseAsync(asset.buffer,''):await this.loader.loadAsync(publicUrl(asset.url));
   const obj=gltf.scene,bounds=new THREE.Box3().setFromObject(obj);
   obj.position.y-=bounds.min.y;
   const wrapper=new THREE.Group();wrapper.add(obj);
   const materialsCache=new Map();
   wrapper.traverse(o=>{
    if(!o.isMesh)return;
    o.castShadow=true;o.receiveShadow=true;
    const sourceMaterials=Array.isArray(o.material)?o.material:[o.material];
    const mapped=sourceMaterials.map(m=>{
     if(m.map)m.map.anisotropy=4;
     if(m.name.startsWith('Drewno'))m.color.set('#b18b5c');
     if(m.transmission>0||/glass/i.test(m.name)){
      o.castShadow=false;
      if(!materialsCache.has(m))materialsCache.set(m,new THREE.MeshPhysicalMaterial({name:m.name,color:/water/i.test(m.name)?'#50867c':'#b9d6d8',transparent:true,opacity:/water/i.test(m.name)?.65:.12,roughness:.12,metalness:.05,depthWrite:false,side:THREE.FrontSide}));
      return materialsCache.get(m);
     }
     // A texture-only finish avoids export shading artifacts on the very narrow timber strips.
     // The enclosing geometry still casts ground shadows; glass and metal retain PBR shading.
     if(/Thermowood|Interior_aspen/.test(m.name)){
      o.receiveShadow=false;
      if(!materialsCache.has(m))materialsCache.set(m,new THREE.MeshBasicMaterial({name:m.name,map:m.map,color:m.color}));
      return materialsCache.get(m);
     }
     return m;
    });
    o.material=Array.isArray(o.material)?mapped:mapped[0];
   });
   return wrapper;
  })();
  this.cache.set(asset.id,promise);
  try{return await promise;}catch(e){this.cache.delete(asset.id);throw e;}
 }
 async add(instance,asset){const template=await this.loadAsset(asset);const obj=template.clone(true);obj.userData.instanceId=instance.id;if(asset.vegetation){this.vegetation.register(asset,template);obj.userData.vegetationAsset=asset.id;obj.visible=false;}this.scene.add(obj);this.items.set(instance.id,obj);this.update(instance);return obj;}
 update(i){const o=this.items.get(i.id);if(!o)return;o.position.set(i.x,this.surfaceAt(i.x,i.z),i.z);o.rotation.y=THREE.MathUtils.degToRad(i.rotation);o.scale.setScalar(i.scale);if(this.selection)this.selection.update();}
 remove(id){const obj=this.items.get(id);if(obj){if(this.selected===id)this.select(null);this.scene.remove(obj);this.items.delete(id);}}
 select(id){this.selected=id;this.transform.detach();if(this.selection){this.scene.remove(this.selection);this.selection.geometry.dispose();this.selection.material.dispose();this.selection=null;}const obj=this.items.get(id);if(obj){this.selection=new THREE.BoxHelper(obj,'#d0f9ad');this.selection.material.transparent=true;this.selection.material.opacity=.7;this.scene.add(this.selection);if(this.mode!=='select')this.transform.attach(obj);}this.setMode(this.mode??'select');}
 setMode(mode){this.mode=mode;this.transform.detach();const obj=this.items.get(this.selected);if(obj&&mode!=='select'){this.transform.setMode(mode);this.transform.showX=mode!=='rotate';this.transform.showY=mode!=='translate';this.transform.showZ=mode!=='rotate';this.transform.attach(obj);}}
 setSnap(on){this.snap=on;this.transform.setTranslationSnap(on?.25:null);this.transform.setRotationSnap(on?Math.PI/12:null);this.transform.setScaleSnap(on?.1:null);}
 readTransforms(){return [...this.items].map(([id,o])=>({id,x:+o.position.x.toFixed(2),z:+o.position.z.toFixed(2),rotation:+THREE.MathUtils.radToDeg(o.rotation.y).toFixed(1),scale:+o.scale.x.toFixed(2)}));}
 cameraView(view){
  if(this.customer){
   const sx=this.customer.root.scale.x,sz=this.customer.root.scale.z;
   if(view==='top'){this.controls.target.set(0,0,.5*sz);this.camera.position.set(0,Math.max(this.plotDepth*1.8,this.plotWidth*2.7),.5*sz+.001);}
   else if(view==='overview'){this.controls.target.set(0,.7,1.1*sz);this.camera.position.set(-26*sx,44,-26*sz);}
   else if(view==='eye'){this.controls.target.set(.8*sx,1.3,1.8*sz);this.camera.position.set(-3.8*sx,1.65,-5.5*sz);}
   else{this.controls.target.set(-.4*sx,.7,-3.4*sz);this.camera.position.set(-16*sx,26,-22*sz);}
   if(this.mobile&&(view==='overview'||!['top','eye'].includes(view)))this.camera.position.sub(this.controls.target).multiplyScalar(view==='overview'?1.35:1.6).add(this.controls.target);
   this.controls.enableRotate=view!=='top';this.camera.lookAt(this.controls.target);this.controls.update();return;
  }
  this.controls.enableRotate=view!=='top';const target=this.controls.target.clone();if(view==='top')this.camera.position.copy(target).add(new THREE.Vector3(0,23,.001));else this.camera.position.copy(target).add(new THREE.Vector3(-11,10,14));this.camera.lookAt(target);this.controls.update();
 }
 focus(){
  const obj=this.items.get(this.selected);if(!obj&&this.customer){this.cameraView('garden');return;}
  const bounds=obj?new THREE.Box3().setFromObject(obj):null;
  const center=bounds?bounds.getCenter(new THREE.Vector3()):new THREE.Vector3(0,.4,0);
  const radius=bounds?bounds.getSize(new THREE.Vector3()).length()/2:3;
  // Reserve the space occupied by the editor panels when framing a small asset.
  const verticalFov=THREE.MathUtils.degToRad(this.camera.fov);
  const horizontalFov=2*Math.atan(Math.tan(verticalFov/2)*this.camera.aspect*(this.mobile?.9:.53));
  const distance=Math.min(this.controls.maxDistance,Math.max(this.controls.minDistance,radius/Math.sin(Math.min(verticalFov,horizontalFov)/2)*1.15));
  const direction=this.customer?this.camera.position.clone().sub(this.controls.target).normalize():new THREE.Vector3(-1,.65,1.5).normalize();
  if(this.customer&&Math.abs(direction.y)>.95)direction.set(-1,.8,-1.5).normalize();
  this.controls.target.copy(center);
  this.camera.position.copy(center).add(direction.multiplyScalar(distance));
  this.controls.enableRotate=true;this.controls.update();
 }
 setLighting(value,weather=this.lastWeather){this.lastWeather=weather;this.daylight?.update(value,weather);}

 setLayerVisibility(layers={}){if(!this.customer)return;for(const name of ['buildings','planting','boundary'])this.customer.layers[name].visible=layers[name]!==false;}
 async exportScene(){const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');const root=new THREE.Group();root.name='Customer Garden';const environment=this.environment.clone(true);const excluded=[];environment.traverse(o=>{if(o.name==='Backdrop')excluded.push(o);});for(const object of excluded)object.removeFromParent();root.add(environment);for(const item of this.items.values()){const copy=item.clone(true);copy.visible=true;root.add(copy);}root.updateMatrixWorld(true);return new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:true,maxTextureSize:1024});}
 diagnostics(){if(!this.ready)return {objects:[]};return {environmentParts:[...(this.customer?.parts||[])].map(([id,o])=>({id,position:o.position.toArray(),visible:o.visible,screen:this.projectPoint(new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()))})),environmentEdit:!!this.environmentEdit,lighting:this.daylight?.state,vegetation:this.vegetation.stats(),camera:this.camera.position.toArray(),target:this.controls.target.toArray(),environment:this.environmentKey,bounds:this.customer?CUSTOMER_BOUNDARY.map(([x,z])=>[x*this.customer.root.scale.x,z*this.customer.root.scale.z]):null,objects:[...this.items].map(([id,o])=>({id,position:o.position.toArray(),screen:this.projectPoint(new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()))}))};}
 projectPoint(point){const p=point.clone().project(this.camera);return [(p.x+1)/2*this.container.clientWidth,(1-p.y)/2*this.container.clientHeight];}
 setEnvironment(kind,width,depth){
  const key=`${kind}:${width}:${depth}`;if(key===this.environmentKey)return;this.environmentKey=key;this.plotWidth=width;this.plotDepth=depth;
  while(this.environment.children.length){const o=this.environment.children[0];o.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material){for(const m of Array.isArray(c.material)?c.material:[c.material])m.dispose();}});this.environment.remove(o);}
  this.customer=null;
  if(kind==='customer'){
   this.customer=buildCustomerGarden({mobile:this.mobile,scaleX:width/CUSTOMER.width,scaleZ:depth/CUSTOMER.depth});this.customer.root.scale.set(width/CUSTOMER.width,1,depth/CUSTOMER.depth);this.environment.add(this.customer.root);
   this.scene.background.set('#242628');this.scene.fog.color.set('#242628');this.scene.fog.near=160;this.scene.fog.far=300;this.controls.maxDistance=160;this.camera.far=400;this.camera.updateProjectionMatrix();
   Object.assign(this.sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,far:100});this.sun.shadow.camera.updateProjectionMatrix();this.sun.shadow.normalBias=.035;
   for(const item of this.items.values())item.position.y=this.surfaceAt(item.position.x,item.position.z);
   this.cameraView('garden');return;
  }
  this.controls.maxDistance=42;this.scene.fog.near=38;this.scene.fog.far=100;
  const box=(w,h,d,color,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.92}));o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;this.environment.add(o);return o;};
  box(200,.1,200,kind==='studio'?'#9caaa8':'#647d72',0,-.25,0);
  box(width,.2,depth,kind==='garden'?'#5d8055':'#bac3be',0,-.12,0);
  if(kind==='garden'){
   box(7,.08,4.5,'#9c866c',-1.4,-.04,-.9);
   for(let j=0;j<23;j++)box(.009,.005,4.5,'#746451',-4.85+j*.30,.003,-.9);
   for(let j=0;j<5;j++)box(1.35,.06,.65,'#c2c6ba',1.5,-.005,2+j*.85);
   const positions=[[-width/2+1,-depth/2+1],[-width/2+1,0],[-width/2+1,depth/2-1],[width/2-1,-depth/2+1],[width/2-1,0],[width/2-1,depth/2-1],[-3,-depth/2+1],[2,-depth/2+1]];
   const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.17,2.1,7),new THREE.MeshStandardMaterial({color:'#665846',roughness:1}),positions.length);
   const leaves=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:'#345d44',roughness:1}),positions.length*3);
   const dummy=new THREE.Object3D();positions.forEach(([x,z],i)=>{dummy.position.set(x,1,z);dummy.scale.set(1,1,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);for(let j=0;j<3;j++){dummy.position.set(x+(j-1)*.3,2.2+j*.45,z+(j%2)*.2);dummy.scale.set(1.1-j*.18,1.25,1.1-j*.18);dummy.rotation.y=i;dummy.updateMatrix();leaves.setMatrixAt(i*3+j,dummy.matrix);}});trunks.castShadow=leaves.castShadow=!this.mobile;this.environment.add(trunks,leaves);
   box(width-.5,.45,.45,'#35523d',0,.18,-depth/2+.3);
  }
  this.scene.background.set(kind==='studio'?'#899b9f':'#738a8b');
 }
 screenshot(){this.renderer.render(this.scene,this.camera);return this.renderer.domElement.toDataURL('image/png');}
}
import {createPremiumFurniture} from './premium-furniture.js';
