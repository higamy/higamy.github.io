// npm install @types/node --save-dev
// npm i --save-dev @types/three
// tsc three/src/script.ts -w
// npx webpack --config ./three/src/webpack.config.js

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";


// Custom modulo function
function mod(n, m) {
    return ((n % m) + m) % m;
}

// Disable the right click menu
window.addEventListener("contextmenu", e => e.preventDefault());

const scene = new THREE.Scene();
//const background_colour: number = 0x00ccff;//0x95776d;
//scene.background = new THREE.Color(background_colour);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.autoClear = false;
renderer.setClearColor(0x000000, 0.0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, document.documentElement);
controls.enableDamping = true;
controls.enableRotate = true;
controls.enableZoom = true;
controls.enablePan = false;
controls.enabled = false;

/*
controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.PAN
}

// Mobile settings
controls.touches.ONE = THREE.TOUCH.PAN;
controls.touches.TWO = THREE.TOUCH.PAN;
*/

let viewing_exhibit: boolean = false;

const projectNameTitle: HTMLElement = document.getElementById('projectNameTitle');
const projectDescriptionContainer: HTMLElement = document.getElementById('projectDescriptionContainer');
const projectDescription: HTMLElement = document.getElementById('projectDescription');
const viewProjectButton: HTMLElement = document.getElementById('viewProjectButton');

const ProjectDescriptions = {
    'Pokopponent': "A utility for the game Pokemon. Type in the opponent pokemon's name and see what you should pick to beat this pokemon.",
    'PyProperty': 'An app allowing users to search properties for sale within the UK, with options to filter out properties based on travel time to user provided locations.',
    'AI Racer': 'A car racing game with opponent AI trained using deep reinforcement learning.'
}

const ProjectURLS = {
    'Pokopponent': 'https://pokopponent.herokuapp.com/',
    'PyProperty': 'https://pyproperty.herokuapp.com/',
    'AI Racer': 'https://simmer.io/@higamy/ai-racer'
}

const ProjectTechnologies = {
    'Pokopponent': ['Python'],
    'PyProperty': ['Python'],
    'AI Racer': ['Unity', 'Blender']
}

let cameraPositions = {}

const LOGO_START_SCALE = 0;
const LOGO_ACTIVATED_SCALE = 0.3;

const LogoOffsets = {
    1: [0],
    2: [-0.5, 0.5],
    3: [-1, 0, 1]
}

const light = new THREE.DirectionalLight(0xFFFFE0, 0.5);
const LIGHT_SHADOW_MAP_SIZE = 1028; // 4096 max
light.castShadow = true;
light.shadow.mapSize.width = LIGHT_SHADOW_MAP_SIZE;
light.shadow.mapSize.height = LIGHT_SHADOW_MAP_SIZE;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 1000
light.shadow.camera.right = 50;
light.position.set(10, 10, 10);
scene.add(light);

const ambient_light = new THREE.AmbientLight(0x404040, 2); // soft white light
scene.add(ambient_light);

const near = 1;
const far = 30;
const background_colour: number = 0x00ccff;//0x95776d;
scene.fog = new THREE.Fog(background_colour, near, far);

const containerMeshes = new Array


//camera.lookAt(new THREE.Vector3())

let exhibits: Exhibit[] = new Array();
let currently_selected_exhibit_number = 0;
let currently_selected_exhibit: Exhibit;
let selected_exhibit_rotation: number = 0;
const easing_method = TWEEN.Easing.Quadratic.InOut

const MAX_SPOTLIGHT_INTENSITY = 0.5;
const LIGHT_INTENSITY_CHANGE_TIME = 250;
const zoom_in_out_time = 2000;

class Exhibit {
    light: THREE.Light
    container: THREE.Object3D
    activated: boolean
    current_tween: TWEEN.tween
    name: string
    startTarget: THREE.Vector3;
    startPosition: THREE.Vector3;
    startRotation: THREE.Quaternion;
    logos: TechLogo[];

    constructor(light: THREE.Light, container: THREE.Object3D, projectName: string) {
        this.light = light;
        this.container = container;
        this.name = projectName;
        this.startRotation = container.quaternion.clone();
    }

