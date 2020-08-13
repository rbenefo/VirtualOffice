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

import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

import About from './components/About';
import Timeline from './components/Timeline'
import Login from './components/Login'
import Onboard from './components/Onboard'
import DLLogo from './assets/images/dlLogo.jpg'
import DLFlagLogo from './assets/images/DLFlagLogo.jpg'

import './App.css';
import { MeshPhysicalMaterial } from "three";

axios.defaults.withCredentials=true;

/// Initialize Constants ///
var clock = new THREE.Clock();
var sunTheta;
var THREEx = {};
var t = 0;
var raycaster = new THREE.Raycaster();
var date;

var mouse = new THREE.Vector2();
var intersected;

var BLOOM_SCENE = 1;

var bloomLayer = new THREE.Layers();
bloomLayer.set( BLOOM_SCENE );
var darkMaterial = new THREE.MeshBasicMaterial( { color: "black" } );
var materials = {};

var windowsPermaOff = ["Window05","Window06", "Window144", "Window145", "Window146", 
"Window147", "Window132", "Window133", "Window134", "Window135", "window002", 
"Window25", "Window26", "Window75", "Window76", "Window264", "Window265", "Window266", 
"Window267", "Window55", "Window56", "Window57", "SideWindow07", "SideWindow12",
"Window58", "Window217", "Window218", "Window219", "Window220"];

var windowsToToggle = ["Window01", "Window02", "Window108", "Window109", 
                      "Window110", "Window111", "Window112", "Window113", "Window114", 
                      "Window115", "Window124", "Window125", "Window126", "Window127", "Window136",
                      "Window137", "Window138", "Window139", "Window148", "Window149",
                      "Window150", "Window151", "Window152", "Window153", "Window154",
                      "Window155", "Window164", "Window165", "Window166", "Window167",
                      "Window96", "Window97", "Window98", "Window99", "Window03", 
                      "Window04", "Window100", "Window101", "Window102", "Window103",
                      "Window116", "Window117", "Window118", "Window119", "Window120",
                      "Window121", "Window122", "Window123", "Window128", "Window129",
                      "Window130", "Window131", "Window140", "Window141", "Window142",
                      "Window143", "Window156", "Window157", "Window158", "Window159", 
                      "Window160", "Window161", "Window162", "Window163", "Window168", 
                      "Window169", "Window170", "Window171"];

var hoverContacts = ["ForkLift001", "Sign_FortPittThatsIt", "GarageDoor_Right", "Plane", "grill_tank_008", "Chimneys", "Van"];
var hoverClips = ["ForkLIftEmptyAction", "CrateAction.001", "RightGarageAction", "ESTD.action.001", "2006.action.001", "ChalkyCarEmptyAction.002", "ChalkyEmptyAction.002"];
var MODELS = [DLBuildingGLB, PlaneGLB];  ///list all GLB models in world

const style = {
  height: window.innerHeight, // we can control scene size by setting container dimensions
};

var delta, d, timeMins;
var __this;
var appContainer;
var timeArr, goal, closest, relevantIndex, relevantPresence;
var intersects, windowPopUp, popUpTitle, popUpText, object;

var loginButton;
var phase;
var banner, drawCanvas, ctx, canvaTexture, words, line, testLine, metrics, testWidth;

var forkLiftEmptyAnim, crateAction, rightGarageAction, chalkyCarEmptyAction, chalkyEmptyAction, ESTDAction, TWO006Action

