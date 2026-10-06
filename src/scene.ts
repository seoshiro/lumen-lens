import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeLens, shadowTexture } from './model';
import { mix, sampleTimeline, smooth } from './timeline';

export function createScene(canvas: HTMLCanvasElement) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.85;
  const scene=new THREE.Scene();
  const pmrem=new THREE.PMREMGenerator(renderer);
  const room=new RoomEnvironment();
  const env=pmrem.fromScene(room,.035);
  scene.environment=env.texture;
  scene.environmentIntensity=.85;
  room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#fffdf2','#657076',.8));
  const key=new THREE.DirectionalLight('#fff8e4',2.4);key.position.set(-3,6,7);scene.add(key);
  const rim=new THREE.DirectionalLight('#d8e6f1',2);rim.position.set(4,2,-4);scene.add(rim);
  const fill=new THREE.DirectionalLight('#ffffff',.7);fill.position.set(0,-2,6);scene.add(fill);
  const camera=new THREE.PerspectiveCamera(30,1,.1,100);camera.position.set(0,.35,16);
  const lens=makeLens();scene.add(lens.root);
  const envelopes=lens.parts.map(part=>{const box=new THREE.Box3().setFromObject(part);return {radius:Math.max(Math.abs(box.min.x),Math.abs(box.max.x),Math.abs(box.min.y),Math.abs(box.max.y))*1.035,zMin:box.min.z-part.position.z,zMax:box.max.z-part.position.z};});
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(7,4.3),new THREE.MeshBasicMaterial({map:shadowTexture(),transparent:true,depthWrite:false,opacity:.8}));
  shadow.name='lens-shadow';shadow.rotation.x=-Math.PI/2;shadow.position.y=-1.72;scene.add(shadow);
  let width=1,height=1;
  let lastProgress=0;
  function resize() { const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix(); }
  function render(progress: number, reduced=false) {
    lastProgress=progress;
    const mobile=width<700;
    const s=sampleTimeline(reduced?0.22:progress,mobile);
    camera.position.x=0;
    const framing=smooth(0.28,.48,s.p)*(1-smooth(.81,.96,s.p));
    const portraitFit=Math.max(1,1.25/camera.aspect);
    camera.position.z=mobile?mix(20.5,35.0,framing):mix(16,height<520?24:19.4,framing)*portraitFit;
    camera.position.y=mobile?.4:.65;
    const lower=smooth(.25,.38,s.p)*(1-smooth(.81,.96,s.p));
    camera.lookAt(0,mobile?0:lower*(height<520?2.05:height<780?1.3:.9),0);
    lens.root.rotation.set(s.rotX,s.rotY,s.rotZ);
    const shortOffset=mobile&&height<700?-.5-.5*(1-smooth(.12,.255,s.p)):0;
    lens.root.position.set(s.modelX,s.modelY+shortOffset,0);lens.root.scale.setScalar(s.scale);
    lens.parts.forEach((part,i)=>{part.position.set(0,s.parts[i].y,s.parts[i].z);part.rotation.z=s.parts[i].rotation;part.visible=true;});
    lens.blades.forEach((blade,i)=>{blade.rotation.z=i/9*Math.PI*2+s.iris*.28;const mesh=blade.children[0];mesh.position.x=s.iris*.13;mesh.position.y=s.iris*.03;});
    shadow.position.x=s.modelX;shadow.position.y=mobile?-2.82:-1.72;shadow.scale.set(mix(1,2.45,s.explode),1,1);shadow.material.opacity=mix(.7,.32,s.intro)*(1-s.explode*.45);
    renderer.render(scene,camera);
    const anchors=[1,4,8].map(i=>{const world=new THREE.Vector3(0,-1.25,0);lens.parts[i].localToWorld(world);world.project(camera);return {x:(world.x*.5+.5)*width,y:(-.5*world.y+.5)*height};});
    const corners:{x:number;y:number}[]=[];
    lens.parts.forEach((part,i)=>{const envelope=envelopes[i];for(let angle=0;angle<48;angle++){const a=angle/48*Math.PI*2;for(const z of [envelope.zMin,envelope.zMax]){const v=new THREE.Vector3(Math.cos(a)*envelope.radius,Math.sin(a)*envelope.radius,z).applyMatrix4(part.matrixWorld).project(camera);corners.push({x:(v.x*.5+.5)*width,y:(-.5*v.y+.5)*height});}}});
    return {state:s,anchors,bounds:{left:Math.min(...corners.map(v=>v.x)),right:Math.max(...corners.map(v=>v.x)),top:Math.min(...corners.map(v=>v.y)),bottom:Math.max(...corners.map(v=>v.y))},renderRoots:scene.children.filter(obj=>obj instanceof THREE.Group||obj instanceof THREE.Mesh).map(obj=>obj.name),layerCount:lens.parts.length,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray()},calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
  }
  function capture(kind: 'assembled'|'glass'|'iris'|'mount',w=1400,h=1200) {
    const oldPixel=renderer.getPixelRatio();renderer.setPixelRatio(1);renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.position.set(0,.3,kind==='assembled'?11.5:7.2);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
    shadow.visible=false;
    lens.root.position.set(0,0,0);lens.root.scale.setScalar(1);lens.root.rotation.set(-.23,kind==='assembled'?-.48:-.45,-.26);
    const selection=kind==='glass'?[0,1,2]:kind==='iris'?[4]:kind==='mount'?[7,8]:[0,1,2,3,4,5,6,7,8];
    lens.parts.forEach((part,i)=>{part.visible=selection.includes(i);part.position.set(0,0,kind==='assembled'?sampleTimeline(0).parts[i].z:kind==='glass'?(1-i)*.25:kind==='mount'?(7.5-i)*.28:0);part.rotation.z=0;});
    lens.blades.forEach((b,i)=>{b.rotation.z=i/9*Math.PI*2;b.children[0].position.x=0;b.children[0].position.y=0;});
    renderer.render(scene,camera);
    const data=canvas.toDataURL('image/webp',.92);
    renderer.setPixelRatio(oldPixel);shadow.visible=true;resize();render(lastProgress);
    return data;
  }
  function dispose(){env.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});lens.materials.forEach(m=>{if(m instanceof THREE.MeshStandardMaterial||m instanceof THREE.MeshBasicMaterial)m.map?.dispose();m.dispose();});shadow.material.map?.dispose();shadow.material.dispose();renderer.dispose();}
  resize();
  return {render,resize,capture,dispose};
}
