// npm install @types/node --save-dev
// npm install @types/three --save-dev
// npm install --save-dev webpack
// tsc three/src/script.ts -w
// npx webpack --config ./three/src/webpack.config.js


/*
TODO:

Loading screen
Hover on tech shows what it was used for this project
Add animations and stop rotation
Better models
Toast popup when opening project, to warn it may take some time.

*/

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
controls.minDistance = 2;
controls.maxDistance = 10;
controls.rotateSpeed = 0.4;
//controls.minAzimuthAngle = -Math.PI / 2;
//controls.maxAzimuthAngle = Math.PI / 2;
controls.minPolarAngle = 0.25 * Math.PI; // How high can the camera go
controls.maxPolarAngle = 0.55 * Math.PI; // How low can the camera go

// Initialise a position where the user can't see the models
camera.position.set(0, 50, 0);
controls.target.set(10, 100, 10);

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


const projectNameTitle: HTMLElement = document.getElementById('projectNameTitle');
const projectDescriptionContainer: HTMLElement = document.getElementById('projectDescriptionContainer');
const projectDescription: HTMLElement = document.getElementById('projectDescription');
const viewProjectButton: HTMLElement = document.getElementById('viewProjectButton');

const techDetailsContainer: HTMLElement = document.getElementById('techDetailsContainer');
const techTitle: HTMLElement = document.getElementById('techTitle');
const techDescription: HTMLElement = document.getElementById('techDescription');

const startButton: HTMLElement = document.getElementById('startButton');

startButton.addEventListener('click', () => {
    if (modelReady) {
        startButton.classList.add('hidden');
        previousProject.classList.remove('fadedOut');
        nextProject.classList.remove('fadedOut');
        exhibits[currently_selected_exhibit_number].select();
        //projectDescriptionContainer.classList.add('fading');
        //projectDescriptionContainer.classList.remove('hidden');
        //switchProject(1);
    }
    else {
        // TODO: Animation to show not ready!
    }

})


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

const ProjectTechnologiesFull = {
    'Pokopponent': { 'Python': 'A Flask app, using fuzzywuzzy to make partial matches from the user inputs.\nStyling using Bootstrap.' },
    'PyProperty': {
        'Python': 'Zoopla and Google Maps APIs called using requests.',
        'MongoDB': 'Caching of Google Maps journey times to prevent excessive API usage.\nIf a similar journey to the requested journey exists in the cache it will be loaded.'
    },
    'AI Racer': {
        'Blender': 'I created all the models of the cars, tracks etc in Blender.',
        'Unity': 'This was the GameEngine used, coded in C#.\nReinforcement learning was conducted using Unity ML Agents.'
    }
}


let ProjectTechnologies = {}
for (let tech of Object.keys(ProjectTechnologiesFull)) {
    ProjectTechnologies[tech] = Object.keys(ProjectTechnologiesFull[tech]);
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
document.documentElement.style.setProperty('--switch-project-transition-time', zoom_in_out_time + "ms");

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

        new TWEEN.Tween(camera.position)
            .to({ x: endPosition.x, y: endPosition.y, z: endPosition.z }, zoom_in_out_time)
            .easing(easing_method)
            .start()
            .onComplete(() => {
                currently_selected_exhibit = this;
                selected_exhibit_rotation = 0;
            });


        // Tween
        new TWEEN.Tween(controls.target)
            .to({ x: this.container.position.x, y: this.container.position.y, z: this.container.position.z }, zoom_in_out_time)
            .easing(easing_method)
            .start()
            .onComplete(() => {
                controls.enabled = true;
            });

        const setDescriptionText = function () {
            projectNameTitle.innerHTML = this.name;
            const projDescriptionText = this.name in ProjectDescriptions ? ProjectDescriptions[this.name] : 'Cannot find project description.';
            projectDescription.innerHTML = projDescriptionText;
            projectDescriptionContainer.classList.remove('hidden');
        }.bind(this);
        setTimeout(setDescriptionText, zoom_in_out_time / 2);

        viewProjectButton.onclick = () => { window.open(ProjectURLS[this.name]) };


        for (let logo of this.logos) {
            logo.select();
        }
    }

    deselect() {
        this.deactivate();

        //projectDescriptionContainer.classList.add('hidden');
        new TWEEN.Tween(this.container.quaternion)
            .to(this.startRotation, zoom_in_out_time)
            .easing(easing_method)
            .start();

        currently_selected_exhibit = null;

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

// Add the tech stack
let all_logos: TechLogo[] = [];
let head: THREE.Bone;
let anim: THREE.AnimationClip;
let track: THREE.KeyframeTrack;


const manager = new THREE.LoadingManager();
manager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};

