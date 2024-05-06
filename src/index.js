import Stats from "stats-js";
import * as dat from "three/examples/jsm/libs/lil-gui.module.min.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
  CONTAINED,
  INTERSECTED,
  NOT_INTERSECTED,
} from "three-mesh-bvh";
import { STLLoader } from "three/examples/jsm/Addons.js";

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

const params = {
  size: 30,
  rotate: true,
};

let stats;
let scene, camera, renderer, controls;
let targetMesh, brushMesh, cloneMesh;
let mouse = new THREE.Vector2();
let mouseType = -1,
  brushActive = false;
let lastTime;
let cloneGeometry;
function init() {
  const bgColor = 0x263238 / 2;

  // renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(bgColor, 1);
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);
  renderer.domElement.style.touchAction = "none";

  // scene setup
  scene = new THREE.Scene();
  // scene.fog = new THREE.Fog( 0x263238 / 2, 20, 60 );

  const light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(1, 1, 1);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  let light2 = new THREE.PointLight(0xffffff, 1, 100);
  light2.position.set(0, 10, 0);
  scene.add(light2);
  // geometry setup
  // const radius = 1;
  // const tube = 0.4;
  // const tubularSegments = 800;
  // const radialSegments = 400;

  // const knotGeometry = new THREE.TorusKnotGeometry( radius, tube, tubularSegments, radialSegments ).toNonIndexed();
  // const colorArray = new Uint8Array( knotGeometry.attributes.position.count * 3 );
  // colorArray.fill( 255 );
  // const colorAttr = new THREE.BufferAttribute( colorArray, 3, true );
  // colorAttr.setUsage( THREE.DynamicDrawUsage );
  // knotGeometry.setAttribute( 'color', colorAttr );

  // const knotMaterial = new THREE.MeshStandardMaterial( { color: 0xffffff, roughness: 0.3, metalness: 0, vertexColors: true } );
  // targetMesh = new THREE.Mesh( knotGeometry, knotMaterial );
  // targetMesh.geometry.computeBoundsTree();
  // scene.add( targetMesh );

  // 创建STL加载器并加载模型
  const loader = new STLLoader();
  loader.load("/model.stl", function (geometry) {
    // const material = new THREE.MeshStandardMaterial({
    //   metalness: 1.0, // 设置金属度为 1.0
    //   roughness: 0.5, // 设置粗糙度为 0.5
    //   color: 0xaeaeae, // 设置材质颜色为红色
    //   // map: texture,
    // });
    // 	const knotMaterial = new THREE.MeshStandardMaterial( { color: 0xffffff, roughness: 0.3, metalness: 0, vertexColors: true } );

    // targetMesh = new THREE.Mesh(geometry, knotMaterial);
    // targetMesh.geometry.computeBoundsTree();
    // scene.add(targetMesh);

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
      wireframe: true,
    });
    targetMesh = new THREE.Mesh(geometry, knotMaterial);
    targetMesh.geometry.computeBoundsTree();
    targetMesh.translateX(-500);
    scene.add(targetMesh);
    render();
  });

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
  scene.add(brushMesh);

  // camera setup
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    50
  );
  camera.position.set(0, 1000, 1000);
  camera.far = 10000;
  camera.updateProjectionMatrix();

  // stats setup
  stats = new Stats();
  document.body.appendChild(stats.dom);

  const gui = new dat.GUI();
  gui.add(params, "size").min(1).max(100).step(1);
  gui.add(params, "rotate");
  gui.open();

  window.addEventListener(
    "resize",
    function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false
  );

  window.addEventListener("pointermove", function (e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    brushActive = true;
  });

  window.addEventListener(
    "pointerdown",
    function (e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseType = e.button;

      // disable the controls early if we're over the object because on touch screens
      // we're not constantly tracking where the cursor is.
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      raycaster.firstHitOnly = true;

      const res = raycaster.intersectObject(targetMesh, true);
      brushActive = true;
      controls.enabled = res.length === 0;
    },
    true
  );

  window.addEventListener(
    "pointerup",
    function (e) {
      mouseType = -1;
      if (e.pointerType === "touch") {
        // disable the brush visualization when the pointer action is done only
        // if it's on a touch device.
        brushActive = false;
      }
    },
    true
  );

  window.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  window.addEventListener("wheel", function (e) {
    let delta = e.deltaY;

    if (e.deltaMode === 1) {
      delta *= 40;
    }

    if (e.deltaMode === 2) {
      delta *= 40;
    }

    params.size += delta * 0.0005;
    params.size = Math.max(Math.min(params.size, 100), 1);

    gui.controllersRecursive().forEach((c) => c.updateDisplay());
  });

  controls = new OrbitControls(camera, renderer.domElement);

  controls.addEventListener("start", function () {
    this.active = true;
  });

  controls.addEventListener("end", function () {
    this.active = false;
  });

  lastTime = window.performance.now();
}

