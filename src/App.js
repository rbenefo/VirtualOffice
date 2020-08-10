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

import FloorTexture from './assets/images/FloorGradient.jpg';
import About from './components/About';
import Timeline from './components/Timeline'
import Login from './components/Login'

import DLLogo from './assets/images/dlLogo.jpg'
import './App.css';
import { MeshPhysicalMaterial } from "three";

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

var hoverContacts = ["ForkLift001", "Sign_FortPittThatsIt", "GarageDoor_Right", "Plane"];
var hoverClips = ["ForkLIftEmptyAction", "CrateAction.001", "RightGarageAction", "ESTD.action.001", "2006.action.001", "ChalkyCarEmptyAction.002", "ChalkyEmptyAction.002", "cloud1Action", "cloud2|cloud2|cloud1Action|cloud2|cloud1Action", "cloud3Action"];
var MODELS = [DLBuildingGLB, PlaneGLB];  ///list all GLB models in world

const style = {
  height: window.innerHeight, // we can control scene size by setting container dimensions
};

var delta, d, timeMins;
var __this;
var appContainer;
var data;
let timeArr, goal, closest, relevantIndex, relevantPresence, relevantActivity;
var intersects, windowPopUp, popUpTitle, popUpText, object;

/// End Initialize Vars ///



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
  light.intensity = 2.5;
  // light.shadow.mapSize.width = 2048; 
  // light.shadow.mapSize.height = 2048;

	this.object3d	= light;
	
	this.update	= function(sunAngle){
		light.position.x = 10;
		light.position.y = Math.sin(sunAngle) * 100;
		light.position.z = Math.cos(sunAngle) * 100;
		var phase	= THREEx.DayNight.currentPhase(sunAngle)
		if( phase === 'day' ){
      light.color.set("rgb(255,"+ (Math.floor(Math.sin(sunAngle)*200)+55) + "," + (Math.floor(Math.sin(sunAngle)*200)+55) +")");
      light.intensity=2.5;
		}else if( phase === 'twilight' ){
		        light.intensity = 0.7;
	        	light.color.set("rgb(" + (255-Math.floor(Math.sin(sunAngle)*510*-1)) + "," + (55-Math.floor(Math.sin(sunAngle)*110*-1)) + ",0)");
		} else {
			light.intensity	= 0;
		}
	}	
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
          let loginButton = document.getElementById("loginButton");
          if (loginButton.style.backgroundColor !== "#c45949") {
            loginButton.style.backgroundColor="#c45949";
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
    this.camera.position.set(25, 35, 30); //set initial camera position
    this.camera.lookAt(0, 25, 0); //set location camera initially points at 
    
    /// camera control ///
    this.controls = new OrbitControls(this.camera, this.el);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.dampingFactor= 0.2;
    this.controls.domElement= appContainer; /// prevents adjusting of timeline from triggering pan and zoom on rendering screen
    this.controls.maxDistance = 60; //min zoom
    this.controls.minDistance = 2; //max zoom
    this.controls.minPolarAngle = Math.PI/10; //min camera angle
    this.controls.maxPolarAngle = Math.PI/2.5; //max camera angle
    

    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha:false, powerPreference:"low-power"}); // init renderer
    this.renderer.setSize(width, height);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;




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
    // var geoFloor = new THREE.BoxBufferGeometry( 400, 0.1, 400 ); /// ground
    // var floorTexture = new THREE.TextureLoader().load(FloorTexture);
    // var matStdFloor = new THREE.MeshStandardMaterial( { map:floorTexture, roughness: 0.7, metalness: 0 } );
    // var floor = new THREE.Mesh( geoFloor, matStdFloor );
    // floor.receiveShadow = true;
    // this.scene.add( floor );
    /// End Floor /// 


    /// insert lights ///
    this.sunLight	= new THREEx.DayNight.SunLight();
    this.scene.add( this.sunLight.object3d );

    
    this.ambiLight = new THREE.AmbientLight( 0xFFFFFF, 0.3 );
    this.scene.add(this.ambiLight)
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    this.scene.add(this.hemiLight)

    /// end insert lights///

  };

  setLights = (sunAngle)=> {
    let phase = THREEx.DayNight.currentPhase(sunAngle)
		if( phase === 'day' ){
      this.scene.background = new THREE.Color("rgb("+(Math.floor(Math.sin(sunAngle)*200))+","+ (Math.floor(Math.sin(sunAngle)*200)+38) + ",255)");
		}else if( phase === 'twilight' ){
      this.scene.background =new THREE.Color("rgb(0," + (120-Math.floor(Math.sin(sunAngle)*240*-1)) + "," + (255-Math.floor(Math.sin(sunAngle)*510*-1)) +")")
		} else if (phase === "night"){
      this.scene.background =new THREE.Color("rgb(0,0, 0)");

      this.ambiLight.intensity = 0.2;
      this.hemiLight.intensity = 0.05;


		}

  }


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
        this.mixer = new THREE.AnimationMixer( planeGroup );
        var planeClips = planeGroup.animations;
        planeClips.forEach(function(clip) {
          __this.mixer.clipAction( clip ).play();
        })
        var box = new THREE.Box3().setFromObject( planeGroup );
        // Reset mesh position:
        box.getCenter( planeGroup.position);
        planeGroup.position.multiplyScalar(-1);
        this.planeRotateGroup = new THREE.Group();

        this.planeRotateGroup.add( planeGroup);
        this.planeRotateGroup.rotation.z=Math.PI/6;
        this.planeRotateGroup.castShadow=true;

        ///END ADD PLANE///

        ///ADD BUILDING///
        this.dlBuilding = this.par.getObjectByName("/static/media/building.0741ca1a.glb");
        this.dlBuilding.position.set(0, 0.5, 0);
        this.windows = this.dlBuilding.getObjectByName("Windows");
        this.scene.add(this.dlBuilding) // adding it to the actual scene 
        this.buildingMixer = new THREE.AnimationMixer( this.dlBuilding );
        this.hoverMixer = new THREE.AnimationMixer( this.dlBuilding );

        this.buildingClips = this.dlBuilding.animations;
        this.buildingClips.forEach(function(clip) {
          if (hoverClips.includes(clip.name) === false) __this.buildingMixer.clipAction( clip ).play();
        })
        let streetLampBulb1 = this.dlBuilding.getObjectByName("00-LIT-starc-lamp-bulb-r002");
        let streetLampBulb2 = this.dlBuilding.getObjectByName("00-LIT-starc-lamp-bulb-r001");
        let lightBulbLamp= new THREE.PointLight( 0xffffff, 1, 0, 2 ); 
        streetLampBulb1.add(lightBulbLamp)
        streetLampBulb2.add(lightBulbLamp)

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
            } else if(windowsPermaOff.includes(node.name)) {
                node.material = new THREE.MeshPhongMaterial({
                  color:"#000000", // window OFF 
                  });
            };

          };


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
      
      const loadingScreen = document.getElementById( 'loadingScreen' );
      loadingScreen.classList.add( 'fade-out' ); 
      setTimeout(function() {
        loadingScreen.parentNode.removeChild(loadingScreen);
      },1500);   
      this.startAnimationLoop()
      
    };

    // load new model 

    function loadGLBModel( model, loader,onLoaded ) {
      loader.setDRACOLoader( dracoLoader );

      loader.load( model, function ( gltf ) {
        __this.model=gltf.scene;
        console.log('model')
        console.log(model)
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
            },2000);   
          }
        });
      }
    }

  };

  startAnimationLoop = () => {
    this.controls.update();
    stats.update();
    delta = clock.getDelta();

    this.mixer.update( delta ); // plane animation
    this.buildingMixer.update(delta);
    this.hoverMixer.update(delta);
    d = new Date();
    timeMins= d.getHours()*60+d.getMinutes();
    if (this.props.timelineActive === 1) {
      sunTheta = (Math.floor(this.props.timelineTime/4)-120)*Math.PI/180; // start at 8 am
    } else {
      sunTheta = (Math.floor(timeMins/4)-120)*Math.PI/180; // start at 8 am
      // sunTheta = Math.PI/2;
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

    this.scene.traverse( this.darkenNonBloomed );
    this.scene.background=new THREE.Color( 0x000000);

    this.bloomComposer.render();

    this.scene.traverse( this.restoreMaterial );
    // this.scene.background=new THREE.Color( 0xd6ebff);
    this.setLights(sunTheta)


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
          let loginButton = document.getElementById("loginButton");
          if (loginButton.style.backgroundColor !== "#c45949") {
            loginButton.style.backgroundColor="#c45949";
          }
        }
      }

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
          let loginButton = document.getElementById("loginButton");
          if (loginButton.style.backgroundColor !== "#c45949") {
            loginButton.style.backgroundColor="#c45949";
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
    popUpTitle = document.createElement("div");
    popUpText= document.createElement("div");

    popUpTitle.id = "popUpTitle";
    popUpText.id = "popUpText";

    windowPopUp.appendChild(popUpTitle)
    windowPopUp.appendChild(popUpText)

    windowPopUp.id = "windowPopup";

    if ( intersects.length > 0 ) {
      object = intersects[ 0 ].object;
      if (this.scene) {
        if (hoverContacts.includes(object.parent.name)) {
            if (object.parent.name === "ForkLift001") {
              popUpTitle.innerHTML = "IN HOUSE PRODUCTION"
              popUpText.innerHTML = "Whether we’re making robots, software or socks, we do the vast majority of our production in house. This allows us to be nimble in our process and give our clients excellent visibility into each project, from start to finish. <br><br> We’re involved every step of the way from insight to install. We make our inventions ourselves: fast, flawlessly, and fully in-house in our 12,000 square foot prototyping facility."
              let forkLiftEmptyAnim = this.hoverMixer.clipAction( this.buildingClips[7]);
              forkLiftEmptyAnim.setLoop(THREE.LoopOnce);
              forkLiftEmptyAnim.clampWhenFinished = true
              let crateAction = this.hoverMixer.clipAction( this.buildingClips[16] );
              crateAction.setLoop( THREE.LoopOnce )
              crateAction.clampWhenFinished = true;
              forkLiftEmptyAnim.play().reset();
              crateAction.play().reset();

            } else if (object.parent.name === "Sign_FortPittThatsIt") {
              popUpTitle.innerHTML = "MADE IN PITTSBURGH"
              popUpText.innerHTML = "Founded in Pittsburgh, grounded in Sharpsburg. We’re proud to be from a city of disruptors, innovators, and makers. Our office and state-of-the-art prototyping facility are located in the Old Fort Pitt Brewery building, nestled in Pittsburgh’s historic Sharpsburg neighborhood."
            } else if (object.parent.name==="chalky001") {
              popUpTitle.innerHTML = "CHALKBOT"
              popUpText.innerHTML = "Meet the Nike Chalkbot. We disrupted the industry with the first use of robotics in advertising. The rest is history in the making.<br><br>Most of our work is made up of custom inventions that are world firsts. Meet the Nike Chalkbot, the first use of robotics in advertising. "

            } else if (object.parent.name ==="GarageDoor_Right") {
              popUpTitle.innerHTML = "CHALKBOT"
              popUpText.innerHTML = "Meet the Nike Chalkbot. We disrupted the industry with the first use of robotics in advertising. The rest is history in the making.<br><br>Most of our work is made up of custom inventions that are world firsts. Meet the Nike Chalkbot, the first use of robotics in advertising. "
              let rightGarageAction = this.hoverMixer.clipAction( this.buildingClips[22]);
              let chalkyCarEmptyAction = this.hoverMixer.clipAction( this.buildingClips[19]);
              let chalkyEmptyAction = this.hoverMixer.clipAction( this.buildingClips[20]);
              let ESTDAction = this.hoverMixer.clipAction( this.buildingClips[21]);
              let TWO006Action = this.hoverMixer.clipAction( this.buildingClips[18]);
              rightGarageAction.clampWhenFinished = true;
              chalkyCarEmptyAction.clampWhenFinished = true;
              chalkyEmptyAction.clampWhenFinished = true;
              ESTDAction.clampWhenFinished = true;
              TWO006Action.clampWhenFinished = true;
              rightGarageAction.setLoop( THREE.LoopOnce )
              chalkyCarEmptyAction.setLoop( THREE.LoopOnce )
              chalkyEmptyAction.setLoop( THREE.LoopOnce )
              ESTDAction.setLoop( THREE.LoopOnce )
              TWO006Action.setLoop( THREE.LoopOnce )
              rightGarageAction.play().reset();
              chalkyCarEmptyAction.play().reset();
              chalkyEmptyAction.play().reset();
              ESTDAction.play().reset();
              TWO006Action.play().reset();
            } else if (object.parent.name ==="Plane") {
              popUpTitle.innerHTML = "EMPLOYEE HIGH FIVES"
              popUpText.innerHTML="Our team is comprised of creatives, marketers, strategists, technologists, engineers (mechanical, electrical, robotic, and software) and artists. See who's crushing it today."
            }
            if (intersected !== object) {            
            if (appContainer.querySelector("#windowPopup") === null) {
            appContainer.appendChild(windowPopUp);
            }
            if (intersected) {
              for (let j = 0; j < intersected.parent.children.length; j++) {
                intersected.parent.children[j].material = new MeshPhysicalMaterial({color:intersected.parent.children[j].currentHex});
              }
            } else {
              intersected = null;
            }
            intersected = object;
            for (let j = 0; j < intersected.parent.children.length; j++) {
              intersected.parent.children[j].currentHex = intersected.parent.children[j].material.color.getHex();
              intersected.parent.children[j].material = new MeshPhysicalMaterial({color:0x691524});
            }
          }
        } else {
            if (intersected) {
              for (let j = 0; j < intersected.parent.children.length; j++) {
              intersected.parent.children[j].material.color.setHex( intersected.parent.children[j].currentHex );
            }
          }
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
      let clockTimeDiv = document.getElementById("clockTime");
      if (clockTimeDiv !== null) clockTimeDiv.innerHTML=clockTime;
      }};
  render() {
    return (
      <div style = {style} id = "container">
        <div id = "appContainer">
        <div id = "clockTime">{this.convertTimelineTimeToClockTime()}</div>
        <App timelineActive ={this.state.timelineActive} timelineTime = {this.state.time}/>
        </div>
        <Timeline timelineActive={this.isTimelineActive}  timelineTime = {this.recordTimelineTime}/>
        
       <Login/>

         <div id = "loadingScreen">
          <img src={DLLogo} id = "loadingLogo"/>
        </div>

      </div>
    );
  }
}



export default Container;