    activate() {
        if (!this.activated) {
            this.activated = true;
            if (this.current_tween) TWEEN.remove(this.current_tween)

            this.current_tween = new TWEEN.Tween(this.light)
                .to({ intensity: MAX_SPOTLIGHT_INTENSITY }, LIGHT_INTENSITY_CHANGE_TIME)
                .start();
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
        controls.enabled = false;
        this.activate();

        // Backup original view settings
        this.startTarget = controls.target.clone();
        this.startPosition = camera.position.clone();

        let endPosition = cameraPositions[this.name];
        console.log(cameraPositions);
        console.log(this.name);
        new TWEEN.Tween(camera.position)
            .to({ x: endPosition.x, y: endPosition.y, z: endPosition.z }, zoom_in_out_time)
            .easing(easing_method)
            .start()
            .onComplete(() => {
                currently_selected_exhibit = this;
                selected_exhibit_rotation = 0;
            });;


        // Tween
        new TWEEN.Tween(controls.target)
            .to({ x: this.container.position.x, y: this.container.position.y, z: this.container.position.z }, zoom_in_out_time)
            .easing(easing_method)
            .start()
            .onComplete(() => {
                controls.enabled = true;
            });

        projectNameTitle.innerHTML = this.name;
        const projDescriptionText = this.name in ProjectDescriptions ? ProjectDescriptions[this.name] : 'Cannot find project description.';
        projectDescription.innerHTML = projDescriptionText;
        viewProjectButton.onclick = () => { window.open(ProjectURLS[this.name]) };
        projectDescriptionContainer.classList.remove('hidden');

        viewing_exhibit = true;
        //controls.enabled = false;

        for (let logo of this.logos) {
            logo.select();
        }
    }

    deselect() {
        this.deactivate();

        projectDescriptionContainer.classList.add('hidden');
        /*
                new TWEEN.Tween(camera.position)
                    .to(this.startPosition, zoom_in_out_time)
                    .easing(easing_method)
                    .start()
                    .onComplete(() => {
                        controls.enabled = true;
                    });
                    */
        /*
                new TWEEN.Tween(controls.target)
                    .to(this.startTarget, zoom_in_out_time)
                    .easing(easing_method)
                    .start();
        */
        /* new TWEEN.Tween(this.container.rotation)
             .to(this.startRotation, zoom_in_out_time)
             .easing(TWEEN.Easing.Quadratic.Out)
             .start();
 */

        //this.container.rotateY(currently_selected_exhibit.container.rotation.y - currently_selected_exhibit.startRotation.y)
        new TWEEN.Tween(this.container.quaternion)
            .to(this.startRotation, zoom_in_out_time)
            .easing(easing_method)
            .start();

        //this.container.rotateY(-selected_exhibit_rotation);

        currently_selected_exhibit = null;
        viewing_exhibit = false;

        for (let logo of this.logos) {
            logo.deselect();
        }
    }

    set_logos(logos: TechLogo[]) {
        this.logos = logos;
    }
}

class TechLogo {
    mesh: THREE.Object3D;
    selected: boolean;
    x_rotation_speed: number;
    y_rotation_speed: number;
    z_rotation_speed: number;

    constructor(mesh: THREE.Object3D) {
        this.mesh = mesh;

        // Assign a random rotation speed on x, y, z for the logo
        // This will be activated when this exhibit is selected
        this.x_rotation_speed = Math.random();
        this.y_rotation_speed = Math.random();
        this.z_rotation_speed = Math.random();

        // Create the outline
        //@ts-ignore
        var outlineGeometry = this.mesh.geometry
        var outlineMaterial1 = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.BackSide });
        var outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial1);
        outlineMesh.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
        outlineMesh.scale.set(LOGO_ACTIVATED_SCALE * 1.05, LOGO_ACTIVATED_SCALE * 1.05, LOGO_ACTIVATED_SCALE * 1.05);
        //scene.add(outlineMesh);
    }

    select() {
        this.selected = true;
        new TWEEN.Tween(this.mesh.scale)
            .to({ x: LOGO_ACTIVATED_SCALE, y: LOGO_ACTIVATED_SCALE, z: LOGO_ACTIVATED_SCALE }, zoom_in_out_time)
            .start()
    }

    deselect() {
        this.selected = true;
        new TWEEN.Tween(this.mesh.scale)
            .to({ x: LOGO_START_SCALE, y: LOGO_START_SCALE, z: LOGO_START_SCALE }, zoom_in_out_time)
            .start()
    }

}

function getProjectName(inputName: string) {
    inputName = inputName.replace('Container', '');
    inputName = inputName.replace('_', ' ');

    return inputName
}

