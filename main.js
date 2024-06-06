import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class PlayerGrid extends THREE.Object3D
{
    constructor(x, y, z)
    {
        super();
        this.cells = [];
        this.ships = [];

        this.position.set(-3,0,-3);

        this.default_material = new THREE.MeshPhongMaterial(
            { color: 0x606060 * 1, side: THREE.DoubleSide });
        this.default_material.opacity = 0.1;
        this.default_material.transparent = true;

        this.hover_material = new THREE.MeshPhongMaterial(
            { color: 0xffffff * 0.5, side: THREE.DoubleSide });
        this.hover_material.opacity = 0.3;
        this.hover_material.transparent = true;
        
        this.line_material = new THREE.LineBasicMaterial({color: 0x606060});

        this.ship_loader = new GLTFLoader();

        var player_grid = this;

        this.ship_loader.load(
            'ship2.glb',
            function ( gltf ) {
                gltf.scene.rotation.set(0, -Math.PI / 2, 0);
                gltf.scene.position.set(1,0,0);
                gltf.scene.traverse((o) => {
                    if (o.isMesh){
                        o.default_material = o.material;
                        o.hover_material = player_grid.hover_material;
                        o.position.set(2, 0.6, 0.5);
                    }
                });
                player_grid.ships.push(gltf.scene);
                player_grid.ship2 = gltf.scene;
                player_grid.add(gltf.scene);
            }
        );

        this.ship_loader.load(
            'ship3.glb',
            function ( gltf ) {
                gltf.scene.rotation.set(0, -Math.PI / 2, 0);
                gltf.scene.position.set(3,0,3);
                gltf.scene.traverse((o) => {
                    if (o.isMesh){
                        o.default_material = o.material;
                        o.hover_material = player_grid.hover_material;
                        o.position.set(1.5, 1, 0.5);
                    }
                });
                player_grid.ships.push(gltf.scene);
                player_grid.ship3 = gltf.scene;
                player_grid.add(gltf.scene);
            }
        );

        this.ship_loader.load(
            'ship4.glb',
            function ( gltf ) {
                gltf.scene.rotation.set(0, 0, 0);
                gltf.scene.position.set(2,0,1);
                gltf.scene.traverse((o) => {
                    if (o.isMesh){
                        o.default_material = o.material;
                        o.hover_material = player_grid.hover_material;
                        o.rotation.set(0.04, 0, 0);
                        o.position.set(2, 1, 0.5);
                    }
                });
                player_grid.ships.push(gltf.scene);
                player_grid.ship4 = gltf.scene;
                player_grid.add(gltf.scene);
            }
        );

        const shape = new THREE.Shape()
            .moveTo( 0, 0 )
            .lineTo( 0, sqLength )
            .lineTo( sqLength, sqLength )
            .lineTo( sqLength, 0 )
            .lineTo( 0, 0 );
        shape.autoClose = true;

        const points = shape.getPoints();
            
        let geometry = new THREE.ShapeGeometry( shape );

        const geometryPoints =
            new THREE.BufferGeometry().setFromPoints( points );
        for (let x_ = 0; x_ < 6; x_++)
        {
            for (let z_ = 0; z_ < 6; z_++)
            {
            
                let mesh = new THREE.Mesh(geometry, this.default_material);
                mesh.default_material = this.default_material;
                mesh.hover_material = this.hover_material;
                mesh.position.set(x_ * sqLength, 0, z_ * sqLength );
                mesh.rotation.set(Math.PI / 2, 0, 0 );
                this.add(mesh);
                this.cells.push(mesh);
            
                let line = new THREE.Line( geometryPoints, this.line_material);
                line.position.set(x_ * sqLength, 0, z_ * sqLength );
                line.rotation.set(Math.PI / 2, 0, 0 );
                this.add( line );
            }
        }
    }
}

let camera, scene, renderer;

let isUserInteracting = false,
    onPointerDownMouseX = 0, onPointerDownMouseY = 0,
    lon = 0, onPointerDownLon = 0,
    lat = 0, onPointerDownLat = 0,
    phi = 0, theta = 0;

const sqLength = 1;

const squareShape = new THREE.Shape()
    .moveTo( 0, 0 )
    .lineTo( 0, sqLength )
    .lineTo( sqLength, sqLength )
    .lineTo( sqLength, 0 )
    .lineTo( 0, 0 );

const container = document.getElementById( 'container' );
const container_rect = container.getBoundingClientRect();

init();

