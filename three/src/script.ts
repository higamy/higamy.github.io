// npm install @types/node --save-dev
// npm i --save-dev @types/three
// tsc three/src/script.ts -w
// npx webpack --config ./three/src/webpack.config.js

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'
import { threadId } from 'worker_threads';
import * as CANNON from 'cannon'
import CannonDebugRenderer from './cannonDebugRenderer.js'

const world = new CANNON.World()
world.gravity.set(0, -9.81, 0)


const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcdf2f7);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const cannonDebugRenderer = new CannonDebugRenderer(scene, world);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

document.body.appendChild(renderer.domElement);

camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true
controls.target = new THREE.Vector3(0, 1, 0)

var axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

const light = new THREE.SpotLight(0xffffff, 1, 1000);
light.castShadow = true;
light.shadow.mapSize.width = 1024; // 4096 max
light.shadow.mapSize.height = 1024;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 100
light.position.set(10, 10, 10);
scene.add(light);

const lightHelper = new THREE.SpotLightHelper(light)
scene.add(lightHelper)

/* Floor */
function add_floor() {
    var geo = new THREE.PlaneGeometry(30, 30);

    var planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

    var plane = new THREE.Mesh(geo, planeMaterial);
    plane.rotateX(- Math.PI / 2);
    plane.receiveShadow = true
    scene.add(plane);
}
//add_floor();

function add_house() {
    new GLTFLoader().load('https://higamy.github.io/models/scene.glb',
        (gltf) => {

            gltf.scene.traverse(function (node) {
                if ((<THREE.Mesh>node).isMesh) {
                    node.frustumCulled = false;
                }
                if (node.name == 'Ground') {
                    node.receiveShadow = true;
                }
                else {
                    node.castShadow = true;
                }
            });

            gltf.scene.scale.set(.1, .1, .1);
            //gltf.scene.position.set(-5, 0, -5);
            scene.add(gltf.scene);
        })
}
add_house()

let mixer: THREE.AnimationMixer
let modelReady = false;
let animationActions: THREE.AnimationAction[] = new Array()
let activeAction: THREE.AnimationAction
let lastAction: THREE.AnimationAction
const gltfLoader: GLTFLoader = new GLTFLoader();

/*
gltfLoader.load(
    'https://higamy.github.io/three/dist/models/Character/Character@Idle.glb',
    (gltf) => { scene.add(gltf.scene); }
)
*/
let player;

gltfLoader.load(
    'https://higamy.github.io/three/dist/models/Character/Character@Idle.glb',
    (gltf) => {
        player = gltf.scene;
        console.log(player)

        gltf.scene.traverse(function (node) {
            if ((<THREE.Mesh>node).isMesh) {
                node.castShadow = true;
                node.frustumCulled = false;
                //node.receiveShadow = true;
            }
        });


        //gltf.scene.scale.set(.001, .001, .001)
        mixer = new THREE.AnimationMixer(gltf.scene);

        let animationAction = mixer.clipAction(gltf.animations[0]);
        animationActions.push(animationAction)
        animationsFolder.add(animations, "default")
        activeAction = animationActions[0]
        activeAction.play()
        scene.add(gltf.scene);

        //add an animation from another file
        gltfLoader.load('https://higamy.github.io/three/dist/models/Character/Character@Walking.glb',
            (gltf) => {
                console.log("loaded samba")
                let animationAction = mixer.clipAction((gltf as any).animations[0]);
                animationActions.push(animationAction)
                animationsFolder.add(animations, "samba")

                //add an animation from another file
                gltfLoader.load('https://higamy.github.io/three/dist/models/Character/Character@Running.glb',
                    (gltf) => {
                        console.log("loaded bellydance")
                        let animationAction = mixer.clipAction((gltf as any).animations[0]);
                        animationActions.push(animationAction)
                        animationsFolder.add(animations, "bellydance")

                        //add an animation from another file
                        gltfLoader.load('https://higamy.github.io/three/dist/models/Character/Character@Running.glb',
                            (gltf) => {
                                console.log("loaded goofyrunning");
                                let animationAction = mixer.clipAction(gltf.animations[0]);
                                animationActions.push(animationAction)
                                animationsFolder.add(animations, "goofyrunning")

                                modelReady = true
                            },
                            (xhr) => {
                                console.log((xhr.loaded / xhr.total * 100) + '% loaded')
                            },
                            (error) => {
                                console.log(error);
                            }
                        )
                    },
                    (xhr) => {
                        console.log((xhr.loaded / xhr.total * 100) + '% loaded')
                    },
                    (error) => {
                        console.log(error);
                    }
                )
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded')
            },
            (error) => {
                console.log(error);
            }
        )
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded')
    },
    (error) => {
        console.log(error);
    }
)

const cubeShape = new CANNON.Box(new CANNON.Vec3(.5, .5, .5))
const cubeBody = new CANNON.Body({ mass: 1 });
cubeBody.addShape(cubeShape)
world.addBody(cubeBody)

var animations = {
    default: function () {
        setAction(animationActions[0])
    },
    samba: function () {
        setAction(animationActions[1])
    },
    bellydance: function () {
        setAction(animationActions[2])
    },
    goofyrunning: function () {
        setAction(animationActions[3])
    },
}

const setAction = (toAction: THREE.AnimationAction) => {
    if (toAction != activeAction) {
        lastAction = activeAction
        activeAction = toAction
        //lastAction.stop()
        lastAction.fadeOut(1)
        activeAction.reset()
        activeAction.fadeIn(1)
        activeAction.play()
    }
}

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

const gui = new GUI()
const animationsFolder = gui.addFolder("Animations")
animationsFolder.open()

const clock: THREE.Clock = new THREE.Clock()

function animate() {

    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    // Physics
    let delta = clock.getDelta()
    if (delta > .1) delta = .1
    world.step(delta)
    cannonDebugRenderer.update()

    if (modelReady) mixer.update(clock.getDelta());

    controls.update(); // This must be called or the damping will not work

    //player.position.set(cubeBody.position.x, cubeBody.position.y, cubeBody.position.z);
    //player.quaternion.set(cubeBody.quaternion.x, cubeBody.quaternion.y, cubeBody.quaternion.z, cubeBody.quaternion.w);
}
animate();

