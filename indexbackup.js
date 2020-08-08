console.log("test141")
import * as THREE from './node_modules/three/build/three.js';
import {OrbitControls} from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from './node_modules/three/examples/jsm/loaders/DRACOLoader.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';
import { RectAreaLightUniformsLib } from './node_modules/three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from './node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from './node_modules/three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import axios from './node_modules/axios/lib/axios.js';

var model;
var composer;

var scene = new THREE.Scene();



var parent = new THREE.Group();

/// Lights and Camera ///
var camera = new THREE.PerspectiveCamera(60, window.innerWidth/ window.innerHeight, 1, 10000);
camera.position.set(0, 0, 10);



var dirLight = new THREE.DirectionalLight( 0xfffcd9,0.3 );
dirLight.position.set( - 3, 10, - 10 );
dirLight.castShadow = true;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = - 10;
dirLight.shadow.camera.left = - 10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far =40;
// dirLight.shadow.radius = 100;
dirLight.shadow.mapSize.width = 64; 
dirLight.shadow.mapSize.height = 64;

scene.add( dirLight );

// var helper = new THREE.DirectionalLightHelper( dirLight, 5 );
// scene.add( helper );

// scene.add(new THREE.AmbientLight(0xf9d71c, 1));
var hemiLight = new THREE.HemisphereLight( 0xa0e4eb, 0xf0b954, 1 );
hemiLight.position.set( 0, 20, 0 );
scene.add( hemiLight );


//// Init Renderer ///
var renderer = new THREE.WebGLRenderer({antialias: true, alpha:true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap


// renderer.autoClear = false;
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.toneMapping = THREE.ReinhardToneMapping;
// renderer.toneMappingExposure = Math.pow(1, 4.0);
renderer.setClearColor(0xf0b954);


document.body.appendChild(renderer.domElement);

/// Init orbit control //
var controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxDistance = 15;
controls.minDistance = 2;
controls.minPolarAngle = Math.PI/10;
controls.maxPolarAngle = Math.PI/4;


var renderScene = new RenderPass( scene, camera )

/// Loading callbacks //
var manager = new THREE.LoadingManager();
manager.onStart = function () {
	console.log( 'Started load');
};
manager.onError = function () {
	console.log( 'There was an error loading ');
};
manager.onLoad = function ( ) {

    console.log("mod")
    let mod = parent.children[0];
    console.log(mod)
    var building = mod.children[3];
    var mainBox0 = building.children[0];
    var mainBox1 = building.children[1];
    var circleWindow = building.children[2];

    var windowMesh = building.children[3];

    windowMesh.material = new THREE.MeshBasicMaterial({
        color:0xe0cc48,
    });
    scene.add(windowMesh)

    mainBox0.castShadow=true;
    mainBox0.receiveShadow = true;
    mainBox1.castShadow=true;
    mainBox1.receiveShadow = true;
    circleWindow.castShadow=true;
    circleWindow.receiveShadow = true;
    circleWindow.material = new THREE.MeshBasicMaterial({
        // color:0xe0cc48,
    });

    mainBox0.material = new THREE.MeshPhongMaterial({
        color:0x80252e,
    });


    scene.add(mainBox0)
    scene.add(mainBox1)
    scene.add(circleWindow)

    console.log( 'Loading Complete!');
    var bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85, [windowMesh], scene, camera )
    bloomPass.threshold = 0.21;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.55;
    var bloomPass2 = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85, [circleWindow], scene, camera )
    bloomPass2.threshold = 0.21;
    bloomPass2.radius = 0.55;

    axios.get('http://localhost:8081/slackRoute/getPresence', {

    }).then(function (res) {
        var test = res.find(x => x.real_name === 'rbenefo').online;
        if (test === 1){
            bloomPass2.strength = 1.2;
            circleWindow.material.color.setHex( 0xe0cc48 );
        } else {
            bloomPass2.strength = 0.1;
            circleWindow.material.color.setHex( 0x18072e );
        }
        console.log(test)


    });


    document.getElementById("testButton").addEventListener("click", lightSwitch);

    // function lightSwitch() {
    //     // windowMesh.material.color.setHex( 0x18072e );
    //     // circleWindow.material.color.setHex( 0x18072e );
    //     bloomPass.strength = 0.1;
    //     bloomPass2.strength = 0.1;


    // }
  
    composer = new EffectComposer( renderer )
    composer.setSize( window.innerWidth, window.innerHeight )
    composer.addPass( renderScene )
    composer.addPass( bloomPass )
    composer.addPass( bloomPass2 )

    render();
};

var loader = new GLTFLoader(manager);
var dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( './node_modules/three/examples/js/libs/draco/gltf/' );

loader.setDRACOLoader( dracoLoader );

loader.load( 'dlo3.glb', function ( gltf ) {
    model = gltf.scene;
    parent.add(model)

}, undefined, function ( e ) {
    console.error( e );
} );

scene.traverse( function( child ) { 

    if ( child.isMesh ) {

        child.castShadow = true;
        child.receiveShadow = true;

    }

} );



var floorGeometry = new THREE.PlaneBufferGeometry( 200, 200 )

var floorMaterial = new THREE.MeshPhongMaterial( {
    color: 0xc4b895,
} );


var floor = new THREE.Mesh( floorGeometry, floorMaterial );
floor.receiveShadow = true;

floor.rotation.x = - Math.PI/2;
scene.add( floor );





// Render //

function render(){
    requestAnimationFrame(render);
    controls.update();


    // renderer.render( scene, camera );
    composer.render();  

  }



