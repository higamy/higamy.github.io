// npm install @types/node --save-dev
// npm i --save-dev @types/three
// tsc three/src/script.ts -w
// npx webpack --config ./three/src/webpack.config.js

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.25 });

// instantiate a loader
//var loader = new THREE.TextureLoader();
//allow cross origin loading
//loader.setCrossOrigin("anonymous");
//loader.load("https://higamy.github.io/three/dist/imgs/grid.png", function (texture) { material.map = texture },)
const texture = new THREE.TextureLoader().load("https://higamy.github.io/three/dist/imgs/grid.png")
material.map = texture

// Material can have an .envMap to be added which adds a reflection of an image to the surface
// With multiple textures can define whether to add or multiply them together
// When changing material properties after original creation, need to set material.needsipdate = true
// so that on the next render frame the properties will be updated.

// The mesh standard material (the most realistic material) can have a displacementMap, bumpMap, roughnessMap and metalnessMap applied
// (like in blender)

// To add shadows, from lights, a few settings need to be updated including adding a light shadow, saying that
// an object can cast shadow, and also saying that an object can receive a shadow being cast onto it.

// Can set the max angle and distance that the orbit controls can rotate around. E.g. restrict so that the user can only see 1 side of a scene

// Can also have interesting controls like drag controls and first person style (point lock)

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const edges = new THREE.EdgesGeometry(geometry);
const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 4 }));
scene.add(line);

camera.position.z = 5;


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    cube.rotation.x += 0.005;
    cube.rotation.y += 0.005;
    line.rotation.x += 0.005;
    line.rotation.y += 0.005;

    controls.update(); // This must be called or the damping will not work
}
animate();

const setBoxColour: HTMLInputElement = <HTMLInputElement>document.getElementById('setBoxColour');
setBoxColour.addEventListener('input', setCubeColour)

function setCubeColour() {
    cube.material.color = new THREE.Color(setBoxColour.value);
}
setCubeColour()

var axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

/* MODELS */

const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(50, 50, 50);
scene.add(light);

const objLoader: OBJLoader = new OBJLoader();
objLoader.load(
    'https://higamy.github.io/three/dist/models/character.obj',
    (object) => {
        //(<THREE.Mesh>object.children[0]).material = material
        // object.traverse(function (child) {
        //  if ((<THREE.Mesh>child).isMesh) {
        //      (<THREE.Mesh>child).material = material
        //  }
        // })
        scene.add(object);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded')
    },
    (error) => {
        console.log(error);
    }
)