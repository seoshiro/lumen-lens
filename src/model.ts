import * as THREE from 'three';
import { BASE_Z } from './timeline';
import { makePresentationCase } from './presentation-case';

export interface LensModel {
  root: THREE.Group;
  parts: THREE.Group[];
  blades: THREE.Group[];
  box: THREE.Group;
  lid: THREE.Group;
  materials: THREE.Material[];
}

export function makeLens(): LensModel {
  const root = new THREE.Group();
  const materials: THREE.Material[] = [];
  const material = <T extends THREE.Material>(m: T): T => { materials.push(m); return m; };
  const silver = material(new THREE.MeshStandardMaterial({ color: '#b9bfc0', metalness: 0.91, roughness: 0.27 }));
  const edge = material(new THREE.MeshStandardMaterial({ color: '#e7e8e1', metalness: 0.95, roughness: 0.16 }));
  const charcoal = material(new THREE.MeshStandardMaterial({ color: '#262c2e', metalness: 0.72, roughness: 0.3 }));
  const black = material(new THREE.MeshStandardMaterial({ color: '#131a1c', metalness: 0.35, roughness: 0.41 }));
  const brass = material(new THREE.MeshStandardMaterial({ color: '#b1986a', metalness: 0.9, roughness: 0.24 }));
  function opticalTexture(tint: string) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d')!;
    const radial=ctx.createRadialGradient(230,245,18,256,256,265);radial.addColorStop(0,'#071925');radial.addColorStop(.45,'#102637');radial.addColorStop(.80,tint);radial.addColorStop(1,'#70848d');ctx.fillStyle=radial;ctx.fillRect(0,0,512,512);
    ctx.save();ctx.translate(256,256);ctx.rotate(-.38);const highlight=ctx.createLinearGradient(-256,0,256,0);highlight.addColorStop(0,'transparent');highlight.addColorStop(.22,'rgba(160,209,216,.06)');highlight.addColorStop(.27,'rgba(196,220,223,.25)');highlight.addColorStop(.31,'rgba(166,214,226,.025)');highlight.addColorStop(1,'transparent');ctx.fillStyle=highlight;ctx.fillRect(-256,-256,512,512);ctx.restore();
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;
  }
  const blue = material(new THREE.MeshPhysicalMaterial({ color: '#7296ae',map:opticalTexture('#234359'), metalness: 0.46, roughness: 0.065, transmission: 0.035, thickness: 0.24, ior: 1.46, clearcoat: 1, clearcoatRoughness: 0.035, iridescence: 0.45, iridescenceThicknessRange: [120, 280] }));
  const teal = material(new THREE.MeshPhysicalMaterial({ color: '#8aaaa9',map:opticalTexture('#3a5e66'), metalness: 0.4, roughness: 0.07, transmission: 0.04, thickness: 0.16, ior: 1.46, clearcoat: 1, iridescence: 0.45, iridescenceThicknessRange: [170, 330] }));
  const violet = material(new THREE.MeshPhysicalMaterial({ color: '#9494ad',map:opticalTexture('#42445d'), metalness: 0.4, roughness: 0.07, transmission: 0.04, thickness: 0.16, clearcoat: 1, iridescence: 0.4 }));
  const bladeMat = material(new THREE.MeshStandardMaterial({ color: '#565e5e', metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide }));
  const parts = BASE_Z.map((z, i) => { const group = new THREE.Group(); group.name = `layer-${i}`; group.position.z = z; root.add(group); return group; });

  function add(parent: THREE.Group, geometry: THREE.BufferGeometry, mat: THREE.Material, z = 0) {
    const mesh = new THREE.Mesh(geometry, mat); mesh.position.z = z; parent.add(mesh); return mesh;
  }
  function profile(points: number[][]) { const geo = new THREE.LatheGeometry(points.map(([r, z]) => new THREE.Vector2(r, z)), 96); geo.rotateX(Math.PI / 2); return geo; }
  function ring(parent: THREE.Group, outer: number, inner: number, depth: number, mat = silver, z = 0) {
    const bevel = Math.min(depth * .18, .025);
    return add(parent, profile([[inner,-depth/2+bevel],[inner+bevel,-depth/2],[outer-bevel,-depth/2],[outer,-depth/2+bevel],[outer,depth/2-bevel],[outer-bevel,depth/2],[inner+bevel,depth/2],[inner,depth/2-bevel],[inner,-depth/2+bevel]]), mat, z);
  }
  function torus(parent: THREE.Group, radius: number, tube: number, mat: THREE.Material, z: number) { return add(parent, new THREE.TorusGeometry(radius, tube, 8, 96), mat, z); }
  function knurl(parent: THREE.Group, radius: number, depth: number, count: number, mat: THREE.Material, z = 0) {
    const geometry = new THREE.BoxGeometry(.018, .037, depth);
    const mesh = new THREE.InstancedMesh(geometry, mat, count);
    const dummy = new THREE.Object3D();
    for(let i = 0; i < count; i++) { const theta = i / count * Math.PI * 2; dummy.position.set(Math.cos(theta) * radius, Math.sin(theta) * radius, z); dummy.rotation.z = theta - Math.PI / 2; dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); }
    parent.add(mesh);
  }
  function screws(parent: THREE.Group, radius: number, count: number, z: number, mat = edge) {
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2 + .21;
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
      const screw = add(parent, new THREE.CylinderGeometry(.039,.039,.018,12), mat, z); screw.rotation.x = Math.PI/2; screw.position.set(x,y,z);
      const slot = add(parent, new THREE.BoxGeometry(.05,.009,.004), black, z+.011); slot.position.x=x; slot.position.y=y; slot.rotation.z=angle;
    }
  }
  function glass(parent: THREE.Group, radius: number, depth: number, mat: THREE.Material, z = 0) {
    const points: number[][] = [];
    for(let i=0;i<=28;i++) { const r=i/28*radius; points.push([r,depth/2+.105*(1-(r/radius)**2)]); }
    for(let i=28;i>=0;i--) { const r=i/28*radius; points.push([r,-depth/2-.048*(1-(r/radius)**2)]); }
    const geo=profile(points);const uv=geo.getAttribute('uv');const pos=geo.getAttribute('position');
    for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)/radius+1)/2,(pos.getY(i)/radius+1)/2);
    return add(parent,geo,mat,z);
  }
  function faceTexture(text: string, outer: number, inner: number, z: number, parent: THREE.Group) {
    const canvas=document.createElement('canvas'); canvas.width=canvas.height=1024;
    const ctx=canvas.getContext('2d')!; ctx.translate(512,512);
    ctx.fillStyle='#d8dcd6'; ctx.font='500 29px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    const chars=[...text]; const arc=1.82*Math.PI; const radius=442;
    chars.forEach((char,i)=>{ const a=-arc/2+i/(chars.length-1)*arc; ctx.save(); ctx.rotate(a); ctx.fillText(char,0,-radius); ctx.restore(); });
    const tex=new THREE.CanvasTexture(canvas); tex.colorSpace=THREE.SRGBColorSpace;
    const mat=material(new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
    const geo=new THREE.RingGeometry(inner,outer,96); const uv=geo.getAttribute('uv'); const pos=geo.getAttribute('position');
    for(let i=0;i<uv.count;i++) uv.setXY(i,(pos.getX(i)/outer+1)/2,(pos.getY(i)/outer+1)/2);
    return add(parent,geo,mat,z);
  }

  // Front retaining bezel: stepped machining, thread lines and curved engraving.
  ring(parts[0],1.23,1.03,.19,charcoal); torus(parts[0],1.222,.011,edge,.079); torus(parts[0],1.08,.012,edge,.095);
  for(let i=0;i<4;i++) torus(parts[0],1.231,.005,silver,-.065+i*.025);
  faceTexture('L U M E N   ·   L — 0 1   ·   O P T I C A L   S T U D Y   ·',1.22,1.03,.098,parts[0]);
  // Convex front optical surface and its exposed metal seat.
  ring(parts[1],1.10,1.015,.11,silver); glass(parts[1],1.03,.08,blue,.022); torus(parts[1],1.025,.013,brass,.06);
  // Retaining group, with a helical-looking series of fine threads.
  ring(parts[2],1.19,.96,.20,silver); ring(parts[2],1.22,1.12,.045,edge,.084);
  for(let i=0;i<7;i++) torus(parts[2],1.191,.004,charcoal,-.085+i*.025);
  screws(parts[2],1.087,6,.108);
  // Focus sleeve: tactile fluting, two polished shoulders, engraved distance ticks.
  ring(parts[3],1.19,.98,.42,charcoal); knurl(parts[3],1.195,.29,136,silver);
  torus(parts[3],1.19,.014,edge,.2); torus(parts[3],1.19,.014,edge,-.2);
  const tickGeometry=new THREE.BoxGeometry(.012,.009,.076);
  for(let i=0;i<36;i++) {const a=i/36*Math.PI*2;const m=add(parts[3],tickGeometry,edge,-.155);m.position.x=Math.cos(a)*1.206;m.position.y=Math.sin(a)*1.206;m.rotation.z=a;}
  // Iris carrier and nine overlapping, individually pivoting metal blades.
  ring(parts[4],1.02,.84,.13,charcoal); ring(parts[4],1.035,.91,.038,edge,.079); screws(parts[4],.955,9,.104);
  const blades: THREE.Group[]=[];
  const shape=new THREE.Shape(); shape.moveTo(.34,-.12);shape.quadraticCurveTo(.37,0,.35,.14);shape.bezierCurveTo(.56,.34,.77,.36,.84,.23);shape.lineTo(.84,-.28);shape.bezierCurveTo(.65,-.33,.46,-.30,.34,-.12);
  const bladeGeo=new THREE.ExtrudeGeometry(shape,{depth:.008,bevelEnabled:true,bevelSize:.003,bevelThickness:.002,bevelSegments:1,curveSegments:16});
  for(let i=0;i<9;i++) {const pivot=new THREE.Group();pivot.rotation.z=i/9*Math.PI*2;const blade=new THREE.Mesh(bladeGeo,bladeMat);blade.position.z=i*.002; pivot.add(blade); parts[4].add(pivot);blades.push(pivot);}
  // Inner optical pair, intentionally spaced to show individual curved surfaces.
  ring(parts[5],.96,.835,.16,silver); glass(parts[5],.84,.07,teal,.035); glass(parts[5],.80,.035,violet,-.085); torus(parts[5],.89,.011,brass,.095);
  // A stepped barrel rather than a solid cylinder. Its hollow interior remains visible.
  add(parts[6],profile([[.82,-.29],[.96,-.29],[1.01,-.25],[1.01,-.18],[1.12,-.15],[1.14,-.10],[1.14,.14],[1.10,.20],[.97,.20],[.93,.28],[.82,.28],[.82,-.29]]),silver);
  ring(parts[6],1.145,1.08,.10,charcoal,-.015); knurl(parts[6],1.148,.085,96,charcoal,-.015); screws(parts[6],1.025,4,.208);
  torus(parts[6],.99,.014,edge,-.265); torus(parts[6],1.12,.012,edge,.165);
  // Rear element and brass seating lip.
  ring(parts[7],.96,.735,.15,charcoal); ring(parts[7],.97,.86,.045,brass,.067); glass(parts[7],.735,.075,violet,.045); screws(parts[7],.91,3,.101);
  // Rear bayonet with three lugs, fastening heads and actual contact pins.
  ring(parts[8],1.015,.745,.13,edge); ring(parts[8],.84,.745,.19,charcoal,-.105); screws(parts[8],.945,6,.079);
  for(let i=0;i<3;i++) {const a=i/3*Math.PI*2;const lug=add(parts[8],new THREE.BoxGeometry(.32,.15,.09),silver,-.08);lug.position.x=Math.cos(a)*.99;lug.position.y=Math.sin(a)*.99;lug.rotation.z=a-Math.PI/2;}
  for(let i=0;i<8;i++) {const a=.10+i*.087;const pin=add(parts[8],new THREE.SphereGeometry(.029,10,8),brass,.092);pin.position.x=Math.cos(a)*.86;pin.position.y=Math.sin(a)*.86;}

  const paper=material(new THREE.MeshStandardMaterial({color:'#dedbd2',roughness:.87,metalness:0}));
  const liner=material(new THREE.MeshStandardMaterial({color:'#adb0a7',roughness:.96}));
  const {box,lid}=makePresentationCase(paper,liner);
  return {root,parts,blades,box,lid,materials};
}

export function shadowTexture() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d')!;
  const gradient=ctx.createRadialGradient(128,128,10,128,128,125);gradient.addColorStop(0,'rgba(37,42,36,.27)');gradient.addColorStop(.35,'rgba(37,42,36,.14)');gradient.addColorStop(1,'rgba(37,42,36,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
  return new THREE.CanvasTexture(canvas);
}