manager.onLoad = function () {
    console.log('Loading complete!');
};


manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};

manager.onError = function (url) {
    console.log('There was an error loading ' + url);
};

function add_project_models(url_to_load: string) {
    new GLTFLoader(manager).load(url_to_load,
        (gltf) => {
            scene.add(gltf.scene);

            mixer = new THREE.AnimationMixer(gltf.scene);

            for (anim of gltf.animations) {
                if (anim.name == 'Idle') {
                    for (track of anim.tracks) {
                        if ((track.name.includes('head') || track.name.includes('spine')) && (track.name.includes('quaternion'))) {
                            const index = anim.tracks.indexOf(track);
                            if (index > -1) {
                                //anim.tracks.splice(index, 1);
                            }
                        }
                    }
                }

                const animationAction = mixer.clipAction(anim);
                animationAction.play();
            }

            gltf.scene.traverse(function (node) {

                if (node.type == 'Bone') {
                    if (node.name == 'head') head = <THREE.Bone>node
                }

                if ((<THREE.Mesh>node).isMesh) {
                    node.frustumCulled = false;
                }

                if (node.name.includes('Ground')) {
                    //node.receiveShadow = true;
                }

                if (node.name.includes('Camera')) {
                    let camPos = new THREE.Vector3();
                    node.getWorldPosition(camPos);
                    //camPos = camera.worldToLocal(camPos);
                    const projectName = getProjectName(node.parent.name);
                    cameraPositions[projectName] = camPos;
                }
                else if (node.name.includes('Container')) {

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

                    let logos_this_project: TechLogo[] = []

                    for (let [index, tech] of ProjectTechnologies[projectName].entries()) {
                        let logo_mesh: THREE.Mesh = <THREE.Mesh>logos[tech].clone();

                        logo_mesh.position.set(node.position.x + LogoOffsets[ProjectTechnologies[projectName].length][index], node.position.y + 1, node.position.z + LogoOffsets[ProjectTechnologies[projectName].length][index]);
                        logo_mesh.scale.set(LOGO_START_SCALE, LOGO_START_SCALE, LOGO_START_SCALE);

                        scene.add(logo_mesh);

                        logo_mesh.userData['Description'] = ProjectTechnologiesFull[projectName][tech];

                        const tl: TechLogo = new TechLogo(logo_mesh);
                        all_logos.push(tl);
                        logos_this_project.push(tl);
                    }
                    exhibit.set_logos(logos_this_project);

                    modelReady = true;
                    startButton.innerHTML = 'Start';

                }
                else {
                    node.castShadow = true;
                }

            });

            //exhibits[currently_selected_exhibit_number].select();
        },
        function (xhr) {
            console.log(xhr)
            //console.log((xhr.loaded / xhr.total * 100) + '% loaded');

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
            add_project_models('https://higamy.github.io/models/scene.glb');
            /*for (let tech of Object.keys(ProjectTechnologiesFull)) {
                let url = 'https://higamy.github.io/models/' + tech + '.glb';
                add_project_models(url);
            }
            */
        })
}
add_logos();

// Buttons to change to the next animation
const previousProject: HTMLElement = document.getElementById('previousProject');
const nextProject: HTMLElement = document.getElementById('nextProject');

