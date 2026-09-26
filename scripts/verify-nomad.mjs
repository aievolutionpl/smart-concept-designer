import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const report=[];
for(const [id,depth] of [['nomad-sofa',.95],['nomad-chaise-left',1.4]]){
 const document=await io.read(`public/models/${id}.glb`);
 const bounds=getBounds(document.getRoot().listScenes()[0]);
 const dimensions=bounds.max.map((max,index)=>max-bounds.min[index]);
 for(const [index,expected] of [2,.67,depth].entries())assert.ok(Math.abs(dimensions[index]-expected)<.002,`${id}: axis ${index} is ${dimensions[index]}, expected ${expected}`);
 assert.ok(Math.abs(bounds.min[1])<.002,'Model should rest on ground');
 assert.equal(document.getRoot().listTextures().length,2,'Embedded upholstery textures');
 const primitives=document.getRoot().listMeshes().flatMap(mesh=>mesh.listPrimitives());
 assert.ok(primitives.length<=8,'Merged geometry should use at most eight draw calls');
 const source=await io.read(`../assets/nomad/${id==='nomad-sofa'?'Nomad_Sofa':'Nomad_Chaise_Left'}.glb`);
 const seats=source.getRoot().listNodes().filter(node=>node.getName().includes('seat cushion'));
 assert.equal(seats.length,3,'Three separately modeled seat modules');
 const seatHeights=seats.map(node=>getBounds(node).max[1]);
 for(const height of seatHeights)assert.ok(Math.abs(height-.35)<.001,'Seat top must be 350 mm');
 report.push({id,dimensions_m:dimensions,seat_heights_m:seatHeights,ground_y:bounds.min[1],primitives:primitives.length,textures:document.getRoot().listTextures().length});
}
await writeFile('test-results/nomad-geometry.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
