import { OrbitControls, STLLoader } from "three/examples/jsm/Addons.js";
import "./style.css";
import * as THREE from "three";
import * as dat from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "stats-js";

interface SceneObject {
  scene: THREE.Scene;
  element: HTMLDivElement;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  mesh?: THREE.Mesh;
  decalMesh?: THREE.Mesh;
}

import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
  CONTAINED,
  INTERSECTED,
  NOT_INTERSECTED,
} from "three-mesh-bvh";

(THREE.BufferGeometry.prototype as any).computeBoundsTree = computeBoundsTree;
(THREE.BufferGeometry.prototype as any).disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

let latestChangeControl: OrbitControls;
let mouse = new THREE.Vector2();
let mouseType = -1;
let brushActive = false;
let brushMesh: THREE.Mesh;
const stats = new Stats();
const raycaster = new THREE.Raycaster();
(raycaster as any).firstHitOnly = true;

const params = {
  size: 10,
  frame: false,
};

const gui = new dat.GUI();
gui.add(params, "size").min(1).max(50).step(1);
gui.add(params, "frame");
gui.open();

const rightMaterial = new THREE.MeshPhongMaterial({
  color: 0x156289, // 基础颜色
  emissive: 0x072534, // 自发颜色
  side: THREE.DoubleSide, // 材质的两面都可见
  flatShading: true, // 平面着色
  shininess: 100, // 高光强度，数值越大越明显
  specular: 0x111111, // 高光颜色，此属性会影响高光的颜色
  wireframe: true,
});
// 创建场景
function createScene(element: HTMLDivElement): SceneObject {
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let controls: OrbitControls;
  let renderer: THREE.WebGLRenderer;
  let width = element.clientWidth;
  let height = element.clientHeight;

  // 初始化场景
  scene = new THREE.Scene();
  // 创建并设置相机
  camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 10000);
  camera.near = 0.01;
  camera.far = 10000;

  // 创建渲染器并设置其大小
  const bgColor = 0x263238 / 2;
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.setClearColor(bgColor, 1);
  element.appendChild(renderer.domElement); // 将渲染器的Canvas添加到body中
  renderer.domElement.style.touchAction = "none";
  // 添加轨道
  controls = new OrbitControls(camera, renderer.domElement);
  // 添加一些灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 1); // 环境光
  scene.add(ambientLight);
  // 调整方向光的强度和位置
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1); // 增加强度
  directionalLight1.position.set(200, 0, 100);
  scene.add(directionalLight1);
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1); // 增加强度
  directionalLight2.position.set(-200, 0, -100);
  scene.add(directionalLight2);

  controls.addEventListener("change", function () {
    latestChangeControl = controls;
  });

  return {
    scene,
    element,
    camera,
    renderer,
    controls,
  };
}

function createTargetMesh(target: SceneObject) {
  const loader = new STLLoader();
  return new Promise((resolve) => {
    loader.load("/model.stl", function (geometry: any) {
      const brushGeometry = new THREE.SphereGeometry(1, 40, 40);
      const brushMaterial = new THREE.MeshStandardMaterial({
        color: 0xec407a,
        roughness: 0.75,
        metalness: 0,
        transparent: true,
        opacity: 0.5,
        premultipliedAlpha: true,
        emissive: 0xec407a,
        emissiveIntensity: 0.5,
      });

      brushMesh = new THREE.Mesh(brushGeometry, brushMaterial);
      target.scene.add(brushMesh);

      const colorArray = new Uint8Array(geometry.attributes.position.count * 3);
      colorArray.fill(255);
      const colorAttr = new THREE.BufferAttribute(colorArray, 3, true);
      colorAttr.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute("color", colorAttr);
      geometry.computeBoundsTree();
      const material = new THREE.MeshStandardMaterial({
        color: 0xcceedd,
        roughness: 0.3,
        metalness: 0,
        vertexColors: true,
        wireframe: false,
        side: THREE.DoubleSide,
      });

      //   const material = new THREE.MeshPhongMaterial({      side: THREE.DoubleSide,color: 0x555555, specular: 0x111111, shininess: 200 }); // 创建材质
      target.mesh = new THREE.Mesh(geometry, material); // 使用几何体和材质创建网格
      target.scene.add(target.mesh); // 将网格添加到场景中
      geometry.computeBoundingBox(); // 计算几何体的边界框，以便我们可以获取到模型的中心和大小
      geometry.computeBoundingSphere();

      // 更新模型的位置，使其居中
      target.mesh.position.x =
        -0.5 * (geometry.boundingBox.max.x + geometry.boundingBox.min.x);
      target.mesh.position.y =
        -0.5 * (geometry.boundingBox.max.y + geometry.boundingBox.min.y);
      target.mesh.position.z =
        -0.5 * (geometry.boundingBox.max.z + geometry.boundingBox.min.z);

      // 调整相机的位置，使模型能够完全显示在视野中
      const boundingSphere = geometry.boundingSphere;
      const center = boundingSphere.center;
      const radius = boundingSphere.radius;

      const horizontalFOV =
        2 *
        Math.atan(
          (left.element.clientWidth / left.element.clientHeight) *
            Math.tan(THREE.MathUtils.degToRad(target.camera.fov) / 2)
        );
      const fov = Math.min(
        target.camera.fov,
        THREE.MathUtils.radToDeg(horizontalFOV)
      );

      const dist = radius / Math.sin(THREE.MathUtils.degToRad(fov / 2));
      target.camera.position.set(center.x, center.y, dist * 1.5);
      target.camera.lookAt(center); // 相机指向模型的中心

      // 当调整相机位置和方向后，需要更新
      target.camera.updateProjectionMatrix();
      target.controls.update();
      resolve(true);
    });
  });
}

