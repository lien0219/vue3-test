<template>
  <div class="view-box" id="viewBox"></div>
</template>

<script setup lang="ts">
import * as THREE from "three";
import {
  Color,
  Raycaster,
  AmbientLight,
  DirectionalLight,
  Vector2,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  DoubleSide,
} from "three";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { type GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { DDSLoader } from "three/examples/jsm/loaders/DDSLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import TWEEN from "@tweenjs/tween.js";
import * as dat from "dat.gui";
import { onMounted, reactive, onBeforeUnmount, watch } from "vue";
import blinkData from "./blendDataBlink.json";
import blinkDataTest from "./blendDataBlinkTest.json";
import createAnimation from "./Converter";
import backgroundImage from "./a.jpg";

const state = reactive({
  title: "加载模型",
  sceneId: "viewBox",
  loaded: false,
});

let mixer = null;
// https://file.40017.cn/guide/zhuanti/2024/aomen/a-82.glb      ../public/static/model/a-82.glb
const url = "https://file.40017.cn/guide/zhuanti/2024/aomen/a-82.glb";
// const url:string = "./static/model/model.glb";
let scene;
let camera;
let renderer;
let controls;
const rayCaster = new Raycaster();
const mouse = new Vector2();
let model;
// let mixer: any = null;
let composer;
const clock = new THREE.Clock();
// const gui = new dat.GUI();
let animationFrameId;
let gltfData;
let morphTargetDictionaryEye,
  morphTargetDictionaryEyelash,
  eyeAnimationData,
  eyelashAnimation,
  upperTeeth,
  lowerTeeth,
  newClips1,
  childName = [];

const initScene = () => {
  scene = new Scene();
  // 0xffffff   0x000000
  // scene.background = new THREE.Color(0xbbbbbb)
  const loader = new THREE.TextureLoader();
  // @ts-ignore
  loader.load(backgroundImage, (texture) => {
    texture.encoding = THREE.sRGBEncoding;
    scene.background = texture;
  });
};

const initCamera = () => {
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  camera.position.set(
    -0.06749098951508223,
    1.096669701522883,
    3.7314463955366644
  );
  camera.updateProjectionMatrix();
};

const initRenderer = () => {
  renderer = new WebGLRenderer({
    antialias: false,
    alpha: true,
    logarithmicDepthBuffer: true,
    localClippingEnabled: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
    sortObjects: false,
    depthWrite: false,
    depthTest: true,
    autoClear: true,
    precision: "highp",
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById(state.sceneId)?.appendChild(renderer.domElement);
  //设置色调映射
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.7;
  renderer.shadowMap.enabled = true;
  renderer.physicallyCorrectLights = true;
  renderer.setPixelRatio(window.devicePixelRatio * 2);
  renderer.gammaOutput = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.soft = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
};

const initControls = () => {
  // controls = new OrbitControls(camera, renderer.domElement);
  // controls.enableDamping = true;
  // controls.dampingFactor = 0.05;
  // controls.target = new THREE.Vector3();
  // controls.update();
  // // controls.enableZoom = false;
  // // controls.enablePan = false;
  // // controls.minPolarAngle = Math.PI / 2.6;
  // // controls.maxPolarAngle = Math.PI / 2.6;
  // // controls.enableRotate = true;
  // 初始化控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.update();
};

const addGridHelper = () => {
  const grid = new THREE.GridHelper(500, 100, 0xffffff, 0xffffff);
  grid.material.opacity = 0.5;
  grid.material.depthWrite = false;
  grid.material.transparent = true;
  grid.position.y = -3;
  scene.add(grid);
};

const addAxesHelper = () => {
  const axesHelper = new THREE.AxesHelper(10);
  axesHelper.setColors(0xff0000, 0x00ff00, 0xffff00);
  axesHelper.position.set(0, 0, 0);
  scene.add(axesHelper);
};

const addEnvironment = () => {
  const environment = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(environment).texture;

  const rgbeLoader = new RGBELoader();
  // 2.hdr   cobblestone_street_night_1k.hdr
  rgbeLoader.load(
    "../public/static/textures/venice_sunset_1k.hdr",
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      // scene.background = texture;
    }
  );
};

const addLights = () => {
  const ambientLight = new AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  // 半球光源
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.5);
  scene.add(hemisphereLight);

  // 平行光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true;
  // 阴影属性
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  scene.add(directionalLight);
};

const removeProperties = (data, propertiesToRemove) => {
  data.forEach((item) => {
    // @ts-ignore
    propertiesToRemove.forEach((prop) => {
      delete item.blendshapes[prop];
    });
  });
  return data;
};
const findMorphTargetIndex = (influences, targetKey) => {
  return influences[targetKey];
};
// 肤色
const skinColor = new THREE.Color(0xffcc99);

const loadModel = async () => {
  const manager = new THREE.LoadingManager();
  manager.onStart = (url, itemsLoaded, itemsTotal) => {
    console.log(
      "开始加载: " +
        url +
        ".\n加载到: " +
        itemsLoaded +
        " || " +
        "共" +
        itemsTotal
    );
  };
  manager.onLoad = () => {
    console.log("加载完成");
  };
  manager.onProgress = (url, itemsLoaded, itemsTotal) => {
    console.log(
      "加载进度: " +
        url +
        ".\n加载到:" +
        itemsLoaded +
        " || " +
        "共" +
        itemsTotal
    );
  };
  manager.onError = (url) => {
    console.log("加载失败" + url);
  };
  THREE.Cache.enabled = true;

  const loader = new GLTFLoader(manager);
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("../public/static/draco/");
  // dracoLoader.setDecoderPath('./static/draco/');
  loader.setDRACOLoader(dracoLoader);
  try {
    const gltf = await loader.loadAsync(url);
    gltfData = gltf;
    model = gltf.scene;
    mixer = new THREE.AnimationMixer(model);
    gltf.scene.traverse((child) => {
      // @ts-ignore
      childName.push(child);
      if (child.isMesh) {
        // child.material.metalness = 0.5;
        // child.material.roughness = 0.5;
        child.material.needsUpdate = true;
        child.castShadow = true;

        // child.material = material;
        // child.material.needsUpdate = true; // 确保材质更新
        // 几何体和材质
        // const geometry = child.geometry;
        // geometry.computeVertexNormals();
        // const material = child.material;
        // manager.morphTargets = true
        // console.log("模型几何体:", geometry, "模型材质:", material);
        // console.log("模型子对象", child);
        // console.log("对象名称", child.name);
        // console.log("目标", child.morphTargetDictionary);
        // console.log("目标影响:", child.morphTargetInfluences);

        // child.material.side = DoubleSide;

        child.material.side =
          THREE.DoubleSide || THREE.FrontSide || THREE.BackSide;

        if (child.material.normalMap) {
          child.material.normalMap.minFilter = THREE.LinearMipMapLinearFilter;
          child.material.normalMap.magFilter = THREE.LinearFilter;
          child.material.normalMap.anisotropy =
            renderer.capabilities.getMaxAnisotropy();
        }

        if (child.name == "shenti") {
          //   @ts-ignore
          child.material.onBeforeCompile = (shader) => {
            shader.vertexShader = shader.vertexShader.replace(
              "#include <uv_pars_vertex>",
              `
                            varying vec2 vUv;
                            #include <uv_pars_vertex>
                            `
            );
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              `
                            vUv = uv;
                            #include <begin_vertex>
                            `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <uv_pars_fragment>",
              `
                            varying vec2 vUv;
                            #include <uv_pars_fragment>
                            `
            );
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <output_fragment>",
              `
                            gl_FragColor = vec4(${skinColor.r}, ${skinColor.g}, ${skinColor.b}, 1.0);
                            #include <output_fragment>
                            `
            );
          };
          // child.material.metalness = 0.5;
          // child.material.roughness = 0.5;
          child.material.needsUpdate = true;
        }

        if (child.name == "yifu") {
          child.material.metalness = 1.0;
          child.material.roughness = 0.8;
          child.material.needsUpdate = true;
          // 目标影响(嘴,眼睛)
          // child.morphTargetInfluences[0] = 0
          // child.morphTargetInfluences[1] = 0
          // child.morphTargetInfluences[2] = 0
        }
        if (child.name == "head") {
          let propertiesToRemove = [
            "jawForward",
            "jawLeft",
            "jawRight",
            "jawOpen",
            "mouthClose",
            "mouthFunnel",
            "mouthPucker",
            "mouthFrownLeft",
            "mouthFrownRight",
            "mouthDimpleLeft",
            "mouthStretchLeft",
            "mouthStretchRight",
            "mouthRollLower",
            "mouthRollUpper",
            "mouthShrugLower",
            "mouthShrugUpper",
            "outhLowerDownLeft",
            "mouthLowerDownRight",
            "mouthUpperUpLeft",
            "mouthUpperUpRight",
            "browDownLeft",
            "browDownRight",
            "browInnerUp",
            "browOuterUpLeft",
            "browOuterUpRight",
            "cheekPuff",
            "cheekSquintLeft",
            "cheekSquintRight",
            "noseSneerLeft",
            "noseSneerRight",
            "tongueOut",
            "headRoll",
            "leftEyeRoll",
            "rightEyeRoll",
          ];
          let newBlinkData = removeProperties(blinkData, propertiesToRemove);
          morphTargetDictionaryEye = child.morphTargetDictionary;
          let blinkClip = createAnimation(
            newBlinkData,
            morphTargetDictionaryEye,
            "head"
          );

          setTimeout(() => {
            eyeAnimationData = mixer.clipAction(blinkClip);
            eyeAnimationData.play();

            const mouthSmileLeft = findMorphTargetIndex(
              child.morphTargetDictionary,
              "mouthSmileLeft"
            );
            const mouthSmileRight = findMorphTargetIndex(
              child.morphTargetDictionary,
              "mouthSmileRight"
            );
            const mouthPressLeft = findMorphTargetIndex(
              child.morphTargetDictionary,
              "mouthPressLeft"
            );
            const mouthPressRight = findMorphTargetIndex(
              child.morphTargetDictionary,
              "mouthPressRight"
            );

            child.morphTargetInfluences[mouthPressLeft] = 0.12;
            child.morphTargetInfluences[mouthPressRight] = 0.12;
            child.morphTargetInfluences[mouthSmileLeft] = 0.17;
            child.morphTargetInfluences[mouthSmileRight] = 0.17;
          });
        }
        if (child.name == "jiemao") {
          let propertiesToRemove2 = [
            "jawForward",
            "jawLeft",
            "jawRight",
            "jawOpen",
            "mouthClose",
            "mouthFunnel",
            "mouthPucker",
            "mouthLeft",
            "mouthRight",
            "mouthSmileLeft",
            "mouthSmileRight",
            "mouthFrownLeft",
            "mouthFrownRight",
            "mouthDimpleLeft",
            "mouthDimpleRight",
            "mouthStretchLeft",
            "mouthStretchRight",
            "mouthRollLower",
            "mouthRollUpper",
            "mouthShrugLower",
            "mouthShrugUpper",
            "mouthPressLeft",
            "mouthPressRight",
            "mouthLowerDownLeft",
            "mouthLowerDownRight",
            "mouthUpperUpLeft",
            "mouthUpperUpRight",
            "browDownLeft",
            "browDownRight",
            "browInnerUp",
            "browOuterUpLeft",
            "browOuterUpRight",
            "cheekPuff",
            "cheekSquintLeft",
            "cheekSquintRight",
            "noseSneerLeft",
            "noseSneerRight",
            "tongueOut",
            "headRoll",
            "leftEyeRoll",
            "rightEyeRoll",
          ];
          let newBlinkData2 = removeProperties(blinkData, propertiesToRemove2);
          morphTargetDictionaryEyelash = child.morphTargetDictionary;
          let blinkClip = createAnimation(
            newBlinkData2,
            morphTargetDictionaryEyelash,
            "jiemao"
          );
          setTimeout(() => {
            eyelashAnimation = mixer.clipAction(blinkClip);
            eyelashAnimation.play();
          });
        }
        // if (child.name == "shangya") {
        //     upperTeeth = child.morphTargetDictionary

        // }
        // if (child.name == "xiaya") {
        //     lowerTeeth = child.morphTargetDictionary
        // }
        if (child.material.normalMap) {
          // 法线贴图向异性和滤镜
          child.material.normalMap.minFilter = THREE.LinearMipMapLinearFilter;
          child.material.normalMap.magFilter = THREE.LinearFilter;
          child.material.normalMap.anisotropy = THREE.maxAnisotropy;
        }
        // 环境光遮蔽着色器
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        if (
          child.material.isMeshStandardMaterial ||
          child.material.isMeshPhysicalMaterial
        ) {
          child.material.aoMapIntensity = 1;
        }
        // 次表面散射
        if (child.material.isMeshPhysicalMaterial) {
          child.material.subsurfaceScattering = true;
          child.material.subsurfaceScatteringRadius = 1.5;
          child.material.subsurfaceScatteringColor = new THREE.Color(0xffffff);
        }

        if (
          child.material.isMeshStandardMaterial ||
          child.material.isMeshPhysicalMaterial
        ) {
          // 材质颜色使用sRGB
          child.material.color.convertSRGBToLinear();
          if (child.material.map) {
            child.material.map.encoding = THREE.sRGBEncoding;
          }
          if (child.material.emissiveMap) {
            child.material.emissiveMap.encoding = THREE.sRGBEncoding;
          }
          if (child.material.map) {
            child.material.map.encoding = THREE.sRGBEncoding;
          }
        }
        // 兼容透明材质显示问题
        if (child.material.transparent) {
          child.material.opacity = child.material.opacity || 1;
          child.material.transparent = true;
          child.material.depthWrite = false;
        }
        child.geometry.dispose();
        child.material.dispose();
      }
    });
    model.position.set(0, 0, 0);

    const groundGeometry = new THREE.PlaneGeometry(5, 5);
    const groundMaterial = new THREE.ShadowMaterial({
      opacity: 0.5,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    scene.add(model);

    state.loaded = true;

    renderer.domElement.addEventListener("click", clickEvent, false);
  } catch (error) {
    console.error("模型加载异常:", error);
  }
};

const startAnimation = (
  skinnedMesh,
  animations,
  animationName,
  animationState,
  timeScale,
  limitation
) => {
  const m_mixer = new THREE.AnimationMixer(skinnedMesh);
  const clip = THREE.AnimationClip.findByName(animations, animationName);
  if (clip) {
    const action = m_mixer.clipAction(clip);
    if (animationState == "play") {
      action.play();
      if (limitation == "yici") {
        action.timeScale = timeScale;
        action.loop = THREE.LoopOnce;
        action.clampWhenFinished = false;
      } else if (limitation == "xunhuan" || limitation == "wu") {
        action.play();
      }
    } else if (animationState == "stop") {
      action.stop();
    } else if (animationState == "pause") {
      if (action.paused) {
        action.paused = false;
      } else {
        action.paused = true;
      }
    }
  }
  return m_mixer;
};

const clickEvent = (event) => {
  if (!state.loaded) {
    console.log("模型尚未加载完成");
    return;
  }
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  rayCaster.setFromCamera(mouse, camera);
  const intersects = rayCaster.intersectObjects(model.children, true);

  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object;
    console.log("模型选中:", intersectedObject);

    if (intersectedObject) {
      mixer = startAnimation(
        model,
        gltfData.animations,
        gltfData.animations[5].name,
        "play",
        1,
        "yici"
      );
    }
  } else {
    console.log("未选中");
  }
};
const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) {
    try {
      mixer.update(delta);
    } catch (error) {
      console.error("动画更新错误:", error);
    }
  }
  // renderer.setRenderTarget(null);
  renderer.render(scene, camera);
  controls.update();
};

const renderThree = () => {
  initScene();
  initCamera();
  initRenderer();
  initControls();
  // addGridHelper();
  addEnvironment();
  addLights();
  loadModel();
  // addAxesHelper();
  animate();
};
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
onMounted(() => {
  renderThree();
  renderer.domElement.removeEventListener("click", clickEvent);
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  if (renderer) {
    renderer.dispose();
  }
  renderer.domElement.removeEventListener("click", clickEvent);
  if (mixer) {
    mixer.stopAllAction();
    for (const action of mixer.actions) {
      action.stop();
    }
    mixer.dispose();
  }
  scene.traverse((child: any) => {
    if (child.isMesh) {
      child.geometry.dispose();
      child.material.dispose();
    }
  });
});
</script>

<style scoped></style>
