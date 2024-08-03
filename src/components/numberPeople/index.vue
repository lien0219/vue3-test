<template>
    <div class="view-box" id="viewBox"> </div>
</template>

<script setup lang="ts">

import * as THREE from 'three';
import {
    Color,
    Raycaster,
    AmbientLight,
    DirectionalLight,
    Vector2,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    DoubleSide
} from "three";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { type GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { DDSLoader } from "three/examples/jsm/loaders/DDSLoader.js"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import TWEEN from '@tweenjs/tween.js';
import * as dat from 'dat.gui';
import { onMounted, reactive, onBeforeUnmount, watch } from "vue";
import blinkData from "./blendDataBlink.json";
import blinkDataTest from "./blendDataBlinkTest.json"
import createAnimation from "./Converter";
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

type StateType = {
    title: string,
    sceneId: string,
    loaded: boolean
}
interface Array<T> {
    map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[]
}
const { audioTime, startAudio, delay } = useAudioPlayer();

const state: StateType = reactive({
    title: '加载模型',
    sceneId: 'viewBox',
    loaded: false
})

const emit = defineEmits<{(e: "modelStatus", status: string | number | boolean | Array<string | number>): void }>()
const props = defineProps<{
    modelAnimationData: any,
    startAudioWatch: boolean,
    startAudioWatchTime: number | string
}>()

const animationData = ref<null>(null)
let mixer: any | null = null;
// https://file.40017.cn/guide/zhuanti/2024/aomen/a-82.glb      ../public/static/model/a-82.glb
const url: string = "https://file.40017.cn/guide/zhuanti/2024/aomen/a-82.glb";
// const url:string = "./static/model/model.glb";
let scene: object | any;
let camera: object | any;
let renderer: object | undefined | any;
let controls: object | any;
const rayCaster = new Raycaster();
const mouse = new Vector2();
let model: object | Array<string | number> | any;
// let mixer: any = null;
let composer: any;
const clock = new THREE.Clock();
// const gui = new dat.GUI();
let animationFrameId: any;
let gltfData: any
let morphTargetDictionaryEye: any, morphTargetDictionaryEyelash: any, eyeAnimationData: any,
    eyelashAnimation: any, upperTeeth: any, lowerTeeth: any, newClips1: any, childName: Array<any> = []
let startAudioTime = ref(false)
let startAudioTimeWatch: number | string = 0

watch(
    () => props.modelAnimationData,
    (newValue, oldValue) => {
        animationData.value = props.modelAnimationData
        if (animationData.value) {
            startData(animationData.value)
        }
    },
    {
        deep: true,
    }
);

const removeProperties = (data: any, propertiesToRemove: any) => {
    data.forEach((item: any) => {
        // @ts-ignore
        propertiesToRemove.forEach(prop => {
            delete item.blendshapes[prop];
        });
    });
    return data;
}

let currentIndex = ref(0);
let animationDataTime = ref(0)
let actions: any[] = [];
let startTime = 0;

watch(
    () => props.startAudioWatch,
    (newValue, oldValue) => {
        startAudioTime.value = newValue
        console.log("音频状态:", startAudioTime.value);
        if (!startAudioTime.value) {
            console.log("监听结束", actions);
        }
    },
)
watch(
    () => props.startAudioWatchTime,
    (newValue, oldValue) => {
        startAudioTimeWatch = newValue
    }
)
const adjustAnimationTimeScale = (action: any, targetDuration: number) => {
    const clipDuration = action.getClip().duration
    action.timeScale = clipDuration / targetDuration
}
const startData = (data: any) => {
    // 记录开始时间
    startTime = performance.now();

    actions.forEach(action => action.stop());
    actions = [];
    animationDataTime.value = 0;

    animationDataTime.value = data[currentIndex.value].value.data.blendData[data[currentIndex.value].value.data.blendData.length - 1].time;
    let blendData = data[currentIndex.value].value.data.blendData;
    randomAnimationSkeleton();

    if (data && eyeAnimationData && eyelashAnimation) {
        eyeAnimationData.stop();
        eyelashAnimation.stop();
        if (blendData) {
            newClips1 = [
                createAnimation(blendData, morphTargetDictionaryEye, "head"),
                createAnimation(blendData, morphTargetDictionaryEyelash, "jiemao"),
                createAnimation(blendData, upperTeeth, "shangya"),
                createAnimation(blendData, lowerTeeth, "xiaya")
            ];
            // @ts-ignore
            actions = newClips1.map((clip, index) => {
                let clipAction = mixer.clipAction(clip);
                clipAction.setLoop(THREE.LoopOnce);
                clipAction.reset();
                clipAction.play();
                return clipAction;
            });
            // actions.forEach(action => {
            //     adjustAnimationTimeScale(action, animationDataTime.value)
            // })
            let actionPromises = actions.map((action: any) => {
                return new Promise<void>((resolve) => {
                    mixer.addEventListener('finished', (e: any) => {
                        if (e.action === action) {
                            action.stop();
                            resolve();
                        }
                    });
                });
            });

            Promise.all(actionPromises).then(() => {
                console.log("执行完毕");
                nextData(data);
                eyeAnimationData.play();
                eyelashAnimation.play();
            });
            // // @ts-ignore
            // mixer.addEventListener('finished', (e) => {
            //     if (actions.includes(e.action)) {
            //         console.log(
            //             "执行完毕"
            //         );

            //         // @ts-ignore
            //         actions.forEach(action => action.stop());
            //         nextData(data);
            //         eyeAnimationData.play();
            //         eyelashAnimation.play();
            //     }
            // });
        }
    }
};

const nextData = async (data: any) => {

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    console.log(`startData 和 nextData执行间隔: ${elapsedTime / 1000} 秒`);
    console.log(`第${currentIndex.value + 1}个音频时间:`, startAudioTimeWatch, "动画时间", animationDataTime.value);

    currentIndex.value = (currentIndex.value + 1) % data.length;
    if (currentIndex.value !== 0) {
        // setTimeout(() => {
        //     startData(data);
        // }, 180)
        await delay(180)
        startData(data)
    } else {
        setTimeout(() => {
            mixer = startAnimation(
                model,
                gltfData.animations,
                gltfData.animations[6].name,
                "play",
                1,
                "xunhuan"
            );
        });
        defaultData()
        console.log("结束");
    }
};

/*
   ***** 勿删,分组动作衔接优化(如要使用需服务端配合并且删除textArr=[textArr.join()]和注释上面startData\nextData) *****

let actions: any = [];

const startData = (data: any) => {
    animationDataTime.value = data[currentIndex.value].value.data.blendData[data[currentIndex.value].value.data.blendData.length - 1].time;
    let blendData = data[currentIndex.value].value.data.blendData;
    randomAnimationSkeleton();

    if (data && eyeAnimationData && eyelashAnimation) {
        eyeAnimationData.stop();
        eyelashAnimation.stop();
        if (blendData) {
            newClips1 = [
                createAnimation(blendData, morphTargetDictionaryEye, "head"),
                createAnimation(blendData, morphTargetDictionaryEyelash, "jiemao"),
                createAnimation(blendData, upperTeeth, "shangya"),
                createAnimation(blendData, lowerTeeth, "xiaya")
            ];
            // @ts-ignore
            actions = newClips1.map((clip, index) => {
                let clipAction = mixer.clipAction(clip);
                clipAction.setLoop(THREE.LoopOnce);
                clipAction.reset();
                clipAction.play();
                return clipAction;
            });

            mixer.addEventListener('finished', handleAnimationFinished);
        }
    }
};

const handleAnimationFinished = (e: any) => {
    if (actions.includes(e.action)) {
        // @ts-ignore
        actions.forEach(action => action.stop());
        nextData(animationData.value);
        eyeAnimationData.play();
        eyelashAnimation.play();
    }
};

const nextData = async (data: any) => {
    await clearPreviousAnimations();
    currentIndex.value = (currentIndex.value + 1) % data.length;
    if (currentIndex.value !== 0) {
        startData(data);
    } else {
        setTimeout(() => {
            mixer = startAnimation(
                model,
                gltfData.animations,
                gltfData.animations[6].name,
                "play",
                1,
                "xunhuan"
            );
        });
        defaultData();
        console.log("结束");
    }
};

const clearPreviousAnimations = () => {
    if (mixer) {
        mixer.stopAllAction();
        mixer.uncacheRoot(model);
        // @ts-ignore
        newClips1.forEach((clip, index) => {
            let clipAction = mixer.clipAction(clip);
            clipAction.stop();
            mixer.uncacheClip(clip);
        });
        newClips1 = [];
        actions = [];
        mixer.removeEventListener('finished', handleAnimationFinished);
    }
};
*/

const initScene = (): void => {
    scene = new Scene();
    // 0xffffff   0x000000
    // scene.background = new THREE.Color(0x000000)
}

const initCamera = (): void => {
    camera = new PerspectiveCamera(75, window.innerWidth / 2 / (window.innerHeight * 2 / 3), 0.1, 1000);
    // camera = new THREE.OrthographicCamera(
    //     window.innerWidth / -2, window.innerWidth / 2,
    //     window.innerHeight / 2, window.innerHeight / -2,
    //     0.1, 1000
    // );
    // camera.position.z = 5;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
}


const initRenderer = (): void => {
    renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        logarithmicDepthBuffer: true,
        localClippingEnabled: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
        sortObjects: false,
        depthWrite: false,
        depthTest: true,
        autoClear: true,
        precision: 'highp',
    });
    renderer.setSize(window.innerWidth / 2, window.innerHeight * 2 / 3);
    document.getElementById(state.sceneId)?.appendChild(renderer.domElement);
    renderer.outputColorSpace = THREE.sRGBEncoding;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);
    renderer.physicallyCorrectLights = true;
    renderer.setPixelRatio(window.devicePixelRatio * 2);
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMappingExposure = 1;
    renderer.domElement.style.position = '';
    renderer.domElement.style.top = '';
    renderer.domElement.style.left = '';
    // 纹理过滤模式
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    scene.traverse(function (object: object | any) {
        if (object.isMesh) {
            const material = object.material;
            if (material.map) {
                material.map.anisotropy = maxAnisotropy;
                material.map.minFilter = THREE.NearestMipMapNearestFilter;
                material.map.magFilter = THREE.NearestFilter;
            }
            if (material.emissiveMap) material.emissiveMap.anisotropy = maxAnisotropy;
            if (material.bumpMap) material.bumpMap.anisotropy = maxAnisotropy;
            if (material.normalMap) material.normalMap.anisotropy = maxAnisotropy;
        }
    });


    // 伽马校正着色器材质
    const gammaCorrectionMaterial = new THREE.ShaderMaterial({
        uniforms: GammaCorrectionShader.uniforms,
        vertexShader: GammaCorrectionShader.vertexShader,
        fragmentShader: GammaCorrectionShader.fragmentShader,
        blending: THREE.NoBlending,
        depthWrite: false
    });
    // 后处理通道
    const gammaCorrectionPass = new ShaderPass(gammaCorrectionMaterial);
    gammaCorrectionPass.renderToScreen = true;

    // 后处理渲染器
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera)); // 添加场景渲染通道
    composer.addPass(gammaCorrectionPass); // 添加伽马校正后处理通道
}