function switchProject(value_change: number = 1) {
    exhibits[currently_selected_exhibit_number].deselect();
    currently_selected_exhibit_number = currently_selected_exhibit_number + value_change;
    currently_selected_exhibit_number = mod(currently_selected_exhibit_number, exhibits.length);
    exhibits[currently_selected_exhibit_number].select();


    //previousProject.classList.remove('right-rotating');
    //void previousProject.offsetWidth; // Bit of a hack that adds a tiny delay between changing classes so that the animation fires
    //previousProject.classList.add('right-rotating');

    //nextProject.classList.remove('left-rotating');
    //void previousProject.offsetWidth; // Bit of a hack that adds a tiny delay between changing classes so that the animation fires
    //nextProject.classList.add('left-rotating');

    projectDescriptionContainer.classList.remove('fading');
    void projectDescriptionContainer.offsetWidth; // Bit of a hack that adds a tiny delay between changing classes so that the animation fires
    projectDescriptionContainer.classList.add('fading');
}
previousProject.addEventListener('click', () => { switchProject(-1) })
nextProject.addEventListener('click', () => { switchProject(1) })



let mixer: THREE.AnimationMixer
let modelReady = false;

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

// HOVER
const raycaster = new THREE.Raycaster();
function getMouseTarget(event: MouseEvent) {
    const mouse = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    }

    raycaster.setFromCamera(mouse, camera);

    let all_meshes: THREE.Mesh[] = []
    for (let logo of all_logos) {
        all_meshes.push(<THREE.Mesh>logo.mesh);
    }

    return raycaster.intersectObjects(all_meshes, false);
}


if (window.PointerEvent) {
    document.documentElement.addEventListener('pointermove', onMouseMove, false);
} else {
    document.documentElement.addEventListener('mousemove', onMouseMove, false);
}

function onMouseMove(event: MouseEvent) {

    const intersects = getMouseTarget(event);

    if (intersects.length > 0) {
        techDetailsContainer.classList.remove('hidden');
        techTitle.innerHTML = intersects[0].object.userData.name;
        techDescription.innerHTML = intersects[0].object.userData.Description;
    }
    else {
        techDetailsContainer.classList.add('hidden');
    }
}

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

    if (currently_selected_exhibit) {
        // Rotate the exibit
        const rotation_amount = Math.PI * 2 * delta / 20;
        selected_exhibit_rotation = selected_exhibit_rotation + rotation_amount;
        //currently_selected_exhibit.container.rotateY(rotation_amount);

        // Rotate the tech logos
        for (let logo of currently_selected_exhibit.logos) {
            logo.mesh.rotateX(delta * logo.x_rotation_speed);
            logo.mesh.rotateY(delta * logo.y_rotation_speed);
            logo.mesh.rotateZ(delta * logo.z_rotation_speed);
        }
    }
    //movePikachusHead(delta);

    render();
    requestAnimationFrame(animate);
    controls.update();
}

function randBetween(min, max) {
    // Returns a random number between max and min
    return Math.random() * (max - min) + min;
}

const range_of_times_between_head_movement = [5, 8];
const range_of_speed_of_moving_head = [1000, 2000];
let cur_max_time_between_head_movement: number;
let time_between_head_movement: number;
updateTimeToNextHeadMovement();

const rot_limits: object = {
    x: [-20, 10],
    y: [-10, 10],
    z: [-20, 20]
}

function updateTimeToNextHeadMovement() {
    time_between_head_movement = 0;
    cur_max_time_between_head_movement = randBetween(range_of_times_between_head_movement[0], range_of_times_between_head_movement[1])
}


function movePikachusHead(delta: number) {
    time_between_head_movement += delta;

    if (time_between_head_movement > cur_max_time_between_head_movement) {
        updateTimeToNextHeadMovement();

        new TWEEN.Tween(head.rotation)
            .to({
                x: THREE.MathUtils.degToRad(randBetween(rot_limits['x'][0], rot_limits['x'][1])),
                y: THREE.MathUtils.degToRad(randBetween(rot_limits['y'][0], rot_limits['y'][1])),
                z: THREE.MathUtils.degToRad(randBetween(rot_limits['z'][0], rot_limits['z'][1])),
            }, randBetween(range_of_speed_of_moving_head[0], range_of_speed_of_moving_head[1]))
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start()
    }

}

function render() {
    renderer.render(scene, camera);
    TWEEN.update()
}

animate();