function add_project_models() {
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

                if (node.name.includes('Camera')) {
                    let camPos = new THREE.Vector3();
                    node.getWorldPosition(camPos);
                    //camPos = camera.worldToLocal(camPos);
                    const projectName = getProjectName(node.parent.name);
                    cameraPositions[projectName] = camPos;
                }

                else if (node.name.includes('Container')) {
                    console.log(node.name);
                    (<THREE.Mesh>node).material = new THREE.MeshPhongMaterial({
                        opacity: 0,
                        transparent: true,
                    });

                    // Add a light
                    let light = new THREE.SpotLight(0xFFFF99, 0, 0, Math.PI / 24, 0.5);
                    light.position.set(node.position.x, 20 + node.position.y, node.position.z)
                    light.shadow.mapSize.width = LIGHT_SHADOW_MAP_SIZE / 4;
                    light.shadow.mapSize.height = LIGHT_SHADOW_MAP_SIZE / 4;
                    light.target = node;
                    light.castShadow = true;
                    scene.add(light);


                    let projectName: string = getProjectName(node.name);

                    // Store a reference to the spot light
                    const exhibit = new Exhibit(light, node, projectName)
                    node.userData.exhibit = exhibit;

                    exhibits.push(exhibit);
                    containerMeshes.push(<THREE.Mesh>node);

                    // Add the tech stack
                    let all_logos: TechLogo[] = []

                    for (let [index, tech] of ProjectTechnologies[projectName].entries()) {
                        console.log(index, projectName, tech)
                        let logo_mesh: THREE.Mesh = <THREE.Mesh>logos[tech].clone();

                        logo_mesh.position.set(node.position.x + LogoOffsets[ProjectTechnologies[projectName].length][index], node.position.y + 1, node.position.z);
                        logo_mesh.scale.set(LOGO_START_SCALE, LOGO_START_SCALE, LOGO_START_SCALE);

                        scene.add(logo_mesh);

                        all_logos.push(new TechLogo(logo_mesh))
                    }
                    exhibit.set_logos(all_logos);

                    console.log(exhibit);

                }
                else {
                    node.castShadow = true;
                }

            });

            exhibits[currently_selected_exhibit_number].select();
        })
}

const logos = {};
function add_logos() {
    new GLTFLoader().load('https://higamy.github.io/models/Logos.glb',
        (gltf) => {
            //scene.add(gltf.scene);

            gltf.scene.traverse(function (node) {
                if (node != gltf.scene) {
                    logos[node.name] = <THREE.Mesh>node;
                }
            })

            console.log(logos);

            add_project_models();


        })
}
add_logos();

// Buttons to change to the next animation
const previousProject: HTMLElement = document.getElementById('previousProject');
const nextProject: HTMLElement = document.getElementById('nextProject');

previousProject.addEventListener('click', () => {
    exhibits[currently_selected_exhibit_number].deselect();
    currently_selected_exhibit_number = currently_selected_exhibit_number - 1;
    currently_selected_exhibit_number = mod(currently_selected_exhibit_number, exhibits.length);
    exhibits[currently_selected_exhibit_number].select();
})

nextProject.addEventListener('click', () => {
    exhibits[currently_selected_exhibit_number].deselect();
    currently_selected_exhibit_number = currently_selected_exhibit_number + 1;
    currently_selected_exhibit_number = mod(currently_selected_exhibit_number, exhibits.length);
    exhibits[currently_selected_exhibit_number].select();
})

let mixer: THREE.AnimationMixer
let modelReady = false;

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

// HOVER
/*
function getMouseTarget(event: MouseEvent) {
    const mouse = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    }

    raycaster.setFromCamera(mouse, camera);

    return raycaster.intersectObjects(containerMeshes, false);
}
*/

/*
if (window.PointerEvent) {
    renderer.domElement.addEventListener('pointermove', onMouseMove, false);
} else {
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
}
*/

/*
const raycaster = new THREE.Raycaster();
function onMouseMove(event: MouseEvent) {
    //if (viewing_exhibit) return;

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
*/

// CLICK
/*
if (window.PointerEvent) {
    renderer.domElement.addEventListener('pointerdown', onClick, false);
} else {
    renderer.domElement.addEventListener('mousedown', onClick, false);
}
*/
/*
function onClick(event: MouseEvent) {
    //if (viewing_exhibit) return;
    //if (!controls.enabled) return;

    const intersects = getMouseTarget(event);

    if (intersects.length > 0) {
        let exhibit = <Exhibit>intersects[0].object.userData.exhibit
        exhibit.select()
    }
}
*/

const clock: THREE.Clock = new THREE.Clock()

function animate() {

    // Physics
    let delta = clock.getDelta()
    if (modelReady) mixer.update(delta);

    TWEEN.update()

    if (currently_selected_exhibit) {
        // Rotate the exibit
        const rotation_amount = Math.PI * 2 * delta / 20;
        selected_exhibit_rotation = selected_exhibit_rotation + rotation_amount;
        currently_selected_exhibit.container.rotateY(rotation_amount);

        // Rotate the tech logos
        for (let logo of currently_selected_exhibit.logos) {
            logo.mesh.rotateX(delta * logo.x_rotation_speed);
            logo.mesh.rotateY(delta * logo.y_rotation_speed);
            logo.mesh.rotateZ(delta * logo.z_rotation_speed);
        }
    }

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();

}
animate();

