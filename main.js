import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


class PiratesRevengeGame
{
    constructor()
    {
        this.container = document.getElementById('container');
        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 1, 1100);
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();

        this.mouse_cell = null;
        this.pointer_down_x = 0;
        this.theta = 0;
        this.interacting = false;
        this.lon = 0;
        this.pointer_down_lon = 0;

        this.state = "ship_0";
        this.player = 1;
        this.ship = 0;
        this.ship_dir = 1;
        this.locked = [];

        this._lights();
        this._objects();
        this._renderer();
        this._listeners();
    }

    _lights()
    {
        this.ambient_light = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(this.ambient_light);

        this.directional_light = new THREE.DirectionalLight(0xffffaa, 5);
        this.directional_light.position.set(100, 100, 0);
        this.scene.add(this.directional_light);
    }

    _sound()
    {
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        this.sound = new THREE.Audio(this.listener);
        var sound_ = this.sound;

        this.audioLoader = new THREE.AudioLoader();
        this.audioLoader.load(
            'pirates_revenge.mp3',
            function(buffer) {
                sound_.setBuffer(buffer);
                sound_.setLoop(true);
                sound_.setVolume(0.5);
                sound_.play();
            });
    }

    _objects()
    {
        this.home_grid = new PlayerGrid(0, 0, 0);
        this.home_grid.position.set(0,  0, 0);
        this.scene.add(this.home_grid);

        this.visitor_grid = new PlayerGrid(0, 0, 0);
        this.visitor_grid.rotation.set(0, Math.PI, 0);
        this.visitor_grid.position.set(8,  0, 3);
        // this.scene.add(this.visitor_grid);

        this.skybox = new SkyBox();
        this.scene.add(this.skybox);

        this.hit = new Hit(0, 0, 0);
        this.scene.add(this.hit);
    }

    _renderer()
    {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setAnimationLoop(animate);
        this.container.appendChild(this.renderer.domElement);
        this.container.style.touchAction = 'none';
    }

    _listeners()
    {
        window.addEventListener('resize', onWindowResize);
    }

    start()
    {
        document.getElementById("info2").style.visibility = "hidden";
        document.addEventListener( 'wheel', onDocumentMouseWheel );
        this._sound();
        this.placement_init();
    }

    placement_init()
    {
        this.placement_timer(7);
        this.locked = [];
        document.addEventListener('click', placement_click);
        document.addEventListener('contextmenu', placement_contextmenu);
        document.addEventListener('mousemove', placement_mousemove);
    }

    shoot_init()
    {
        clearInterval(this.interval);
        this.progress_element.style.visibility = "hidden";
        document.removeEventListener('click', placement_click);
        document.removeEventListener('contextmenu', placement_contextmenu);
        document.removeEventListener('mousemove', placement_mousemove);
        document.addEventListener('mousemove', shoot_mousemove);
        document.addEventListener('click', shoot_click);
    }

    placement_timer(duration)
    {
        let timer = duration * 5;
        let max_time = timer;
        let timer_element = document.getElementById('timer');
        this.progress_element = document.getElementById('progress');
        
        this.progress_element.style.visibility = "unset";

        let _this = this;

        this.interval = setInterval(
            function () {
                timer_element.style.width = `${(100*timer/max_time)}%`;
                if (timer > -1) {
                    timer --;
                } else {
                    _this.placement_place_random();
                    _this.shoot_init();
                }
            },
            200);
    }

    _is_valid_placement(pos, dir)
    {
        var ship = this._get_current_ship();
        var hover_pos = pos;
        var cells = [];

        if (ship != null && hover_pos != null)
        {
            for (let x = 0; x < this.ship + 2; x++)
            {
                var x_ = hover_pos[0] + dir * x;
                var z_ = hover_pos[1] + (1 - dir) * x;

                if (x_ < 0 || x_ > 5)
                {
                    return false;
                }

                if (z_ < 0 || z_ > 5)
                {
                    return false;
                }

                for (let i = 0; i < this.locked.length; i++)
                {
                    if (this.locked[i][0] == x_ && this.locked[i][1] == z_)
                    {
                        return false;
                    }
                }

                cells.push([x_, z_]);
            }
        }

        else
        {
            return false;
        }

        return cells;
    }

    _get_current_grid()
    {
        if (this.player == 1)
        {
            return this.home_grid;
        }

        if (this.player == -1)
        {
            return this.visitor_grid;
        }
    }

    _get_current_ship()
    {
        var grid = this._get_current_grid();

        if (grid != null && this.ship >= 0 && this.ship <= 2)
        {
            return grid.ships[this.ship];
        }
    }

    shoot_hover(event)
    {
        var mouse3D = new THREE.Vector3(
            (event.clientX / window.innerWidth) * 2 - 1,   
            -(event.clientY / window.innerHeight) * 2 + 1,  
            0.5 );
        var raycaster = new THREE.Raycaster();                                        
        raycaster.setFromCamera(mouse3D, this.camera);
        var intersects = raycaster.intersectObjects(
            this._get_current_grid().cells, true);

        if (intersects.length > 0)
        {
            var selected = intersects[0];
            if (selected != this.mouse_cell)
            {
                if (this.mouse_cell != null)
                {
                    this.mouse_cell.object.material =
                        this.mouse_cell.object.default_material;
                }
                this.mouse_cell = selected;
                selected.object.material = selected.object.hover_material;
            }
        }
        else
        {
            if (this.mouse_cell != null)
            {
                this.mouse_cell.object.material =
                    this.mouse_cell.object.default_material;
            }
            this.mouse_cell = null;
        }
    }

    shoot_shoot()
    {
        document.removeEventListener('click', shoot_click);
        document.removeEventListener('mousemove', shoot_mousemove);

        let cell = this.mouse_cell;
        this.deselect_cell();

        if (cell == null)
        {
            document.addEventListener('click', shoot_click);
            document.addEventListener('mousemove', shoot_mousemove);
            return;
        }

        let pos = cell.object.value;
        let target = new THREE.Vector3();
        let hit = false;

        for (let i = 0; i < game.locked.length; i++)
        {
            if (game.locked[i][0] == pos[0] && game.locked[i][1] == pos[1])
            {
                hit = true;
            }
        }

        cell.object.getWorldPosition(target);
        this.hit.position.set(target.x, target.y, target.z);

        if (hit)
        {
            this.hit.hit();
        }
        else
        {
            this.hit.miss();
        }

        setTimeout(
            () => {
                document.addEventListener('click', shoot_click);
                document.addEventListener('mousemove', shoot_mousemove);
            },
            2800
        )
    }

    placement_hover(event)
    {
        var mouse3D = new THREE.Vector3(
            (event.clientX / window.innerWidth) * 2 - 1,   
            -(event.clientY / window.innerHeight) * 2 + 1,  
            0.5 );
        var raycaster = new THREE.Raycaster();                                        
        raycaster.setFromCamera(mouse3D, this.camera);
        var intersects = raycaster.intersectObjects(
            this._get_current_grid().cells, true);

        if (intersects.length > 0)
        {
            var selected = intersects[0];

            if (selected != this.mouse_cell)
            {
                this.mouse_cell = selected;
            }
        }

        else
        {
            this.mouse_cell = null;
        }

        this.placement_preview();
    }

    deselect_cell()
    {
        if (this.mouse_cell != null)
        {
            this.mouse_cell.object.material = this.mouse_cell.object.default_material;
            this.mouse_cell = null;
        }
    }

    placement_preview()
    {
        var ship = this._get_current_ship();
        var cell = this.mouse_cell;

        if (ship == null)
        {
            return;
        }

        if (cell == null
            || this._is_valid_placement(
                cell.object.value, this.ship_dir) === false)
        {
            ship.visible = false;
            return;
        }

        ship.position.set(
            cell.object.value[0], 0, cell.object.value[1]);
        ship.rotate(this.ship_dir);
        ship.set_hover_material();
        ship.visible = true;
    }

    placement_place()
    {
        if (game.mouse_cell != null)
        {
            let ship_ = this._get_current_ship();
            let placement = this._is_valid_placement(
                game.mouse_cell.object.value, game.ship_dir);

            if (placement == false)
            {
                return;
            }

            this.ship = this.ship + 1;
            Array.prototype.push.apply(this.locked, placement);
            ship_.set_default_material();
            ship_.visible = true;
        }

        if (this.ship >= 3)
        {
            this.shoot_init();
        }
    }

    placement_place_random()
    {
        while (this.ship < 3)
        {
            let x, y, z, placement;

            do
            {
                x = Math.floor(Math.random() * 5);
                z = Math.floor(Math.random() * 5);
                y = Math.floor(Math.random() * 2);
                placement = this._is_valid_placement([x, z], y);
            } 
            while (placement == false);

            Array.prototype.push.apply(this.locked, placement);
            let ship = this._get_current_ship();
            ship.position.set(x, 0, z);
            ship.rotate(y);
            ship.set_default_material();

            this.ship = this.ship + 1;
        }
    }

    placement_rotate()
    {
        this.ship_dir = 1 - this.ship_dir;
        this.placement_preview();
    }

}

