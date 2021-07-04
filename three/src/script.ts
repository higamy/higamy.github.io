// npm install @types/node --save-dev
// npm i --save-dev @types/three
// tsc three/src/script.ts -w
// npx webpack --config ./three/src/webpack.config.js

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'


const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcdf2f7);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

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

const light = new THREE.DirectionalLight(0xFFFFE0, 0.5);
light.castShadow = true;
light.shadow.mapSize.width = 256; // 4096 max
light.shadow.mapSize.height = 256;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 1000
light.shadow.camera.right = 50;
light.position.set(10, 10, 10);
scene.add(light);

const lightHelper = new THREE.DirectionalLightHelper(light)
scene.add(lightHelper)

const ambient_light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambient_light);

const sceneMeshes = new Array()

/* Floor */
function add_floor() {
    var geo = new THREE.PlaneGeometry(3000, 3000);

    var planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

    var plane = new THREE.Mesh(geo, planeMaterial);
    plane.rotateX(- Math.PI / 2);
    plane.receiveShadow = true
    scene.add(plane);
}
add_floor();

const SCENE_SCALE_FACTOR = 0.1

function add_house() {
    new GLTFLoader().load('https://higamy.github.io/models/scene.glb',
        (gltf) => {

            gltf.scene.scale.set(SCENE_SCALE_FACTOR, SCENE_SCALE_FACTOR, SCENE_SCALE_FACTOR);
            scene.add(gltf.scene);

            gltf.scene.traverse(function (node) {
                if ((<THREE.Mesh>node).isMesh) {
                    node.frustumCulled = false;
                }

                if (node.name == 'Ground') {
                    node.receiveShadow = true;
                }
                else if (node.name.includes('Container')) {
                    console.log(node.name)
                    node.visible = false;

                    // Add a light
                    let light = new THREE.SpotLight(0xFFFF99, 0.5, 0, Math.PI / 8)
                    light.position.set(node.position.x * SCENE_SCALE_FACTOR, 5 + node.position.y * SCENE_SCALE_FACTOR, node.position.z * SCENE_SCALE_FACTOR)
                    light.target = node;
                    scene.add(light)

                    const lightHelper = new THREE.SpotLightHelper(light)
                    scene.add(lightHelper)
                }
                else {
                    node.castShadow = true;
                }


                sceneMeshes.push(<THREE.Mesh>node)
            });


            //gltf.scene.position.set(-5, 0, -5);

        })
}
add_house()

let mixer: THREE.AnimationMixer
let modelReady = false;

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

renderer.domElement.addEventListener('mousemove', onMouseMove, false);


const raycaster = new THREE.Raycaster();

function onMouseMove(event: MouseEvent) {
    const mouse = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    }

    //console.log(mouse)

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(sceneMeshes, false);

    if (intersects.length > 0) {
        //console.log(sceneMeshes.length + " " + intersects.length)
        console.log(intersects[0].object.name)
    }
}

const clock: THREE.Clock = new THREE.Clock()

function animate() {

    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    // Physics
    let delta = clock.getDelta()
    if (modelReady) mixer.update(delta);

    controls.update(); // This must be called or the damping will not work

    //player.position.set(cubeBody.position.x, cubeBody.position.y, cubeBody.position.z);
    //player.quaternion.set(cubeBody.quaternion.x, cubeBody.quaternion.y, cubeBody.quaternion.z, cubeBody.quaternion.w);
}
animate();

