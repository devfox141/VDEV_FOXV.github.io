// ตัวแปร Global สำหรับเก็บสถานะการทำงาน
let currentSet = 1;
let cleanupSet1 = null;
let cleanupSet2 = null;
let keyKListener = null;
let isSwitching = false; // Guard สำหรับกันการกดปุ่มสลับฉากซ้ำรัวๆ

// Helper Function สำหรับค้นหา Container เพื่อให้ Element อยู่ในที่เดียวกันเสมอ
function getCanvasContainer() {
    let container = document.getElementById('canvas-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'canvas-container';
        document.body.appendChild(container);
    }
    return container;
}

// ==========================================
// ระบบ SET 1
// ==========================================

function initSet1() {
    const HDR_FOLDER_PATH = 'textures/HDR/';
    const DEFAULT_HDR_FILE = 'Day.exr';
    const MODEL_FOLDER_PATH = 'AllModels/';
    const FILE_LIST = [
        'RealMain.obj', 'RealMain.mtl',
        'RealMain1.obj', 'RealMain1.mtl',
        'leaf.glb'
    ];

    const container = getCanvasContainer();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1.1, 5000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controls.enableRotate = false; // ปิดการลากเมาส์หมุนกล้อง

    const ambientLight = new THREE.AmbientLight(0xffffff, 10.6);
    scene.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 10.8);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    let globalModelSize = 10;

    // [ระบบก้อนเมฆพื้นหลัง]
    const cloudsArray = [];
    const textureLoader = new THREE.TextureLoader();
    const cloudTexture = textureLoader.load('cloud.png');
    cloudTexture.magFilter = THREE.LinearFilter;
    cloudTexture.minFilter = THREE.LinearFilter;

    function createSingleCloudMesh(segments, radius) {
        const group = new THREE.Group();
        const cloudMat = new THREE.MeshBasicMaterial({
            map: cloudTexture, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide
        });
        const geo = new THREE.SphereGeometry(radius, 2, 8);
        for (let i = 0; i < segments; i++) {
            const mesh = new THREE.Mesh(geo, cloudMat);
            mesh.position.set((Math.random() - 0.5) * radius * 20.5, 0, (Math.random() - 0.5) * radius * 20.5);
            const s = 3.5 + Math.random() * 3.5;
            mesh.scale.set(s, s, s);
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            group.add(mesh);
        }
        return group;
    }
    function setCameraView(type){
        switch(type){
            case "wide":
                camera.position.set(822.15, 231.45, 186.47);
                controls.target.set(-0.20, -6.07, 42.83);
                controls.autoRotate = true;
                controls.autoRotateSpeed = 3; 
                break;

            case "medium":
                camera.position.set(-72.74, -23.64, 31.03);
                controls.target.set(-53.87, -23.07, 30.72);
                controls.autoRotate = false;
                camera.fov = 30;
                break;

            case "close":
                camera.position.set(31.89, -21.59, 14.63);
                controls.target.set(4.85, -19.46, 30.71);
                controls.autoRotate = true;
                controls.autoRotateSpeed = 0.2; 
                camera.fov = 20;
                break;
        }
        
        controls.update();
        camera.updateProjectionMatrix();
    }
    function spawnCloud(x, y, z) {
        const cloudGroup = new THREE.Group();
        const layer1 = createSingleCloudMesh(10, 3);
        const layer2 = createSingleCloudMesh(10, 4);
        layer2.position.set(0, 1, 0);
        cloudGroup.add(layer1, layer2);
        cloudGroup.position.set(x, -48, z);
        cloudGroup.userData.speed = 0.05 + Math.random() * 0.08;
        scene.add(cloudGroup);
        cloudsArray.push(cloudGroup);
    }

    for (let i = 0; i < 200; i++) {
        spawnCloud((Math.random() - 0.5) * 1000, 0, (Math.random() - 0.5) * 1000);
    }

    function getDefaultMaterial() {
        return new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.15, metalness: 0.4, side: THREE.DoubleSide });
    }