var dhours;

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
  light.shadow.camera.top = 5;
  light.shadow.camera.bottom = - 5;
  light.shadow.camera.left = - 5;
  light.shadow.camera.right = 5;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far =300;
  light.shadow.bias = 0.001;
  
  light.shadow.radius = 10000;
  light.intensity = 2.5;

	this.object3d	= light;
	
	this.update	= function(sunAngle){
		light.position.x = Math.cos(sunAngle) * 60;
		light.position.y = Math.sin(sunAngle) * 60;
		light.position.z = 10;
		phase	= THREEx.DayNight.currentPhase(sunAngle)
		if( phase === 'day' ){
      light.color.set("rgb(255,"+ (Math.floor(Math.sin(sunAngle)*200)+55) + "," + (Math.floor(Math.sin(sunAngle)*200)+55) +")");
      light.intensity=2.5;

		}else if( phase === 'twilight' ){
		        light.intensity = 2.5+3.46*Math.sin(sunAngle);
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
      bulkData:[],
      highFives:[],
    };
    this.load = this.load.bind(this);
    this.startAnimationLoop = this.startAnimationLoop.bind(this);
    this.updateModel = this.updateModel.bind(this);
    this.onDocumentMouseOver = this.onDocumentMouseOver.bind(this);
    this.updateTimelineData = this.updateTimelineData.bind(this);
    this.initTimelineData = this.initTimelineData.bind(this);

  };
  componentDidMount() {
    console.log("test8")
    this.totRoomsOnTemp = 10000;
    this.sceneSetup();
    this.load();
    this.initTimelineData();
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


  sceneSetup = () => {
    appContainer = document.getElementById("appContainer");

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
    this.controls.dampingFactor= 0.2;
    this.controls.domElement= appContainer; /// prevents adjusting of timeline from triggering pan and zoom on rendering screen
    this.controls.maxDistance = 60; //min zoom
    this.controls.minDistance = 5; //max zoom
    this.controls.minPolarAngle = Math.PI/10; //min camera angle
    this.controls.maxPolarAngle = Math.PI/2.5; //max camera angle
    

    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha:false, powerPreference:"low-power"}); // init renderer
    this.renderer.setSize(width, height);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // for softer shadows
    this.renderer.capabilities.maxTextureSize=1;
    this.renderer.setSize(width, height);
    this.el.appendChild(this.renderer.domElement); // mount using React ref

    this.renderScene = new RenderPass( this.scene, this.camera )    
    this.bloomComposer = new EffectComposer( this.renderer );

    this.par = new THREE.Group(); // init parent group for all objects in scene

    /// insert lights ///
    this.sunLight	= new THREEx.DayNight.SunLight();
    this.scene.add( this.sunLight.object3d );
    this.ambiLight = new THREE.AmbientLight( 0xFFFFFF, 1.8 );
    this.scene.add(this.ambiLight)

    /// end insert lights///
  };

  setLights = (sunAngle)=> {
    phase = THREEx.DayNight.currentPhase(sunAngle)
		if( phase === 'day' ){
      this.scene.background = new THREE.Color("rgb("+(Math.floor(Math.sin(sunAngle)*35*(-1))+235)+","+ (Math.floor(Math.sin(sunAngle)*6)+232) + ",255)");
      this.ambiLight.intensity = 1.8;

    }else if( phase === 'twilight' ){
      this.scene.background =new THREE.Color("rgb("+(Math.floor(Math.sin(sunAngle)*470)+235)+"," + (232+Math.floor(Math.sin(sunAngle)*464)) + "," + (255+Math.floor(Math.sin(sunAngle)*510)) +")")
      this.ambiLight.intensity = 1.8+3.07*Math.sin(sunAngle);

    } else if (phase === "night"){
      this.scene.background =new THREE.Color("rgb(0,0, 0)");
      this.ambiLight.intensity = 0.2;
		}

  }


  load = () => {
    __this = this; //access "this inside functions
    appContainer = document.getElementById("appContainer");
    // get container dimensions and use them for scene sizing
    const width = appContainer.clientWidth;
    const height = appContainer.clientHeight;
    let numLoadedModels = 0; // init local vars
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
        this.bannerTexture = new THREE.TextureLoader().load(DLFlagLogo);
        this.bannerTexture.wrapT = THREE.RepeatWrapping;
        this.bannerTexture.wrapS = THREE.RepeatWrapping;

        this.bannerTexture.repeat.y = - 1;


        banner = __this.plane.getObjectByName("Banner"); //rm const
        banner.material	= new THREE.MeshStandardMaterial({
          map	: this.bannerTexture,
          side: THREE.DoubleSide,
  
        })
        this.scene.add(this.planeRotateGroup)

        ///END ADD PLANE///

        ///ADD BUILDING///
        this.dlBuilding = this.par.getObjectByName("/static/media/building.d2daf444.glb");
        this.dlBuilding.position.set(0, 0.5, 0);
        this.windows = this.dlBuilding.getObjectByName("Windows");
        this.scene.add(this.dlBuilding) // adding it to the actual scene 
        this.buildingMixer = new THREE.AnimationMixer( this.dlBuilding );
        this.hoverMixer = new THREE.AnimationMixer( this.dlBuilding );

        this.buildingClips = this.dlBuilding.animations;
        this.buildingClips.forEach(function(clip) {
          if (hoverClips.includes(clip.name) === false) __this.buildingMixer.clipAction( clip ).play();
        })
        let streetLampBulb2 = this.dlBuilding.getObjectByName("00-LIT-starc-lamp-bulb-r002");
        let streetLampBulb1 = this.dlBuilding.getObjectByName("00-LIT-starc-lamp-bulb-r001");
        streetLampBulb2.material = new THREE.MeshBasicMaterial({
          color:"#e0cc48", // light ON
          });
        streetLampBulb2.layers.toggle( BLOOM_SCENE );

        streetLampBulb1.material = new THREE.MeshBasicMaterial({
          color:"#e0cc48", // light ON
          });
        streetLampBulb1.layers.toggle( BLOOM_SCENE );
        let lightBulbLamp2= new THREE.PointLight( '#e0cc48', 30, 0, 2); 
        let lightBulbLamp1= new THREE.PointLight( '#e0cc48', 30, 0, 2); 
        lightBulbLamp2.position.set(3, 3, 1)
        lightBulbLamp1.position.set(-33, 4, 3.5)

        this.scene.add(lightBulbLamp2)
        this.scene.add(lightBulbLamp1)

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

      var bloomPass = new UnrealBloomPass( new THREE.Vector2( width, height ), 1.5, 0.4, 0.85)
      bloomPass.threshold = 0.7;
      bloomPass.strength = 0.4;
      bloomPass.radius = 0.2;

      this.bloomComposer.setSize( width, height )
      this.bloomComposer.renderToScreen = false;
			this.bloomComposer.addPass( this.renderScene );
      this.bloomComposer.addPass( bloomPass );
      

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
      },2000);   
      this.startAnimationLoop()
      
    };

    // load new model 

    function loadGLBModel( model, loader,onLoaded ) {
      loader.setDRACOLoader( dracoLoader );

      loader.load( model, function ( gltf ) {
        __this.model=gltf.scene;
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
      var m;
      for ( let i = 0; i < MODELS.length; ++ i ) {
        m = MODELS[ i ];
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
    delta = clock.getDelta();

    this.mixer.update( delta ); // plane animation
    this.buildingMixer.update(delta);
    this.hoverMixer.update(delta);
    d = new Date();
    dhours = d.getUTCHours()-4;
    if (dhours < 0) dhours = 24+dhours;

    timeMins= dhours*60+d.getMinutes();
    if (this.props.timelineActive === 1) {
      sunTheta = (Math.floor(this.props.timelineTime/4)-120)*Math.PI/180; // start at 8 am
      this.updateTimelineData()
    } else {
      sunTheta = (Math.floor(timeMins/4)-120)*Math.PI/180; // start at 8 am
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
    this.setLights(sunTheta)
    this.finalComposer.render();
    this.requestID = window.requestAnimationFrame(this.startAnimationLoop);
  };

  initTimelineData(){
    axios.get('https://virtualoffice-285701.ue.r.appspot.com/api/slackRoute/getBulkData', {
    }).then(function (res) {
      __this.setState({bulkData:res.data});
    }).catch(function (error) {
      if (error.response !== void(0)){
      if (error.response.status===401) {
        loginButton = document.getElementById("loginButton");
        if (loginButton.style.backgroundColor !== "#C58158") {
          loginButton.style.backgroundColor="#C58158";
        }
      }
    }

  })};

  updateTimelineData() {
    this.totRoomsOnTemp = 10000; // make totRoomsOnTemp large to force update
      __this = this;
      console.log(this.state.bulkData)
      if (this.state.bulkData !== []) {
        if ( typeof this.state.bulkData.presenceData !== "undefined" && this.state.bulkData.presenceData) {
          if (this.state.bulkData.presenceData.length > 0) {
          timeArr = (this.state.bulkData.presenceData.map(function(value,index) { 
                      return value[__this.state.bulkData.presenceData[0].length-1]; 
                    }));
          goal = this.props.timelineTime;
  
          closest = timeArr.reduce(function(prev, curr) {
            return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
          });        
          relevantIndex = (timeArr.indexOf(closest));
          relevantPresence = this.state.bulkData.presenceData[relevantIndex];
          relevantPresence.pop();
          var totOnline = 0;
          relevantPresence.forEach(function(val) {
            totOnline += val;
          })
          console.log("relevant presence bulk")
          console.log(relevantPresence)
          let totRoomsOn = Math.floor((totOnline/relevantPresence.length)*windowsToToggle.length);
          let frontWindows = __this.windows.getObjectByName("FrontWindows");
          let toTurnOn = [];
          let x = windowsToToggle.sort(function() {
            return 0.5 - Math.random();
          });
          toTurnOn = x.slice(0, totRoomsOn);
          console.log("to turn on bulk")
          console.log(toTurnOn)
          frontWindows.traverse(function(node) {
            if ((toTurnOn.includes(node.name)=== true) && (windowsToToggle.includes(node.name) ===true)) {
              node.material = new THREE.MeshBasicMaterial({
                color:"#e0cc48", // window ON  000000
                });
            } else if (windowsToToggle.includes(node.name) ===true)  {
              node.material = new THREE.MeshPhongMaterial({
                color:"#000000", // window ON
                });
            }
          })   
        }};
     };
    };
  updateModel() {
    __this = this;
    setInterval(function() {
      axios.get('https://virtualoffice-285701.ue.r.appspot.com/api/slackRoute/getBulkData', {
      }).then(function (res) {
        __this.setState({bulkData:res.data});
      }).catch(function (error) {
        if (error.response !== void(0)){
        if (error.response.status===401) {
          loginButton = document.getElementById("loginButton");
          if (loginButton.style.backgroundColor !== "#C58158") {
            loginButton.style.backgroundColor="#C58158";
          }
        }
      }
    });
    }, 300000); // every 5 minutes
    setInterval(function() {
      if (__this.props.timelineActive !== 1){ 
        axios.get('https://virtualoffice-285701.ue.r.appspot.com/api/slackRoute/getPresence', {
        }).then(function (res) {
            console.log("got live data")
            var data = res.data;
            var totOnline = 0;
            data.forEach(function(val) {
              totOnline += val;
            })
            let totRoomsOn = Math.floor((totOnline/data.length)*windowsToToggle.length);
            if (totRoomsOn !==__this.totRoomsOnTemp) { // only run if room #'s are different
            __this.totRoomsOnTemp = totRoomsOn;
            let frontWindows = __this.windows.getObjectByName("FrontWindows");
            let toTurnOn = [];
            let x = windowsToToggle.sort(function() {
              return 0.5 - Math.random();
            });
            toTurnOn = x.slice(0, totRoomsOn);
            console.log("live to turn on")
            console.log(toTurnOn)
            frontWindows.traverse(function(node) {
              if ((toTurnOn.includes(node.name)=== true) && (windowsToToggle.includes(node.name) === true)) {
                node.material = new THREE.MeshBasicMaterial({
                  color:"#e0cc48", // window ON 
                  });
              } else if (windowsToToggle.includes(node.name) === true) {
                node.material = new THREE.MeshPhongMaterial({
                  color:"#000000", // window OFF
                  });
              }    
            })}
        }).catch(function (error) {
          if (error.response !== void(0)){
        if (error.response.status===401) {
          loginButton = document.getElementById("loginButton");
          if (loginButton.style.backgroundColor !== "#C58158") {
            loginButton.style.backgroundColor="#C58158";
          }
        }
      }
      });
    }
    }, 10000); // 10 seconds
    setInterval(function() {
      axios.get('https://virtualoffice-285701.ue.r.appspot.com/api/slackRoute/getHighFives', {
      }).then(function (res) {
        let result = res.data.map(a => {if (a.user ==="U017PEP5XV0") return a.text}); //replace U017PEP5XV0 with High Five bot
        let newHighFives = __this.state.highFives.concat(result)
        __this.setState({highFives:newHighFives});   
      }).catch(function (error) {
        if (error.response !== void(0)){
        if (error.response.status===401) {
          loginButton = document.getElementById("loginButton");
          if (loginButton.style.backgroundColor !== "#C58158") {
            loginButton.style.backgroundColor="#C58158";
          }
        }
      }
    });
    }, 60000);//60000 ; 1 min

    setInterval(function() {
      console.log("high fives list")
      console.log(__this.state.highFives)
      if (__this.state.highFives.length > 0) {
        console.log("THERE ARE HIGH FIVES!!")
        if (__this.props.timelineActive !== 1){
          banner = __this.plane.getObjectByName("Banner"); 
          drawCanvas = document.createElement("CANVAS");
          drawCanvas.width = 1024;
          drawCanvas.height=1024;
          ctx = drawCanvas.getContext("2d");
          ctx.font = "250px Overpass";
          ctx.fillStyle = "white";
          ctx.textAlign="center";
          ctx.transform(1, 0, 0, -1, 0, drawCanvas.height)
          ctx = __this.wrapText(ctx, __this.state.highFives[0], (drawCanvas.width-20)/2, 100, drawCanvas.width-100, 350);
          ctx.textBaseline = "middle";
          canvaTexture=new THREE.CanvasTexture( drawCanvas );
          canvaTexture.wrapS = THREE.RepeatWrapping;
      
          banner.material	= new THREE.MeshStandardMaterial({map	: canvaTexture,side: THREE.DoubleSide,});
          __this.setState({highFives:__this.state.highFives.slice(1)})
        }
      } else {
        banner = __this.plane.getObjectByName("Banner"); //rm const
        banner.material	= new THREE.MeshStandardMaterial({
          map	: __this.bannerTexture,
          side: THREE.DoubleSide,
        })      
      }
    }, 120000) // 2 mins; planes fly for 2 mins
}

  wrapText(context, text, x, y, maxWidth, lineHeight) { // function from codepen.io/nishiohirokazu/pen/jjNyye (MIT license)
    words = text.split(' ');
    line = '';
    for (let n = 0; n<words.length; n++) {
      testLine = line+words[n]+' ';
      metrics = context.measureText(testLine);
      testWidth = metrics.width;
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
              popUpText.innerHTML = "Whether we’re making robots, roller coasters, or smart socks, we have a unique, end-to-end process from insight to install. We make our inventions ourselves: fast, flawlessly, and fully in-house in our 12,000 square foot prototyping facility."
              forkLiftEmptyAnim = this.hoverMixer.clipAction( this.buildingClips[3]);
              forkLiftEmptyAnim.setLoop(THREE.LoopOnce);
              forkLiftEmptyAnim.clampWhenFinished = true
              crateAction = this.hoverMixer.clipAction( this.buildingClips[12] );
              crateAction.setLoop( THREE.LoopOnce )
              crateAction.clampWhenFinished = true;
              forkLiftEmptyAnim.play().reset();
              crateAction.play().reset();

            } else if (object.parent.name === "Sign_FortPittThatsIt") {
              popUpTitle.innerHTML = "MADE IN PITTSBURGH"
              popUpText.innerHTML = "Founded in Pittsburgh, grounded in Sharpsburg. We’re proud to be from a city of disruptors, innovators, and makers. Our office and state-of-the-art prototyping facility are located in the Old Fort Pitt Brewery building, nestled in Pittsburgh’s historic Sharpsburg neighborhood."
            } else if (object.parent.name==="chalky001") {
              popUpTitle.innerHTML = "CHALKBOT"
              popUpText.innerHTML = "Deeplocal disrupted the industry with Chalkbot, the first use of robotics in advertising. Since then, we’ve created award-winning interactive experiences for the world’s most innovative brands."

            } else if (object.parent.name ==="GarageDoor_Right") {
              popUpTitle.innerHTML = "CHALKBOT"
              popUpText.innerHTML = "Deeplocal disrupted the industry with Chalkbot, the first use of robotics in advertising. Since then, we’ve created award-winning interactive experiences for the world’s most innovative brands."
              rightGarageAction = this.hoverMixer.clipAction( this.buildingClips[18]);
              chalkyCarEmptyAction = this.hoverMixer.clipAction( this.buildingClips[15]);
              chalkyEmptyAction = this.hoverMixer.clipAction( this.buildingClips[16]);
              ESTDAction = this.hoverMixer.clipAction( this.buildingClips[17]);
              TWO006Action = this.hoverMixer.clipAction( this.buildingClips[14]);

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
            } else if (object.parent.name ==="grill_tank_008") {
              popUpTitle.innerHTML = "COMPANY CULTURE"
              popUpText.innerHTML="Deeplocal is a place where amazing talent can invent, create, and inspire. Even with such a strong mix of individual talent, we work with and for each other. We share our wins, and you might even catch our team sharing some grub around the grill."
            } else if (object.parent.name ==="Chimneys") {
              popUpTitle.innerHTML = "CARBON DEFENSE LEAGUE"
              popUpText.innerHTML="Fun fact: our CEO Nathan Martin was leading a collective called the Carbon Defense League and fronting a grindcore band called “Creation is Crucifixion” in the early 2000s"
            } else if (object.parent.name ==="Van") {
              popUpTitle.innerHTML = "AT YOUR SERVICE"
              popUpText.innerHTML="This is our Deeplocal van. It’s put in some miles, and it’s always on the go, ready to help us install and support our clients’ projects."
            }

            if (intersected !== object) {            
            if (appContainer.querySelector("#windowPopup") === null) {
            appContainer.appendChild(windowPopUp);
            }
            if (intersected) {
              for (let j = 0; j < intersected.parent.children.length; j++) {
                if ((intersected.parent.children[j].material !== void(0)) && (intersected.parent.children[j].name !=="Banner")){
                intersected.parent.children[j].material = new MeshPhysicalMaterial({color:intersected.parent.children[j].currentHex});
              }}
            } else {
              intersected = null;
            }
            intersected = object;
            for (let j = 0; j < intersected.parent.children.length; j++) {
              if ((intersected.parent.children[j].material !== void(0)) && (intersected.parent.children[j].name !=="Banner")){
              intersected.parent.children[j].currentHex = intersected.parent.children[j].material.color.getHex();
              intersected.parent.children[j].material = new MeshPhysicalMaterial({color:0xc5a158});
            }}
          }
        } else {
            if (intersected) {
              for (let j = 0; j < intersected.parent.children.length; j++) {
              if ((intersected.parent.children[j].material !== void(0))&& (intersected.parent.children[j].name !=="Banner")){
              intersected.parent.children[j].material = new MeshPhysicalMaterial({color:intersected.parent.children[j].currentHex});
            }}
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

  componentDidMount() {
    date = new Date()
    let clockTimeHours = date.getUTCHours()-4;
    if (clockTimeHours < 0) clockTimeHours = 24+clockTimeHours;
    let clockTimeMins = date.getMinutes();
    let clockTimeMinsStr = clockTimeMins.toString();
    if (clockTimeMinsStr.length ===1) { // otherwise,round hours get displayed as "7:0", not "7:00"
    clockTimeMinsStr = "0"+clockTimeMinsStr;
    }
    let clockTime = clockTimeHours.toString() + ":"+clockTimeMinsStr;
    let clockTimeDiv = document.getElementById("clockTime");
    if (clockTimeDiv !== null) clockTimeDiv.innerHTML=clockTime;
    window.setInterval(function () {
      this.convertTimelineTimeToClockTime();
    }.bind(this), 1000);
  }
  
  isTimelineActive(bool) {
    this.setState({timelineActive:bool})
  }
  recordTimelineTime(timelinePercentage) {
    date = new Date();
    let timeHours = date.getUTCHours()-4;
    if (timeHours < 0) timeHours = 24+timeHours;
    timeMins= timeHours*60+date.getMinutes();
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
      } else if (this.state.timelineActive !==1 ) {
        date = new Date()
        let clockTimeHours = date.getUTCHours()-4;
        if (clockTimeHours < 0) clockTimeHours = 24+clockTimeHours;
    
        let clockTimeMins = date.getMinutes();
        let clockTimeMinsStr = clockTimeMins.toString();
        if (clockTimeMinsStr.length ===1) { // otherwise,round hours get displayed as "7:0", not "7:00"
        clockTimeMinsStr = "0"+clockTimeMinsStr;
        }
        let clockTime = clockTimeHours.toString() + ":"+clockTimeMinsStr;
        let clockTimeDiv = document.getElementById("clockTime");
        if (clockTimeDiv !== null) clockTimeDiv.innerHTML=clockTime;
      }
  };
  render() {
    return (
      <div style = {style} id = "container">
        <div id = "appContainer">
        <div id = "clockTime">{this.convertTimelineTimeToClockTime()}</div>
        <App timelineActive ={this.state.timelineActive} timelineTime = {this.state.time}/>
        </div>
        <Timeline timelineActive={this.isTimelineActive}  timelineTime = {this.recordTimelineTime}/>
        
       <Login/>
       <Onboard/>
         <div id = "loadingScreen">
          <img src={DLLogo} alt="" id = "loadingLogo"/>
        </div>

      </div>
    );
  }
}



export default Container;