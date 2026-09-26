import * as THREE from 'three/webgpu';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {prepareEnvironmentParts} from './environment-parts.js';

export const CUSTOMER={width:15,depth:25,focus:[-.6,0,-3.2],
 buildings:[[-5.65,1.9,6.2,6.55],[3.15,6.5,6.2,12.25],[2.7,-10.45,5.9,-5.7]],
 lawn:[[-2.8,-7.6],[1.95,-8.25],[1.95,-5.4],[2.95,-5.4],[2.95,-.55],[-2.8,-.55]],
 patio:[[-5.9,-4.15],[-2.8,-4.15],[-2.8,-.55],[3.3,-.55],[3.3,1.88],[-5.9,1.88]],
 deck:[[2,-9.3],[2.7,-9.3],[2.7,-5.7],[6.5,-5.7],[6.5,1.88],[3.3,1.88],[3.3,-5.4],[2,-5.4]],
 tank:[[-4.7,-7.2],[-3.4,-8.55],[-2.85,-8.2],[-2.85,-6.5]],
 planting:[[-5.9,-4.15],[-4.8,-7.7],[-2,-9.9],[2.8,-11.1],[6.45,-11.35],[6.45,-9.15],[2.9,-8.27],[-2.8,-7.6],[-2.8,-4.15]],
 labels:[['Dom',0,4.3],['Taras',-3.8,.8],['Trawnik',.2,-4],['Domek',4.3,-8.075],['Zbiornik',-3.55,-7.4],['Podjazd',.2,10.2]]};

export function insidePolygon(x,z,polygon){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
 const a=polygon[i],b=polygon[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
}return inside;}
const boundaryCurve=new THREE.CatmullRomCurve3([[6.7,-11.8],[2.8,-11.55],[-1.8,-10.3],[-4.8,-7.65],[-6.6,-3.7],[-7.9,1.8],[-7.3,6.8],[-4.45,10.9],[.3,12.8],[6.7,13.2]].map(([x,z])=>new THREE.Vector3(x,0,z)));
export const CUSTOMER_BOUNDARY=boundaryCurve.getPoints(70).map(p=>[p.x,p.z]);
export function customerSurface(x,z){
 if(insidePolygon(x,z,CUSTOMER.deck))return .11;
 if(insidePolygon(x,z,CUSTOMER.patio))return .035;
 return 0;
}
export function customerPlaceable(x,z,halfX=0,halfZ=0){
 const corners=[[x-halfX,z-halfZ],[x+halfX,z-halfZ],[x+halfX,z+halfZ],[x-halfX,z+halfZ]];
 if(corners.some(([a,b])=>!insidePolygon(a,b,CUSTOMER_BOUNDARY)))return false;
 if(corners.some(([a,b])=>insidePolygon(a,b,CUSTOMER.tank)))return false;
 if(CUSTOMER.tank.some(([a,b])=>a>=x-halfX&&a<=x+halfX&&b>=z-halfZ&&b<=z+halfZ))return false;
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 for(let i=0;i<4;i++)for(let j=0;j<CUSTOMER.tank.length;j++){
  const a=corners[i],b=corners[(i+1)%4],c=CUSTOMER.tank[j],d=CUSTOMER.tank[(j+1)%CUSTOMER.tank.length];
  if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return false;
 }
 return !CUSTOMER.buildings.some(([x1,z1,x2,z2])=>x+halfX>x1&&x-halfX<x2&&z+halfZ>z1&&z-halfZ<z2);
}
function seeded(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}

