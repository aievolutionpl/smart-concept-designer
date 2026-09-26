import * as THREE from 'three/webgpu';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createFurniture(id){
 const group=new THREE.Group();group.name=id;
 const wood=new THREE.MeshStandardMaterial({name:'Teak',color:'#a69268',roughness:.8});
 const metal=new THREE.MeshStandardMaterial({name:'Powder coated frame',color:'#303d39',roughness:.63});
 const fabric=new THREE.MeshStandardMaterial({name:'Outdoor upholstery',color:'#c6cbb9',roughness:.94});
 function box(w,h,d,x,y,z,mat,radius=0){const o=new THREE.Mesh(radius?new RoundedBoxGeometry(w,h,d,3,radius):new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;group.add(o);return o;}
 function cylinder(r1,r2,h,x,y,z,mat){const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,32),mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;group.add(o);return o;}
 if(id==='dining-table'){
  cylinder(.58,.58,.045,0,.735,0,wood);cylinder(.055,.075,.66,0,.35,0,metal);
  for(const angle of [0,Math.PI/2]){const base=box(.83,.04,.065,0,.04,0,metal,.018);base.rotation.y=angle;}
  for(let i=-5;i<=5;i++){const x=i*.093,length=2*Math.sqrt(Math.max(0,.56**2-x*x));box(.006,.002,length,x,.759,0,metal);}
 }else if(id==='garden-chair'){
  box(.48,.08,.46,0,.46,0,fabric,.035);const back=box(.48,.43,.065,0,.70,-.21,fabric,.025);back.rotation.x=-.10;
  for(const x of [-.225,.225])for(const z of [-.19,.19])box(.027,.43,.027,x,.235,z,metal,.01);
  for(const x of [-.27,.27]){box(.035,.05,.46,x,.66,0,wood,.012);box(.025,.21,.025,x,.55,.17,metal);}
 }else if(id==='coffee-table'){
  box(.92,.06,.58,0,.37,0,wood,.035);for(const x of [-.35,.35])for(const z of [-.19,.19])box(.035,.34,.035,x,.17,z,metal,.009);
 }else if(id==='planter'){
  const ceramic=new THREE.MeshStandardMaterial({name:'Terracotta',color:'#916650',roughness:.95});cylinder(.25,.19,.44,0,.22,0,ceramic);
  cylinder(.23,.23,.015,0,.445,0,new THREE.MeshStandardMaterial({color:'#413e31',roughness:1}));
  const leaf=new THREE.MeshStandardMaterial({name:'Herb foliage',color:'#62783e',roughness:1});
  for(let i=0;i<18;i++){const a=i*2.4,o=new THREE.Mesh(new THREE.IcosahedronGeometry(.12,1),leaf);o.position.set(Math.cos(a)*.16,.49+(i%4)*.075,Math.sin(a)*.16);o.scale.set(.8,1.5,.8);group.add(o);}
 }
 return group;
}
