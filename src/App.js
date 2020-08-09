import React, { Component } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import PlaneGLB from './assets/glb/airplane.glb';
import DLBuildingGLB from './assets/glb/building.glb';

import axios from "axios";
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

import FloorTexture from './assets/images/greenGradient.png';
import About from './components/About';
import Timeline from './components/Timeline'
import Login from './components/Login'

import DLLogo from './assets/images/dlLogo.jpg'

import './App.css';

axios.defaults.withCredentials=true;

/// Initialize Constants ///
var stats = new Stats();
var clock = new THREE.Clock();
var sunTheta;
var THREEx = {};
var t = 0;
var raycaster = new THREE.Raycaster();

var mouse = new THREE.Vector2();
var intersected;

var BLOOM_SCENE = 1;

var bloomLayer = new THREE.Layers();
bloomLayer.set( BLOOM_SCENE );
var darkMaterial = new THREE.MeshBasicMaterial( { color: "black" } );
var materials = {};

var windowsPermaOff = ["Window05","Window06", "Window144", "Window145", "Window146", 
"Window147", "Window132", "Window133", "Window134", "Window135", "WindowLarge202", 
"Window25", "Window26", "Window75", "Window76", "Window264", "Window265", "Window266", 
"Window267", "WindowSide02", "WindowSide01", "Window55", "Window56", "Window57", 
"Window58", "Window217", "Window218", "Window219", "Window220", "WindowSide04",
"WindowSide03", "WindowLarge01"];


var MODELS = [DLBuildingGLB, PlaneGLB];  ///list all GLB models in world
// const loadingManager = new THREE.LoadingManager( () => {
// 	console.log("loading complete!")
//   const loadingScreen = document.getElementById( 'loadingScreen' );
//   loadingScreen.classList.add( 'fade-out' );
  
//   // // optional: remove loader from DOM via event listener
//   // loadingScreen.addEventListener( 'transitionend', onTransitionEnd );
  
// } );

const style = {
  height: window.innerHeight, // we can control scene size by setting container dimensions
};

var delta, d, timeMins;
var __this;
var appContainer;
var data;
let timeArr, goal, closest, relevantIndex, relevantPresence, relevantActivity;
var intersects, windowPopUp, object;
/// End Initialize Constants ///



/// Day night cycle ///
THREEx.DayNight	= {}
THREEx.DayNight.baseURL	= '../'
THREEx.DayNight.currentPhase	= function(sunAngle){
	if( Math.sin(sunAngle) > Math.sin(0) ){
		return 'day'
	}else if( Math.sin(sunAngle) > Math.sin(-Math.PI/6) ){
		return 'twilight'
	}else{
		return 'night'
	}
}
//day+night
THREEx.DayNight.SunLight	= function(){
  var light	= new THREE.DirectionalLight( "#ffffff");
  light.castShadow = true;
  light.shadow.camera.top = 10;
  light.shadow.camera.bottom = - 10;
  light.shadow.camera.left = - 10;
  light.shadow.camera.right = 10;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far =40;
  light.shadow.radius = 100000;
  light.intensity = 1;
  // light.shadow.mapSize.width = 2048; 
  // light.shadow.mapSize.height = 2048;

	this.object3d	= light;
	
	this.update	= function(sunAngle){
		light.position.x = -3;
		light.position.y = Math.sin(sunAngle) * 20;
		light.position.z = Math.cos(sunAngle) * 30;
		var phase	= THREEx.DayNight.currentPhase(sunAngle)
		if( phase === 'day' ){
			light.color.set("rgb(255,"+ (Math.floor(Math.sin(sunAngle)*300)+55) + "," + (Math.floor(Math.sin(sunAngle)*300)) +")");
		}else if( phase === 'twilight' ){
		        light.intensity = 0.7;
	        	light.color.set("rgb(" + (255-Math.floor(Math.sin(sunAngle)*510*-1)) + "," + (55-Math.floor(Math.sin(sunAngle)*110*-1)) + ",0)");
		} else {
			light.intensity	= 0;
		}
	}	
}



