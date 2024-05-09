import * as THREE from "three"; // 导入three.js库
import { STLLoader, OrbitControls } from "three/examples/jsm/Addons.js"; // 导入STLLoader模块
// 基础设置
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0); // 确保相机朝向原点，假设模型位于原点
const controls = new OrbitControls(camera, renderer.domElement);
// 添加环境光和定向光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

let cube: any;
const loader = new STLLoader();

loader.load("/model.stl", function (geometry) {
  const colorArray = new Uint8Array(geometry.attributes.position.count * 3);
  colorArray.fill(255);
  const colorAttr = new THREE.BufferAttribute(colorArray, 3, true);
  colorAttr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("color", colorAttr);

  const knotMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0,
    vertexColors: true,
    wireframe: false,
  });
  cube = new THREE.Mesh(geometry, knotMaterial);
  scene.add(cube);
});
// 更改模型的材质和颜色以便看到效果
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.3,
  metalness: 0,
  vertexColors: true,
  wireframe: false,
});

// 确保渲染器尺寸与窗口匹配
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 创建几何体和材质，并添加到场景中
// const geometry = new THREE.BoxGeometry(100, 100, 100);
// // const material = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true });
// const material = new THREE.MeshPhongMaterial({ color: 0xffffff, vertexColors: true });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// 射线投射和鼠标
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// 颜色和画笔大小
const brushColor = new THREE.Color("rgb(255,0,0)");
const brushSize = 0.1; // 需要根据几何体尺寸调整

// 事件监听器
window.addEventListener("resize", onWindowResize, false);
// window.addEventListener("mousemove", onMouseMove, false);
window.addEventListener("mousedown", onMouseMove, false);

// 窗口大小调整时的处理
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// 更新鼠标位置
function onMouseMove(event: any) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(scene.children,true);
  var intersect = intersects[0]
  console.log(intersect)

  var direction = new THREE.Vector3()
      .subVectors(vertex, camera.position)
      .normalize();
  // var geometry = cube.geometry;
  // var attributes = geometry.attributes;
  // const position = attributes.position;
  // var colorAttribute = geometry.attributes.color;

  // // var epsilon = 0.00001;
  // // console.log(scene.children)
  // // var intersects = raycaster.intersectObjects(cube,true);
  // // console.log(intersects)

  // for (
  //   var vertexIndex = 0;
  //   vertexIndex < position.count;
  //   vertexIndex++
  // ) {
  //   var vertex = new THREE.Vector3();
  //   vertex.fromBufferAttribute(position, vertexIndex);

  //   var direction = new THREE.Vector3()
  //     .subVectors(vertex, camera.position)
  //     .normalize();

  //   raycaster.set(intersect.point, direction);
  //   raycaster.far = vertex.distanceTo(intersect.point);

  //   var intersects2 = raycaster.intersectObject(intersect.object, true);
  //   console.log(intersects2.length, raycaster.far - 10);
  //   if (
  //     intersects2.length === 0 ||
  //     intersects2[0].distance >= raycaster.far - 10
  //   ) {
  //     colorAttribute.setXYZ(
  //       vertexIndex,
  //       brushColor.r,
  //       brushColor.g,
  //       brushColor.b
  //     );
  //   }
  // }
  // colorAttribute.needsUpdate = true;
}

// 绘画函数
// function paint(event: any) {
//   // 通过投射一条射线来检查什么物体被点击
//   raycaster.setFromCamera(mouse, camera);

//   // 计算物体和射线的交点
//   var intersects = raycaster.intersectObjects(scene.children);

//   if (intersects.length > 0) {
//     var intersect = intersects[0];
//     // 你可以在此处进行涂色操作，例如：
//     var brushSize = 20; // 画刷的大小
//     var color = new THREE.Color(0xff9900); // 需要涂上的颜色