function render() {
  requestAnimationFrame(render);
  stats.begin();

  const geometry = targetMesh.geometry;
  const bvh = geometry.boundsTree;
  const colorAttr = geometry.getAttribute("color");
  const indexAttr = geometry.index;
  const newVertices = [];

  if (controls.active || !brushActive) {
    brushMesh.visible = false;
  } else {
    brushMesh.scale.setScalar(params.size);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    raycaster.firstHitOnly = true;

    const res = raycaster.intersectObject(targetMesh, true);
    if (res.length) {
      brushMesh.position.copy(res[0].point);
      controls.enabled = false;
      brushMesh.visible = true;

      const inverseMatrix = new THREE.Matrix4();
      inverseMatrix.copy(targetMesh.matrixWorld).invert();

      const sphere = new THREE.Sphere();
      sphere.center.copy(brushMesh.position).applyMatrix4(inverseMatrix);
      sphere.radius = params.size;

      const indices = [];
      const tempVec = new THREE.Vector3();
      bvh.shapecast({
        intersectsBounds: (box) => {
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

        intersectsTriangle: (tri, i, contained) => {
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

        for (let i = 0, l = indices.length; i < l; i++) {
          const i2 = indexAttr.getX(indices[i]);
          colorAttr.setX(i2, r);
          colorAttr.setY(i2, g);
          colorAttr.setZ(i2, b);
        }

        colorAttr.needsUpdate = true;
      }
    } else {
      controls.enabled = true;
      brushMesh.visible = false;
    }
  }

  const currTime = window.performance.now();
  if (params.rotate) {
    const delta = currTime - lastTime;
    targetMesh.rotation.y += delta * 0.001;
		if(cloneMesh){
			cloneMesh.rotation.y += delta * 0.001;
		}
  }

  lastTime = currTime;

  renderer.render(scene, camera);
  stats.end();
}

init();

const button = document.getElementById("generate");
button.addEventListener("click", () => {
  const colorAttr = targetMesh.geometry.getAttribute("color");
  const positionAttr = targetMesh.geometry.getAttribute("position");
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

  if (points.length) {
    if (cloneMesh) {
      scene.remove(cloneMesh);
    }

    const geometry = new THREE.BufferGeometry();
    // 创建静态的顶点数据，例子中创建了一个不规则的三角形
    // 注意: 顶点是以x, y, z连续排列的
    const vertices = new Float32Array(points);

    // 创建顶点位置的attribute并添加到geometry中
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.computeBoundsTree();

    // 创建材料
    // const material = new THREE.MeshStandardMaterial({
    //   color: 0x00ff00,
    //   roughness: 0.3,
    //   metalness: 0,
    //   vertexColors: true,
    // });

    let material = new THREE.MeshPhongMaterial({
      color: 0x156289, // 基础颜色
      emissive: 0x072534, // 自发颜色
      side: THREE.DoubleSide, // 材质的两面都可见
      flatShading: true, // 平面着色
      shininess: 100, // 高光强度，数值越大越明显
      specular: 0x111111, // 高光颜色，此属性会影响高光的颜色
    });

    // 创建一个Mesh（网格），将geometry和material传递给它
    cloneMesh = new THREE.Mesh(geometry, material);
    cloneMesh.translateX(500);
    scene.add(cloneMesh);
  }
});