THREEx.DayNight.Skydom		= function(){
	var geometry	= new THREE.SphereGeometry( 700, 32, 15 );
	var shader	= THREEx.DayNight.Skydom.Shader
	var uniforms	= THREE.UniformsUtils.clone(shader.uniforms)
	var material	= new THREE.ShaderMaterial({
		vertexShader	: shader.vertexShader,
		fragmentShader	: shader.fragmentShader,
		uniforms	: uniforms,
		side		: THREE.BackSide
	});

	var mesh	= new THREE.Mesh( geometry, material );
	this.object3d	= mesh
	
	this.update	= function(sunAngle){
		var phase	= THREEx.DayNight.currentPhase(sunAngle)
		if( phase === 'day' ){
			uniforms.topColor.value.set("rgb(0,120,255)");
			uniforms.bottomColor.value.set("rgb(255,"+ (Math.floor(Math.sin(sunAngle)*200)+55) + "," + (Math.floor(Math.sin(sunAngle)*200)) +")");
		} else if( phase === 'twilight' ){
			uniforms.topColor.value.set("rgb(0," + (120-Math.floor(Math.sin(sunAngle)*240*-1)) + "," + (255-Math.floor(Math.sin(sunAngle)*510*-1)) +")");
			uniforms.bottomColor.value.set("rgb(" + (255-Math.floor(Math.sin(sunAngle)*510*-1)) + "," + (55-Math.floor(Math.sin(sunAngle)*110*-1)) + ",0)");
		} else {
			uniforms.topColor.value.set('black')
			uniforms.bottomColor.value.set('black');
		}		
	}
}

THREEx.DayNight.Skydom.Shader	= {
	uniforms	: {
		topColor	: { type: "c", value: new THREE.Color().setHSL( 0.6, 1, 0.75 ) },
		bottomColor	: { type: "c", value: new THREE.Color( 0xffffff ) },
		offset		: { type: "f", value: 400 },
		exponent	: { type: "f", value: 0.6 },
	},
	vertexShader	: [
		'varying vec3 vWorldPosition;',
		'void main() {',
		'	vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
		'	vWorldPosition = worldPosition.xyz;',
		'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}',
	].join('\n'),
	fragmentShader	: [
		'uniform vec3 topColor;',
		'uniform vec3 bottomColor;',
		'uniform float offset;',
		'uniform float exponent;',

		'varying vec3 vWorldPosition;',

		'void main() {',
		'	float h = normalize( vWorldPosition + offset ).y;',
		'	gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( h, exponent ), 0.0 ) ), 1.0 );',
		'}',
	].join('\n'),
}
/// End Day night cycle///


const vertexScript = 
`varying vec2 vUv;

void main() {

    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

const fragmentScript = 
`			
uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;

varying vec2 vUv;