// 创建双侧场景
const left = createScene(document.getElementById("left") as HTMLDivElement);
const right = createScene(document.getElementById("right") as HTMLDivElement);

async function init() {
  await createTargetMesh(left);
  // await createTargetMesh(right);
  document.body.appendChild(stats.dom);
}

// 创建一个动画循环来渲染场景
const animate = function () {
  stats.begin();
  requestAnimationFrame(animate);

  if (latestChangeControl === left.controls) {
    right.controls.target.copy(left.controls.target);
    right.controls.object.position.copy(left.controls.object.position);
    right.controls.object.rotation.copy(left.controls.object.rotation);
    left.controls.update();
    right.controls.update();
  } else if (latestChangeControl === right.controls) {
    left.controls.target.copy(right.controls.target);
    left.controls.object.position.copy(right.controls.object.position);
    left.controls.object.rotation.copy(right.controls.object.rotation);
    right.controls.update();
    left.controls.update();
  }

  if (!brushActive && brushMesh) {
    brushMesh.visible = false;
  }

  if (left.mesh && brushMesh && brushActive) {
    render();
  }

  left.renderer.render(left.scene, left.camera);
  right.renderer.render(right.scene, right.camera);
  stats.end();
};

animate(); // 开始动画循环

function render() {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, left.camera);
  const intersects = raycaster.intersectObject(left.mesh!, false);
  const intersect = intersects[0];

  if (intersect) {
    updateGeometryColor();
    updateRightMesh();
  } else {
    brushMesh.visible = false;
    left.controls.enabled = true;
  }
}

// 在窗口大小变化时调整相机和渲染器的属性
window.addEventListener("resize", function () {
  left.camera.aspect = left.element.clientWidth / left.element.clientHeight;
  left.camera.updateProjectionMatrix();
  left.renderer.setSize(left.element.clientWidth, left.element.clientHeight);

  right.camera.aspect = right.element.clientWidth / right.element.clientHeight;
  right.camera.updateProjectionMatrix();
  right.renderer.setSize(left.element.clientWidth, left.element.clientHeight);
});

left.element.addEventListener("pointermove", function (e) {
  mouse.x = (e.clientX / left.element.clientWidth) * 2 - 1;
  mouse.y = -(e.clientY / left.element.clientHeight) * 2 + 1;
  brushActive = true;
});

left.element.addEventListener(
  "pointerdown",
  function (e) {
    mouse.x = (e.clientX / left.element.clientWidth) * 2 - 1;
    mouse.y = -(e.clientY / left.element.clientHeight) * 2 + 1;
    mouseType = e.button;
    // brushActive = true;
    // disable the controls early if we're over the object because on touch screens
    // we're not constantly tracking where the cursor is.
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, left.camera);
    (raycaster as any).firstHitOnly = true;

    const res = raycaster.intersectObject(left.mesh!, true);
    brushActive = true;
    left.controls.enabled = res.length === 0;
  },
  true
);

left.element.addEventListener(
  "pointerup",
  function () {
    mouseType = -1;
    brushActive = false;
    left.controls.enabled = true;
  },
  true
);