function finalizeSceneConfiguration() {
    if (modelGroup.children.length === 0) return;
    
    modelGroup.position.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(modelGroup);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    modelGroup.position.sub(center);
    globalModelSize = Math.max(size.x, size.y, size.z);
    
    // ตั้งค่าระยะ Zoom สูงสุดไว้ป้องกันกล้องหลุดโฟกัส
    controls.maxDistance = globalModelSize * 10;

    // --- เพิ่มตำแหน่งกล้องที่คุณต้องการหลังจากโหลดโมเดลเสร็จที่นี่ ---
    camera.position.set(31.89, -21.59, 14.63);
    controls.target.set(4.85, -19.46, 30.71);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2; 
    camera.fov = 20;

    // อัปเดตกล้องและคอนโทรลเลอร์
    camera.updateProjectionMatrix();
    controls.update();
}
    async function loadModelsFromSeverFolder() {
        try {
            const loadingManager = new THREE.LoadingManager();
            loadingManager.setURLModifier((url) => {
                const fileName = url.split('/').pop().split('?')[0];
                const fileNameLower = fileName.toLowerCase();
                const match = FILE_LIST.find(f => f.toLowerCase() === fileNameLower);
                if (match) return MODEL_FOLDER_PATH + match;
                if (fileNameLower.endsWith('.png') || fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg')) return MODEL_FOLDER_PATH + fileName;
                return url;
            });

            const objFiles = FILE_LIST.filter(name => name.toLowerCase().endsWith('.obj'));
            const mtlFiles = FILE_LIST.filter(name => name.toLowerCase().endsWith('.mtl'));
            const glbFiles = FILE_LIST.filter(name => name.toLowerCase().endsWith('.glb') || name.toLowerCase().endsWith('.gltf'));

            const objLoader = new THREE.OBJLoader(loadingManager);
            const mtlLoader = new THREE.MTLLoader(loadingManager);
            const gltfLoader = new THREE.GLTFLoader(loadingManager);
            mtlLoader.setPath(MODEL_FOLDER_PATH);

            for (const objFileName of objFiles) {
                let materialsLoaded = false;
                const expectedMtlName = objFileName.replace(/\.obj$/i, '.mtl').toLowerCase();
                const hasMtl = mtlFiles.some(f => f.toLowerCase() === expectedMtlName);
                if (hasMtl) {
                    try {
                        const materials = await new Promise((resolve, reject) => mtlLoader.load(objFileName.replace(/\.obj$/i, '.mtl'), resolve, null, reject));
                        materials.preload();
                        objLoader.setMaterials(materials);
                        materialsLoaded = true;
                    } catch (e) { console.warn(`MTL Error:`, e); }
                } else { objLoader.setMaterials(null); }

                const obj = await new Promise((resolve, reject) => objLoader.load(MODEL_FOLDER_PATH + objFileName, resolve, null, reject));
                obj.traverse(function(child) {
                    if (child.isMesh) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        let hasValidTexture = false;
                        materials.forEach((mat) => {
                            if (materialsLoaded && mat && (mat.map || mat.name)) { hasValidTexture = true; mat.side = THREE.DoubleSide; }
                        });
                        if (!hasValidTexture) child.material = getDefaultMaterial();
                    }
                });
                modelGroup.add(obj);
            }

            for (const glbFileName of glbFiles) {
                try {
                    const gltf = await new Promise((resolve, reject) => gltfLoader.load(MODEL_FOLDER_PATH + glbFileName, resolve, null, reject));
                    gltf.scene.traverse(function(child) { if (child.isMesh) child.material.side = THREE.DoubleSide; });
                    modelGroup.add(gltf.scene);
                } catch (e) { console.error(`GLB Error:`, e); }
            }
            finalizeSceneConfiguration();
        } catch (err) { console.error(err); }
    }

    function loadEnvironmentFromFolder(fileName) {
        if (!fileName) return;
        const fileUrl = HDR_FOLDER_PATH + fileName;
        const fileExtension = fileName.split('.').pop().toLowerCase();
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        let loader = (fileExtension === 'exr') ? new THREE.EXRLoader() : new THREE.RGBELoader();
        loader.load(fileUrl, function (texture) {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.background = envMap;
            scene.environment = envMap;
            texture.dispose();
            ambientLight.intensity = 0.1;
            dirLight1.intensity = 0.3;
        }, null, function(err){ console.error(err); });
    }

    loadModelsFromSeverFolder();
    loadEnvironmentFromFolder(DEFAULT_HDR_FILE);

    let animationId1;
    function animate() {
        animationId1 = requestAnimationFrame(animate);
        cloudsArray.forEach((cloud => {
            cloud.position.x += cloud.userData.speed;
            if (cloud.position.x > 500) cloud.position.x = -500;
        }));
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Event Listeners
    function onResize1() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    function onKeyDown1(event) {
        if (event.code === "KeyW") {
            console.log(`camera.position.set(${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)});\ncontrols.target.set(${controls.target.x.toFixed(2)}, ${controls.target.y.toFixed(2)}, ${controls.target.z.toFixed(2)});\ncontrols.update();`);
        }
    }
    window.addEventListener('resize', onResize1);
    window.addEventListener('keydown', onKeyDown1);
    window.setCameraView = setCameraView;
    // Cleanup Function สำหรับ Set 1
    return function cleanup() {
        cancelAnimationFrame(animationId1);
        window.removeEventListener('resize', onResize1);
        window.removeEventListener('keydown', onKeyDown1);
        controls.dispose();
        delete window.setCameraView;
        scene.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        cloudTexture.dispose();
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
    };
}