const initControls = (): void => {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target = new THREE.Vector3();
    controls.update();
    // controls.enableZoom = false;
    // controls.enablePan = false;
    // controls.minPolarAngle = Math.PI / 2.6;
    // controls.maxPolarAngle = Math.PI / 2.6;
    // controls.enableRotate = true;
}

const addGridHelper = (): void => {
    const grid = new THREE.GridHelper(500, 100, 0xffffff, 0xffffff);
    grid.material.opacity = 0.5;
    grid.material.depthWrite = false;
    grid.material.transparent = true;
    grid.position.y = -3;
    scene.add(grid);
}

const addAxesHelper = (): void => {
    const axesHelper = new THREE.AxesHelper(10);
    axesHelper.setColors(0xff0000, 0x00ff00, 0xffff00);
    axesHelper.position.set(0, 0, 0);
    scene.add(axesHelper);
}

const addEnvironment = (): void => {
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(environment).texture;

    const rgbeLoader = new RGBELoader()
    rgbeLoader.load('../public/static/textures/rosendal_plains_1_4k.hdr', (texture: any) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.background = texture;
    });
}

const addLights = (): void => {
    // 环境光
    const ambientLight = new AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    // 左边
    const spotLight1TargetObject = new THREE.Object3D();
    spotLight1TargetObject.position.set(0, 0, 0);
    scene.add(spotLight1TargetObject);
    const spotLight1 = new THREE.SpotLight(0xffffff, 5);
    spotLight1.position.set(-5, 0, 6);
    // spotLight1.castShadow = true;
    spotLight1.angle = Math.PI / 6.5;
    scene.add(spotLight1);
    const spotLight1LightHelper = new THREE.SpotLightHelper(spotLight1, 0xffffff);
    // scene.add(spotLight1LightHelper);
    function rotateSpotlight1(angle: any) {
        const distance = 10;
        spotLight1TargetObject.position.set(
            spotLight1.position.x + distance * Math.cos(angle),
            spotLight1.position.y,
            spotLight1.position.z + distance * Math.sin(angle)
        );
        spotLight1LightHelper.update();
    }

    const spotLight1Angle = THREE.MathUtils.degToRad(0);
    rotateSpotlight1(spotLight1Angle);

    // 右边
    const spotLight2TargetObject = new THREE.Object3D();
    spotLight2TargetObject.position.set(0, 0, 0);
    scene.add(spotLight2TargetObject);
    const spotLight2 = new THREE.SpotLight(0xffffff, 5);
    // spotLight2.castShadow = true;
    spotLight2.angle = Math.PI / 6.5;
    spotLight2.position.set(3, 0, -5);
    scene.add(spotLight2);
    spotLight2.target = spotLight2TargetObject;
    const spotLight2LightHelper = new THREE.SpotLightHelper(spotLight2, 0xffffff);
    // scene.add(spotLight2LightHelper);
    function rotateSpotlight(angle: any) {
        const distance = 10;
        spotLight2TargetObject.position.set(
            spotLight2.position.x + distance * Math.cos(angle),
            spotLight2.position.y,
            spotLight2.position.z + distance * Math.sin(angle)
        );
        spotLight2LightHelper.update();
    }

    const spotLight2Angle = THREE.MathUtils.degToRad(122);
    rotateSpotlight(spotLight2Angle);

    // 前
    const targetObject = new THREE.Object3D();
    targetObject.position.set(1.5, -0.45, 1.5);
    scene.add(targetObject);
    const spotLight3 = new THREE.SpotLight(0xffffff);
    spotLight3.angle = Math.PI / 13;
    spotLight3.intensity = 1;
    spotLight3.position.set(1.5, 0.65, 1.5);
    scene.add(spotLight3);
    const angle = THREE.MathUtils.degToRad(225);
    const distance = 1;
    targetObject.position.set(
        spotLight3.position.x + distance * Math.cos(angle),
        spotLight3.position.y,
        spotLight3.position.z + distance * Math.sin(angle)
    );
    spotLight3.target = targetObject;
    const spotLightHelper = new THREE.SpotLightHelper(spotLight3, 0xffffff)
    // scene.add(spotLightHelper);

    // 后
    const targetObject4 = new THREE.Object3D();
    targetObject4.position.set(0, 0, 0);
    scene.add(targetObject4);
    const spotLight4 = new THREE.SpotLight(0xffffff);
    spotLight4.angle = Math.PI / 38;
    spotLight4.intensity = 10.0;
    spotLight4.position.set(-9, 0.9, -9);
    scene.add(spotLight4);
    const angle4 = THREE.MathUtils.degToRad(45);
    const distance4 = 1;
    targetObject4.position.set(
        spotLight4.position.x + distance4 * Math.cos(angle4),
        spotLight4.position.y,
        spotLight4.position.z + distance4 * Math.sin(angle4)
    );
    spotLight4.target = targetObject4;
    const spotLightHelper4 = new THREE.SpotLightHelper(spotLight4, 0xffffff)
    // scene.add(spotLightHelper4);

    // 半球光源
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    hemiLight.position.set(0, 0, 0);
    hemiLight.color.set(0xffffff); //天空
    hemiLight.groundColor.set(0xffffff); //大地
    hemiLight.intensity = 2;
    scene.add(hemiLight);

}
const defaultData = () => {
    // @ts-ignore
    if (!childName.length) return
    // @ts-ignore
    childName.forEach(child => {
        if (child.isMesh) {
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
                    "rightEyeRoll"
                ];
                let newBlinkData = removeProperties(blinkData, propertiesToRemove)
                morphTargetDictionaryEye = child.morphTargetDictionary;
                let blinkClip = createAnimation(
                    newBlinkData,
                    morphTargetDictionaryEye,
                    "head"
                );

                setTimeout(() => {
                    eyeAnimationData = mixer.clipAction(blinkClip);
                    eyeAnimationData.play();

                    const mouthRight = findMorphTargetIndex(child.morphTargetDictionary, 'mouthRight');
                    const mouthLeft = findMorphTargetIndex(child.morphTargetDictionary, 'mouthLeft');
                    const mouthSmileLeft = findMorphTargetIndex(child.morphTargetDictionary, 'mouthSmileLeft');
                    const mouthSmileRight = findMorphTargetIndex(child.morphTargetDictionary, 'mouthSmileRight');
                    const mouthPressLeft = findMorphTargetIndex(child.morphTargetDictionary, 'mouthPressLeft');
                    const mouthPressRight = findMorphTargetIndex(child.morphTargetDictionary, 'mouthPressRight');
                    const mouthDimpleRight = findMorphTargetIndex(child.morphTargetDictionary, 'mouthDimpleRight');

                    child.morphTargetInfluences[mouthRight] = 0.3;
                    child.morphTargetInfluences[mouthLeft] = 0.29;
                    child.morphTargetInfluences[mouthPressLeft] = 0.1;
                    child.morphTargetInfluences[mouthPressRight] = 0.1;
                    child.morphTargetInfluences[mouthSmileLeft] = 0.27;
                    child.morphTargetInfluences[mouthSmileRight] = 0.27;
                    child.morphTargetInfluences[mouthDimpleRight] = 0.24;

                })


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
                    "rightEyeRoll"
                ]
                let newBlinkData2 = removeProperties(blinkData, propertiesToRemove2)
                morphTargetDictionaryEyelash = child.morphTargetDictionary
                let blinkClip = createAnimation(newBlinkData2, morphTargetDictionaryEyelash, "jiemao")
                setTimeout(() => {
                    eyelashAnimation = mixer.clipAction(blinkClip)
                    eyelashAnimation.play()
                });
            }
        }
    });

}
const findMorphTargetIndex = (influences: any, targetKey: any) => {
    return influences[targetKey];
}
const loadModel = async (): Promise<void> => {

    const manager = new THREE.LoadingManager();
    manager.onStart = (url: string, itemsLoaded: string | number, itemsTotal: string | number) => {
        console.log('开始加载: ' + url + '.\n加载到: ' + itemsLoaded + ' || ' + '共' + itemsTotal);
    };
    manager.onLoad = () => {
        console.log('加载完成');
        setTimeout(() => {
            mixer = startAnimation(
                model,
                gltfData.animations,
                gltfData.animations[6].name,
                "play",
                1,
                "xunhuan"
            );
        })
    };
    manager.onProgress = (url: string, itemsLoaded: number | string, itemsTotal: string | number) => {
        console.log('加载进度: ' + url + '.\n加载到:' + itemsLoaded + ' || ' + '共' + itemsTotal);
    };
    manager.onError = (url: string) => {
        console.log('加载失败' + url);
    };
    THREE.Cache.enabled = true;

    const loader = new GLTFLoader(manager);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('../public/static/draco/');
    // dracoLoader.setDecoderPath('./static/draco/');
    loader.setDRACOLoader(dracoLoader);
    try {
        const gltf = await loader.loadAsync(url);
        gltfData = gltf
        const box = new THREE.Box3().setFromObject(gltf.scene)
        const size = box.getSize(new THREE.Vector3()).length()
        const center = box.getCenter(new THREE.Vector3())
        gltf.scene.position.x -= center.x
        gltf.scene.position.y -= center.y
        gltf.scene.position.z -= center.z
        camera.near = size / 100;
        camera.far = size * 100;
        camera.updateProjectionMatrix();
        const cameraOffsetY = size / 4;
        camera.position.copy(center);
        camera.position.x += size / 2;
        camera.position.y += size / 2 - cameraOffsetY;
        camera.position.z += size / 2;
        camera.lookAt(center);
        scene.add(gltf.scene);
        controls.target.set(center.x, center.y, center.z);
        controls.update();

        gltf.scene.traverse((child: any) => {
            // @ts-ignore
            childName.push(child)
            if (child.isMesh) {
                // 几何体和材质
                const geometry = child.geometry;
                geometry.computeVertexNormals();
                const material = child.material;
                manager.morphTargets = true
                // console.log("模型几何体:", geometry, "模型材质:", material);
                // console.log("模型子对象", child);
                // console.log("对象名称", child.name);
                // console.log("目标", child.morphTargetDictionary);
                // console.log("目标影响:", child.morphTargetInfluences);

                child.material.side = DoubleSide;
                if (child.name == "toufa") {
                    child.material.metalness = 1;
                    child.material.roughness = 1;
                    child.material.needsUpdate = true
                }
                if (child.name == "yifu") {
                    child.material.metalness = 0.7;
                    child.material.roughness = 0.9;
                    child.material.needsUpdate = true
                    // 目标影响(嘴,眼睛)
                    // child.morphTargetInfluences[0] = 0
                    // child.morphTargetInfluences[1] = 0
                    // child.morphTargetInfluences[2] = 0
                }
                if (child.name == "head") {
                    // console.log(child.morphTargetDictionary, "目标");
                    // console.log(child.morphTargetInfluences, "影响");
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
                        "rightEyeRoll"
                    ];
                    let newBlinkData = removeProperties(blinkData, propertiesToRemove)
                    morphTargetDictionaryEye = child.morphTargetDictionary;
                    let blinkClip = createAnimation(
                        newBlinkData,
                        morphTargetDictionaryEye,
                        "head"
                    );

                    setTimeout(() => {
                        eyeAnimationData = mixer.clipAction(blinkClip);
                        eyeAnimationData.play();
                        const mouthRight = findMorphTargetIndex(child.morphTargetDictionary, 'mouthRight')
                        const mouthLeft = findMorphTargetIndex(child.morphTargetDictionary, 'mouthLeft')
                        const mouthSmileLeft = findMorphTargetIndex(child.morphTargetDictionary, 'mouthSmileLeft')
                        const mouthSmileRight = findMorphTargetIndex(child.morphTargetDictionary, 'mouthSmileRight')
                        const mouthPressLeft = findMorphTargetIndex(child.morphTargetDictionary, 'mouthPressLeft')
                        const mouthPressRight = findMorphTargetIndex(child.morphTargetDictionary, 'mouthPressRight')
                        const mouthDimpleRight = findMorphTargetIndex(child.morphTargetDictionary, 'mouthDimpleRight')
                        child.morphTargetInfluences[mouthRight] = 0.3
                        child.morphTargetInfluences[mouthLeft] = 0.29
                        child.morphTargetInfluences[mouthPressLeft] = 0.1
                        child.morphTargetInfluences[mouthPressRight] = 0.1
                        child.morphTargetInfluences[mouthSmileLeft] = 0.27
                        child.morphTargetInfluences[mouthSmileRight] = 0.27
                        child.morphTargetInfluences[mouthDimpleRight] = 0.24
                    })


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
                        "rightEyeRoll"
                    ]
                    let newBlinkData2 = removeProperties(blinkData, propertiesToRemove2)
                    morphTargetDictionaryEyelash = child.morphTargetDictionary
                    let blinkClip = createAnimation(newBlinkData2, morphTargetDictionaryEyelash, "jiemao")
                    setTimeout(() => {
                        eyelashAnimation = mixer.clipAction(blinkClip)
                        eyelashAnimation.play()
                    });
                }
                if (child.name == "shangya") {
                    upperTeeth = child.morphTargetDictionary

                }
                if (child.name == "xiaya") {
                    lowerTeeth = child.morphTargetDictionary
                }

                // 阴影
                // child.castShadow = true;
                // child.receiveShadow = true;
                child.frustumCulled = false;
                child.geometry.computeBoundingBox();
                child.geometry.computeBoundingSphere();

                // console.log(child.material.normalMap,"法线贴图");
                if (child.material.normalMap) {
                    // 法线贴图向异性和滤镜
                    child.material.normalMap.minFilter = THREE.LinearMipMapLinearFilter;
                    child.material.normalMap.magFilter = THREE.LinearFilter;
                    child.material.normalMap.anisotropy = THREE.maxAnisotropy;
                }
                // 环境光遮蔽着色器
                const ambientLight = new THREE.AmbientLight(0x404040);
                scene.add(ambientLight);
                if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
                    child.material.aoMapIntensity = 1;
                }
                // 次表面散射
                if (child.material.isMeshPhysicalMaterial) {
                    child.material.subsurfaceScattering = true;
                    child.material.subsurfaceScatteringRadius = 1.5;
                    child.material.subsurfaceScatteringColor = new THREE.Color(0xffffff);
                }

                if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
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

        model = gltf.scene;
        model.scale.set(1, 1, 1);
        model.position.set(0, -0.1, 0)
        model.rotation.y = Math.PI / 4;
        //     mixer = startAnimation(
        //         model,
        //         gltf.animations,
        //         gltf.animations[0].name,
        //         "play",
        //         1,
        //          "yici"
        //     );

        state.loaded = true;
        emit("modelStatus", state.loaded);

        renderer.domElement.addEventListener('click', clickEvent, false);
    } catch (error) {
        console.error('模型加载异常:', error);
    }
}
const stopAllAimations = () => {
    if (eyeAnimationData && eyelashAnimation && newClips1) {
        newClips1.forEach((item: object, index: number) => {
            let clipAction = mixer.clipAction(newClips1[index]);
            clipAction.stop();
        })
        newClips1 = []
        for (let index = 0; index < gltfData.animations.slice(0, 4).length; index++) {
            mixer = startAnimation(
                model,
                gltfData.animations,
                gltfData.animations[index].name,
                "stop",
                1,
                "wu"
            );
        }
        defaultData()
        mixer = startAnimation(
            model,
            gltfData.animations,
            gltfData.animations[6].name,
            "play",
            1,
            "xunhuan"
        );
    }
}
const clickEvent = (event: MouseEvent): void => {
    if (!state.loaded) {
        console.log('模型尚未加载完成');
        return;
    }
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    rayCaster.setFromCamera(mouse, camera);
    const intersects = rayCaster.intersectObjects(model.children, true);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        console.log('模型选中:', intersectedObject);
        console.log(animationData.value, "接收");

        // if (intersectedObject) {
        // mixer = startAnimation(
        //     model,
        //     gltfData.animations,
        //     gltfData.animations[5].name,
        //     "play",
        //     1,
        //     "yici"
        // );
        // }

        // newClips1.forEach((item: object, index: number) => {
        //     let clipAction = mixer.clipAction(newClips1[index]);
        //     clipAction.stop();
        // })
        // defaultData()
        // eyeAnimationData.play()
        // eyelashAnimation.play()

    } else {
        console.log('未选中');
    }
}
const random0To4 = () => {
    return Math.floor(Math.random() * 5);
}
const randomAnimationSkeleton = () => {
    if (gltfData) {
        let assemble = 0;
        for (let index = 0; index < gltfData.animations.slice(0, 4).length; index++) {
            assemble += gltfData.animations.slice(0, 4)[index].duration
        }
        if (animationDataTime.value > assemble) {
            // 所有动作依次执行
            mixer = startAnimation(
                model,
                gltfData.animations,
                gltfData.animations[4].name,
                "play",
                1,
                "yici"
            );
        } else if (animationDataTime.value < assemble && animationDataTime.value > gltfData.animations.slice(0, 4)[0].duration) {
            // 随机
            let random = random0To4()
            mixer = startAnimation(
                model,
                gltfData.animations,
                gltfData.animations[random].name,
                "play",
                1,
                "yici"
            );
        } else if (animationDataTime.value < gltfData.animations.slice(0, 4)[3].duration) {
            // 播放第三个动作
        } else return
        // mixer = startAnimation(
        //     model,
        //     gltfData.animations,
        //     gltfData.animations[0].name,
        //     "play",
        //     1,
        //     "yici"
        // );
        mixer.addEventListener('finished', (e: any) => {
            if (gltfData.animations[0].name == e.action._clip.name) {
                console.log(e.action, "骨骼结束");
            }
        });
    }
}


