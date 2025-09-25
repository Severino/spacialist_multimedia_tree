<template>
    <div class="canvas-container">

        <div class="breadcrumbs">
            <a href="/">HOME</a>
            <a :href="'/?path=' + value.path" v-for="value in parts">{{ value.name }}</a>

        </div>
        <div v-show="Boolean(activeItem?.model)" class="three-dee-container" ref="threeDeeContainer"
            style="height: 500px;"></div>
        <canvas  ref="canvasRef" class="border border-2 border-dark">
            Canvas is not supported in your browser.
        </canvas>

    </div>
</template>

<script setup>
    import { Canvas, Circle, FabricImage, Point } from 'fabric';
    import { computed, nextTick, onMounted, onUnmounted, ref, unref, watch } from 'vue';
    import useClipboard from '../composables/clipboard';
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    const canvasRef = ref(null);
    let canvas = null;
    let resizeHandler = null;
    let image = ref(null);

    const activeItem = ref(null);

    const imageSrc = ref(null);
    const activeMarkers = ref([]);
    const path = ref('');

    // Three.js related variables
    let threeJsControls = null;
    let threeJsCamera = null;
    const threeDeeContainer = ref(null);
    const threeDeeObject = ref(null);
    let threeJsRenderer = null;
    let threeJsScene = null;
    let threeJsRaycaster = null;
    let animationId = null;

    const { copyToClipboard } = useClipboard();

    const configuration = {
        root: true,
        name: "map",
        image: "/assets/map.jpg",
        children: [
            {
                name: "Site I",
                position: { x: 0.7453, y: 0.8557 },
                image: "/assets/site.jpg",
                children: [
                    {
                        name: "Object A",
                        position: { x: 0.6452, y: 0.3411 },
                        image: "/assets/object.jpg",
                        children: [
                            {
                                name: "Sample A1",
                                position: { x: 0.1248, y: 0.2086 },
                                image: "/assets/sample.jpg",
                            },
                            {
                                name: "Sample A1",
                                position: { x: 0.6204, y: 0.3926 },
                                image: "/assets/sample.jpg",
                            },
                            {
                                name: "Sample A1",
                                position: { x: 0.5136, y: 0.1999 },
                                image: "/assets/sample.jpg",
                            }
                        ]
                    },
                    {
                        name: "Object B",
                        position: { x: 0.4550, y: 0.5352 },
                        model: "/assets/grab/scene.gltf",
                        children: [
                            {
                                name: "Sample A1",
                                position: { x: 0.1767, y: 0.5886, z: 1.9667 },
                                image: "/assets/sample.jpg",
                            },
                            {
                                name: "Sample A1",
                                position: { x: -0.4271, y: 1.3683, z: -1.3853 },
                                image: "/assets/sample.jpg",
                            },
                            {
                                name: "Sample A1",
                                position: { x: -1.1501, y: 0.6146, z: 0.1057 },
                                image: "/assets/sample.jpg",
                            }
                        ]
                    },
                    {
                        name: "Object C",
                        position: { x: 0.2331, y: 0.3927 },
                        image: "/assets/object.jpg",
                        children: [

                        ]
                    }
                ]
            },
            {
                name: "Site II",
                position: { x: 0.1376, y: 0.7613 },
                image: "/assets/site.jpg",
                children: []
            }
        ]
    }

    const getOffset = () => {
        const viewportTransform = canvas.viewportTransform;
        return { x: viewportTransform[4], y: viewportTransform[5] };
    }

    const getDimensions = (element) => {
        element = unref(element);

        // Scale image to fit canvas if needed
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgWidth = image.value.width;
        const imgHeight = image.value.height;

        // Calculate scale to fit image in canvas
        const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);

        return {
            canvas: {
                width: canvasWidth,
                height: canvasHeight
            },
            image: {
                width: imgWidth,
                height: imgHeight
            },
            scale,

        }
    };

    const resetPosition = (render = false) => {
        const { scale: targetScale, image: imageDimensions, canvas: canvasDimensions } = getDimensions(image);

        const viewportTransform = canvas.viewportTransform;
        viewportTransform[0] = targetScale;
        viewportTransform[3] = targetScale;
        viewportTransform[4] = (canvasDimensions.width - imageDimensions.width * targetScale) / 2;
        viewportTransform[5] = (canvasDimensions.height - imageDimensions.height * targetScale) / 2;

        if (render) {
            canvas.renderAll();
        }
    }

    const unmountActiveItem = () => {
        // Clear fabric canvas
        if (canvas) {
            canvas.clear();
        }

        // Clean up Three.js
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        if (threeJsRenderer) {
            threeJsRenderer.dispose();
            threeJsRenderer = null;
        }

        if (threeDeeContainer.value) {
            threeDeeContainer.value.innerHTML = '';
        }

        if (threeDeeObject.value) {
            threeDeeObject.value = null;
        }

        // Reset Three.js variables
        threeJsScene = null;
        threeJsCamera = null;
        threeJsControls = null;
        threeJsRaycaster = null;
    };

    const setupThreeScene = () => {
        try {

            if (!threeDeeContainer.value) {
                console.error('Three.js container not found');
                return false;
            }

            // Clear any existing content
            threeDeeContainer.value.innerHTML = '';

            // Basic Three.js setup
            threeJsScene = new THREE.Scene();
            threeJsScene.background = new THREE.Color(0xbfe3dd);

            // Get container dimensions
            const containerWidth = threeDeeContainer.value.clientWidth || 800;
            const containerHeight = threeDeeContainer.value.clientHeight || 500;

            threeJsCamera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
            threeJsCamera.position.set(0, 1.6, 3);

            threeJsRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            threeJsRenderer.setSize(containerWidth, containerHeight);
            threeJsRenderer.setClearColor(0x000000, 0);

            threeDeeContainer.value.appendChild(threeJsRenderer.domElement);

            // Lighting
            const light = new THREE.HemisphereLight(0xffffff, 0x444444);
            light.position.set(0, 20, 0);
            threeJsScene.add(light);

            const directionalLight = new THREE.DirectionalLight(0xffffff);
            directionalLight.position.set(0, 20, 10);
            threeJsScene.add(directionalLight);

            threeJsRaycaster = new THREE.Raycaster();

            // Click handler for 3D scene
            threeDeeContainer.value.addEventListener('click', (event) => {
                const rect = threeDeeContainer.value.getBoundingClientRect();
                const mouse = new THREE.Vector2(
                    ((event.clientX - rect.left) / rect.width) * 2 - 1,
                    -((event.clientY - rect.top) / rect.height) * 2 + 1
                );

                threeJsRaycaster.setFromCamera(mouse, threeJsCamera);
                const intersects = threeJsRaycaster.intersectObjects(threeJsScene.children, true);
                if (intersects.length > 0) {
                    const firstIntersect = intersects[0];

                    if (event.altKey) {
                        copyToClipboard(`position: {x: ${firstIntersect.point.x.toFixed(4)}, y: ${firstIntersect.point.y.toFixed(4)}, z: ${firstIntersect.point.z.toFixed(4)}}`);
                    } else if (firstIntersect.object.target) {
                        const targetChild = activeItem.value.children.find(child => child.name === firstIntersect.object.target);
                        if (targetChild) {
                            mountItem(targetChild);
                        }
                    }
                }
            });

            // Controls
            threeJsControls = new OrbitControls(threeJsCamera, threeJsRenderer.domElement);
            threeJsControls.target.set(0, 1.6, 0);
            threeJsControls.update();
            return true;
        } catch (error) {
            console.error('Failed to setup 3D scene:', error);
            return false;
        }
    };


    const mountThreeDee = async (item) => {

        // Set up Three.js scene fresh each time
        const sceneSetupSuccess = setupThreeScene();
        if (!sceneSetupSuccess) {
            console.error('Failed to setup Three.js scene');
            return;
        }

        // Load 3D model (assuming GLTF format)
        const loader = new GLTFLoader();
        loader.load(
            item.model,
            function (gltf) {
                if (!threeJsScene) {
                    console.error('Three.js scene not available');
                    return;
                }

                const model = gltf.scene;
                console.log('Adding model to scene:', threeJsScene);
                threeJsScene.add(model);
                threeDeeObject.value = model;

                // Add markers for children
                item.children.forEach(child => {
                    // For 3D models, we might want to log the 3D position directly
                    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
                    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                    const sphere = new THREE.Mesh(geometry, material);
                    sphere.position.set(child.position.x, child.position.y, child.position.z);
                    sphere.target = child.name; // Store reference to child data
                    threeJsScene.add(sphere);
                });

                // Start animation
                function animate() {
                    if (!threeJsRenderer || !threeJsScene || !threeJsCamera) return;
                    animationId = requestAnimationFrame(animate);
                    if (threeJsControls) threeJsControls.update();
                    threeJsRenderer.render(threeJsScene, threeJsCamera);
                }
                animate();
            },
            function (progress) {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            function (error) {
                console.error('An error happened while loading the 3D model:', error);
            }
        );
    }

    const mountImage = async (item) => {
        try {
            imageSrc.value = item.image


            // Fabric.js v6+ correct API
            image.value = await FabricImage.fromURL(imageSrc.value, {}, {
                selectable: false,
                hoverCursor: 'default',
            });
            console.log('Loading image from:', image.value);

            image.value.on('mousedown', (event) => {
                const scenePosition = event.scenePoint;
                const relativeX = (scenePosition.x / image.value.width);
                const relativeY = (scenePosition.y / image.value.height);
                copyToClipboard(`position: {x: ${relativeX.toFixed(4)}, y: ${relativeY.toFixed(4)}}`);
            });

            // Get current scale and position for markers
            // const canvasWidth = canvas.width;
            // const canvasHeight = canvas.height;
            // const imgWidth = image.value.width;
            // const imgHeight = image.value.height;
            // const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);

            // Add the image to the canvas first
            canvas.add(image.value);

            resetPosition();
            const { image: imageDimensions } = getDimensions(image);

            // Add marker for children
            item.children.forEach(child => {
                const marker = new Circle({
                    left: child.position.x * imageDimensions.width,
                    top: child.position.y * imageDimensions.height,
                    radius: 10,
                    fill: 'red',
                    stroke: 'black',
                    strokeWidth: 2,
                    selectable: false,
                    originX: 'center',
                    originY: 'center',
                    hoverCursor: 'pointer',
                });
                canvas.add(marker);

                marker.on('mousedown', (event) => {
                    mountItem(child);
                });

                activeMarkers.value.push(marker);
            });

            canvas.renderAll();
            console.log('Image added to canvas and rendered');
        } catch (error) {
            console.error('Failed to load image:', error);
        }
    };

    const mountItem = async (item) => {
        // Set activeItem first to make containers visible
        activeItem.value = item;

        // Wait a tick for the DOM to update
        await new Promise(resolve => setTimeout(resolve, 0));

        unmountActiveItem();

        if (item.model) {
            await mountThreeDee(item);
            return;
        }

        if (item.image) {
            await mountImage(item);
        }

        path.value.split('/').pop();
        if (!item.root) {
            if (path.value) {
                path.value += '/';
            }
            path.value += item.name;
        }

        // SET URL parameter
        const url = new URL(window.location);
        url.searchParams.set('path', path.value.split('/').join(','));
        window.history.pushState({}, '', url);
    }


    onMounted(async () => {
        // Get parent container dimensions and set canvas size
        const parentContainer = canvasRef.value.parentElement;
        const containerWidth = parentContainer.clientWidth;
        const containerHeight = parentContainer.clientHeight;

        // Set canvas dimensions to match parent
        canvasRef.value.width = containerWidth;
        canvasRef.value.height = containerHeight;

        canvas = new Canvas(canvasRef.value);
        canvas.setDimensions({
            width: containerWidth,
            height: containerHeight
        });


        // Handle window resize
        resizeHandler = () => {
            const newWidth = parentContainer.clientWidth;
            const newHeight = parentContainer.clientHeight;

            canvas.setDimensions({
                width: newWidth,
                height: newHeight
            });
            canvas.renderAll();
        };

        window.addEventListener('resize', resizeHandler);

        // Setup zoom and pan functionality
        setupZoomAndPan();

        // canvas.on('mouse:over', function (event) {
        //     console.log('Mouse over event:', event);

        //     if (event.target instanceof FabricImage) {
        //         canvas.hoverCursor = 'default';
        //         console.log('Cursor set to default over image');
        //     } else {
        //         canvas.hoverCursor = 'pointer';
        //     }
        //     // if (evt.button === 0) {
        //     //     canvas.defaultCursor = 'grab';
        //     //     canvas.hoverCursor = 'grab';
        //     // }
        // });


        const urlParams = new URLSearchParams(window.location.search);

        const activePath = urlParams.get('path')?.split(',') ?? [];

        let currentItem = configuration;
        for (const segment of activePath) {
            currentItem = currentItem.children.find(child => child.name === segment);
            if (!currentItem) {
                currentItem = configuration;
                break;
            }
        }

        path.value = activePath.slice(0, -1).join('/');
        await mountItem(currentItem);
    });

    function setupZoomAndPan() {
        let isPanning = false;
        let lastPosX, lastPosY;

        // Zoom configuration
        const minZoom = 0.1;
        const maxZoom = 10;

        // Mouse wheel zoom
        canvas.on('mouse:wheel', function (opt) {
            const delta = opt.e.deltaY;
            let zoom = canvas.getZoom();

            // Calculate new zoom level
            zoom *= 0.999 ** delta;

            // Apply zoom limits
            if (zoom > maxZoom) zoom = maxZoom;
            if (zoom < minZoom) zoom = minZoom;

            // Zoom at cursor position
            const point = new Point(opt.e.offsetX, opt.e.offsetY);
            canvas.zoomToPoint(point, zoom);

            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        // Pan functionality
        canvas.on('mouse:down', function (opt) {
            const evt = opt.e;
            if (evt.button === 0) {
                isPanning = true;
                canvas.selection = false;
                lastPosX = evt.clientX;
                lastPosY = evt.clientY;
                canvas.defaultCursor = 'grab';
                canvas.hoverCursor = 'grab';
            }
        });

        canvas.on('mouse:move', function (opt) {
            if (isPanning) {
                const e = opt.e;
                const viewportTransform = canvas.viewportTransform;

                viewportTransform[4] += e.clientX - lastPosX;
                viewportTransform[5] += e.clientY - lastPosY;

                canvas.requestRenderAll();
                lastPosX = e.clientX;
                lastPosY = e.clientY;
            }
        });

        canvas.on('mouse:up', function (opt) {
            if (isPanning) {
                isPanning = false;
                canvas.selection = true;
                canvas.defaultCursor = 'default';
                canvas.hoverCursor = 'move';
            }
        });

        // Double click to reset zoom and pan
        canvas.on('mouse:dblclick', function (opt) {
            resetPosition(true);
        });

        // Touch support for mobile
        let lastDistance = 0;
        let lastTouchX = 0;
        let lastTouchY = 0;

        canvas.on('touch:gesture', function (opt) {
            if (opt.e.touches && opt.e.touches.length === 2) {
                const touch1 = opt.e.touches[0];
                const touch2 = opt.e.touches[1];

                const distance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );

                if (lastDistance > 0) {
                    let zoom = canvas.getZoom();
                    zoom *= distance / lastDistance;

                    if (zoom > maxZoom) zoom = maxZoom;
                    if (zoom < minZoom) zoom = minZoom;

                    const center = new Point(
                        (touch1.clientX + touch2.clientX) / 2,
                        (touch1.clientY + touch2.clientY) / 2
                    );

                    canvas.zoomToPoint(center, zoom);
                }

                lastDistance = distance;
            }
        });
    }

    onUnmounted(() => {
        // Clean up event listeners
        if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
        }

        // Clean up Three.js resources
        unmountActiveItem();
    });

    const parts = computed(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const pathParts = urlParams.get('path')?.split(',') ?? [];

        let paths = [];
        do {
            let path = (pathParts.join('/'));
            let name = pathParts.pop();
            paths.push({ path, name });
        } while (path.length > 0);

        return paths;
    });

    const isItemImage = (item) => {
        return Boolean(item?.image && !item?.model);
    };

    watch(activeItem, (newItem, oldItem) => {

        console.log("oldItem", isItemImage(oldItem), "newItem", isItemImage(newItem));

        if (!(isItemImage(newItem) && isItemImage(oldItem))) {
           console.log('Active item changed from', oldItem, 'to', newItem);
        }
    });
</script>

<style scoped>
    .canvas-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }

    canvas {
        display: block;
        flex: 1;
    }
</style>