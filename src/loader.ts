import * as THREE from 'three'; // 导入three.js库
import { STLLoader,OrbitControls } from 'three/examples/jsm/Addons.js'; // 导入STLLoader模块

// 初始化场景
const scene = new THREE.Scene();

// 创建并设置相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 100);


// 创建渲染器并设置其大小
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // 将渲染器的Canvas添加到body中

const controls = new OrbitControls(camera, renderer.domElement);

// 添加一些灯光
const ambientLight = new THREE.AmbientLight(0x404040,2); // 环境光
scene.add(ambientLight);



// 调整方向光的强度和位置
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // 增加强度
directionalLight.position.set(5, 10, 7.5);

scene.add(directionalLight);

// 使用STLLoader加载模型
const loader = new STLLoader();
loader.load('/test.stl', function (geometry:any) {
    const material = new THREE.MeshPhongMaterial({ color: 0x555555, specular: 0x111111, shininess: 200 }); // 创建材质
    const mesh = new THREE.Mesh(geometry, material); // 使用几何体和材质创建网格

    scene.add(mesh); // 将网格添加到场景中

    geometry.computeBoundingBox(); // 计算几何体的边界框，以便我们可以获取到模型的中心和大小
    geometry.computeBoundingSphere();
    // 更新模型的位置，使其居中
    mesh.position.x = -0.5 * (geometry.boundingBox.max.x + geometry.boundingBox.min.x);
    mesh.position.y = -0.5 * (geometry.boundingBox.max.y + geometry.boundingBox.min.y);
    mesh.position.z = -0.5 * (geometry.boundingBox.max.z + geometry.boundingBox.min.z);

    // // 调整相机的位置，使模型能够完全显示在视野中
    // const boundingSphere = geometry.boundingSphere;
    // const center = boundingSphere.center;
    // const radius = boundingSphere.radius;

    // const horizontalFOV = 2 * Math.atan((window.innerWidth / window.innerHeight) * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    // const fov = Math.min(camera.fov, THREE.MathUtils.radToDeg(horizontalFOV));

    // const dist = radius / Math.sin(THREE.MathUtils.degToRad(fov / 2));
    // camera.position.set(center.x, center.y, dist);

    // camera.lookAt(center); // 相机指向模型的中心

    // 当调整相机位置和方向后，需要更新
    camera.updateProjectionMatrix();
    
});

// 创建一个动画循环来渲染场景
const animate = function () {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

animate(); // 开始动画循环

// 在窗口大小变化时调整相机和渲染器的属性
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    controls.update()
    renderer.setSize(window.innerWidth, window.innerHeight);
});