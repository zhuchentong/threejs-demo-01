import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/Addons.js";

onmessage = function (event) {

  
  // const { mesh: meshJSON, decalPosition, euler, decalSize } = event.data;
  // const objectLoader = new THREE.ObjectLoader();
  // const mesh = objectLoader.parse(JSON.parse(meshJSON)) as THREE.Mesh;

  // var decalMaterial = new THREE.MeshPhongMaterial({
  //     // map: texture,
  //     color: 0xff0000,
  //     transparent: true,
  //     depthTest: true,
  //     depthWrite: false,
  //     polygonOffset: true,
  //     polygonOffsetFactor: -4,
  //     wireframe: false,
  //   });

  // // console.time("task:4-1");
  // var decalGeometry = new DecalGeometry(mesh, decalPosition, euler, decalSize);
  // // console.timeEnd("task:4-1");
  // // console.time("task:4-2");
  // // var decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
  // // console.timeEnd("task:4-2");
  // // console.time("task:5");
  // // postMessage({ mesh: decalMesh.toJSON() });
  // // console.timeEnd("task:5");
};
