<template>
    <div class="position-relative h-100 w-100">
        <div
            v-if="error"
            class="position-absolute top-50 start-50 translate-middle text-danger bg-dark bg-opacity-75 px-3 py-2 rounded z-index-1"
        >
            <span class="fw-bold">Error loading file: </span>{{ error }}
        </div>
        <div
            v-if="loading && !error"
            class="position-absolute top-50 start-50 translate-middle text-white bg-dark bg-opacity-75 px-3 py-2 rounded z-index-1"
        >
            Loading 3D model ... <br><span class="d-block text-center fw-bold">{{ progress }}%</span>
        </div>
        <div
            class="bg-secondary h-100 overflow-hidden"
            ref="container"
        >
            <div>

                <canvas
                    ref="canvasRef"
                    class="h-100"
                >
                    Canvas is not supported in your browser.
                </canvas>
            </div>

        </div>
    </div>
</template>

<script setup>
    import { onMounted, ref, watch } from 'vue';
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { useCanvas } from '../../composables/canvas-viewer';
    import { univeralLoader } from '../../utils/3d';
    import { getActiveFillColor, getFillColor, getTextColor, getTextStrokeColor } from '../../utils/styler';

    const loading = ref(false);
    const progress = ref(0);
    const error = ref('');
    const container = ref(null);
    const object = ref(null);

    let controls = null;
    let camera = null;
    let renderer = null;
    let scene = null;
    let raycaster = null;
    let animationId = null;

    const {
        canvasRef,
    } = useCanvas({
        resize: (width, height) => {
            if (renderer) {
                renderer.setSize(width, height);
                if (camera) {
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                }
            }
        }
    });

    const props = defineProps({
        activeChildId: Number,
        lock: Boolean,
        childCoordinates: Array,
        childEntities: Array,
        item: {
            type: Object,
            required: true
        }
    });

    const emit = defineEmits(['item-clicked', 'update-active-child', 'navigate-to-child']);

    onMounted(async () => {
        // Initialize Three.js scene
        setupThreeScene();
        await mount();
    });

    watch(() => props.item, async (newItem, oldItem) => {
        if (newItem !== oldItem) {
            unmount();
            await mount(newItem);
        }
    });

    const update = async () => {
        updateChildren();
    }

    watch(() => props.childCoordinates, async () => {
        await update();
    }, { deep: true });

    watch(() => props.activeChildId, async () => {
        await update();
    });

    const unmount = async () => {

        // Clean up Three.js
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        if (renderer) {
            renderer.dispose();
            renderer = null;
        }

        if (container.value) {
            container.value.innerHTML = '';
        }

        if (object.value) {
            object.value = null;
        }

        // Reset Three.js variables
        scene = null;
        camera = null;
        controls = null;
        raycaster = null;
    }

    function onSceneClick(event) {
        const raycaster = new THREE.Raycaster();

        const rect = event.target.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster
            .intersectObjects(scene.children, true)
            .filter(intersect => intersect.object.target);

        if (intersects.length > 0) {

            const firstIntersect = intersects[0];

            console.log('Clicked on object:', intersects);

            if (event.ctrlKey) {
                if (!props.activeChildId) {
                    console.warn('No active child selected for CTRL-click position update');
                    return;
                }

                const position = {
                    x: firstIntersect.point.x,
                    y: firstIntersect.point.y,
                    z: firstIntersect.point.z
                }

                // const child = props.childCoordinates.find(c => c.entity_id === props.activeChildId);
                emit('update-active-child', {
                    entity_id: props.activeChildId,
                    ...position
                });

            } else if (firstIntersect.object.target) {
                if (event.altKey) {
                    emit('navigate-to-child', firstIntersect.object.target);
                } else {
                    emit('item-clicked', firstIntersect.object.target);
                }
            }
        }
    }


    const setupThreeScene = () => {
        try {

            if (!container.value) {
                console.error('Three.js container not found');
                return false;
            }

            // Remove existing click listener if any
            container.value.removeEventListener('click', onSceneClick);

            // Clear any existing content
            container.value.innerHTML = '';

            // Basic Three.js setup
            scene = new THREE.Scene();
            // scene.background = new THREE.Color(0xbfe3dd);

            // Get container dimensions
            const containerWidth = container.value.clientWidth || 800;
            const containerHeight = container.value.clientHeight || 500;

            camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
            camera.position.set(-5, 5, 0.5);

            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(containerWidth, containerHeight);
            renderer.setClearColor(0x000000, 0);
            // Enable shadows and correct light response
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.physicallyCorrectLights = true;
            renderer.outputEncoding = THREE.sRGBEncoding;

            container.value.appendChild(renderer.domElement);

            // Unidirectional lighting (strong directional light + soft ambient fill)
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
            directionalLight.position.set(5, 10, 7.5);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            const d = 20;
            directionalLight.shadow.camera.left = -d;
            directionalLight.shadow.camera.right = d;
            directionalLight.shadow.camera.top = d;
            directionalLight.shadow.camera.bottom = -d;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 100;
            directionalLight.shadow.bias = -0.0005;
            scene.add(directionalLight);

            // Low-intensity ambient to lift dark areas while keeping directional look
            const ambient = new THREE.AmbientLight(0xffffff, 0.3);
            scene.add(ambient);


            // Click handler for 3D scene
            container.value.addEventListener('click', onSceneClick);

            // Controls
            controls = new OrbitControls(camera, renderer.domElement);
            // controls.target.set(0, 0, 0);
            controls.update();
            return true;
        } catch (error) {
            console.error('Failed to setup 3D scene:', error);
            return false;
        }
    };

    // Helper to enable shadows on a loaded object (walks children)
    function enableShadowsForObject(obj) {
        if (!obj || !obj.traverse) return;
        obj.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    // Ensure AO maps work: copy UV -> uv2 when necessary and enable aoMapIntensity
    function applyAoMap(obj) {
        if (!obj || !obj.traverse) return;
        obj.traverse(child => {
            if (!child.isMesh) return;

            const geom = child.geometry;
            if (geom && !geom.attributes.uv2 && geom.attributes.uv) {
                geom.setAttribute('uv2', geom.attributes.uv);
            }

            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(mat => {
                if (!mat) return;
                if (mat.aoMap) {
                    if (typeof mat.aoMapIntensity === 'undefined') mat.aoMapIntensity = 1.0;
                    mat.needsUpdate = true;
                }
            });
        });
    }

    function createTextSprite(text) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const fontSize = 48;
        const outlineWidth = 6;
        const padding = outlineWidth;

        ctx.font = `bold ${fontSize}px sans-serif`;
        const textWidth = ctx.measureText(text).width;
        canvas.width = textWidth + padding * 2;
        canvas.height = fontSize + padding * 2;

        // Outlined text (stroke drawn first so fill sits on top)
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.lineWidth = outlineWidth * 2;
        ctx.lineJoin = 'round';
        ctx.strokeStyle =  getTextStrokeColor().hex();
        ctx.strokeText(text, padding, canvas.height / 2);
        ctx.fillStyle = getTextColor().hex();
        ctx.fillText(text, padding, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
        const sprite = new THREE.Sprite(material);

        // Scale so text appears at a readable size relative to the canvas aspect
        const aspect = canvas.width / canvas.height;
        sprite.scale.set(aspect, 1, 1);

        return sprite;
    }

    const childGeometries = ref([]);
    const updateChildren = () => {
        // Remove old child geometries
        childGeometries.value.forEach(geom => {
            geom.removeFromParent();
        });
        childGeometries.value = [];

        const { cameraDistance } = getObjectDimensions();

        const sphereRadius = 0.01 * cameraDistance;
        const labelOffset = sphereRadius;
        const labelScale = sphereRadius * 1;

        props.childCoordinates.forEach(child => {
            const isActive = child.entity_id === props.activeChildId;
            const color = isActive ? getActiveFillColor(child.entity_id).hex() : getFillColor(child.entity_id).hex();

            // Sphere
            const geometry = new THREE.SphereGeometry(sphereRadius, 16, 16);
            const material = new THREE.MeshStandardMaterial({ color });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(child.x, child.y, child.z);
            sphere.target = child;
            sphere.castShadow = true;
            sphere.receiveShadow = true;
            scene.add(sphere);
            childGeometries.value.push(sphere);

            // Text label
            const entity = props.childEntities?.find(e => e.id === child.entity_id);
            const label = entity?.name ?? String(child.entity_id);
            const sprite = createTextSprite(label);
            sprite.target = child;
            sprite.userData.baseAspect = sprite.scale.x / sprite.scale.y;
            sprite.scale.set(labelScale * sprite.userData.baseAspect, labelScale, 1);
            sprite.position.set(child.x, child.y - (sphereRadius + labelOffset), child.z);
            scene.add(sprite);
            childGeometries.value.push(sprite);
        });
    }

    const mount = async () => {

        try {
            error.value = '';
            loading.value = true;
            progress.value = 0;

            if (!props.item.url) {
                error.value = 'No 3D model URL provided';
                loading.value = false;
                return;
            }

            // Set up Three.js scene fresh each time
            const sceneSetupSuccess = setupThreeScene();
            if (!sceneSetupSuccess) {
                error.value = 'Failed to setup 3D scene';
                loading.value = false;
                return;
            }

            if (!scene) {
                error.value = 'Three.js scene not available';
                loading.value = false;
                return;
            }

            const model = await univeralLoader(props.item.url, progress);

            scene.add(model);
            // Ensure loaded model meshes cast and receive shadows
            enableShadowsForObject(model);
            // Apply ao map support (copy UV->uv2 and enable intensity) when present
            applyAoMap(model);
            object.value = model;


            const { center, cameraDistance } = getObjectDimensions();

            controls.target = center;
            camera.position.set(0, cameraDistance / 2, cameraDistance);

            updateChildren();

            // Start animation
            const vFovHalf = (camera.fov * Math.PI) / 360; // half-fov in radians
            const labelHeightPx = 24; // desired label height in pixels
            function animate() {
                if (!renderer || !scene || !camera) return;
                animationId = requestAnimationFrame(animate);
                if (controls) controls.update();

                // Keep label sprites constant screen size regardless of zoom
                const viewH = renderer.domElement.height;
                childGeometries.value.forEach(obj => {
                    if (!obj.isSprite) return;

                    const dist = camera.position.distanceTo(obj.position);
                    const worldHeight = 2 * Math.tan(vFovHalf) * dist * (labelHeightPx / viewH);
                    obj.scale.set(worldHeight * obj.userData.baseAspect, worldHeight, 1);
                });

                renderer.render(scene, camera);
            }
            animate();
            loading.value = false;
        } catch (err) {
            error.value = 'Failed to load 3D model: ' + err.message;
            console.error('Failed to load 3D model:', err);
            loading.value = false;
        }
    };


    const getObjectDimensions = () => {
        let center = new THREE.Vector3();
        let size = new THREE.Vector3();
        let cameraDistance = 2;

        if (object.value) {
            let bbox = new THREE.Box3().setFromObject(object.value);
            bbox.getCenter(center);
            bbox.getSize(size);

            let maxSize = Math.max(size.x, size.y, size.z);
            cameraDistance = maxSize / 2 / Math.tan(camera.fov / 2 * (Math.PI / 180));
        }

        return { center, size, cameraDistance };
    }

</script>