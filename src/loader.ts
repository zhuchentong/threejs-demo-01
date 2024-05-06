import * as dat from "three/examples/jsm/libs/lil-gui.module.min.js";
import * as THREE from "three"; // 导入three.js库
import { STLLoader, OrbitControls } from "three/examples/jsm/Addons.js"; // 导入STLLoader模块

const params = {
  rotate: true,
};
// 初始化场景
const scene = new THREE.Scene();
// 创建并设置相机
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.near = 0.1;
camera.far = 10000;
camera.position.set(200, 0, 100);

const gui = new dat.GUI();
gui.add(params, "rotate");
gui.open();

// 创建渲染器并设置其大小
const renderer = new THREE.WebGLRenderer();
// renderer.setClearColor(0xd3df56, 1); //设置背景颜色
const bgColor = 0x263238 / 2;

// renderer setup
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(bgColor, 1);
document.body.appendChild(renderer.domElement); // 将渲染器的Canvas添加到body中

const controls = new OrbitControls(camera, renderer.domElement);
// 添加一些灯光
const ambientLight = new THREE.AmbientLight(0xffffff, 100); // 环境光
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1000);
pointLight.position.set(200, 0, 100);
scene.add(pointLight);
// 调整方向光的强度和位置
const directionalLight1 = new THREE.DirectionalLight(0xffffff, 100); // 增加强度
directionalLight1.position.set(200, 0, 100);
scene.add(directionalLight1);
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 100); // 增加强度
directionalLight2.position.set(-200, 0, -100);
scene.add(directionalLight2);

// 使用STLLoader加载模型
const loader = new STLLoader();
loader.load("/test.stl", function (geometry: any) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0,
    vertexColors: true,
    wireframe: false,
    side: THREE.DoubleSide,
  });

  //   const material = new THREE.MeshPhongMaterial({      side: THREE.DoubleSide,color: 0x555555, specular: 0x111111, shininess: 200 }); // 创建材质
  const mesh = new THREE.Mesh(geometry, material); // 使用几何体和材质创建网格
  scene.add(mesh); // 将网格添加到场景中

  geometry.computeBoundingBox(); // 计算几何体的边界框，以便我们可以获取到模型的中心和大小
  geometry.computeBoundingSphere();
  console.log(geometry.boundingBox);
  // 更新模型的位置，使其居中
  mesh.position.x =
    -0.5 * (geometry.boundingBox.max.x + geometry.boundingBox.min.x);
  mesh.position.y =
    -0.5 * (geometry.boundingBox.max.y + geometry.boundingBox.min.y);
  mesh.position.z =
    -0.5 * (geometry.boundingBox.max.z + geometry.boundingBox.min.z);

  // 调整相机的位置，使模型能够完全显示在视野中
  const boundingSphere = geometry.boundingSphere;
  const center = boundingSphere.center;
  const radius = boundingSphere.radius;

  const horizontalFOV =
    2 *
    Math.atan(
      (window.innerWidth / window.innerHeight) *
        Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    );
  const fov = Math.min(camera.fov, THREE.MathUtils.radToDeg(horizontalFOV));

  const dist = radius / Math.sin(THREE.MathUtils.degToRad(fov / 2));
  camera.position.set(center.x, center.y, dist * 1.5);
  camera.lookAt(center); // 相机指向模型的中心

  // 当调整相机位置和方向后，需要更新
  camera.updateProjectionMatrix();
  controls.update();
});

let lastTime =  window.performance.now()
function updateRotate(){
const currTime = window.performance.now();
  if (params.rotate) {
    const meshs = scene.children.filter(x=>x.type === 'Mesh')
    const delta = currTime - lastTime;

    meshs.forEach(mesh=>{
        mesh.rotation.y += delta * 0.001;
    })
  }

  lastTime = currTime;
}

// 创建一个动画循环来渲染场景
const animate = function () {
  requestAnimationFrame(animate);

//   updateRotate()

  renderer.render(scene, camera);
  controls.update();
};

animate(); // 开始动画循环

// 在窗口大小变化时调整相机和渲染器的属性
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});