const startAnimation = (skinnedMesh: unknown, animations: unknown, animationName: string, animationState: string, timeScale: number, limitation: string): object => {
    const m_mixer = new THREE.AnimationMixer(skinnedMesh);
    const clip = THREE.AnimationClip.findByName(animations, animationName);
    if (clip) {
        const action = m_mixer.clipAction(clip);
        if (animationState == "play") {
            action.play();
            if (limitation == "yici") {
                action.timeScale = timeScale
                action.loop = THREE.LoopOnce;
                action.clampWhenFinished = false
            } else if (limitation == "xunhuan" || limitation == "wu") {
                action.play();
            }

        } else if (animationState == "stop") {
            action.stop()
        } else if (animationState == "pause") {
            if (action.paused) {
                action.paused = false
            } else {
                action.paused = true
            }
        }

    }
    return m_mixer;
};
const animate = (): void => {
    animationFrameId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) {
        try {
            mixer.update(delta);
        } catch (error) {
            console.error("动画更新错误:", error);
        }

        // @ts-ignore
        // childName.forEach(child => {
        //     if (child.isMesh && child.name == "head") {
        //         const mouthRight = findMorphTargetIndex(child.morphTargetDictionary, 'mouthRight');
        //         const mouthLeft = findMorphTargetIndex(child.morphTargetDictionary, 'mouthLeft');
        //         const mouthSmileLeft = findMorphTargetIndex(child.morphTargetDictionary, 'mouthSmileLeft');
        //         const mouthSmileRight = findMorphTargetIndex(child.morphTargetDictionary, 'mouthSmileRight');
        //         const mouthPressLeft = findMorphTargetIndex(child.morphTargetDictionary, 'mouthPressLeft');
        //         const mouthPressRight = findMorphTargetIndex(child.morphTargetDictionary, 'mouthPressRight');
        //         const mouthDimpleRight = findMorphTargetIndex(child.morphTargetDictionary, 'mouthDimpleRight');

        //         child.morphTargetInfluences[mouthRight] = 0.3;
        //         child.morphTargetInfluences[mouthLeft] = 0.29;
        //         child.morphTargetInfluences[mouthPressLeft] = 0.1;
        //         child.morphTargetInfluences[mouthPressRight] = 0.1;
        //         child.morphTargetInfluences[mouthSmileLeft] = 0.27;
        //         child.morphTargetInfluences[mouthSmileRight] = 0.27;
        //         child.morphTargetInfluences[mouthDimpleRight] = 0.24;
        //     }
        // });
    }
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    composer.render();
    renderer.setRenderTarget(null);
}

const renderThree = (): void => {
    initScene();
    initCamera();
    initRenderer();
    initControls();
    // addGridHelper();
    // addEnvironment();
    addLights();
    loadModel();
    // addAxesHelper();
    animate();
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / 2 / (window.innerHeight * 2 / 3);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth / 2, window.innerHeight * 2 / 3);
});
onMounted(() => {
    renderThree()
    renderer.domElement.removeEventListener('click', clickEvent);
})

onBeforeUnmount(() => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
    }
    if (renderer) {
        renderer.dispose()
    }
    renderer.domElement.removeEventListener('click', clickEvent);
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
defineExpose({ stopAllAimations })
</script>

<style scoped></style>
