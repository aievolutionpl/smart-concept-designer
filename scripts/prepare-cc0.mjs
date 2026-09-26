import {mkdir,readFile,writeFile,stat,readdir} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,prune,weld,simplify,flatten,getBounds} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';

const cache='.asset-cache/cc0',out='public/library';
await mkdir(cache,{recursive:true});await mkdir(out,{recursive:true});
const headers={'User-Agent':'SmartConceptDesigner/0.1 (local CC0 asset preparation)'};
async function download(url,file,expected){
 let data;try{data=await readFile(file);}catch{}
 if(!data){await new Promise(r=>setTimeout(r,350));const response=await fetch(url,{headers,signal:AbortSignal.timeout(90000)});if(!response.ok)throw Error(`${response.status}: ${url}`);data=Buffer.from(await response.arrayBuffer());if(data.length>80*1024*1024)throw Error('Download exceeds budget');await mkdir(path.dirname(file),{recursive:true});await writeFile(file,data);}
 if(expected&&createHash('md5').update(data).digest('hex')!==expected)throw Error(`Checksum mismatch: ${file}`);
 return data;
}
async function json(url,file){return JSON.parse((await download(url,`${cache}/${file}.json`)).toString());}
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);await MeshoptSimplifier.ready;
const catalog=[];
function triangles(doc){return doc.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0),0);}
for(const [id,name,category,vegetation] of [['fern_02','Paprocie leśne','Rośliny',true],['planter_pot_clay','Donica gliniana','Donice',false],['rock_07','Kamień naturalny','Kamienie',false]]){
 const info=await json(`https://api.polyhaven.com/info/${id}`,`${id}-info`),files=await json(`https://api.polyhaven.com/files/${id}`,`${id}-files`);
 const file=files.gltf?.['1k']?.gltf;if(!file)throw Error(`No 1K glTF for ${id}`);
 const folder=`${cache}/${id}`;await download(file.url,`${folder}/source.gltf`,file.md5);
 for(const [relative,entry] of Object.entries(file.include)){if(relative.includes('..')||path.isAbsolute(relative))throw Error('Unsafe dependency path');await download(entry.url,`${folder}/${relative}`,entry.md5);}
 const doc=await io.read(`${folder}/source.gltf`),before=triangles(doc);
 await doc.transform(flatten(),dedup(),weld());
 if(before>10000)await doc.transform(simplify({simplifier:MeshoptSimplifier,ratio:10000/before,error:.002}));
 await doc.transform(prune());
 const textureInfo=[];
 for(const texture of doc.getRoot().listTextures()){
  const bytes=texture.getImage(),meta=await sharp(bytes).metadata();if(meta.width>2048||meta.height>2048)throw Error('Texture exceeds 2K budget');textureInfo.push({width:meta.width,height:meta.height,bytes:bytes.length});
 }
 const bounds=getBounds(doc.getRoot().listScenes()[0]),dimensions=bounds.max.map((v,i)=>+(v-bounds.min[i]).toFixed(3));
 const dest=`${out}/${id}.glb`;await io.write(dest,doc);
 const preview=`${out}/${id}.png`;await download(info.thumbnail_url,preview);
 const bytes=(await stat(dest)).size;if(bytes>8*1024*1024)throw Error(`${id} exceeds 8 MB`);
 catalog.push({id:`ph-${id}`,name,kind:'model',category,path:`/library/${id}.glb`,preview:`/library/${id}.png`,dimensions:{width:dimensions[0],height:dimensions[1],depth:dimensions[2],unit:'m'},source:{provider:'Poly Haven',id,url:`https://polyhaven.com/a/${id}`,authors:info.authors},license:'CC0-1.0',licenseUrl:'https://polyhaven.com/license',triangles:triangles(doc),originalTriangles:before,bytes,materials:doc.getRoot().listMaterials().length,textures:textureInfo,vegetation,scale:{status:'source-metric',note:'glTF metres; dimensions measured from geometry; not independently surveyed',providerDimensionsMm:info.dimensions},sha256:createHash('sha256').update(await readFile(dest)).digest('hex')});
 console.log(id,bytes,triangles(doc),dimensions);
}
const acg=await json('https://ambientcg.com/api/v2/full_json?id=PavingStones092,WoodFloor051&include=downloadData,dimensionsData&limit=2','ambient-materials-v2');
for(const asset of acg.foundAssets){
 const id=asset.assetId,entry=asset.downloadFolders.default.downloadFiletypeCategories.zip.downloads.find(d=>d.attribute==='1K-JPG');if(!entry)throw Error('Missing 1K material');
 const zip=`${cache}/${id}.zip`,folder=path.resolve(`${cache}/${id}`);await download(entry.downloadLink,zip);
 await mkdir(folder,{recursive:true});execFileSync('powershell',['-NoProfile','-Command',`Expand-Archive -LiteralPath '${path.resolve(zip)}' -DestinationPath '${folder}' -Force`]);
 const files=await readdir(folder),maps={};let bytes=0;
 for(const [slot,suffix] of [['color','Color'],['normal','NormalGL'],['roughness','Roughness']]){
  const file=files.find(f=>f.endsWith(`_${suffix}.jpg`));if(!file)throw Error(`Missing ${slot} for ${id}`);
  const dest=`${out}/${id}-${slot}.jpg`,data=await readFile(path.join(folder,file)),meta=await sharp(data).metadata();if(meta.width>2048||meta.height>2048)throw Error('Material exceeds 2K budget');await writeFile(dest,data);maps[slot]=`/library/${id}-${slot}.jpg`;bytes+=(await stat(dest)).size;
 }
 catalog.push({id:`acg-${id}`,name:id.startsWith('Paving')?'Kostka kamienna':'Deski drewniane',kind:'material',category:id.startsWith('Paving')?'Nawierzchnie':'Drewno',path:maps.color,preview:maps.color,maps,dimensions:{width:asset.dimensionX/100,depth:asset.dimensionY/100,unit:'m'},source:{provider:'ambientCG',id,url:asset.shortLink},license:'CC0-1.0',licenseUrl:'https://docs.ambientcg.com/license/',triangles:0,bytes,materials:1,resolution:1024,scale:{status:'provider',note:'Tile size from provider centimetres'},targets:id.startsWith('Paving')?['patio']:['deck']});
 console.log(id,bytes);
}
await writeFile('public/assets.json',JSON.stringify({version:1,generatedAt:new Date().toISOString(),assets:catalog},null,2));
console.log('CATALOG_READY',catalog.length);
