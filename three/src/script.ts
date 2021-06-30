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
//scene.add(cube);

const edges = new THREE.EdgesGeometry(geometry);
const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 4 }));
//scene.add(line);

camera.position.z = 5;


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true



const setBoxColour: HTMLInputElement = <HTMLInputElement>document.getElementById('setBoxColour');
setBoxColour.addEventListener('input', setCubeColour)

function setCubeColour() {
    cube.material.color = new THREE.Color(setBoxColour.value);
}
setCubeColour()

var axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

/* MODELS 

Different model formats are shown below.
Beyond the below, you can also compress model saving in Blender by checking "compression"
This uses something called DRACO. It will make the model 1/3 smaller, but it will need to be decompressed
on the client side, so would only be worth it for larger models (> 1MB??)
FBX can also be imported
*/

const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(10, 10, 10);
scene.add(light);

const lightHelper = new THREE.PointLightHelper(light)
scene.add(lightHelper)

/*
const material_char: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff, wireframe: false })
material_char.side = THREE.DoubleSide

const objLoader: OBJLoader = new OBJLoader();
objLoader.load(
    'https://higamy.github.io/three/dist/models/character.obj',
    (object) => {
        (<THREE.Mesh>object.children[0]).material = material_char
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
*/

/*
const mtlLoader = new MTLLoader();
mtlLoader.load('https://higamy.github.io/three/dist/models/character v2.mtl',
    (materials) => {
        materials.preload();

        const objLoader: OBJLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(
            'https://higamy.github.io/three/dist/models/character v2.obj',
            (object) => {
                scene.add(object);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.log('An error happened');
            }
        );
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.log('An error happened');
    }
)
*/

// The gltf format includes the texture with the model so it doesn't need to be matched up
// It also potentially reduces file size although this isn't clear that it is true.

/*
const loader = new GLTFLoader()
loader.load(
    'https://higamy.github.io/three/dist/models/character.glb',
    function (gltf) {
        // gltf.scene.traverse(function (child) {
        //     if ((<THREE.Mesh>child).isMesh) {
        //         let m = <THREE.Mesh>child
        //         m.receiveShadow = true
        //         m.castShadow = true
        //     }
        //     if ((<THREE.Light>child).isLight) {
        //         let l = <THREE.Light>child
        //         l.castShadow = true
        //         //l.shadow.bias = -.003
        //         l.shadow.mapSize.width = 2048
        //         l.shadow.mapSize.height = 2048
        //     }
        // })
        scene.add(gltf.scene);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded')
    },
    (error) => {
        console.log(error);
    }
);
*/

let mixer: THREE.AnimationMixer
let modelReady = false;
let animationActions: THREE.AnimationAction[] = new Array()
let activeAction: THREE.AnimationAction
let lastAction: THREE.AnimationAction
const gltfLoader: GLTFLoader = new GLTFLoader();

gltfLoader.load(
    'https://higamy.github.io/three/dist/models/Character/Character@Idle.glb',
    (gltf) => {
        // gltf.scene.scale.set(.01, .01, .01)
        mixer = new THREE.AnimationMixer(gltf.scene);
        console.log(gltf)

        let animationAction = mixer.clipAction(gltf.animations[0]);
        animationActions.push(animationAction)
        animationsFolder.add(animations, "default")
        activeAction = animationActions[0]

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

const gui = new GUI()
const animationsFolder = gui.addFolder("Animations")
animationsFolder.open()

const clock: THREE.Clock = new THREE.Clock()

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    cube.rotation.x += 0.005;
    cube.rotation.y += 0.005;
    line.rotation.x += 0.005;
    line.rotation.y += 0.005;

    if (modelReady) mixer.update(clock.getDelta());

    controls.update(); // This must be called or the damping will not work

}
animate();