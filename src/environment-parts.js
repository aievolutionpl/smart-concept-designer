import * as T from 'three/webgpu';

export const ENVIRONMENT_PARTS={house:'Dom',room:'Domek ogrodowy',tank:'Zbiornik z oslona',patio:'Taras',deck:'Podest',lawn:'Trawnik',bed:'Rabata',driveway:'Podjazd',boundary:'Ogrodzenie',planting:'Niskie nasadzenia',car:'Samochod',lights:'Oswietlenie'};
export function cleanEnvironmentEdits(value){
 const result={};
 if(!value||typeof value!=='object'||Array.isArray(value))return result;
 for(const id of Object.keys(ENVIRONMENT_PARTS)){
  const v=value[id];if(!v||typeof v!=='object')continue;
  const number=(key,fallback,min,max)=>Number.isFinite(v[key])?Math.min(max,Math.max(min,v[key])):fallback;
  result[id]={x:number('x',0,-100,100),z:number('z',0,-100,100),rotation:number('rotation',0,-360,360),scale:number('scale',1,.25,3),visible:v.visible!==false};
 }
 return result;
}

// Keep semantic ownership before the geometry is merged for rendering.
export function prepareEnvironmentParts(root,layers){
 const parts=new Map();
 function group(id,parent,objects){
  if(!objects.length)return;
  root.updateMatrixWorld(true);
  const box=new T.Box3();for(const o of objects)box.expandByObject(o);
  const center=box.isEmpty()?new T.Vector3():box.getCenter(new T.Vector3());center.y=0;
  const g=new T.Group();g.name=ENVIRONMENT_PARTS[id];g.position.copy(parent.worldToLocal(center));parent.add(g);root.updateMatrixWorld(true);
  for(const o of objects)g.attach(o);
  g.userData.environmentId=id;g.userData.basePosition=g.position.toArray();parts.set(id,g);
 }
 const room=layers.buildings.children.find(o=>o.name==='Relocated garden room');
 group('room',layers.buildings,[room,...layers.details.children.filter(o=>o.name==='Room doorstep')].filter(Boolean));
 group('house',layers.buildings,layers.buildings.children.filter(o=>o!==parts.get('room')));
 const tank=layers.details.children.filter(o=>/Oil tank|Tank screen|Angled tank/.test(o.name));
 tank.push(...layers.terrain.children.filter(o=>o.name==='Relocated tank pad'));
 group('tank',layers.details,tank);
 const car=layers.details.children.find(o=>o.isGroup&&!o.userData.environmentId);if(car)group('car',layers.details,[car]);
 const slabs={'L-shaped terrace':'patio','Garden room deck':'deck','Lawn':'lawn','Rear planting bed':'bed','Front driveway':'driveway'};
 for(const o of [...layers.terrain.children])if(slabs[o.name])group(slabs[o.name],layers.terrain,[o]);
 group('boundary',layers.boundary,[...layers.boundary.children]);
 group('planting',layers.planting,[...layers.planting.children]);
 group('lights',layers.details,layers.details.children.filter(o=>!o.userData.environmentId));
 return parts;
}

export function applyEnvironmentEdits(customer,edits={}){
 if(!customer?.parts)return;
 const sx=customer.root.scale.x,sz=customer.root.scale.z;
 for(const [id,o] of customer.parts){const v=edits[id]||{};o.position.fromArray(o.userData.basePosition);o.position.x+=(v.x||0)/sx;o.position.z+=(v.z||0)/sz;o.rotation.y=T.MathUtils.degToRad(v.rotation||0);o.scale.setScalar(v.scale??1);o.visible=v.visible!==false;}
 customer.root.updateMatrixWorld(true);
}
