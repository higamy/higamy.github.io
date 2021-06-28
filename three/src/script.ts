// npm install @types/node --save-dev
// npm i --save-dev @types/three
// tsc three/src/script.ts -w
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.25 });

// instantiate a loader
var loader = new THREE.TextureLoader();
//allow cross origin loading
loader.crossOrigin = '';

loader.load("imgs/grid.png", function (texture) { material.map = texture },)


const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const edges = new THREE.EdgesGeometry(geometry);
const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 4 }));
scene.add(line);

camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    cube.rotation.x += 0.005;
    cube.rotation.y += 0.005;
    line.rotation.x += 0.005;
    line.rotation.y += 0.005;
}
animate();

const setBoxColour: HTMLInputElement = <HTMLInputElement>document.getElementById('setBoxColour');
setBoxColour.addEventListener('input', setCubeColour)

function setCubeColour() {
    cube.material.color = new THREE.Color(setBoxColour.value);
}
setCubeColour()

const controls = new OrbitControls(camera, renderer.domElement);

var axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)