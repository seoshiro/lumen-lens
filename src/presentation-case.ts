import * as THREE from 'three';

// The cavity accommodates the assembled lens at its initial desktop scale.
export const CASE = { width: 3.8, depth: 4.4, floor: -.18, rim: 3.78, hinge: 3.86, wall: .09 } as const;

export function makePresentationCase(paper: THREE.Material, liner: THREE.Material) {
  const box = new THREE.Group();
  const lid = new THREE.Group();
  box.add(lid);
  const add = (parent: THREE.Group, size: [number, number, number], position: [number, number, number], material: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);parent.add(mesh);return mesh;
  };
  add(box, [CASE.width, .17, CASE.depth], [0, CASE.floor, 0], paper);
  const bottom = CASE.floor + .085;
  const height = CASE.rim - bottom;
  for (const side of [-1, 1]) {
    add(box, [CASE.wall, height, CASE.depth], [side * (CASE.width - CASE.wall) / 2, bottom + height / 2, 0], paper);
    add(box, [CASE.width - CASE.wall * 2, height, CASE.wall], [0, bottom + height / 2, side * (CASE.depth - CASE.wall) / 2], paper);
  }
  add(box, [CASE.width - CASE.wall * 2, .09, CASE.depth - CASE.wall * 2], [0, -.06, 0], liner);
  // All lid vertices are forward of the rear hinge. Negative X rotation lifts
  // them above the rim throughout opening, including on reverse scroll.
  lid.position.set(0, CASE.hinge, -CASE.depth / 2);
  add(lid, [CASE.width, .12, CASE.depth], [0, 0, CASE.depth / 2], paper);
  add(lid, [CASE.width - CASE.wall * 2, .012, CASE.depth - CASE.wall * 2], [0, -.069, CASE.depth / 2], liner);
  return { box, lid };
}