// ==========================================
// ระบบ SET 2
// ==========================================
function initSet2() {
    let controlscam = false;
    let isRightMouseDown = false;
    let targetY = 12;

    const container = getCanvasContainer();
    const scene = new THREE.Scene();
    const targetCameraPos = new THREE.Vector3(0.05, 7.65, 50.00);
    const targetLookAt = new THREE.Vector3(-1.50, 2.94, 0.00);  

    const camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // แก้ไขจุดนี้: นำ Element ยัดใส่ container แทน document.body เพื่อความเป็นระเบียบ
    container.appendChild(renderer.domElement);

    function onKeyDown2(event) { if (event.code === "KeyE") controlscam = true; }
    function onMouseDown2(e) { if (e.button === 2) isRightMouseDown = true; }
    function onMouseUp2(e) { if (e.button === 2) isRightMouseDown = false; }
    function onMouseMove2(e) {
        if (!isRightMouseDown) return;
        targetY += e.movementY * 0.01;
    }
    document.addEventListener("keydown", onKeyDown2);
    window.addEventListener("mousedown", onMouseDown2);
    window.addEventListener("mouseup", onMouseUp2);
    window.addEventListener("mousemove", onMouseMove2);

    // Post-processing
    const composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    const colorCorrectionPass = new THREE.ShaderPass(THREE.ColorCorrectionShader);
    colorCorrectionPass.uniforms['powRGB'].value = new THREE.Vector3(2.2, 2.2, 2.2);
    colorCorrectionPass.uniforms['mulRGB'].value = new THREE.Vector3(1.15, 1.15, 1.15);
    composer.addPass(colorCorrectionPass);

    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.4, 0.85);
    composer.addPass(bloomPass);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minAzimuthAngle = THREE.MathUtils.degToRad(-45);
    controls.maxAzimuthAngle = THREE.MathUtils.degToRad(45);
    controls.mouseButtons.RIGHT = null;
    controls.enableRotate = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    function makeDirectionalLight(x, y, z) {
        const light = new THREE.DirectionalLight(0xffffff, 3);
        light.position.set(x, y, z);
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        const cam = light.shadow.camera;
        cam.left = -10; cam.right = 10; cam.top = 10; cam.bottom = -10; cam.near = 0.1; cam.far = 100;
        light.shadow.bias = -0.0002;
        light.shadow.normalBias = 0.025;
        light.shadow.radius = 4;
        return light;
    }
    const leftLight = makeDirectionalLight(-5, 4, 15);
    const rightLight = makeDirectionalLight(5, 4, 15);
    scene.add(leftLight, rightLight);

    // Background Planes
    const textureLoader = new THREE.TextureLoader();
    const planeGeo = new THREE.PlaneGeometry(50, 35);
    const bgTexture1 = textureLoader.load('background.png');
    const bgPlane1 = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: bgTexture1, depthWrite: false }));
    bgPlane1.position.set(0, 0, -0.5); scene.add(bgPlane1);

    const bgTexture2 = textureLoader.load('background2.png');
    const bgPlane2 = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: bgTexture2, transparent: true, depthWrite: false }));
    bgPlane2.position.set(0, 0, -5); scene.add(bgPlane2);

    const bgTexture3 = textureLoader.load('background3.png');
    const bgPlane3 = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: bgTexture3, transparent: true, depthWrite: false }));
    bgPlane3.position.set(0, 0, 0.5); scene.add(bgPlane3);

    const bgTexture4 = textureLoader.load('background4.png');
    const bgPlane4 = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: bgTexture4, transparent: true, depthWrite: false }));
    bgPlane4.position.set(0, 0, 0.6); scene.add(bgPlane4);

    const bgTextureLight = textureLoader.load('ever.png');
    const bgPlaneLight = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: bgTextureLight, transparent: true, depthWrite: false }));
    bgPlaneLight.position.set(0, 0, 5); bgPlaneLight.scale.set(1, 1.1, 1); scene.add(bgPlaneLight);

    const bgTextureshadow = textureLoader.load('shadow.png');
    const bgPlaneShadow = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: bgTextureshadow, transparent: true, depthWrite: false }));
    bgPlaneShadow.position.set(0, 0.85, 0); scene.add(bgPlaneShadow);

    const pivotGroup = new THREE.Group();
    pivotGroup.rotation.z = THREE.MathUtils.degToRad(30);
    scene.add(pivotGroup);

    // โหลดโมเดล
    const loader = new THREE.GLTFLoader();
    let model;
    loader.load('main.glb', function (gltf) {
        model = gltf.scene;
        model.position.set(0, 0, 0);
        model.traverse((child) => {
            if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
        });
        pivotGroup.add(model);
    }, undefined, function (error) { console.error('GLB Error:', error); });

    let animationId2;
    function animate() {
        animationId2 = requestAnimationFrame(animate);
        if (model) model.rotation.y += 0.01;

        bgPlane1.quaternion.copy(camera.quaternion);
        bgPlane2.quaternion.copy(camera.quaternion);
        bgPlane3.quaternion.copy(camera.quaternion);
        bgPlane4.quaternion.copy(camera.quaternion);
        bgPlaneLight.quaternion.copy(camera.quaternion);
        bgPlaneShadow.quaternion.copy(camera.quaternion);

        camera.updateProjectionMatrix();

        if (controlscam) {  
            camera.fov = THREE.MathUtils.lerp(camera.fov, 2, 0.01);
            camera.position.lerp(targetCameraPos, 0.08);
            controls.target.lerp(targetLookAt, 0.01);
        }
        controls.update();
        composer.render();
    }
    animate();

    function onResize2() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        composer.setSize(width, height);
        bloomPass.setSize(width, height);
    }
    window.addEventListener('resize', onResize2);

    // Cleanup Function สำหรับ Set 2
    return function cleanup() {
        cancelAnimationFrame(animationId2);
        window.removeEventListener('resize', onResize2);
        document.removeEventListener("keydown", onKeyDown2);
        window.removeEventListener("mousedown", onMouseDown2);
        window.removeEventListener("mouseup", onMouseUp2);
        window.removeEventListener("mousemove", onMouseMove2);
        controls.dispose();

        scene.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });

        [bgTexture1, bgTexture2, bgTexture3, bgTexture4, bgTextureLight, bgTextureshadow].forEach(t => t.dispose());
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
    };
}

