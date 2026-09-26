import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, prune, weld, meshopt, flatten, join } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { mkdir, stat, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
await mkdir('public/models',{recursive:true}); await mkdir('public/images',{recursive:true});
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const selected=new Set(process.argv.slice(2));
const report=selected.size?JSON.parse(await readFile('public/models/optimization.json','utf8').catch(()=>'[]')):[];
for(const [id,source,preview] of [['cube-plus','../assets/cube-plus/Cube_Plus.glb','../assets/cube-plus/Cube_Plus_hero.png'],['bench','../bench_demo/lawka_ogrodowa.glb','../bench_demo/lawka_render.png'],['nomad-sofa','../assets/nomad/Nomad_Sofa.glb','../assets/nomad/Nomad_Sofa.png'],['nomad-chaise-left','../assets/nomad/Nomad_Chaise_Left.glb','../assets/nomad/Nomad_Chaise_Left.png']]){
 if(selected.size&&!selected.has(id))continue;
 const doc=await io.read(source);
 await mkdir('.asset-cache',{recursive:true});
 for(const [i,texture] of doc.getRoot().listTextures().entries()){
  const input=path.resolve(`.asset-cache/${id}-${i}.png`),output=path.resolve(`.asset-cache/${id}-${i}.webp`);
  await writeFile(input,texture.getImage());
  execFileSync('python',['-X','utf8','scripts/optimize-image.py',input,output,'512']);
  texture.setImage(await readFile(output)).setMimeType('image/webp');
 }
 if(doc.getRoot().listTextures().length)doc.createExtension(EXTTextureWebP).setRequired(true);
 await doc.transform(dedup(),weld(),...(id.startsWith('nomad-')?[flatten(),join()]:[]),prune(),meshopt({encoder:MeshoptEncoder,level:'high'}));
 const dest=`public/models/${id}.glb`;await io.write(dest,doc);
 execFileSync('python',['-X','utf8','scripts/optimize-image.py',path.resolve(preview),path.resolve(`public/images/${id}.webp`),'640']);
 const entry={id,before:(await stat(source)).size,after:(await stat(dest)).size};
 const existing=report.findIndex(item=>item.id===id);if(existing>=0)report[existing]=entry;else report.push(entry);
}
await writeFile('public/models/optimization.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