function init() {


    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );

    const listener = new THREE.AudioListener();
    camera.add( listener );

    // create a global audio source
    const sound = new THREE.Audio( listener );

    // load a sound and set it as the Audio object's buffer
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load( 'pirates_revenge.mp3', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( true );
        sound.setVolume( 0.5 );
        sound.play();
    });

    scene = new THREE.Scene();

    const ambient_light = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient_light);

    const directional_light = new THREE.DirectionalLight(0xffffff, 5);
    directional_light.position.set(100, 100, 0);
    scene.add(directional_light);

    const geometry = new THREE.SphereGeometry( 500, 60, 40 );
    // invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale( - 1, 1, 1 );

    const texture = new THREE.TextureLoader().load( 'space.jpg' );
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial( { map: texture } );

    const mesh = new THREE.Mesh( geometry, material );

    scene.add( mesh );

    var grid1 = new PlayerGrid(0, 0, 0);
    grid1.position.set(-8,  0, -3);
    var grid2 = new PlayerGrid(0, 0, 0);
    grid2.rotation.set(0, Math.PI, 0);
    grid2.position.set(8,  0, 3);
    scene.add(grid1, grid2);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    container.appendChild( renderer.domElement );

    container.style.touchAction = 'none';
    container.addEventListener( 'pointerdown', onPointerDown );

    document.addEventListener( 'wheel', onDocumentMouseWheel );

    //

    document.addEventListener( 'dragover', function ( event ) {

        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';

    } );

    document.addEventListener( 'dragenter', function () {

        document.body.style.opacity = 0.5;

    } );

    document.addEventListener( 'dragleave', function () {

        document.body.style.opacity = 1;

    } );

    document.addEventListener( 'drop', function ( event ) {

        event.preventDefault();

        const reader = new FileReader();
        reader.addEventListener( 'load', function ( event ) {

            material.map.image.src = event.target.result;
            material.map.needsUpdate = true;

        } );
        reader.readAsDataURL( event.dataTransfer.files[ 0 ] );

        document.body.style.opacity = 1;

    } );


    window.addEventListener( 'resize', onWindowResize );
    document.addEventListener('mousemove', onHover(grid1.cells));

}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onPointerDown( event ) {

    if ( event.isPrimary === false ) return;

    isUserInteracting = true;

    onPointerDownMouseX = event.clientX;
    onPointerDownMouseY = event.clientY;

    onPointerDownLon = lon;
    onPointerDownLat = lat;

    document.addEventListener( 'pointermove', onPointerMove );
    document.addEventListener( 'pointerup', onPointerUp );

}

function onPointerMove( event ) {

    if ( event.isPrimary === false ) return;

    lon = ( onPointerDownMouseX - event.clientX ) * 0.1 + onPointerDownLon;
    lat = ( event.clientY - onPointerDownMouseY ) * 0.1 + onPointerDownLat;

}

var lastSelected = null;

function onHover(objects)
{
    function onMouseMove( event )
    {
        event.preventDefault();
        var mouse3D = new THREE.Vector3(
            ( event.clientX / window.innerWidth ) * 2 - 1,   
            -( event.clientY / window.innerHeight ) * 2 + 1,  
            0.5 );
        var raycaster = new THREE.Raycaster();                                        
        raycaster.setFromCamera(mouse3D, camera);
        var intersects = raycaster.intersectObjects(objects, true);
        if ( intersects.length > 0 )
        {
            var selected = intersects[0];
            if (selected != lastSelected)
            {
                if (lastSelected != null)
                {
                    lastSelected.object.material =
                        lastSelected.object.default_material;
                }
                lastSelected = selected;
                selected.object.material = selected.object.hover_material;
            }
            console.log("Hover");
        }
        else
        {
            if (lastSelected != null)
            {
                lastSelected.object.material =
                    lastSelected.object.default_material;
            }
            lastSelected = null;
        }
    }
    return onMouseMove
}


function onPointerUp() {

    if ( event.isPrimary === false ) return;

    isUserInteracting = false;

    document.removeEventListener( 'pointermove', onPointerMove );
    document.removeEventListener( 'pointerup', onPointerUp );

}

function onDocumentMouseWheel( event ) {

    lon = lon + event.deltaY * 0.05;

    camera.updateProjectionMatrix();

}

function animate() {

    lat = 35;
    phi = THREE.MathUtils.degToRad( 90 - lat );
    theta = THREE.MathUtils.degToRad( lon );

    const x = 6 * Math.sin( phi ) * Math.cos( theta );
    const y = 6 * Math.cos( phi );
    const z = 6 * Math.sin( phi ) * Math.sin( theta );

    camera.position.set(-5 * sqLength + x, y, z);
    camera.lookAt( -5 * sqLength, - sqLength, 0 );
    camera.updateProjectionMatrix();
    renderer.render( scene, camera );

}