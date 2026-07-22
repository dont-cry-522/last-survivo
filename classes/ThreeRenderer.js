/**
 * ============================================================
 *  ThreeRenderer.js - Three.js 渲染引擎
 * ============================================================
 *  纯渲染职责：Scene / Camera / Lights / Ground / 后处理
 *  不包含任何游戏逻辑，不依赖游戏类
 * ============================================================
 */
class ThreeRenderer {
    constructor(canvas, width, height) {
        this.width = width;
        this.height = height;

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        this.renderer.setSize(width, height, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#0a0a1a');
        this.scene.fog = new THREE.Fog('#0a0a1a', 300, 1200);

        this._createCamera();
        this._createLights();
        this._createGround();

        this.meshGroups = {};
        this.animationTime = 0;
    }

    _createCamera() {
        const aspect = this.width / this.height;
        const viewHeight = this.height;
        this.camera = new THREE.OrthographicCamera(
            -viewHeight * aspect / 2, viewHeight * aspect / 2,
            viewHeight / 2, -viewHeight / 2,
            1, 5000
        );
        this.camera.position.set(0, 600, 400);
        this.camera.lookAt(0, 0, 0);
    }

    _createLights() {
        this.ambient = new THREE.AmbientLight('#4488cc', 0.5);
        this.scene.add(this.ambient);

        this.hemi = new THREE.HemisphereLight('#88ccff', '#224466', 0.3);
        this.scene.add(this.hemi);

        this.sun = new THREE.DirectionalLight('#ffeedd', 4);
        this.sun.position.set(200, 500, 100);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.set(1024, 1024);
        this.sun.shadow.camera.left = -800;
        this.sun.shadow.camera.right = 800;
        this.sun.shadow.camera.top = 800;
        this.sun.shadow.camera.bottom = -800;
        this.sun.shadow.camera.near = 1;
        this.sun.shadow.camera.far = 2500;
        this.sun.shadow.bias = -0.001;
        this.scene.add(this.sun);

        this.playerLight = new THREE.PointLight('#00d4ff', 3, 250);
        this.playerLight.castShadow = true;
        this.playerLight.shadow.mapSize.set(256, 256);
        this.playerLight.shadow.bias = -0.005;
        this.scene.add(this.playerLight);
    }

    _createGround() {
        const geo = new THREE.PlaneGeometry(8000, 8000);
        const mat = new THREE.MeshStandardMaterial({
            color: '#0a1020',
            roughness: 0.95,
            metalness: 0.1,
        });
        this.ground = new THREE.Mesh(geo, mat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -0.5;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        const gridHelper = new THREE.PolarGridHelper(4000, 80, 40, 64, '#1a3355', '#1a3355');
        gridHelper.position.y = -0.45;
        this.scene.add(gridHelper);
    }

    registerGroup(name, count, factory) {
        const group = new THREE.Group();
        group.userData = { pool: [] };
        for (let i = 0; i < count; i++) {
            const mesh = factory();
            mesh.visible = false;
            group.add(mesh);
            group.userData.pool.push(mesh);
        }
        this.scene.add(group);
        this.meshGroups[name] = group;
        return group;
    }

    setMesh(name, index, positionX, positionZ, rotationZ, scale, visible, extra) {
        const group = this.meshGroups[name];
        if (!group) return;
        const mesh = group.userData.pool[index];
        if (!mesh) return;
        mesh.position.set(positionX, 0, positionZ);
        mesh.rotation.set(0, 0, rotationZ);
        if (scale != null) mesh.scale.setScalar(scale);
        mesh.visible = visible;
        if (extra) Object.assign(mesh, extra);
    }

    updateCamera(centerX, centerZ, shakeX, shakeZ) {
        this.camera.position.x = (centerX || 0) + (shakeX || 0);
        this.camera.position.z = (centerZ || 0) + 400 + (shakeZ || 0);
        this.camera.lookAt((centerX || 0) + (shakeX || 0), 0, (centerZ || 0) + (shakeZ || 0));
        this.playerLight.position.set(centerX || 0, 2, centerZ || 0);
    }

    getAspectViewSize() {
        return 900 * (this.width / this.height);
    }

    render(deltaTime) {
        this.animationTime += deltaTime;
        this.renderer.render(this.scene, this.camera);
    }

    getScene() { return this.scene; }
}

if (typeof window !== 'undefined') { window.ThreeRenderer = ThreeRenderer; }
