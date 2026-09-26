import * as THREE from 'three/webgpu';

export class VegetationBatches {
 constructor(scene,items){this.scene=scene;this.items=items;this.batches=new Map();this.matrix=new THREE.Matrix4();}
 register(asset,template){
  if(this.batches.has(asset.id))return;
  template.updateMatrixWorld(true);const parts=[];
  template.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const batch=new THREE.InstancedMesh(mesh.geometry,mesh.material,60);
   batch.name=`Vegetation:${asset.id}`;batch.count=0;batch.castShadow=true;batch.receiveShadow=true;batch.frustumCulled=false;
   batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.scene.add(batch);
   parts.push({mesh:batch,local:mesh.matrixWorld.clone()});
  });
  this.batches.set(asset.id,parts);
 }
 sync(){
  for(const [assetId,parts] of this.batches){
   const objects=[...this.items.values()].filter(o=>o.userData.vegetationAsset===assetId);
   objects.forEach(o=>o.updateMatrixWorld(true));
   for(const part of parts){part.mesh.count=objects.length;objects.forEach((o,i)=>part.mesh.setMatrixAt(i,this.matrix.multiplyMatrices(o.matrixWorld,part.local)));part.mesh.instanceMatrix.needsUpdate=true;}
  }
 }
 stats(){return {batches:[...this.batches.values()].reduce((n,p)=>n+p.length,0),instances:[...this.items.values()].filter(o=>o.userData.vegetationAsset).length};}
}