function getIntersectsFromPoint(pointA: THREE.Vector3) {
  var pointB = left.camera.position;

  var direction = new THREE.Vector3().subVectors(pointB, pointA).normalize();

  var ray = new THREE.Raycaster(pointA, direction);
  ray.far = pointA.distanceTo(pointB);

  return ray.intersectObject(left.mesh!, true);
}
function updateGeometryColor() {
  const geometry = left.mesh!.geometry;
  const bvh = (geometry as any).boundsTree;
  const colorAttr = geometry.getAttribute("color");
  const indexAttr = geometry.index!;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, left.camera);
  (raycaster as any).firstHitOnly = true;

  const res = raycaster.intersectObject(left.mesh!, true);

  if (res.length) {
    left.controls.enabled = false;
    brushMesh.position.copy(res[0].point);
    left.controls.enabled = false;
    brushMesh.visible = true;
    brushMesh.scale.setScalar(params.size);

    const inverseMatrix = new THREE.Matrix4();
    inverseMatrix.copy(left.mesh!.matrixWorld).invert();

    const sphere = new THREE.Sphere();
    sphere.center.copy(brushMesh.position).applyMatrix4(inverseMatrix);
    sphere.radius = params.size;

    const indices: number[] = [];
    const tempVec = new THREE.Vector3();

    bvh.shapecast({
      intersectsBounds: (box: THREE.Box3) => {
        const intersects = sphere.intersectsBox(box);
        const { min, max } = box;
        if (intersects) {
          for (let x = 0; x <= 1; x++) {
            for (let y = 0; y <= 1; y++) {
              for (let z = 0; z <= 1; z++) {
                tempVec.set(
                  x === 0 ? min.x : max.x,
                  y === 0 ? min.y : max.y,
                  z === 0 ? min.z : max.z
                );
                if (!sphere.containsPoint(tempVec)) {
                  return INTERSECTED;
                }
              }
            }
          }

          return CONTAINED;
        }

        return intersects ? INTERSECTED : NOT_INTERSECTED;
      },

      intersectsTriangle: (tri: any, i: number, contained: boolean) => {
        if (contained || tri.intersectsSphere(sphere)) {
          const i3 = 3 * i;
          indices.push(i3, i3 + 1, i3 + 2);
        }

        return false;
      },
    });

    if (mouseType === 0 || mouseType === 2) {
      let r = 1,
        g = 1,
        b = 1;

      if (mouseType === 0) {
        r = 15 / 255;
        g = 78 / 255;
        b = 85 / 255;
      }

      const count = indices.length / 3;

      for (let i = 0; i < count; i++) {
        const i1 = indexAttr.getX(indices[i]);
        const i2 = indexAttr.getX(indices[i + 1]);
        const i3 = indexAttr.getX(indices[i + 2]);

        var positionAttribute = left.mesh!.geometry.attributes.position;
        var pointA1 = new THREE.Vector3();
        pointA1.fromBufferAttribute(positionAttribute, i1);
        var pointA2 = new THREE.Vector3();
        pointA1.fromBufferAttribute(positionAttribute, i2);
        var pointA3 = new THREE.Vector3();
        pointA1.fromBufferAttribute(positionAttribute, i3);

        const intersects1 = getIntersectsFromPoint(pointA1);
        const intersects2 = getIntersectsFromPoint(pointA2);
        const intersects3 = getIntersectsFromPoint(pointA3);

        if (
          intersects1.length === 0 ||
          intersects2.length === 0 ||
          intersects3.length === 0 ||
          true
        ) {
          colorAttr.setXYZ(i1, r, g, b);
          colorAttr.setXYZ(i2, r, g, b);
          colorAttr.setXYZ(i3, r, g, b);
        }
      }

      // for (let i = 0, l = indices.length; i < l; i++) {
      //   const i2 = indexAttr.getX(indices[i]);

      //   var positionAttribute = left.mesh!.geometry.attributes.position;
      //   var pointA = new THREE.Vector3();
      //   pointA.fromBufferAttribute(positionAttribute, i2);
      //   var pointB = left.camera.position;

      //   var direction = new THREE.Vector3()
      //     .subVectors(pointB, pointA)
      //     .normalize();

      //   var ray = new THREE.Raycaster(pointA, direction);
      //   ray.far = pointA.distanceTo(pointB);

      //   var intersects2 = ray.intersectObject(left.mesh!, true);

      //   if (intersects2.length === 0) {
      //     colorAttr.setX(i2, r);
      //     colorAttr.setY(i2, g);
      //     colorAttr.setZ(i2, b);
      //   }
      // }

      colorAttr.needsUpdate = true;
    }
  }
}

let line: any = null;

function updateRightMesh() {
  const colorAttr = left.mesh!.geometry.getAttribute("color");
  const positionAttr = left.mesh!.geometry.getAttribute("position");
  const points = [];
  for (let i = 0; i < colorAttr.count; i++) {
    const index = i * 3; // 每个顶点颜色由3个值组成
    const color = {
      r: colorAttr.array[index],
      g: colorAttr.array[index + 1],
      b: colorAttr.array[index + 2],
    };

    if (color.r !== 255 && color.g !== 255 && color.b !== 255) {
      points.push(
        positionAttr.array[index],
        positionAttr.array[index + 1],
        positionAttr.array[index + 2]
      );
    }
  }

  const geometry = new THREE.BufferGeometry();
  // 创建静态的顶点数据，例子中创建了一个不规则的三角形
  // 注意: 顶点是以x, y, z连续排列的
  const vertices = new Float32Array(points);
  // 创建顶点位置的attribute并添加到geometry中
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

  if (right.mesh) {
    right.scene.remove(right.mesh);
  }

  if (line) {
    right.scene.remove(line);
  }

  if (params.frame) {
    var edges = new THREE.EdgesGeometry(geometry, 180);
    line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0xff0000 })
    );
    right.scene.add(line);
  }

  const mesh = new THREE.Mesh(geometry, rightMaterial);
  right.mesh = mesh;
  right.scene.add(mesh);
}

init();
