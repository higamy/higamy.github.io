// npm install @types/node --save-dev
// npm i --save-dev @types/three
// tsc three/src/script.ts -w
// npx webpack --config ./three/src/webpack.config.js

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const scene = new THREE.Scene();
const background_colour: number = 0x95776d;
scene.background = new THREE.Color(background_colour);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

document.body.appendChild(renderer.domElement);

camera.position.x = 3;
camera.position.y = 6;
camera.position.z = 6;

let viewing_exhibit: boolean = false;

const projectNameTitle: HTMLElement = document.getElementById('projectNameTitle');
const projectDescriptionContainer: HTMLElement = document.getElementById('projectDescriptionContainer');
const closeDescriptionButton: HTMLElement = document.getElementById('closeDescriptionButton');

closeDescriptionButton.addEventListener('click', () => {
    currently_selected_exhibit.deselect();
})


var axesHelper = new THREE.AxesHelper(5)
//scene.add(axesHelper)

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
//scene.add(lightHelper)

const ambient_light = new THREE.AmbientLight(0x404040, 2); // soft white light
scene.add(ambient_light);

const near = 1;
const far = 30;
scene.fog = new THREE.Fog(background_colour, near, far);

const containerMeshes = new Array

const controls = new OrbitControls(camera, renderer.domElement);
/* Floor */
function add_floor() {
    var geo = new THREE.PlaneGeometry(3000, 3000);

    var planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

    var plane = new THREE.Mesh(geo, planeMaterial);
    plane.rotateX(- Math.PI / 2);
    plane.receiveShadow = true
    scene.add(plane);


}
//add_floor();

camera.lookAt(new THREE.Vector3())

const spot_light_helpers = new Array()
let exhibits = new Array()
let currently_selected_exhibit: Exhibit;
const MAX_SPOTLIGHT_INTENSITY = 0.5;
const LIGHT_INTENSITY_CHANGE_TIME = 250;

class Exhibit {
    light: THREE.Light
    container: THREE.Object3D
    activated: boolean
    current_tween: TWEEN.tween
    name: string
    startTarget: THREE.Vector3;
    startPosition: THREE.Vector3;

    constructor(light: THREE.Light, container: THREE.Object3D, projectName: string) {
        this.light = light;
        this.container = container;
        this.name = projectName;
    }

    activate() {
        if (!this.activated) {
            this.activated = true;
            if (this.current_tween) TWEEN.remove(this.current_tween)

            this.current_tween = new TWEEN.Tween(this.light)
                .to({ intensity: MAX_SPOTLIGHT_INTENSITY }, LIGHT_INTENSITY_CHANGE_TIME)
                .start()
        }
    }

    deactivate() {
        if (this.activated) {
            this.activated = false;
            if (this.current_tween) TWEEN.remove(this.current_tween)
            this.current_tween = new TWEEN.Tween(this.light)
                .to({ intensity: 0 }, LIGHT_INTENSITY_CHANGE_TIME)
                .start()
        }
    }

    select() {
        currently_selected_exhibit = this;

        // Backup original view settings
        this.startTarget = controls.target;
        this.startPosition = camera.position.clone();

        let endPosition = new THREE.Vector3(this.container.position.x - 2, this.container.position.y + 1, this.container.position.z + 3)
        new TWEEN.Tween(camera.position)
            .to({ x: endPosition.x, y: endPosition.y, z: endPosition.z }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();


        // Tween
        new TWEEN.Tween(controls.target)
            .to({ x: endPosition.x, y: endPosition.y, z: endPosition.z - 1 }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();


        projectNameTitle.innerHTML = this.name;
        projectDescriptionContainer.classList.remove('hidden');

        viewing_exhibit = true;
        controls.enabled = false;
    }

    deselect() {
        projectDescriptionContainer.classList.add('hidden');

        new TWEEN.Tween(camera.position)
            .to(this.startPosition, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();

        new TWEEN.Tween(controls.target)
            .to(this.startTarget, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();

        currently_selected_exhibit = null;
        viewing_exhibit = false;
        controls.enabled = true;
    }
}

function add_house() {
    new GLTFLoader().load('https://higamy.github.io/models/scene.glb',
        (gltf) => {
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
                    let light = new THREE.SpotLight(0xFFFF99, 0, 0, Math.PI / 12, 0.5);
                    light.position.set(node.position.x, 10 + node.position.y, node.position.z)
                    light.target = node;
                    light.castShadow = true;
                    scene.add(light)

                    const lightHelper = new THREE.SpotLightHelper(light)
                    //scene.add(lightHelper)

                    const projectName: string = node.name.replace('Container', '')

                    // Store a reference to the spot light
                    const exhibit = new Exhibit(light, node, projectName)
                    node.userData.exhibit = exhibit;

                    exhibits.push(exhibit);
                    spot_light_helpers.push(lightHelper);
                    containerMeshes.push(<THREE.Mesh>node);
                }
                else {
                    node.castShadow = true;
                }



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

// HOVER

function getMouseTarget(event: MouseEvent) {
    const mouse = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    }

    raycaster.setFromCamera(mouse, camera);

    return raycaster.intersectObjects(containerMeshes, false);
}


if (window.PointerEvent) {
    renderer.domElement.addEventListener('pointermove', onMouseMove, false);
} else {
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
}

const raycaster = new THREE.Raycaster();
function onMouseMove(event: MouseEvent) {
    if (viewing_exhibit) return;

    const intersects = getMouseTarget(event)

    for (let exhibit of exhibits) {
        exhibit.deactivate();
    }

    if (intersects.length > 0) {
        //console.log(intersects[0])
        //console.log(intersects[0].object.name)

        let exhibit = <Exhibit>intersects[0].object.userData.exhibit
        exhibit.activate()
    }
}

// CLICK
if (window.PointerEvent) {
    renderer.domElement.addEventListener('pointerdown', onClick, false);
} else {
    renderer.domElement.addEventListener('mousedown', onClick, false);
}

function onClick(event: MouseEvent) {
    if (viewing_exhibit) return;

    const intersects = getMouseTarget(event);

    if (intersects.length > 0) {
        let exhibit = <Exhibit>intersects[0].object.userData.exhibit
        exhibit.select()
    }
}

const clock: THREE.Clock = new THREE.Clock()

function animate() {

    // Physics
    let delta = clock.getDelta()
    if (modelReady) mixer.update(delta);

    //player.position.set(cubeBody.position.x, cubeBody.position.y, cubeBody.position.z);
    //player.quaternion.set(cubeBody.quaternion.x, cubeBody.quaternion.y, cubeBody.quaternion.z, cubeBody.quaternion.w);

    for (let lightHelper of spot_light_helpers) {
        lightHelper.update();
    }
    TWEEN.update()
    // for (let exhibit of exhibits) {
    //    exhibit.update_intensity(delta)
    // }

    controls.update();

    renderer.render(scene, camera);
    requestAnimationFrame(animate);

}
animate();