// ==========================================
// ระบบสลับ SET (แก้ไขให้ปลอดภัยขึ้น)
// ==========================================
function switchToSet1() {
    // 1. เช็กว่ากำลังสลับ Set อยู่ หรือ อยู่ที่ Set 1 อยู่แล้วหรือไม่
    if (isSwitching || currentSet === 1) return;
    isSwitching = true;

    console.log("กำลังล้างข้อมูล Set 2 และโหลด Set 1...");

    // 2. ล้างข้อมูล Set 2 ก่อนเปิด Set 1
    if (cleanupSet2) {
        cleanupSet2();
        cleanupSet2 = null;
    }

    // 3. เริ่มต้น Set 1 และอัปเดตสถานะ currentSet
    currentSet = 1;
    cleanupSet1 = initSet1();

    setTimeout(() => { isSwitching = false; }, 300); // กันกดซ้ำ
}

function switchToSet2() {
    // 1. เช็กว่ากำลังสลับ Set อยู่ หรือ อยู่ที่ Set 2 อยู่แล้วหรือไม่
    if (isSwitching || currentSet === 2) return;
    isSwitching = true;

    console.log("กำลังล้างข้อมูล Set 1 และโหลด Set 2...");

    // 2. ล้างข้อมูล Set 1 ก่อนเปิด Set 2
    if (cleanupSet1) {
        cleanupSet1();
        cleanupSet1 = null;
    }

    // 3. เริ่มต้น Set 2 และอัปเดตสถานะ currentSet
    currentSet = 2;
    cleanupSet2 = initSet2();

    setTimeout(() => { isSwitching = false; }, 300); // กันกดซ้ำ
}

// Event Listener สำหรับปุ่ม K (สลับฉาก)
keyKListener = function(event) {
    if (event.code === "KeyK") {
        if (currentSet === 1) {
            switchToSet2();
        } else if (currentSet === 2) {
            switchToSet1();
        }
    }
};

window.addEventListener('keydown', keyKListener);

// เริ่มต้นระบบด้วย Set 1
window.addEventListener('load', () => {
    cleanupSet1 = initSet1();
});
