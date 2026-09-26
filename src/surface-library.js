import * as THREE from 'three/webgpu';
import {publicUrl} from './public-url.js';

export class SurfaceLibrary {
 constructor(){this.cache=new Map();this.loader=new THREE.TextureLoader();this.revision=0;this.originals=new WeakMap();}
 async material(asset){
  if(this.cache.has(asset.id))return this.cache.get(asset.id);
  const promise=(async()=>{
   const textures=await Promise.all(['color','normal','roughness'].map(key=>this.loader.loadAsync(publicUrl(asset.maps[key]))));
   textures.forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;});textures[0].colorSpace=THREE.SRGBColorSpace;
   const material=new THREE.MeshStandardMaterial({name:asset.name,map:textures[0],normalMap:textures[1],roughnessMap:textures[2],roughness:1});
   return material;
  })();this.cache.set(asset.id,promise);try{return await promise;}catch(e){this.cache.delete(asset.id);throw e;}
 }
 async apply(environment,selection,catalog){
  const revision=++this.revision;
  for(const [target,originalName] of [['patio','Square paving'],['deck','Composite decking']]){
   const asset=catalog.find(a=>a.id===selection?.[target]&&a.kind==='material'&&a.targets.includes(target));
   const material=asset?await this.material(asset):null;if(revision!==this.revision)return;
   environment.traverse(o=>{
    if(!o.isMesh)return;
    let layer=o.parent;while(layer&&layer!==environment&&layer.name!=='terrain')layer=layer.parent;
    if(layer?.name!=='terrain')return;
    if(!this.originals.has(o)&&o.material.name===originalName)this.originals.set(o,o.material);
    const original=this.originals.get(o);if(original?.name!==originalName)return;
    o.material=material||original;
    // Existing UVs are metres divided by the procedural material's tile size.
    if(material){const tile=original.userData.tile||1;let root=o;while(root.parent&&root.parent!==environment)root=root.parent;for(const t of [material.map,material.normalMap,material.roughnessMap])t.repeat.set(tile*root.scale.x/asset.dimensions.width,tile*root.scale.z/asset.dimensions.depth);}
   });
  }
 }
}