//     var geometry = cube.geometry;
//     var attributes = cube.geometry.attributes;
//     const position = cube.geometry.getAttribute("position");
//     var positionAttribute = geometry.attributes.position;
//     var normalAttribute = geometry.attributes.normal;
//     var colorAttribute = geometry.attributes.color;
//     // 遍历所有顶点
//     // for (var i = 0, n = position.count; i < n; i++) {
//     //   // 如果顶点距离交点的距离小于画刷大小，则更改其颜色
//     //   // const x = position.getX(i);
//     //   // const y = position.getY(i);
//     //   // const z = position.getZ(i);

//     //   // 使用这些分量来创建一个 THREE.Vector3 对象
//     //   const vertex = new THREE.Vector3();
//     //   vertex.fromBufferAttribute(positionAttribute, i);

//     //   // if (vertex.distanceTo(intersect.point) < brushSize) {
//     //   //   attributes.color.setXYZ(i, color.r, color.g, color.b);
//     //   // }
//     //   var vertexNormal = new THREE.Vector3();
//     //   vertexNormal.fromBufferAttribute(normalAttribute, i);
//     //   // console.log(vertexNormal.dot(intersect!.face!.normal))
//     //   if (vertex.distanceTo(intersect.point) < brushSize && vertexNormal.dot(intersect!.face!.normal) >= 0) {
//     //     // 在color属性中设置顶点的颜色
//     //     attributes.color.setXYZ(i, color.r, color.g, color.b);
//     //   }
//     // }

//     //   for (var vertexIndex = 0; vertexIndex < positionAttribute.count; vertexIndex++) {
//     //     // 提取当前顶点
//     //     var vertex = new THREE.Vector3();
//     //     vertex.fromBufferAttribute(positionAttribute, vertexIndex);

//     //     // 提取当前顶点的法线
//     //     var vertexNormal = new THREE.Vector3();
//     //     vertexNormal.fromBufferAttribute(normalAttribute, vertexIndex);
//     // console.log(vertexNormal.dot(intersect!.face!.normal) )
//     //     // 创建一个从交点指向当前顶点的辅助方向射线
//     //     // var direction = new THREE.Vector3().subVectors(vertex, intersect.point).normalize();

//     //     // 如果当前顶点与射线相交点的距离小于画刷大小，并且顶点的法线方向与射线方向一致
//     //     if (vertex.distanceTo(intersect.point) < brushSize && vertexNormal.dot(intersect!.face!.normal) >= 0) {
//     //         // 在color属性中设置顶点的颜色
//     //         colorAttribute.setXYZ(vertexIndex, brushColor.r, brushColor.g, brushColor.b);
//     //     }
//     // }
//     //   // 需要设定color需要更新
//     //   cube.geometry.attributes.color.needsUpdate = true;
//     // }

//     for (
//       var vertexIndex = 0;
//       vertexIndex < positionAttribute.count;
//       vertexIndex++
//     ) {
//       // 提取当前顶点
//       var vertex = new THREE.Vector3();
//       vertex.fromBufferAttribute(positionAttribute, vertexIndex);

//       // 提取当前顶点的法线
//       var vertexNormal = new THREE.Vector3();
//       vertexNormal.fromBufferAttribute(normalAttribute, vertexIndex);

//       // 创建一个从交点指向当前顶点的向量
//       var direction = new THREE.Vector3()
//         .subVectors(vertex, intersect.point)
//         .normalize();

//       // 使用交点处的表面法线作为过滤条件
//       var faceNormal = intersect!.face!.normal;

//       // 计算辅助方向射线与顶点法线的点积，用于判断顶点是否面向射线
//       var normalDot = vertexNormal.dot(direction);

//       // 计算顶点法线与面法线的点积，判断顶点方向是否与面的方向一致
//       var faceNormalDot = vertexNormal.dot(faceNormal);

//       if (
//         vertex.distanceTo(intersect.point) < brushSize &&
//         normalDot > 0 &&
//         faceNormalDot > 0
//       ) {
//         // 在color属性中设置顶点的颜色
//         colorAttribute.setXYZ(
//           vertexIndex,
//           brushColor.r,
//           brushColor.g,
//           brushColor.b
//         );
//       }
//     }
//   }
// }

// 渲染循环
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
