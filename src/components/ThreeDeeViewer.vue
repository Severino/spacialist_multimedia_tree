<template>
    <div class="position-relative h-100 w-100">
        <div
        v-if="loading"
            class="position-absolute top-50 start-50 translate-middle text-red bg-dark bg-opacity-75 px-3 py-2 rounded z-index-1">
            Loading 3D model <span>{{ progress }}%</span>...
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
    let controls = null;
    let camera = null;
    const container = ref(null);
    const object = ref(null);
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
        item: {
            type: Object,
            required: true
        }
    });

    const emit = defineEmits(['item-clicked']);

    onMounted(() => {
        // Initialize Three.js scene
        setupThreeScene();
        mount();
    });

    watch(() => props.item, (newItem, oldItem) => {
        if (newItem !== oldItem) {
            unmount();
            mount(newItem);
        }
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


    const setupThreeScene = () => {
        try {

            if (!container.value) {
                console.error('Three.js container not found');
                return false;
            }

            // Clear any existing content
            container.value.innerHTML = '';

            // Basic Three.js setup
            scene = new THREE.Scene();
            // scene.background = new THREE.Color(0xbfe3dd);

            // Get container dimensions
            const containerWidth = container.value.clientWidth || 800;
            const containerHeight = container.value.clientHeight || 500;

            camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
            camera.position.set(0, 1.6, 3);

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

            raycaster = new THREE.Raycaster();

            // Click handler for 3D scene
            container.value.addEventListener('click', (event) => {

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
                        copyToClipboard(`position: {x: ${firstIntersect.point.x.toFixed(4)}, y: ${firstIntersect.point.y.toFixed(4)}, z: ${firstIntersect.point.z.toFixed(4)}}`);
                    } else if (firstIntersect.object.target) {
                        const targetChild = props.item.children.find(child => child.name === firstIntersect.object.target);
                        if (targetChild) {
                            emit('item-clicked', targetChild);
                        }
                    }
                }
            });

            // Controls
            controls = new OrbitControls(camera, renderer.domElement);
            controls.target.set(0, 1.6, 0);
            controls.update();
            return true;
        } catch (error) {
            console.error('Failed to setup 3D scene:', error);
            return false;
        }
    };


    const mount = async () => {

        console.log('Mounting 3D item:', props.item);
        loading.value = true;
        progress.value = 0;

        // Set up Three.js scene fresh each time
        const sceneSetupSuccess = setupThreeScene();
        if (!sceneSetupSuccess) {
            console.error('Failed to setup Three.js scene');
            return;
        }

        // Load 3D model (assuming GLTF format)
        const loader = new GLTFLoader();
        loader.load(
            props.item.model,
            function (gltf) {
                if (!scene) {
                    console.error('Three.js scene not available');
                    return;
                }

                const model = gltf.scene;
                console.log('Adding model to scene:', scene);
                scene.add(model);
                object.value = model;

                // Add markers for children
                props.item.children.forEach(child => {
                    // For 3D models, we might want to log the 3D position directly
                    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
                    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                    const sphere = new THREE.Mesh(geometry, material);
                    sphere.position.set(child.position.x, child.position.y, child.position.z);
                    sphere.target = child.name; // Store reference to child data
                    scene.add(sphere);
                });

                // Start animation
                function animate() {
                    if (!renderer || !scene || !camera) return;
                    animationId = requestAnimationFrame(animate);
                    if (controls) controls.update();
                    renderer.render(scene, camera);
                }
                animate();
                loading.value = false;
            },
            function (prog) {
                progress.value = Math.floor(prog.loaded / prog.total * 100);
            },
            function (error) {
                loading.value = false;
                console.error('An error happened while loading the 3D model:', error);
            }
        );
    };

</script>