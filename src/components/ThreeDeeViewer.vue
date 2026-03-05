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
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { useCanvas } from '../composables/canvas-viewer';

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

    const emit = defineEmits(['item-clicked', 'update-active-child']);

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

    watch(() => props.childCoordinates, () => {
        updateChildren();
    }, { deep: true });

    watch(() => props.activeChildId, () => {
        updateChildren();
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
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            const firstIntersect = intersects[0];

            if (event.altKey) {
                if (!props.activeChildId) {
                    console.warn('No active child selected for ALT-click position update');
                    return;
                }

                const position = {
                    x: firstIntersect.point.x,
                    y: firstIntersect.point.y,
                    z: firstIntersect.point.z
                }

                const child = props.childCoordinates.find(c => c.entity_id === props.activeChildId);
                emit('update-active-child', {
                    entity_id: props.activeChildId,
                    parent_id: props.item.id,
                    ...position
                });

            } else if (firstIntersect.object.target) {
                const targetChild = props.item.children.find(child => child.name === firstIntersect.object.target);
                if (targetChild) {
                    emit('item-clicked', targetChild);
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

            container.value.appendChild(renderer.domElement);

            // Lighting
            const light = new THREE.HemisphereLight(0xffffff, 0x444444);
            light.position.set(0, 20, 0);
            scene.add(light);

            const directionalLight = new THREE.DirectionalLight(0xffffff);
            directionalLight.position.set(0, 20, 10);
            scene.add(directionalLight);


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

    const childGeometries = ref([]);
    const updateChildren = () => {
        // Remove old child geometries
        childGeometries.value.forEach(geom => {
            geom.removeFromParent();
        });
        childGeometries.value = [];

        const { cameraDistance } = getObjectDimensions();

        const sphereRadius = 0.01 * cameraDistance;

        props.childCoordinates.forEach(child => {
            // For 3D models, we might want to log the 3D position directly
            const geometry = new THREE.SphereGeometry(sphereRadius, 16, 16);
            const material = new THREE.MeshBasicMaterial({ color:  child.entity_id === props.activeChildId ? 0x0000ff : 0xff0000 });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(child.x, child.y, child.z);
            sphere.target = child.name; // Store reference to child data
            scene.add(sphere);
            childGeometries.value.push(sphere);
        });
    }

    const mount = async () => {

        try {
            error.value = '';
            loading.value = true;
            progress.value = 0;


            console.log('Mounting 3D model with item:', props.item);

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

            // Load 3D model (assuming GLTF format)
            const loader = new GLTFLoader();

            const gltf = await loader.loadAsync(
                props.item.url,
                function (prog) {
                    progress.value = Math.floor(prog.loaded / prog.total * 100);
                }
            );

            if (!scene) {
                error.value = 'Three.js scene not available';
                loading.value = false;
                return;
            }

            const model = gltf.scene;

            scene.add(model);
            object.value = model;


            const { center, cameraDistance } = getObjectDimensions();

            controls.target = center;
            camera.position.set(0, cameraDistance / 2, cameraDistance);

            updateChildren();

            // Start animation
            function animate() {
                if (!renderer || !scene || !camera) return;
                animationId = requestAnimationFrame(animate);
                if (controls) controls.update();
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