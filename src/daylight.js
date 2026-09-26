import * as THREE from 'three/webgpu';
import {SkyMesh} from 'three/addons/objects/SkyMesh.js';
import {vec4} from 'three/tsl';

export const defaultWeather={clouds:25,direction:0,lamps:'auto',lampPower:1,quality:'balanced'};
export const clockLabel=value=>`${String(Math.floor(value)).padStart(2,'0')}:${String(Math.round(value%1*60)).padStart(2,'0')}`;
export function cleanWeather(value={}){
 const clamp=(v,a,b,d)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):d;
 return {clouds:clamp(value.clouds,0,100,25),direction:clamp(value.direction,0,360,0),lamps:['auto','on','off'].includes(value.lamps)?value.lamps:'auto',lampPower:clamp(value.lampPower,0,2,1),quality:['eco','balanced','high'].includes(value.quality)?value.quality:'balanced'};
}
export class Daylight {
 constructor(engine){this.engine=engine;this.sky=new SkyMesh();this.sky.name='Atmosphere';this.sky.scale.setScalar(250);this.sky.material.colorNode=vec4(this.sky.material.colorNode.rgb.mul(.28),1);this.sky.material.depthWrite=false;this.sky.material.fog=false;this.sky.cloudSpeed.value=0;engine.scene.add(this.sky);}
 update(hour,options={}){
  const e=this.engine,w=cleanWeather(options),cloud=w.clouds/100;
  // Illustrative 06:00-20:00 solar path; not a geolocated shadow survey.
  const phase=(hour-6)/14*Math.PI,elevation=Math.sin(phase),angle=w.direction*Math.PI/180;
  const vector=new THREE.Vector3(Math.cos(phase),elevation*.95,Math.sin(phase)*.25).normalize().applyAxisAngle(new THREE.Vector3(0,1,0),angle);
  e.sun.position.copy(vector).multiplyScalar(32);
  const daylight=THREE.MathUtils.smoothstep(elevation,-.12,.25),golden=1-THREE.MathUtils.smoothstep(elevation,.03,.5);
  e.sun.color.set('#fff3dc').lerp(new THREE.Color('#ffae66'),golden);
  e.sun.intensity=Math.max(0,elevation)*3.6*(1-cloud*.86);
  e.ambient.color.set('#c5def7').lerp(new THREE.Color('#d0d6df'),cloud);e.ambient.groundColor.set('#666d57');
  e.ambient.intensity=.035+daylight*(.7+cloud*.6);e.scene.environmentIntensity=.015+daylight*.42;
  this.sky.sunPosition.value.copy(vector).multiplyScalar(450000);this.sky.turbidity.value=2+cloud*8;this.sky.rayleigh.value=1.8;
  this.sky.cloudCoverage.value=cloud*.85;this.sky.cloudDensity.value=.35+cloud*.5;this.sky.cloudScale.value=.0002;
  const haze=new THREE.Color('#a9bac7').lerp(new THREE.Color('#c5c8ca'),cloud).lerp(new THREE.Color('#171e2b'),1-daylight);
  e.scene.fog.color.copy(haze);e.scene.fog.near=90-cloud*25;e.scene.fog.far=300-cloud*80;
  e.renderer.toneMappingExposure=.92+golden*.12;
  const size=w.quality==='high'?2048:e.mobile?512:1024,shadows=w.quality!=='eco';
  if(e.sun.shadow.mapSize.x!==size){e.sun.shadow.map?.dispose();e.sun.shadow.map=null;e.sun.shadow.mapSize.setScalar(size);}
  e.renderer.shadowMap.enabled=shadows;e.sun.castShadow=shadows&&daylight>.05;e.sun.shadow.normalBias=.025;e.sun.shadow.bias=-.0002;
  e.sun.shadow.radius=2+cloud*4;
  const lampLevel=(w.lamps==='off'?0:w.lamps==='on'?1:1-THREE.MathUtils.smoothstep(elevation,.02,.4))*w.lampPower;
  if(e.customer){for(const light of e.customer.lights)light.intensity=lampLevel*8;e.customer.lightMaterial.emissiveIntensity=.15+lampLevel*3;}
  this.state={hour,...w,sunPosition:e.sun.position.toArray(),sunIntensity:e.sun.intensity,lampLevel,shadowMap:size};
 }
}