class GridCell extends THREE.Object3D
{
    constructor(x, z)
    {
        super();

        this.line_material = new THREE.LineBasicMaterial({color: 0x505050});

        this.default_material = new THREE.MeshPhongMaterial(
            { color: 0x606060 * 1, side: THREE.DoubleSide });
        this.default_material.opacity = 0.1;
        this.default_material.transparent = true;

        this.hover_material = new THREE.MeshPhongMaterial(
            { color: 0x7fffff, side: THREE.DoubleSide });
        this.hover_material.opacity = 0.3;
        this.hover_material.transparent = true;

        let shape = new THREE.Shape()
            .moveTo( -0.5, -0.5 )
            .lineTo( -0.5, 0.5 )
            .lineTo( 0.5, 0.5 )
            .lineTo( 0.5, -0.5 )
            .lineTo( -0.5, -0.5 );
        shape.autoClose = true;
        
        const points = shape.getPoints();
            
        let geometry = new THREE.ShapeGeometry( shape );

        const geometryPoints =
            new THREE.BufferGeometry().setFromPoints( points );

        this.mesh = new THREE.Mesh(geometry, this.default_material);
        this.value = [x, z];
        this.mesh.value = [x, z];
        this.mesh.default_material = this.default_material;
        this.mesh.hover_material = this.hover_material;
        this.mesh.position.set(0, 0, 0);
        this.mesh.rotation.set(Math.PI / 2, 0, 0);
        this.add(this.mesh);
    
        let line = new THREE.Line( geometryPoints, this.line_material);
        line.position.set(0, 0, 0);
        line.rotation.set(Math.PI / 2, 0, 0);
        this.add(line);
    }
}