function texture(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const ctx=canvas.getContext('2d'),rand=seeded(kind.length*923+41);
 if(kind==='stone'){
  ctx.fillStyle='#a09d90';ctx.fillRect(0,0,512,512);
  const palette=['#a29b86','#898e85','#b3a08a','#987d6b','#bbb09c','#837e6d','#afb0a2'];
  let row=0,y=0;while(y<512){const height=42+rand()*39;let x=row%2?-42:0;while(x<512){const width=39+rand()*65;
   ctx.fillStyle=palette[Math.floor(rand()*palette.length)];ctx.beginPath();ctx.moveTo(x+3,y+5);ctx.lineTo(x+width*.48,y+2);ctx.lineTo(x+width-5,y+4);ctx.lineTo(x+width-2,y+height*.55);ctx.lineTo(x+width-5,y+height-3);ctx.lineTo(x+width*.4,y+height-1);ctx.lineTo(x+2,y+height-5);ctx.lineTo(x+4,y+height*.5);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#605e5138';ctx.lineWidth=1.5;ctx.stroke();
   for(let grain=0;grain<55;grain++){ctx.fillStyle=rand()>.5?'#ffffff15':'#302c221b';ctx.fillRect(x+4+rand()*(width-8),y+4+rand()*(height-8),2+rand()*4,1+rand()*2);}
   x+=width;
  }y+=height;row++;}
 }else if(kind==='slate'){
  ctx.fillStyle='#2d363c';ctx.fillRect(0,0,512,512);
  for(let row=0;row<16;row++)for(let col=-1;col<9;col++){const x=col*64+(row%2)*32,y=row*32,light=14+rand()*7;
   ctx.fillStyle=`hsl(210 9% ${light}%)`;ctx.fillRect(x+1,y+1,62,30);ctx.fillStyle='#121b214d';ctx.fillRect(x+1,y+29,62,2);
  }
 }else if(kind==='paving'){
  ctx.fillStyle='#d2d0c6';ctx.fillRect(0,0,512,512);
  for(let y=0;y<4;y++)for(let x=0;x<4;x++){const light=71+rand()*8;ctx.fillStyle=`hsl(47 8% ${light}%)`;ctx.fillRect(x*128+1,y*128+1,126,126);}
 }else if(kind==='grass'){
  ctx.fillStyle='#456037';ctx.fillRect(0,0,512,512);
  for(let i=0;i<54000;i++){const x=rand()*512,y=rand()*512,l=22+rand()*13;ctx.strokeStyle=`hsl(${95+rand()*20} ${24+rand()*12}% ${l}%)`;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rand()*2,y-2-rand()*5);ctx.stroke();}
 }else{
  ctx.fillStyle=kind==='deck'?'#a5a89c':'#8c8067';ctx.fillRect(0,0,512,512);
  for(let i=0;i<1900;i++){ctx.strokeStyle=`rgba(45,40,30,${rand()*.12})`;const x=rand()*512,y=rand()*512;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rand()*4,y+40+rand()*200);ctx.stroke();}
  for(let i=0;i<8;i++){ctx.fillStyle='#4b4d463b';ctx.fillRect(i*64,0,2,512);}
 }
 if(kind!=='grass')for(let i=0;i<26000;i++){ctx.fillStyle=rand()>.5?'#ffffff0c':'#0000000c';ctx.fillRect(rand()*512,rand()*512,1,1);}
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
 return map;
}

