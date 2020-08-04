import React, { Component } from "react";
// import ReactDOM from "react-dom";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import BuildingGLB from './assets/glb/dlo3.glb';
import PlaneGLB from './assets/glb/airplane2.glb';
import DLBuildingGLB from './assets/glb/dlbuildingv3.glb';
import Flag from './assets/glb/flagv3.glb';

import axios from "axios";
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

import About from './components/About';
import Timeline from './components/Timeline'

// import THREEx from './threex.daynight'
import './App.css';

var stats = new Stats();
var clock = new THREE.Clock();
var timeCounter = 0;
var mixers = [];
var sunTheta;
var THREEx = {};
var t = 0;

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
		light.position.y = Math.sin(sunAngle) * 10;
		light.position.z = Math.cos(sunAngle) * 10;
// console.log('Phase ', THREEx.DayNight.currentPhase(sunAngle))

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



var MODELS = [BuildingGLB, PlaneGLB, DLBuildingGLB, Flag];
  

const style = {
  height: window.innerHeight, // we can control scene size by setting container dimensions
};

/// main component/// 
class App extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.state = {
      model:"",
      time:"",
      timelineActive:0,
    };
    this.load = this.load.bind(this);
    this.startAnimationLoop = this.startAnimationLoop.bind(this);
    this.updateModel = this.updateModel.bind(this);

  };
  componentDidMount() {
    this.sceneSetup();
    this.load();
    // this.startAnimationLoop();
    window.addEventListener("resize", this.handleWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleWindowResize);
    window.cancelAnimationFrame(this.requestID);
    this.controls.dispose();
  }

  sceneSetup = () => {
    const appContainer = document.getElementById("appContainer");
    appContainer.appendChild( stats.dom );

    // get container dimensions and use them for scene sizing
    const width = appContainer.clientWidth;
    const height = appContainer.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width/height, 1, 10000);
    this.camera.position.set(-10, 10, 10);
    this.camera.lookAt(0, 5, 0);
    
    /// camera control ///
    this.controls = new OrbitControls(this.camera, this.el);
    // this.controls.enableDamping = true;
    this.controls.domElement= appContainer; /// prevents adjusting of timeline from triggering pan and zoom on rendering screen
    // this.controls.maxDistance = 20;
    // this.controls.minDistance = 2;
    // this.controls.minPolarAngle = Math.PI/10;
    // this.controls.maxPolarAngle = Math.PI/4;

    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha:false}); // init renderer
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    
    
    // renderer.autoClear = false;
    this.renderer.setSize(width, height);
    // this.renderer.toneMapping = THREE.ReinhardToneMapping;
    // this.renderer.toneMappingExposure = Math.pow(1, 4.0);
    this.renderer.setClearColor("#ffe4c4");

    this.el.appendChild(this.renderer.domElement); // mount using React ref

    var geoFloor = new THREE.BoxBufferGeometry( 400, 0.1, 400 ); /// ground
    var matStdFloor = new THREE.MeshStandardMaterial( { color:"#ffe9cf", roughness: 2, metalness: 0 } );
    // var matStdFloor = new THREE.MeshPhongMaterial( { color:"#ffe19c" } );
    // node.material = new THREE.MeshPhongMaterial({
    //   color:"#060f2b",
    //  });

    var floor = new THREE.Mesh( geoFloor, matStdFloor );
    floor.receiveShadow = true;
    this.scene.add( floor );

    this.renderScene = new RenderPass( this.scene, this.camera )    
    this.composer = new EffectComposer( this.renderer );

    this.par = new THREE.Group(); // init parent group for all objects in scene

    /// insert lights
    this.sunLight	= new THREEx.DayNight.SunLight()
    this.scene.add( this.sunLight.object3d )    
    
    var hemiLight = new THREE.HemisphereLight( "#ffffff", "#ffffff", 0.1 );
    hemiLight.position.set( 0, 20, 0 );
    this.scene.add( hemiLight );


  };

  load = () => {
    var self = this;
    const appContainer = document.getElementById("appContainer");
    // get container dimensions and use them for scene sizing
    const width = appContainer.clientWidth;
    const height = appContainer.clientHeight;
    var numLoadedModels = 0;
    var dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( 'three/examples/js/libs/draco/gltf/' );
    loadModels();
    
    let setModelsInWorld = ()=> {
        ///add building///
        let buildingGroup = this.par.getObjectByName("/static/media/dlo3.5cb8f2a3.glb");
        var building = buildingGroup.children[3];
        var mainBox0 = building.children[0];
        var mainBox1 = building.children[1];
        this.circleWindow = building.children[2];
    
        var windowMesh = building.children[3];
        windowMesh.material = new THREE.MeshBasicMaterial({
            color:"#e0cc48",
        });
        this.scene.add(windowMesh)
    
        RectAreaLightUniformsLib.init();
        const world = new THREE.Vector3();
        var rectLight = new THREE.RectAreaLight( "#e0cc48", 3,  0.7, 4.3 );
        var windowMeshPose = windowMesh.getWorldPosition(world).toArray();
        rectLight.position.set(windowMeshPose[0], windowMeshPose[1], windowMeshPose[2]);
        rectLight.rotateY(Math.PI/2)
        this.scene.add( rectLight )
        var rectLightMesh = new THREE.Mesh( new THREE.PlaneBufferGeometry(), new THREE.MeshBasicMaterial( { color:"#e0cc48", side: THREE.BackSide } ) );
        rectLightMesh.scale.x = rectLight.width;
        rectLightMesh.scale.y = rectLight.height;
        rectLight.add( rectLightMesh );

        mainBox0.castShadow=true;
        mainBox0.receiveShadow = true;
        mainBox1.castShadow=true;
        mainBox1.receiveShadow = true;
        this.circleWindow.castShadow=true;
        this.circleWindow.receiveShadow = true;
        this.circleWindow.material = new THREE.MeshBasicMaterial({
            color:"#e0cc48",
        });
    
        mainBox0.material = new THREE.MeshPhongMaterial({
            color:"#80252e",
        });
    
    
        this.scene.add(mainBox0)
        this.scene.add(mainBox1)
        this.scene.add(this.circleWindow)

        ///add plane///
        this.planeGroup = this.par.getObjectByName("/static/media/airplane2.69ef2ffd.glb");
        this.plane = this.planeGroup.children[2];

        this.propellor = this.planeGroup.children[3];
        this.mixer = new THREE.AnimationMixer( this.planeGroup );
        this.mixer.clipAction(this.planeGroup.animations[1]).play();
        this.mixer2 = new THREE.AnimationMixer( this.planeGroup );
			  this.mixer2.clipAction(this.planeGroup.animations[0]).play();

        // this.planeGroup.remove(this.planeGroup.children[0]);
        // this.planeGroup.remove(this.planeGroup.children[0]);
        var box = new THREE.Box3().setFromObject(this.planeGroup );
        // Reset mesh position:
        box.getCenter(this.planeGroup.position);
        this.planeGroup.position.multiplyScalar(-1);
        this.planeRotateGroup = new THREE.Group();

        this.scene.add(this.planeRotateGroup);
        this.planeRotateGroup.add(this.planeGroup);
        // this.planeRotateGroup.add(this.propellor);

        this.planeRotateGroup.rotation.z=Math.PI/6;
        this.planeRotateGroup.castShadow=true;

        this.dlBuilding = this.par.getObjectByName("/static/media/dlbuildingv3.fb0f3294.glb");
        var windows = this.dlBuilding.getObjectByName("Windows");
        console.log("dlbuildinghcildren")
        console.log(windows)
        var frontWindows = windows.getObjectByName("FrontWindows");
        var circleWindows = windows.getObjectByName("CircularWindows");
        var backWindows = windows.getObjectByName("BackWindows");
        var octagonWindows = windows.getObjectByName("OctagonalWindows");
        var rightWindows = windows.getObjectByName("RightWindows");
        var leftWindows = windows.getObjectByName("LeftWindows");
            
      
        console.log(this.dlBuilding.children)

        this.scene.add(this.dlBuilding)



        console.log( 'Loading Complete!');
        // var bloomPass = new UnrealBloomPass( new THREE.Vector2( width, height ), 1.5, 0.4, 0.85, [windowMesh], self.scene, self.camera )
        // bloomPass.threshold = 0.21;
        // bloomPass.strength = 1.2;
        // bloomPass.radius = 0.55;
        // this.bloomPass2 = new UnrealBloomPass( new THREE.Vector2( width, height ), 1.5, 0.4, 0.85, [this.circleWindow], self.scene, self.camera )
        // this.bloomPass2.threshold = 0.21;
        // this.bloomPass2.strength = 1.2;
        // this.bloomPass2.radius = 0.55;
        this.composer.setSize( width, height )
        this.composer.addPass( this.renderScene )
        // this.composer.addPass( bloomPass )
        self = this;
        frontWindows.traverse( function( node ) {
          if ( node instanceof THREE.Mesh ) {

            // var rectLight = new THREE.RectAreaLight( "#e0cc48", 3,  0.7, 4.3 );
            // var windowMeshPose = node.getWorldPosition(world).toArray();
            // rectLight.position.set(windowMeshPose[0], windowMeshPose[1], windowMeshPose[2]);
            // rectLight.rotateY(Math.PI/2)
            // self.scene.add( rectLight )
            // var rectLightMesh = new THREE.Mesh( new THREE.PlaneBufferGeometry(), new THREE.MeshBasicMaterial( { color:"#e0cc48", side: THREE.BackSide } ) );
            // rectLightMesh.scale.x = rectLight.width;
            // rectLightMesh.scale.y = rectLight.height;
            // rectLight.add( rectLightMesh );

              // console.log(node.name)
              node.material = new THREE.MeshBasicMaterial({
                color:"#e0cc48",
                });

              if (node.name == "Window25" || node.name == "Window24" || node.name == "Window23" ) {
                console.log(node)
                node.material = new THREE.MeshPhongMaterial({
                  color:"#060f2b",
                 });
                };
              // var bloomPass85 = new UnrealBloomPass( new THREE.Vector2( width, height ), 1.5, 0.4, 0.85, [node], self.scene, self.camera )
              // bloomPass85.threshold = 0.21;
              // bloomPass85.strength = 1.2;
              // bloomPass85.radius = 0.55;
              // self.composer.addPass( bloomPass85 )

              // }
          }
      } );
      // to make the bloom computationally less expensive, let's apply one bloom step, and exclude the things we DON"T want to bloom!
      var bloomPass85 = new UnrealBloomPass( new THREE.Vector2( width, height ), 1.5, 0.4, 0.85)
      bloomPass85.threshold = 0.7;
      bloomPass85.strength = 1.2;
      bloomPass85.radius = 0.55;
      self.composer.addPass( bloomPass85 )

            /// todo: make into function, fix blurry text, test with animation
      var drawCanvas = document.createElement("CANVAS");
      drawCanvas.width = 1800;
      drawCanvas.height=1200;
      var ctx = drawCanvas.getContext("2d");
      ctx.font = "100px Arial";
      ctx.fillStyle = "white";

      ctx.fillText("Hello World", 100, 100);
      let blackFlag = this.par.getObjectByName("/static/media/flagv3.60c4954c.glb");
      let actualFlag = blackFlag.getObjectByName("Flag(TaylorGittings)-01");
      actualFlag.position.set(10, 10, 10)
      actualFlag.material	= new THREE.MeshStandardMaterial({
        map	: new THREE.CanvasTexture( drawCanvas )

      })

      this.scene.add(actualFlag)
      // var material	= new THREE.MeshBasicMaterial({
      //   map	: dynamicTexture.texture
      // })


        this.startAnimationLoop()
      
    };



    function loadGLBModel( model, onLoaded ) {
      var loader = new GLTFLoader();
      loader.setDRACOLoader( dracoLoader );

      loader.load( model, function ( gltf ) {
        self.model=gltf.scene;
        console.log('model')
        console.log(model)
        console.log('anim')
        console.log(gltf.animations)
        self.model.name = model;
        self.model.animations = gltf.animations;
        self.par.add(self.model)

        // Enable Shadows
        self.model.traverse( function ( object ) {
          if ( object.isMesh ) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        } );
        onLoaded();
      });
    }
    function loadModels() {
      for ( let i = 0; i < MODELS.length; ++ i ) {
        var m = MODELS[ i ];
        loadGLBModel( m, function () {
          numLoadedModels+=1;
          if ( numLoadedModels === MODELS.length ) {
            setTimeout(function() {
              setModelsInWorld();
            },1000);
            
          }
        });
      }
    }

  };

  startAnimationLoop = () => {
    this.controls.update();
    stats.update();
    var delta = clock.getDelta();



    this.mixer.update( delta ); // propellor
    this.mixer2.update( delta ); // plane bob


    var d = new Date();
    var timeMins= d.getHours()*60+d.getMinutes();
    if (this.props.timelineActive === 1) {
      sunTheta = (Math.floor(this.props.timelineTime/4)-120)*Math.PI/180; // start at 8 am
    } else {
      sunTheta = (Math.floor(timeMins/4)-120)*Math.PI/180; // start at 8 am
    }
    t += 0.01;
    if (Math.abs(t-2*Math.PI) < 0.01) {
      t = 0;
    }
    if (this.planeRotateGroup !== undefined) {
      this.planeRotateGroup.position.set(5*Math.cos(t), 9, 5*Math.sin(t));
      this.planeRotateGroup.rotation.y=-t;
    }
    this.sunLight.update(sunTheta);
    this.updateModel(timeMins);
    this.composer.render();  

    this.requestID = window.requestAnimationFrame(this.startAnimationLoop);
  };

  updateModel(timeMins) {
    timeCounter += 1;

    var __this = this;

    if (this.props.timelineActive  !== 1) { 
      // console.log(timeCounter)

      if (timeCounter >= 600) {
        timeCounter =0;
        axios.get('http://localhost:8081/slackRoute/getPresence', {
        }).then(function (res) {
          // console.log(res)
            var test = res.data;
            var rbenefoOnline = test.find(x => x.real_name === 'rbenefo').online;
            if (rbenefoOnline === 1){
              __this.bloomPass2.strength = 1.2;
              __this.circleWindow.material.color.setHex( 0xe0cc48);
            } else {
              __this.bloomPass2.strength = 0.1;
              __this.circleWindow.material.color.setHex( 0x18072e);
            }
        }).catch(function (error) {
          console.log("Axios error:")
          console.log(error)
      });
      }
    } else {      
      axios.get('http://localhost:8081/slackRoute/getBulkData', {
      }).then(function (res) { //todo: have this happen only when DragStart begins, so we're not shuttling large amounts of data so rapidly
      if (res.data.presenceData === undefined || res.data.presenceData.length === 0) {
          // array empty or does not exist
      } else {
      
        let timeArr = (res.data.presenceData.map(function(value,index) { 
                    return value[res.data.presenceData[0].length-1]; 
                  }));
        let goal = __this.props.timelineTime;
        let closest = timeArr.reduce(function(prev, curr) {
          return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
        });        
        let relevantIndex = (timeArr.indexOf(closest));
        let relevantPresence = res.data.presenceData[relevantIndex];
        let relevantActivity = res.data.activityMetricData[relevantIndex];
        if (relevantPresence[2] === 1){
          __this.bloomPass2.strength = 1.2;
          __this.circleWindow.material.color.setHex( 0xe0cc48 );
        } else {

          __this.bloomPass2.strength = 0.1;
          __this.circleWindow.material.color.setHex( 0x18072e );
        }
      };
      });
  

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
    var date = new Date();
    var timeMins= date.getHours()*60+date.getMinutes();
    var timelineTime = timeMins*timelinePercentage;
    this.setState({time: timelineTime})
  }
  render() {
    return (
      <div style = {style} id = "container">
        <div id = "appContainer">
        <App timelineActive ={this.state.timelineActive} timelineTime = {this.state.time}/>
        </div>
        <Timeline timelineActive={this.isTimelineActive} timelineTime = {this.recordTimelineTime}/>
      </div>
    );
  }
}



export default Container;