class PlayerGrid extends THREE.Object3D
{
    constructor()
    {
        super();
        this.cells = [];
        this.ships = [];

        this.group = new THREE.Group();
        this.group.position.set(-2.5, 0, -2.5);
        super.add(this.group);

        this.ship2 = new Ship('ship2.glb', 2, 0, 0.6, 0.5);
        this.ships.push(this.ship2);
        this.add(this.ship2);

        this.ship3 = new Ship('ship3.glb', 3, 0, 0.8, 0.9);
        this.ships.push(this.ship3);
        this.add(this.ship3);

        this.ship4 = new Ship('ship4.glb', 4, 0, 1, 1.6);
        this.ships.push(this.ship4);
        this.add(this.ship4);
            
        for (let x_ = 0; x_ < 6; x_++)
        {
            for (let z_ = 0; z_ < 6; z_++)
            {
                let cell = new GridCell(x_, z_);
                cell.position.set(x_, 0, z_);
                this.cells.push(cell.mesh);
                this.add(cell);
            }
        }
    }

    add(object)
    {
        this.group.add(object);
    }
}

class Ship extends THREE.Object3D
{
    constructor(file, length, x, y, z)
    {
        super();
        this.length = length;

        this.group = new THREE.Group();
        this.add(this.group);
        this.group.position.set(0, 0, 0);

        this.hover_material = new THREE.MeshPhongMaterial(
            { color: 0x7fffff, side: THREE.DoubleSide });
        this.hover_material.opacity = 0.3;
        this.hover_material.transparent = true;

        this.death_material = new THREE.MeshPhongMaterial(
            { color: 0x000000, side: THREE.DoubleSide });

        this.ship_loader = new GLTFLoader();
        var _this = this;
        this.ship_loader.load(
            file,
            function ( gltf ) {
                gltf.scene.traverse((o) => {
                    if (o.isMesh){
                        _this.group.add(o);
                        o.default_material = o.material;
                        o.rotation.set(0, -Math.PI / 2, 0);
                        o.position.set(x, y, z);
                    }
                });
            }
        );

        this.visible = false;
    }