export function buildCustomerGarden({mobile=false,scaleX=1,scaleZ=1}={}){
 const root=new THREE.Group();root.name='Customer Garden';
 const layers={};for(const name of ['terrain','buildings','planting','boundary','details']){layers[name]=new THREE.Group();layers[name].name=name;root.add(layers[name]);}
 const rand=seeded(91427);
 const mat=(name,color,roughness=1,map=null,tile=1)=>{const m=new THREE.MeshStandardMaterial({name,color,roughness,map});m.userData.tile=tile;return m;};
 const stone=mat('Granite walls','#ffffff',.92,texture('stone'),2.2),slate=mat('Slate roof','#ffffff',.92,texture('slate'),1.4);
 const paving=mat('Square paving','#ffffff',.94,texture('paving'),1.2),timber=mat('Weathered timber','#ffffff',.95,texture('timber'),1.6);
 const grass=mat('Lawn','#ffffff',1,texture('grass'),2.5),deck=mat('Composite decking','#ffffff',.88,texture('deck'),.7);
 const white=mat('White joinery','#e3e6df',.58),siding=mat('Grey garden room','#9fa9ad',.85),dark=mat('Anthracite trim','#283331',.6);
 const brick=mat('Brick surrounds','#94715d',.95),gravel=mat('Gravel driveway','#b8b8a8',1),soil=mat('Planted soil','#474535',1);
 const glass=new THREE.MeshStandardMaterial({name:'Window glass',color:'#334d52',roughness:.23,metalness:.45});
 const lightMat=new THREE.MeshStandardMaterial({name:'Warm garden lights',color:'#ffe0a5',emissive:'#ffd08c',emissiveIntensity:1.4});
 const materialSet=new Set([stone,slate,paving,timber,grass,deck,white,siding,dark,brick,gravel,soil,glass,lightMat]);
 function uvScale(geometry,material){if(!material.map)return;const pos=geometry.getAttribute('position'),norm=geometry.getAttribute('normal'),uv=geometry.getAttribute('uv');if(!uv)return;const period=material.userData.tile;
  for(let i=0;i<pos.count;i++){const nx=Math.abs(norm.getX(i)),ny=Math.abs(norm.getY(i));if(ny>.7)uv.setXY(i,pos.getX(i)/period,pos.getZ(i)/period);else if(nx>.7)uv.setXY(i,pos.getZ(i)/period,pos.getY(i)/period);else uv.setXY(i,pos.getX(i)/period,pos.getY(i)/period);}
 }
 function mesh(geometry,material,position,layer='buildings',name=''){uvScale(geometry,material);const o=new THREE.Mesh(geometry,material);o.position.set(...position);o.castShadow=layer!=='terrain';o.receiveShadow=true;o.name=name;layers[layer].add(o);return o;}
 const box=(name,w,h,d,x,y,z,material,layer='buildings',radius=0)=>mesh(radius?new RoundedBoxGeometry(w,h,d,2,radius):new THREE.BoxGeometry(w,h,d),material,[x,y,z],layer,name);
 function cylinder(name,r1,r2,height,x,y,z,material,layer='details'){return mesh(new THREE.CylinderGeometry(r1,r2,height,12),material,[x,y,z],layer,name);}
 function slab(name,points,height,material){
  const shape=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z)));
  const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);
  return mesh(geometry,material,[0,height,0],'terrain',name);
 }
 box('Backdrop',180,.1,180,0,-.4,0,mat('Background ground','#242628'),'terrain');
 slab('Plot outline',CUSTOMER_BOUNDARY,-.06,gravel);
 slab('L-shaped terrace',CUSTOMER.patio,.035,paving);
 slab('Lawn',CUSTOMER.lawn,0,grass);
 slab('Garden room deck',CUSTOMER.deck,.11,deck);
 slab('Rear planting bed',CUSTOMER.planting,.006,soil);
 slab('Front driveway',[[-6.3,6.58],[3.1,6.58],[3.1,12.6],[.3,12.8],[-4.4,10.8]],.015,gravel);
 const edgePoints=CUSTOMER_BOUNDARY.map(([x,z])=>new THREE.Vector3(x,.03,z));edgePoints.push(edgePoints[0].clone());
 const boundaryLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(edgePoints),new THREE.LineBasicMaterial({color:'#b69b61'}));boundaryLine.name='Survey outline (estimated)';layers.boundary.add(boundaryLine);
 // The road follows the bowed boundary visible in the user's aerial sketch.
 const roadVertices=[],roadUV=[];
 for(let i=0;i<70;i++){for(const t of [i/70,(i+1)/70]){const p=boundaryCurve.getPoint(t),v=boundaryCurve.getTangent(t),n=new THREE.Vector3(-v.z,0,v.x);for(const offset of [.15,2.65]){roadVertices.push(p.x+n.x*offset,-.065,p.z+n.z*offset);roadUV.push(t*10,offset);}}}
 const roadGeometry=new THREE.BufferGeometry();roadGeometry.setAttribute('position',new THREE.Float32BufferAttribute(roadVertices,3));roadGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(roadUV,2));const roadIndices=[];
 for(let i=0;i<70;i++){const a=i*4;roadIndices.push(a,a+1,a+2,a+1,a+3,a+2);}roadGeometry.setIndex(roadIndices);roadGeometry.computeVertexNormals();
 mesh(roadGeometry,mat('La Rue d Olive','#a7aaa5'),[0,0,0],'terrain','Curving lane');
 // Garden-side boundary only; the driveway remains open to the lane.
 const fencePoints=boundaryCurve.getPoints(24).slice(0,15);
 for(let i=0;i<fencePoints.length-1;i++){
  const a=fencePoints[i],b=fencePoints[i+1],center=a.clone().add(b).multiplyScalar(.5),length=a.distanceTo(b),angle=-Math.atan2(b.z-a.z,b.x-a.x);
  box('Fence post',.12,1.8,.12,a.x,.85,a.z,timber,'boundary');
  for(let j=0;j<10;j++){const o=box('Fence board',length-.06,.145,.055,center.x,.13+j*.164,center.z,timber,'boundary');o.rotation.y=angle;}
 }
 for(let z=-11.5;z<2;z+=1.8){box('East fence post',.12,1.7,.12,6.65,.8,z,timber,'boundary');for(let j=0;j<10;j++)box('East fence slat',.055,.14,1.77,6.65,.12+j*.16,z+.85,timber,'boundary');}
 function house(name,x,z,w,d,eave,rise){
  if(name==='Original stone house'){
   const a=-.8,b=2.1,left=x-w/2,right=x+w/2;
   box('House back wall',w,eave,.22,x,eave/2,z+d/2-.11,stone);
   for(const edge of [left,right])box('House end wall',.22,eave,d,edge,eave/2,z,stone);
   box('Facade left pier',a-left,eave,.24,(a+left)/2,eave/2,z-d/2+.12,stone);
   box('Facade right pier',right-b,eave,.24,(right+b)/2,eave/2,z-d/2+.12,stone);
   box('Glazing lintel',b-a,.31,.24,(a+b)/2,eave-.155,z-d/2+.12,stone);
   box('Interior floor',w,.06,d,x,.025,z,mat('Interior oak','#a49377'));
   box('Interior rear lining',4.2,2.3,.06,.65,1.17,3.9,mat('Warm plaster','#d9d2c2'));
   box('Interior dining top',1.65,.08,.78,.65,.76,3.2,deck);
   for(const dx of [-.68,.68])for(const dz of [-.28,.28])box('Dining leg',.06,.7,.06,.65+dx,.37,3.2+dz,dark);
  }else box(name+' stone walls',w,eave,d,x,eave/2,z,stone);
  box(name+' plinth',w+.07,.12,d+.07,x,.06,z,stone);
  const slope=Math.hypot(d/2+.18,rise),angle=Math.atan2(rise,d/2+.18);
  for(const side of [-1,1]){const roof=box(name+' slate roof',w+.38,.09,slope,x,eave+rise/2,z+side*(d/4+.09),slate);roof.rotation.x=side*angle;
   box(name+' gutter',w+.43,.09,.09,x,eave-.015,z+side*(d/2+.19),dark);
  }
  for(const side of [-1,1]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([side*w/2,0,-d/2,side*w/2,0,d/2,side*w/2,rise,0],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,d/2.2,0,d/4.4,rise/2.2],2));g.computeVertexNormals();const material=stone.clone();material.side=THREE.DoubleSide;materialSet.add(material);mesh(g,material,[x,eave,z]);}
  box(name+' ridge',w+.45,.12,.15,x,eave+rise+.025,z,dark);
  return {x,z,w,d,eave,rise,angle};
 }
 const home=house('Original stone house',.275,4.225,11.85,4.65,2.63,1.63);
 // The return wing defines the L-shaped house footprint on the supplied plan.
 const wing=new THREE.Group();layers.buildings.add(wing);
 const previous=layers.buildings;layers.buildings=wing;
 house('House return wing',0,0,5.7,3.05,2.63,1.5);
 layers.buildings=previous;wing.rotation.y=Math.PI/2;wing.position.set(4.68,0,9.4);
 function windowFront(x,z,w,h,base=0,door=false){
  const y=base+h/2;
  box('Glass opening',w,h,.055,x,y,z,glass);
  for(const side of [-1,1])box('White jamb',.055,h+.11,.12,x+side*w/2,y,z-.02,white);
  for(const sy of [base,base+h])box('White lintel',w+.12,.065,.12,x,sy,z-.02,white);
  box('Window mullion',.037,h,.09,x,y,z-.07,white);
  if(!door)box('Window rail',w,.04,.1,x,base+h*.48,z-.075,white);
  for(const side of [-1,1])for(let row=0;row<Math.ceil(h/.14);row++)box('Brick jamb',.16,.12,.075,x+side*(w/2+.13),base+.07+row*.14,z+.005,brick);
  for(let j=0;j<Math.ceil(w/.13)+2;j++)box('Brick header',.11,.2,.08,x-w/2-.065+j*.13,base+h+.15,z+.008,brick);
 }
 windowFront(-4.15,1.865,1.08,2.08,.04,true);windowFront(-1.92,1.865,.86,1.27,.76);
 const clearGlass=new THREE.MeshStandardMaterial({name:'Architectural clear glazing',color:'#adc5c9',transparent:true,opacity:.23,roughness:.12,metalness:.12,depthWrite:false});materialSet.add(clearGlass);
 box('Panoramic glazing',2.9,2.25,.035,.65,1.185,1.875,clearGlass);
 for(let i=0;i<=4;i++)box('Panoramic white stile',.045,2.3,.12,-.8+i*.725,1.18,1.8,white);
 for(const y of [.06,2.32])box('Panoramic white rail',3,.065,.13,.65,y,1.8,white);
 for(const x of [.59,.71])box('Glazing door handle',.025,.22,.045,x,1.05,1.71,dark);
 box('Flush garden threshold',3.08,.055,.46,.65,.045,1.64,paving);
 windowFront(3.25,1.865,1.46,2.08,.04,true);windowFront(5.25,1.865,.57,1.2,.86);
 for(const x of [-3.8,-.6,2.6]){
  const y=home.eave+home.rise*.57,z=home.z-home.d*.215;
  const frame=box('Rooflight frame',.85,.08,.78,x,y+.08,z,dark);frame.rotation.x=-home.angle;
  const pane=box('Rooflight glass',.73,.09,.65,x,y+.12,z,glass);pane.rotation.x=-home.angle;
 }
 for(const x of [-5.62,6.17])box('Rainwater pipe',.07,2.65,.07,x,1.31,1.86,dark);
 box('Chimney',.62,1.25,.6,-3.9,4.24,4.55,stone);box('Chimney cap',.75,.12,.72,-3.9,4.91,4.55,dark);
 for(const x of [-4.07,-3.74])cylinder('Chimney pot',.12,.13,.35,x,5.13,4.55,brick,'buildings');
 const roomLayer=layers.buildings,room=new THREE.Group();room.name='Relocated garden room';room.position.set(-.6,0,-1.35);roomLayer.add(room);layers.buildings=room;
 // Grey clad garden room: glazed doors face the lawn, small window faces the house.
 box('Garden room east wall',.13,2.48,4.75,6.435,1.24,-6.725,siding);
 box('Garden room north wall',3.2,2.48,.13,4.9,1.24,-9.035,siding);
 box('Garden room south wall',3.2,2.48,.13,4.9,1.24,-4.415,siding);
 for(const [z,d] of [[-8.45,1.3],[-4.825,.95]])box('Garden room door pier',.13,2.48,d,3.365,1.24,z,siding);
 box('Garden room door header',.13,.26,2.5,3.365,2.35,-6.55,siding);
 box('Garden room floor',3.07,.09,4.62,4.9,.12,-6.725,deck);
 const seam=mat('Cladding shadow','#7b8688',.9);
 for(let row=0;row<15;row++){
  const y=.13+row*.159;
  box('Garden room front seam',3.22,.012,.015,4.9,y,-4.342,seam);
  for(const [z,d] of [[-8.45,1.3],[-4.825,.95]])box('Garden room west seam',.015,.012,d,3.293,y,z,seam);
 }
 box('Garden room roof',3.48,.105,4.99,4.9,2.51,-6.725,dark);
 box('Garden room front fascia',3.49,.14,.06,4.9,2.47,-4.21,white);
 box('Garden room sliding glass',.035,2.04,2.5,3.27,1.2,-6.55,clearGlass);
 for(const z of [-7.8,-6.967,-6.134,-5.3])box('Garden room sliding stile',.12,2.13,.045,3.235,1.2,z,white);
 for(const y of [.15,2.25])box('Garden room sliding track',.14,.06,2.62,3.235,y,-6.55,white);
 box('Garden room door handle',.06,.22,.025,3.15,1.12,-6.92,dark);
 box('Garden room interior wall',.04,2.25,4.45,6.3,1.24,-6.7,mat('Garden room interior','#d5d0c3'));
 box('Garden room desk',.65,.08,1.55,5.85,.82,-6.6,deck);
 for(const z of [-7.2,-6])box('Desk leg',.07,.7,.07,5.7,.44,z,dark);
 box('Side window glass',.86,.9,.07,4.85,1.4,-4.31,glass);
 for(const x of [4.39,5.31])box('Side jamb',.06,1.02,.12,x,1.4,-4.27,white);
 for(const y of [.9,1.9])box('Side rail',.98,.06,.12,4.85,y,-4.27,white);
 for(const z of [-9.1,-4.35])box('Garden room corner trim',.065,2.45,.065,3.255,1.24,z,white);
 box('Garden room west fascia',.075,.14,5,3.17,2.48,-6.725,white);
 layers.buildings=roomLayer;
 box('Garden room doorstep',.65,.12,2.8,2.42,.07,-7.9,deck,'details');
 // Polygonal screen follows marked area 2, entirely within the boundary.
 slab('Relocated tank pad',CUSTOMER.tank,.015,gravel);
 box('Oil tank',1.0,1.2,.85,-3.55,.65,-7.4,mat('Oil tank green','#344a3b',.7),'details',.2);
 cylinder('Oil tank fill cap',.1,.1,.06,-3.55,1.28,-7.4,dark);
 CUSTOMER.tank.forEach(([x,z],i)=>{
  const [bx,bz]=CUSTOMER.tank[(i+1)%CUSTOMER.tank.length],length=Math.hypot(bx-x,bz-z),angle=-Math.atan2(bz-z,bx-x);
  box('Tank screen post',.11,1.88,.11,x,.91,z,timber,'details');
  for(let row=0;row<12;row++){const board=box('Angled tank screen',length,.15,.07,(x+bx)/2,.1+row*.147,(z+bz)/2,timber,'details');board.rotation.y=angle;}
 });
 // Rounded white car gives scale and keeps the foreground driveway legible.
 const car=new THREE.Group();layers.details.add(car);
 const previousDetails=layers.details;layers.details=car;
 const carPaint=mat('Car warm white','#dcddd7',.32),rubber=mat('Tyres','#202623',.94);
 box('Car body',1.75,.53,3.8,0,.57,0,carPaint,'details',.2);
 box('Car cabin',1.53,.61,2.05,0,1.05,-.13,glass,'details',.24);
 box('Car roof',1.41,.065,1.25,0,1.34,-.05,carPaint,'details',.1);
 for(const x of [-.82,.82])for(const z of [-1.22,1.2]){const wheel=cylinder('Wheel',.31,.31,.19,x,.34,z,rubber);wheel.rotation.z=Math.PI/2;}
 layers.details=previousDetails;car.position.set(.35,0,9.75);car.rotation.y=-.28;car.scale.set(1/scaleX,1,1/scaleZ);
 const leaves=[],flowers=[];
 function leafCloud(center,radii,count,color){for(let i=0;i<count;i++){
  const u=rand()*2-1,t=rand()*Math.PI*2,r=Math.cbrt(rand()),s=Math.sqrt(1-u*u);
  leaves.push({position:[center[0]+Math.cos(t)*s*r*radii[0],center[1]+u*r*radii[1],center[2]+Math.sin(t)*s*r*radii[2]],scale:.075+rand()*.085,color});
 }}
 // Dense low shrubs, maximum foliage height about 65 cm; no trees.
 for(let z=-10.95;z<1.4;z+=.58)for(let x=-6.2;x<6.2;x+=.58){
  const inBed=insidePolygon(x,z,CUSTOMER.planting)||(x> -6.15&&x< -5.1&&z> -4.15&&z<1.4);
  if(!inBed||!insidePolygon(x,z,CUSTOMER_BOUNDARY)||!customerPlaceable(x,z,.42,.42)||insidePolygon(x,z,CUSTOMER.deck))continue;
  leafCloud([x+(rand()-.5)*.14,.28,z+(rand()-.5)*.14],[.4,.23,.38],mobile?70:140,rand()>.5?'#536d3e':'#71804b');
 }
 for(const [x,z] of [[-5.55,-3.75],[-5.55,-2.3],[-5.55,-.8],[-5.55,.75],[-2.5,-8.2],[-1.2,-8.45],[.4,-8.7],[1.75,-8.9]]){
  if(!customerPlaceable(x,z,.4,.4)||insidePolygon(x,z,CUSTOMER.deck))continue;
  leafCloud([x,.29,z],[.38,.32,.36],130,'#526d40');
  for(let head=0;head<5;head++){const hx=x+(rand()-.5)*.5,hz=z+(rand()-.5)*.5,hy=.42+rand()*.24;for(let petal=0;petal<16;petal++){const a=rand()*Math.PI*2,v=rand()*2-1;flowers.push([hx+Math.cos(a)*.13*Math.sqrt(1-v*v),hy+v*.1,hz+Math.sin(a)*.13*Math.sqrt(1-v*v)]);}}
 }
 const leafGeometry=new THREE.BufferGeometry();leafGeometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.33,.45,.07,0,1,0,.33,.45,.07,0,.48,.11],3));leafGeometry.setAttribute('uv',new THREE.Float32BufferAttribute([.5,0,0,.45,.5,1,1,.45,.5,.48],2));leafGeometry.setIndex([0,1,4,1,2,4,2,3,4,3,0,4]);leafGeometry.computeVertexNormals();
 const leafMat=new THREE.MeshStandardMaterial({name:'Individual leaves',color:'#ffffff',roughness:.95,side:THREE.DoubleSide});materialSet.add(leafMat);
 const foliage=new THREE.InstancedMesh(leafGeometry,leafMat,leaves.length),dummy=new THREE.Object3D();
 leaves.forEach((leaf,index)=>{dummy.position.set(...leaf.position);dummy.rotation.set(rand()*Math.PI,rand()*Math.PI*2,rand()*Math.PI);dummy.scale.setScalar(leaf.scale);dummy.updateMatrix();foliage.setMatrixAt(index,dummy.matrix);foliage.setColorAt(index,new THREE.Color(leaf.color).multiplyScalar(.82+rand()*.4));});foliage.name='Leaf canopy';foliage.castShadow=!mobile;foliage.receiveShadow=true;layers.planting.add(foliage);
 const flowerMat=mat('White hydrangea flowers','#e3e4cf',.95),blooms=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.05,0),flowerMat,flowers.length);materialSet.add(flowerMat);
 flowers.forEach((p,index)=>{dummy.position.set(...p);dummy.rotation.set(rand(),rand(),rand());dummy.scale.setScalar(.7+rand()*.6);dummy.updateMatrix();blooms.setMatrixAt(index,dummy.matrix);});blooms.name='Hydrangea blooms';blooms.receiveShadow=true;layers.planting.add(blooms);
 const grassBladeMat=mat('Ornamental grass','#8a9354');
 for(const [x,z] of [[-5.1,-3.5],[-5.15,-1.8],[-5.2,0],[-2,-8.2],[.4,-8.7],[2.6,-9.1]]){
  for(let i=0;i<20;i++){const angle=rand()*Math.PI*2,height=.3+rand()*.4,r=.14+rand()*.18;
   const points=[new THREE.Vector3(x,.015,z),new THREE.Vector3(x+Math.cos(angle)*r*.5,height*.6,z+Math.sin(angle)*r*.5),new THREE.Vector3(x+Math.cos(angle)*r,height,z+Math.sin(angle)*r)];
   mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),3,.011,3,false),grassBladeMat,[0,0,0],'planting','Grass blade');
  }
 }
 const lights=[];
 for(const [x,z] of [[-5.7,-3.6],[-5.7,-1.7],[-5.7,.6],[3.48,-3.8],[6.28,-1.6]]){
  box('Path light',.08,.48,.08,x,.24,z,dark,'details');box('Path light lens',.095,.06,.095,x,.425,z,lightMat,'details');
  const light=new THREE.PointLight('#ffd39a',0,3,2);light.position.set(x,.53,z);layers.details.add(light);lights.push(light);
 }
 for(const x of [-3,2.4,5.8]){box('Wall lamp',.14,.26,.12,x,1.94,1.77,dark);box('Wall lamp lens',.09,.17,.135,x,1.94,1.755,lightMat);const light=new THREE.PointLight('#ffd39a',0,4,2);light.position.set(x,1.8,1.55);layers.details.add(light);lights.push(light);}
 // Merge static architecture by material to keep the detailed scene inexpensive to draw.
 const parts=prepareEnvironmentParts(root,layers);
 for(const layer of [...Object.values(layers),...parts.values()]){
  layer.updateMatrixWorld(true);const buckets=new Map();
  layer.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;let owner=o.parent;while(owner&&owner!==layer){if(owner.userData.environmentId)return;owner=owner.parent;}const key=o.material;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);});
  for(const [material,objects] of buckets){if(objects.length<2)continue;const geometries=objects.map(o=>{const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());g.applyMatrix4(new THREE.Matrix4().copy(layer.matrixWorld).invert().multiply(o.matrixWorld));for(const name of Object.keys(g.attributes))if(!['position','normal','uv'].includes(name))g.deleteAttribute(name);if(!g.getAttribute('uv'))g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.getAttribute('position').count*2),2));return g;});
   const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!merged)continue;
   const combined=new THREE.Mesh(merged,material);combined.name=material.name;combined.castShadow=layer!==layers.terrain;combined.receiveShadow=true;
   for(const obj of objects){obj.removeFromParent();obj.geometry.dispose();}layer.add(combined);
  }
 }
 root.userData.source='Reconstructed from user photos and marked sketch; dimensions estimated';
 return {root,layers,parts,lights,lightMaterial:lightMat};
}