void main() {
  gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
}
`
/// main component/// 
class App extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.state = {
      time:"",
    };
    this.load = this.load.bind(this);
    this.startAnimationLoop = this.startAnimationLoop.bind(this);
    this.updateModel = this.updateModel.bind(this);
    this.onDocumentMouseOver = this.onDocumentMouseOver.bind(this);
  };
  componentDidMount() {
    this.sceneSetup();
    this.load();
    this.updateModel()
    window.addEventListener("resize", this.handleWindowResize);
    window.addEventListener('mousemove', this.onDocumentMouseOver );
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleWindowResize);
    window.removeEventListener("mousemove", this.onDocumentMouseOver);

    window.cancelAnimationFrame(this.requestID);
    this.controls.dispose();
  }
  componentDidUpdate(prevProps, prevState) {
    if ((prevProps.timelineActive !== this.props.timelineActive) &&(this.props.timelineActive === 1)) {
      axios.get('http://localhost:8081/slackRoute/getBulkData', {
      }).then(function (res) {
      if (res.data.presenceData === undefined || res.data.presenceData.length === 0) {
          // array empty or does not exist
      } else {
        console.log(res)
        timeArr = (res.data.presenceData.map(function(value,index) { 
                    return value[res.data.presenceData[0].length-1]; 
                  }));
        goal = __this.props.timelineTime;
        closest = timeArr.reduce(function(prev, curr) {
          return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
        });        
        relevantIndex = (timeArr.indexOf(closest));
        relevantPresence = res.data.presenceData[relevantIndex];
        relevantActivity = res.data.activityMetricData[relevantIndex];
        if (relevantPresence[2] === 1){
          // __this.bloomPass2.strength = 1.2;
          // __this.circleWindow.material.color.setHex( 0xe0cc48 );
        } else {

          // __this.bloomPass2.strength = 0.1;
          // __this.circleWindow.material.color.setHex( 0x18072e );
        }
      };
      }).catch(function (error) {
        if (error.response !== void(0)){

        if (error.response.status===401) {
          let blocker = document.getElementById("blocker");
          if (blocker.style.display !== "block") {

            blocker.style.display="block";
            let notLoggedIn = document.getElementById("notLoggedInWarning");
            notLoggedIn.style.display="block";
          }
        }
        }
        console.log("Axios error:")
        console.log(error)
    });
    } 
  }

  sceneSetup = () => {
    appContainer = document.getElementById("appContainer");
    appContainer.appendChild( stats.dom );

    // get container dimensions and use them for scene sizing
    const width = appContainer.clientWidth;
    const height = appContainer.clientHeight;
    //camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width/height, 1, 10000); //init camera. 1, 1000 sets camera "Frustrum"; see docs
    this.camera.position.set(-10, 10, 10); //set initial camera position
    this.camera.lookAt(0, 5, 0); //set location camera initially points at 
    
    /// camera control ///
    this.controls = new OrbitControls(this.camera, this.el);
    this.controls.enableDamping = true;
    this.controls.dampingFactor= 0.2;
    this.controls.domElement= appContainer; /// prevents adjusting of timeline from triggering pan and zoom on rendering screen
    this.controls.maxDistance = 35; //min zoom
    this.controls.minDistance = 2; //max zoom
    this.controls.minPolarAngle = Math.PI/10; //min camera angle
    this.controls.maxPolarAngle = Math.PI/2; //max camera angle

    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha:false, powerPreference:"low-power"}); // init renderer
    this.renderer.setSize(width, height);
    // this.renderer.setClearColor
    // this.renderer.shadowMap.enabled = true;
    // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // for softer shadows
    this.renderer.capabilities.maxTextureSize=1;

    
    // renderer.autoClear = false;
    this.renderer.setSize(width, height);
    // this.renderer.toneMapping = THREE.ReinhardToneMapping; // can set tonemapping for overall vibes
    // this.renderer.toneMappingExposure = Math.pow(1, 4.0);

    this.el.appendChild(this.renderer.domElement); // mount using React ref

    this.renderScene = new RenderPass( this.scene, this.camera )    
    this.bloomComposer = new EffectComposer( this.renderer );

    this.par = new THREE.Group(); // init parent group for all objects in scene


    /// Floor ///
    var geoFloor = new THREE.BoxBufferGeometry( 400, 0.1, 400 ); /// ground
    var floorTexture = new THREE.TextureLoader().load(FloorTexture);
    var matStdFloor = new THREE.MeshStandardMaterial( { map:floorTexture, roughness: 0.2, metalness: 0 } );
    var floor = new THREE.Mesh( geoFloor, matStdFloor );
    floor.receiveShadow = true;
    this.scene.add( floor );
    /// End Floor /// 


    this.skydom = new THREEx.DayNight.Skydom();
    this.scene.add(this.skydom.object3d);
    /// insert lights ///
    this.sunLight	= new THREEx.DayNight.SunLight();
    this.scene.add( this.sunLight.object3d );

    
    var ambiLight = new THREE.AmbientLight( "#FFFFFF", 0.05 );
    this.scene.add(ambiLight)
    /// end insert lights///

  };


  load = () => {
    __this = this; //access "this inside functions
    appContainer = document.getElementById("appContainer");
    // get container dimensions and use them for scene sizing
    const width = appContainer.clientWidth;
    const height = appContainer.clientHeight;
    var numLoadedModels = 0; // init local vars
    var dracoLoader = new DRACOLoader(); // prep loader
    dracoLoader.setDecoderPath( '/draco/gltf/' );

    loadModels(); // execute load models
    
    let setModelsInWorld = ()=> {
    
        ///ADD PLANE///
        const planeGroup = this.par.getObjectByName("/static/media/airplane.ca054c40.glb");
        this.plane = planeGroup.getObjectByName("Plane")
        // const banner = this.plane.getObjectByName("Banner");
        this.mixer = new THREE.AnimationMixer( planeGroup );
        // this.mixer.clipAction(planeGroup.animations[1]).play();
        var planeClips = planeGroup.animations;
        planeClips.forEach(function(clip) {
          __this.mixer.clipAction( clip ).play();
        })
        // this.mixer2 = new THREE.AnimationMixer( planeGroup );
			  // this.mixer2.clipAction(planeGroup.animations[0]).play();
        var box = new THREE.Box3().setFromObject( planeGroup );
        // Reset mesh position:
        box.getCenter( planeGroup.position);
        planeGroup.position.multiplyScalar(-1);
        this.planeRotateGroup = new THREE.Group();

        // this.scene.add(this.planeRotateGroup);
        this.planeRotateGroup.add( planeGroup);
        this.planeRotateGroup.rotation.z=Math.PI/6;
        this.planeRotateGroup.castShadow=true;
        ///END ADD PLANE///

        ///ADD BUILDING///
        const dlBuilding = this.par.getObjectByName("/static/media/building.9ccf91d1.glb");
        dlBuilding.position.set(0, 0.5, 0);
        this.windows = dlBuilding.getObjectByName("Windows");
        this.scene.add(dlBuilding) // adding it to the actual scene 
        this.buildingMixer = new THREE.AnimationMixer( dlBuilding );
        var buildingClips = dlBuilding.animations;
        buildingClips.forEach(function(clip) {
          __this.buildingMixer.clipAction( clip ).play();
        })

        ///END ADD BUILDING///

        // GLOW WINDOWS //
        RectAreaLightUniformsLib.init();

        this.windows.traverse( function(node) {
          if ( node instanceof THREE.Mesh ) {
            node.material = new THREE.MeshBasicMaterial({
              color:"#e0cc48", // window ON
              });
            node.layers.toggle( BLOOM_SCENE );
            if (node.name === "Window173" || node.name === "Window104") {
                  var rectLight = new THREE.RectAreaLight( "#e0cc48", 5,  2, 2 );
                  rectLight.translateZ(0.5);
                  rectLight.rotateY(Math.PI/2)
                  node.add( rectLight )
                  // var rectLightMesh = new THREE.Mesh( new THREE.PlaneBufferGeometry(), new THREE.MeshBasicMaterial( { color:"#e0cc48", side: THREE.FrontSide } ) );
                  // rectLightMesh.scale.x = rectLight.width;
                  // rectLightMesh.scale.y = rectLight.height;
                  // rectLight.add( rectLightMesh );
            } else if(windowsPermaOff.includes(node.name)) {
                node.material = new THREE.MeshBasicMaterial({
                  color:"#060f2b", // window OFF 
                  });
            };

          };
          const loadingScreen = document.getElementById( 'loadingScreen' );
          loadingScreen.classList.add( 'fade-out' );        
          console.log( 'Loading Complete!');
          loadingScreen.addEventListener("transitioned", removeLoadingScreen)

        });
        // END GLOW WINDOWS //

      var bloomPass85 = new UnrealBloomPass( new THREE.Vector2( width, height ), 1.5, 0.4, 0.85)
      bloomPass85.threshold = 0.7;
      bloomPass85.strength = 0.7;
      bloomPass85.radius = 0.55;

      this.bloomComposer.setSize( width, height )
      this.bloomComposer.renderToScreen = false;
			this.bloomComposer.addPass( this.renderScene );
      this.bloomComposer.addPass( bloomPass85 );
      

      var finalPass = new ShaderPass(
				new THREE.ShaderMaterial( {
					uniforms: {
						baseTexture: { value: null },
						bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
					},
					vertexShader: vertexScript,
					fragmentShader: fragmentScript,
					defines: {}
				} ), "baseTexture"
			);
			finalPass.needsSwap = true;

			this.finalComposer = new EffectComposer( this.renderer );
			this.finalComposer.addPass( this.renderScene );
			this.finalComposer.addPass( finalPass );

      this.startAnimationLoop()
      
    };

    // load new model 

    function loadGLBModel( model, loader,onLoaded ) {
      var loader = new GLTFLoader();
      loader.setDRACOLoader( dracoLoader );

      loader.load( model, function ( gltf ) {
        __this.model=gltf.scene;
        console.log('model')
        console.log(model)
        console.log('anim')
        console.log(gltf.animations)
        __this.model.name = model;
        __this.model.animations = gltf.animations;
        __this.par.add(__this.model)

        // Enable Shadows
        __this.model.traverse( function ( object ) {
          if ( object.isMesh ) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        } );
        onLoaded();
      });
    }
    function loadModels() {
      var loader = new GLTFLoader();
      for ( let i = 0; i < MODELS.length; ++ i ) {
        var m = MODELS[ i ];
        loadGLBModel( m,loader, function () {
          numLoadedModels+=1;
          if ( numLoadedModels === MODELS.length ) {
            setTimeout(function() {
              setModelsInWorld();
            },1000);   
          }
        });
      }
    }
    function removeLoadingScreen(event) {
      event.target.remove()
    }

  };

  startAnimationLoop = () => {
    this.controls.update();
    stats.update();
    delta = clock.getDelta();

    this.mixer.update( delta ); // plane animation
    this.buildingMixer.update(delta);
    d = new Date();
    timeMins= d.getHours()*60+d.getMinutes();
    if (this.props.timelineActive === 1) {
      sunTheta = (Math.floor(this.props.timelineTime/4)-120)*Math.PI/180; // start at 8 am
    } else {
      // sunTheta = (Math.floor(timeMins/4)-120)*Math.PI/180; // start at 8 am
      sunTheta = Math.PI/2;
    }
    t += 0.01;
    if (Math.abs(t-2*Math.PI) < 0.01) {
      t = 0;
    }
    if (this.planeRotateGroup !== undefined) {
      this.planeRotateGroup.position.set(15*Math.cos(t)-10, 20, 10*Math.sin(t)-10); // change 20 to other for plane size and divide t by speed
      this.planeRotateGroup.rotation.y=-t;
    }
    this.sunLight.update(sunTheta);
    this.skydom.update(sunTheta);

    this.scene.traverse( this.darkenNonBloomed );
    this.bloomComposer.render();

    this.scene.traverse( this.restoreMaterial );
    this.finalComposer.render();

    this.requestID = window.requestAnimationFrame(this.startAnimationLoop);
  };


  updateModel() {
    __this = this;
    var highFivesArr;
    setInterval(function() {
      if (__this.props.timelineActive !== 1){ 
        axios.get('http://localhost:8081/slackRoute/getPresence', {
        }).then(function (res) {
            data = res.data;
            // var rbenefoOnline = data.find(x => x.real_name === 'rbenefo').online;
            // if (rbenefoOnline === 1){
            //   // __this.bloomPass2.strength = 1.2;
            //   // __this.circleWindow.material.color.setHex( 0xe0cc48);
            // } else {
            //   // __this.bloomPass2.strength = 0.1;
            //   // __this.circleWindow.material.color.setHex( 0x18072e);
            // }
        }).catch(function (error) {
          if (error.response !== void(0)){
          if (error.response.status===401) {
            let blocker = document.getElementById("blocker");
            if (blocker.style.display !== "block") {
              blocker.style.display="block";
              let notLoggedIn = document.getElementById("notLoggedInWarning");
              notLoggedIn.style.display="block";
            }
          }
        };

          console.log("Axios error:")
          console.log(error)
      });
    }
    }, 20000); // 20 seconds
    setInterval(function() {
      axios.get('http://localhost:8081/slackRoute/getHighFives', {
      }).then(function (res) {
        highFivesArr = res.data;
        let result = highFivesArr.map(a => {if (a.user ==="U017PEP5XV0") return a.text}); //replace U017PEP5XV0 with High Five bot        
        let i = 0;
        if (result.length >0 && i<result.length) {
          loopHighFives()
        }
        function loopHighFives() {
          if (__this.props.timelineActive !== 1){
            const banner = __this.plane.getObjectByName("Banner"); //rm const
            var drawCanvas = document.createElement("CANVAS");
            drawCanvas.width = 1800;
            drawCanvas.height=1200;
            var ctx = drawCanvas.getContext("2d");
            ctx.font = "250px Quicksand";
            ctx.fillStyle = "white";
            ctx.textAlign="center";
            ctx.transform(1, 0, 0, -1, 0, drawCanvas.height)
            ctx = wrapText(ctx, result[i], (drawCanvas.width-20)/2, 250, drawCanvas.width-100, 350);
            ctx.textBaseline = "middle";
    
            var canvaTexture=new THREE.CanvasTexture( drawCanvas );
            canvaTexture.wrapS = THREE.RepeatWrapping;
    
            banner.material	= new THREE.MeshStandardMaterial({
              map	: canvaTexture,
              side: THREE.DoubleSide,
      
            })
        function wrapText(context, text, x, y, maxWidth, lineHeight) { // function from codepen.io/nishiohirokazu/pen/jjNyye (MIT license)
          var words = text.split(' ');
          var line = '';
          for (var n = 0; n<words.length; n++) {
            var testLine = line+words[n]+' ';
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
              context.fillText(line, x, y);
              line = words[n]+ ' ';
              y+= lineHeight;
            } else {
              line = testLine;
            }
          }
          context.fillText(line,x,y);
          return context;
          }
            __this.scene.add(__this.planeRotateGroup)
          }
          setTimeout(function() {
            if (__this.scene.getObjectByName("planeRotateGroup")!==void(0)) {
            __this.scene.remove(__this.planeRotateGroup)
            }
            i++;
            if (i < result.length+1) loopHighFives();
          },50000/result.length );
      }
      }).catch(function (error) {
        if (error.response !== void(0)){
        if (error.response.status===401) {
          let blocker = document.getElementById("blocker");
          if (blocker.style.display !== "block") {
            blocker.style.display="block";
            let notLoggedIn = document.getElementById("notLoggedInWarning");
            notLoggedIn.style.display="block";
          }
        }
      }
        console.log("Axios error high five:")
        console.log(error)
    });
    }, 60000);//60000 ; 1 mins
}

  onDocumentMouseOver( event ) {
    event.preventDefault();
    appContainer = document.getElementById("appContainer");
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, this.camera );
    intersects = raycaster.intersectObjects( this.scene.children, true );
    windowPopUp = document.createElement("div");
    windowPopUp.id = "windowPopup"

    if ( intersects.length > 0 ) {
      object = intersects[ 0 ].object;
      if (this.windows) {
        if ((this.windows.getObjectByName(object.name) !==void(0)) && (this.windows.getObjectByName(object.name).type !=="RectAreaLight")) {
            if (intersected !== object) {            
            windowPopUp.innerHTML += object.name;
            windowPopUp.style.left = event.clientX+'px';
            windowPopUp.style.top = event.clientY+'px';
            if (appContainer.querySelector("#windowPopup") === null) {
            appContainer.appendChild(windowPopUp);
            }
            if (intersected) {
              intersected.material.color.setHex( intersected.currentHex );
            } else {
              intersected = null;
            }
            intersected = object;
            intersected.currentHex = intersected.material.color.getHex();
						intersected.material.color.setHex( 0x691524 );
          }
        } else {
            if (intersected) intersected.material.color.setHex( intersected.currentHex );
            intersected = null;
            if ((windowPopUp !==void(0)) && (appContainer.querySelector("#windowPopup") !== null)){
                appContainer.removeChild(appContainer.querySelector("#windowPopup"));
              } 
          }
    } else {
        intersected=null;
        if ((windowPopUp !==void(0)) && (appContainer.querySelector("#windowPopup") !== null)){
          appContainer.removeChild(appContainer.querySelector("#windowPopup"));
        } 

    }
    }

  }
  darkenNonBloomed( obj ) {
    if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {
      materials[ obj.uuid ] = obj.material;
      obj.material = darkMaterial;
    }
  }

  restoreMaterial( obj ) {
    if ( materials[ obj.uuid ] ) {
      obj.material = materials[ obj.uuid ];
      delete materials[ obj.uuid ];
    }
  }


  handleWindowResize = () => {
    const width = this.el.clientWidth;
    const height = this.el.clientHeight;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;

    // Note that after making changes to most of camera properties you have to call
    // .updateProjectionMatrix for the changes to take effect.
    this.camera.updateProjectionMatrix();
  };

  render() {
    return (
    <div id = "visual"  ref={ref => (this.el = ref)}>
    <About/>
    
    </div>
    );
  }
}
class Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      timelineActive:0,
    };
    this.isTimelineActive = this.isTimelineActive.bind(this);

    this.recordTimelineTime = this.recordTimelineTime.bind(this);

  };  
  
  isTimelineActive(bool) {
    this.setState({timelineActive:bool})
  }
  recordTimelineTime(timelinePercentage) {
    var date = new Date(); // REMOVE VARS
    timeMins= date.getHours()*60+date.getMinutes();
    var timelineTime = timeMins*timelinePercentage;
    this.setState({time: timelineTime})
  }
  convertTimelineTimeToClockTime(){
    if ((this.state.time) && (this.state.timelineActive ===1)) {
    let clockTimeHours = Math.floor(this.state.time/60)
    let clockTimeMins = Math.trunc(this.state.time % 60);
    let clockTimeMinsStr = clockTimeMins.toString();
    if (clockTimeMinsStr.length ===1) { // otherwise,round hours get displayed as "7:0", not "7:00"
    clockTimeMinsStr = "0"+clockTimeMinsStr;
    }
    let clockTime = clockTimeHours.toString() + ":"+clockTimeMinsStr;
    return clockTime 
    }
  }
  closeWarning() {
    let notLoggedIn = document.getElementById("notLoggedInWarning");
    let blocker = document.getElementById("blocker");
    notLoggedIn.style.display="none";
    blocker.style.display="none";
  }
  render() {
    return (
      <div style = {style} id = "container">
        <div id = "appContainer">
        <div id = "clockTime">{this.convertTimelineTimeToClockTime()}</div>
        <App timelineActive ={this.state.timelineActive} timelineTime = {this.state.time}/>
        </div>
        <Timeline timelineActive={this.isTimelineActive}  timelineTime = {this.recordTimelineTime}/>
        
        <div id = "notLoggedInWarning">You’re not logged into your Deeplocal account! Log in to view Deeplocal’s virtual office.<Login/></div>
        <div id = "blocker" onClick = {this.closeWarning}/>
        <div id = "loadingScreen">
          <img src={DLLogo} id = "loadingLogo"/>
        </div>
      </div>
    );
  }
}



export default Container;