    set_hover_material()
    {
        this.visible = true;
        this.traverse((o) => {
            if (o.isMesh)
            {
                o.material = this.hover_material;
            }
        });
    }

    set_death_material()
    {
        this.visible = true;
        this.traverse((o) => {
            if (o.isMesh)
            {
                o.material = this.death_material;
            }
        });
    }

    set_default_material()
    {
        this.visible = true;
        this.traverse((o) => {
            if (o.isMesh)
            {
                o.material = o.default_material;
            }
        })
    }

    rotate(direction)
    {
        this.rotation.set(0, direction * Math.PI / 2, 0);
    }
}

class SkyBox extends THREE.Object3D
{
    constructor()
    {
        super();
        this.geometry = new THREE.SphereGeometry(500, 60, 40);
        this.geometry.scale(-1, 1, 1);

        this.texture = new THREE.TextureLoader().load( 'space.jpg' );
        this.texture.colorSpace = THREE.SRGBColorSpace;
        this.material = new THREE.MeshBasicMaterial({map: this.texture});

        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.add(this.mesh);
    }
}

class Hit extends THREE.Object3D
{
    constructor(x, y, z)
    {
        super();

        this.animating = false;
        this.loader = new GLTFLoader();
        this.scale.set(0.3, 0.3, 0.3);
        var _this = this;
        this.loader.load(
            "hit.glb",
            function ( gltf ) {
                gltf.scene.traverse((o) => {
                    if (o.isMesh){
                        _this.add(gltf.scene);
                        _this.animations = gltf.animations;
                        _this.scene = gltf.scene;
                        console.log(_this.animations);
                        o.position.set(x, y, z);
                    }
                });
            }
        );
        this.visible = false;
    }

    hit()
    {
        this.visible = true;
        this.animating = true;
        this.mixer = new THREE.AnimationMixer(this.scene);
        const firstAction = this.mixer.clipAction(this.animations[0]);
        const secondAction = this.mixer.clipAction(this.animations[1]);
        firstAction.setLoop(THREE.LoopOnce);
        secondAction.setLoop(THREE.LoopOnce);
        firstAction.clampWhenFinished = true;
        secondAction.clampWhenFinished = true;
        firstAction.play();
        secondAction.play();
    }

    miss()
    {
        this.visible = true;
        this.animating = true;
        this.mixer = new THREE.AnimationMixer(this.scene);
        const firstAction = this.mixer.clipAction(this.animations[0]);
        firstAction.setLoop(THREE.LoopOnce);
        firstAction.clampWhenFinished = true;
        firstAction.play();
    }
}

var game = new PiratesRevengeGame();
const clock = new THREE.Clock();

document.getElementById("play").addEventListener("click", function(){
    game.start();
})

function onWindowResize()
{
    game.camera.aspect = window.innerWidth / window.innerHeight;
    game.camera.updateProjectionMatrix();
    game.renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseWheel( event )
{
    game.lon = game.lon + event.deltaY * 0.05;
    game.camera.updateProjectionMatrix();
}

function shoot_mousemove(event)
{
    event.preventDefault();
    game.shoot_hover(event);
}

function shoot_click(event)
{
    event.preventDefault();
    game.shoot_shoot();
}

function placement_mousemove(event)
{
    event.preventDefault();
    game.placement_hover(event);
}

function placement_click(event)
{
    event.preventDefault();
    game.placement_place();
}

function placement_contextmenu(event)
{
    event.preventDefault();
    game.placement_rotate();
}

function animate()
{
    const delta = clock.getDelta();

    if (game.hit.animating == true)
    {
        game.hit.mixer.update(delta);
    }

    var phi = THREE.MathUtils.degToRad(55);
    game.theta = THREE.MathUtils.degToRad(game.lon);

    const x = 6 * Math.sin(phi) * Math.cos(game.theta);
    const y = 6 * Math.cos(phi);
    const z = 6 * Math.sin(phi) * Math.sin(game.theta);

    game.camera.position.set(0 + x, y, z);
    game.camera.lookAt(0, - 1, 0);
    game.camera.updateProjectionMatrix();
    game.renderer.render(game.scene, game.camera);
}
