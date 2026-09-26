import {readFile,stat} from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {getBounds} from '@gltf-transform/functions';
import sharp from 'sharp';
import assert from 'node:assert/strict';
const catalog=JSON.parse(await readFile('public/assets.json','utf8')).assets;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),ids=new Set();
for(const asset of catalog){
 assert(!ids.has(asset.id));ids.add(asset.id);assert.equal(asset.license,'CC0-1.0');assert(asset.source.url.startsWith('https://'));
 await stat('public'+asset.preview);
 if(asset.kind==='model'){
  const data=await readFile('public'+asset.path);assert.equal(data.length,asset.bytes);assert(data.length<8*1024*1024);
  const json=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());assert(!json.images?.some(i=>i.uri));assert(!json.buffers?.some(i=>i.uri));
  const doc=await io.read('public'+asset.path),bounds=getBounds(doc.getRoot().listScenes()[0]);
  const dims=bounds.max.map((v,i)=>v-bounds.min[i]);for(const [i,key] of ['width','height','depth'].entries())assert(Math.abs(dims[i]-asset.dimensions[key])<.001);
  const expected=asset.scale.providerDimensionsMm.map(v=>v/1000).sort((a,b)=>a-b),measured=[...dims].sort((a,b)=>a-b);expected.forEach((v,i)=>assert(Math.abs(v-measured[i])<.005,'Scale differs from provider metadata'));
  let triangles=0;for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives())triangles+=(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3;
  assert.equal(triangles,asset.triangles);assert(triangles<=10000);
  for(const t of doc.getRoot().listTextures()){const meta=await sharp(t.getImage()).metadata();assert(meta.width<=2048&&meta.height<=2048);}
 }else{
  let bytes=0;for(const file of Object.values(asset.maps)){bytes+=(await stat('public'+file)).size;const meta=await sharp('public'+file).metadata();assert(meta.width<=2048&&meta.height<=2048);}assert.equal(bytes,asset.bytes);assert(asset.dimensions.width>0&&asset.dimensions.depth>0);
 }
}
console.log(JSON.stringify({status:'PASS',assets:catalog.length,models:catalog.filter(a=>a.kind==='model').length,materials:catalog.filter(a=>a.kind==='material').length,totalBytes:catalog.reduce((n,a)=>n+a.bytes,0)}));
