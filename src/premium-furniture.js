import * as T from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const premiumAssets=[
 ['premium-lounger','Lezak Riviera','0,76 × 2,05 × 1,05 m','lounger'],
 ['premium-sectional','Naroznik wicker','2,9 × 2,2 × 0,88 m','sectional'],
 ['premium-table','Stol ze szklanym blatem','1,5 × 0,85 × 0,7 m','sectional'],
 ['premium-stool','Pufa wicker','0,48 × 0,48 × 0,46 m','sectional'],
 ['premium-tub','Balia timber & steel','Ø 1,9 m; wysokosc 1,05 m','tub']
].map(([id,name,dimensions,photo])=>({id,name,dimensions:dimensions+' (szacunkowo)',category:'Meble ogrodowe premium wellness',type:'PREMIUM · ZE ZDJECIA',procedural:true,image:'/images/premium-'+photo+'.png'}));

function texture(kind){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
 x.fillStyle=kind==='wood'?'#ad8252':kind==='fabric'?'#ded8ca':'#746f65';x.fillRect(0,0,256,256);
 for(let i=0;i<256;i++){
  x.strokeStyle=`rgba(${kind==='wood'?'55,30,12':'30,28,25'},${.05+(i%7)*.014})`;x.beginPath();
  if(kind==='wood'){x.moveTo(i,0);x.bezierCurveTo(i+7,70,i-7,190,i,256);}else{x.moveTo(0,i);x.lineTo(256,i);}x.stroke();
 }
 if(kind==='wicker')for(let y=0;y<256;y+=8)for(let a=0;a<256;a+=16){x.fillStyle=(a/16+y/8)%2?'#a39e92':'#868074';x.fillRect(a+(y%16?8:0),y,13,5);x.fillStyle='#bbb5a7';x.fillRect(a+(y%16?8:0),y,13,1);}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='wood'?2:3,kind==='wood'?1:3);return t;
}
export function createPremiumFurniture(id){
 const g=new T.Group();g.name=id;
 const wicker=new T.MeshStandardMaterial({name:'Woven warm grey wicker',map:texture('wicker'),roughness:.88});
 const fabric=new T.MeshStandardMaterial({name:'Ivory outdoor linen',map:texture('fabric'),roughness:1});
 const wood=new T.MeshStandardMaterial({name:'Vertical cedar grain',map:texture('wood'),roughness:.65});
 const steel=new T.MeshStandardMaterial({name:'Brushed stainless steel',color:'#b5bcb9',metalness:.85,roughness:.28});
 const black=new T.MeshStandardMaterial({color:'#252723',roughness:.65});
 function mesh(geo,mat,x,y,z){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
 const box=(w,h,d,x,y,z,m,r=.025)=>mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,h/3)),m,x,y,z);
 if(id==='premium-sectional'){
  for(const [x,z,side] of [[-.97,0,0],[0,0,0],[.97,0,0],[-.97,.78,1],[-.97,1.42,1]]){
   box(.94,.3,.78,x,.24,z,wicker);box(.91,.13,.73,x,.455,z,fabric,.055);
   const b=box(side?.14:.94,.48,side?.78:.14,x-(side?.4:0),.62,z-(side?0:.34),wicker);
   const p=box(side?.17:.85,.4,side?.65:.17,x-(side?.29:0),.69,z-(side?0:.24),fabric,.065);p.rotation.x=side?0:-.12;p.rotation.z=side?.12:0;
  }
  box(.14,.58,.8,1.43,.39,0,wicker);box(.94,.58,.14,-.97,.39,1.83,wicker);
 }else if(id==='premium-table'){
  box(1.5,.08,.85,0,.67,0,wicker);box(1.38,.012,.73,0,.716,0,new T.MeshPhysicalMaterial({name:'Smoked glass',color:'#343d39',metalness:.35,roughness:.09,clearcoat:1}));
  for(const x of [-.64,.64])for(const z of [-.32,.32])box(.075,.63,.075,x,.315,z,wicker);
 }else if(id==='premium-stool'){box(.48,.34,.48,0,.19,0,wicker);box(.49,.11,.49,0,.415,0,fabric,.045);
 }else if(id==='premium-lounger'){
  for(const x of [-.32,.32]){
   const shape=new T.Shape();shape.moveTo(-1,.09);shape.quadraticCurveTo(-.4,.47,.25,.36);shape.lineTo(.94,.3);shape.lineTo(.94,.19);shape.quadraticCurveTo(-.3,.35,-1,.02);
   const side=mesh(new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false,curveSegments:16}),wicker,x,.02,0);side.rotation.y=-Math.PI/2;
  }
  const seat=box(.71,.1,1.25,0,.405,.36,fabric,.04);seat.rotation.x=.1;
  const back=box(.73,.065,.88,0,.65,-.59,wicker);back.rotation.x=-.72;
  const cushion=box(.71,.09,.87,0,.71,-.56,fabric,.04);cushion.rotation.x=-.72;
  const pillow=box(.48,.13,.25,0,.96,-.75,fabric,.06);pillow.rotation.x=-.72;
  for(const x of [-.37,.37]){const wheel=mesh(new T.TorusGeometry(.12,.028,8,20),black,x,.145,-.78);wheel.rotation.y=Math.PI/2;for(let j=0;j<5;j++){const spoke=box(.022,.22,.022,x,.145,-.78,black,.005);spoke.rotation.x=j*Math.PI/5;}}
 }else if(id==='premium-tub'){
  const points=[[0,.12],[.82,.12],[.85,.18],[.87,.97],[.95,1.02],[.96,.98],[.96,.07]].map(([r,y])=>new T.Vector2(r,y));mesh(new T.LatheGeometry(points,64),steel,0,0,0);
  for(let i=0;i<64;i++){const a=i*Math.PI/32;const s=box(.092,.91,.045,Math.sin(a)*.935,.52,Math.cos(a)*.935,wood,.007);s.rotation.y=a;}
  for(const y of [.17,.84])mesh(new T.CylinderGeometry(.966,.966,.055,64,1,true),steel,0,y,0);
  mesh(new T.CylinderGeometry(.848,.848,.009,64),new T.MeshPhysicalMaterial({name:'Plunge water',color:'#547f79',metalness:.25,roughness:.12,transparent:true,opacity:.78,clearcoat:1}),0,.77,0);
  for(const [z,y] of [[1.05,.48],[1.43,.24]]){box(.78,.055,.4,0,y,z,wood);for(const x of [-.34,.34])box(.055,y,.35,x,y/2,z,wood);}
 }
 // Bake static parts by material to keep the editor's draw-call budget small.
 g.updateMatrixWorld(true);const batches=new Map();
 for(const child of g.children){const geo=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();geo.applyMatrix4(child.matrixWorld);if(!batches.has(child.material))batches.set(child.material,[]);batches.get(child.material).push(geo);}
 g.clear();for(const [material,geometries] of batches){const m=new T.Mesh(mergeGeometries(geometries),material);m.castShadow=m.receiveShadow=true;g.add(m);for(const geo of geometries)geo.dispose();}
 return g;
}
