import {
  DecalGeometry,
  OrbitControls,
  STLLoader,
} from "three/examples/jsm/Addons.js";
import "./style.css";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

// const cache: { decalPosition: THREE.Vector3; euler: THREE.Euler }[] = [];

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.Renderer;
let loader: THREE.Loader;
let controls: OrbitControls;
let light: THREE.AmbientLight;
let mesh: THREE.Mesh;
let cloneMesh: THREE.Mesh;
let decalMesh: THREE.Mesh;
let meshList: THREE.BufferGeometry[] = [];
// let decalGeometry: DecalGeometry;

var decalSize = new THREE.Vector3(40, 40, 5); // 尺寸可以根据你的需要调整

// 假设您已经有了一个mesh，该mesh使用了MeshStandardMaterial
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("/image.png");

const decalMaterial = new THREE.MeshPhongMaterial({
  // map: texture,
  color: 0x28e430,
  transparent: true,
  depthTest: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -4,
  wireframe: false,
});

const cloneMaterial = new THREE.MeshPhongMaterial({
  color: 0x156289, // 基础颜色
  emissive: 0x072534, // 自发颜色
  side: THREE.DoubleSide, // 材质的两面都可见
  flatShading: true, // 平面着色
  shininess: 100, // 高光强度，数值越大越明显
  specular: 0x111111, // 高光颜色，此属性会影响高光的颜色
  wireframe: true,
});

function init() {
  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // 创建摄像头
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.01,
    10000
  );

  // 创建渲染器并添加到HTML
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.z = 10;
  controls = new OrbitControls(camera, renderer.domElement);

  light = new THREE.AmbientLight(0x404040);
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight1.position.set(-1, -1, -1);
  scene.add(directionalLight1);

  // 创建STL加载器并加载模型

  // 创建STL加载器并加载模型
  loader = new STLLoader();
  loader.load("/test.stl", function (event: any) {
    var geometry = event!.content!;
    scene.add(new THREE.Mesh(geometry));
  });

  // 调整视角大小跟随窗口变化
  window.addEventListener("resize", onWindowResize);

  renderer.domElement.addEventListener("mousedown", onMouseDown);
  renderer.domElement.addEventListener("mousemove", onMouseOver);
  renderer.domElement.addEventListener("mouseup", onMouseUp);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// 射线投射，用来检测点击的对象
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
let dragging = false;

// const MAX_EVENTS = 10; // 触发处理的累积事件数量阈值
// const INTERVAL = 100; // 触发处理的时间间隔（毫秒）

function onMouseDown(event: MouseEvent) {
  event.preventDefault();

  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

  // 更新射线投射的位置
  raycaster.setFromCamera(mouse, camera);
  // 计算物体和射线的交点
  var intersects = raycaster.intersectObject(mesh);
  if (intersects.some((x) => x.object === mesh)) {
    dragging = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableRotate = false;
  }
}

function onMouseUp(event: MouseEvent) {
  event.preventDefault();
  dragging = false;

  controls.enablePan = true;
  controls.enableZoom = true;
  controls.enableRotate = true;
}

function onMouseOver(event: MouseEvent) {
  if (!dragging) {
    return;
  }

  event.preventDefault();

  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

  // 更新射线投射的位置
  raycaster.setFromCamera(mouse, camera);

  // 计算物体和射线的交点
  var intersects = raycaster.intersectObject(mesh);
  const intersect = intersects.find((x) => x.object === mesh);

  if (intersect && intersect.face) {
    // // 创建一个平面几何体，作为“喷漆”图案
    // var decalGeometry = new DecalGeometry(intersect.object, 96);
    // // var decalMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    // // var decalMaterial = new THREE.MeshBasicMaterial({
    // //   color: 0xff0000,
    // //   side: THREE.DoubleSide,
    // // });

    // const decalMaterial = new THREE.MeshStandardMaterial({
    //   metalness: 1.0, // 设置金属度为 1.0
    //   roughness: 0.5, // 设置粗糙度为 0.5
    //   color: 0xff0000, // 设置材质颜色为红色
    //   // map: texture,
    // });

    // var decal = new THREE.Mesh(decalGeometry, decalMaterial);

    // // 将平面贴在模型表面上
    // decal.position.copy(intersect.point);
    // decal.position.add(intersect.face.normal.multiplyScalar(0.1));
    // decal.lookAt(intersect.face.normal.add(intersect.point));
    // scene.add(decal);

    var decalNormal = intersect.face.normal;
    var decalPosition = intersect.point;

    // 创建贴花
    // .setRotationFromQuaternion 
    var quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), decalNormal);
    var euler = new THREE.Euler().setFromQuaternion(quaternion, "XYZ");

    const decalGeometry = new DecalGeometry(
      mesh,
      decalPosition,
      euler,
      decalSize
    );
    meshList.push(decalGeometry);

    if (decalMesh) {
      scene.remove(decalMesh);
    }
    const temp = BufferGeometryUtils.mergeGeometries(meshList);
    const geometry = BufferGeometryUtils.mergeVertices(temp, 0);

    decalMesh = new THREE.Mesh(geometry, decalMaterial);
    scene.add(decalMesh);

    generateMesh();

    // decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
    // scene.add(decalMesh);

    // cache.push({
    //   decalPosition,
    //   euler,
    // });

    // const decalGeometry = new DecalGeometry(
    //   mesh,
    //   decalPosition,
    //   euler,
    //   decalSize
    // );

    // console.time("task:4-2");
    // var decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
    // console.timeEnd("task:4-2");
    // console.time("task:5");
    // scene.add(decalMesh);
    // console.timeEnd("task:5");
  }
}

init();
animate();

// const createDecalGeometry: IdleRequestCallback = (deadline) => {
//   if (deadline.timeRemaining() > 1) {
//     if (cache.length > 0 && mesh) {
//       const data = cache.shift();

//       if (data) {
//         const decalGeometry = new DecalGeometry(
//           mesh,
//           data.decalPosition,
//           data.euler,
//           decalSize
//         );

//         var decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
//         scene.add(decalMesh);
//       }
//     }
//   }

//   requestIdleCallback(createDecalGeometry);
// };

// requestIdleCallback(createDecalGeometry);

const button = document.getElementById("generate");

if (button) {
  button.addEventListener("click", () => {
    generateMesh();
  });
}

function generateMesh() {
  if (cloneMesh) {
    scene.remove(cloneMesh);
  }
  const temp = BufferGeometryUtils.mergeGeometries(meshList);
  const geometry = BufferGeometryUtils.mergeVertices(temp, 20);

  cloneMesh = new THREE.Mesh(geometry, cloneMaterial);
  cloneMesh.translateX(-500);
  scene.add(cloneMesh);
}