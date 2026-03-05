<template>
    <div class="bg-secondary h-100 position-relative">
        <canvas
            ref="canvasRef"
            class="h-100"
        >
            Canvas is not supported in your browser.
        </canvas>
    </div>
</template>

<script setup>
    import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { useCanvas } from '../composables/canvas-viewer';
    import { Canvas, Circle, FabricImage, Point, FabricText as Text } from 'fabric';

    const emit = defineEmits(['item-clicked', 'update-active-child']);

    const props = defineProps({
        activeChildId: Number | null,
        lock: Boolean,
        item: {
            type: Object,
            required: true
        },
        childEntities: Array,
        childCoordinates: Array,
    });


    const activeMarkers = ref([]);
    let canvas = null;
    let isPanning = false;
    let lastPosX, lastPosY;

    const image = ref(null);

    const {
        canvasRef,
    } = useCanvas({
        resize: (width, height) => {
            if (canvas) {
                canvas.setDimensions({ width, height });
            }
        }
    });

    watch(() => props.item, async () => {
        unmount();
        await mount();
    });

    watch(() => props.activeChildId, async () => {
        drawChildren();
    });

    watch(() => props.childCoordinates, async () => {
        drawChildren();
    }, { deep: true });


    function setupZoomAndPan() {
        // Zoom configuration
        const minZoom = 0.1;
        const maxZoom = 10;

        // Mouse wheel zoom
        canvas.on('mouse:wheel', function (opt) {
            if (props.lock) return;

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
    }

    onMounted(async () => {
        if (canvasRef.value) {
            // Pan functionality
            canvas = new Canvas(canvasRef.value);

            canvas.on('mouse:down', function (opt) {
                if (props.lock) return;

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
                if (props.lock) return;

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

            // // Touch support for mobile
            // let lastDistance = 0;
            // let lastTouchX = 0;
            // let lastTouchY = 0;

            // canvas.on('touch:gesture', function (opt) {
            //     if (props.lock) return;

            //     if (opt.e.touches && opt.e.touches.length === 2) {
            //         const touch1 = opt.e.touches[0];
            //         const touch2 = opt.e.touches[1];

            //         const distance = Math.sqrt(
            //             Math.pow(touch2.clientX - touch1.clientX, 2) +
            //             Math.pow(touch2.clientY - touch1.clientY, 2)
            //         );

            //         if (lastDistance > 0) {
            //             let zoom = canvas.getZoom();
            //             zoom *= distance / lastDistance;

            //             if (zoom > maxZoom) zoom = maxZoom;
            //             if (zoom < minZoom) zoom = minZoom;

            //             const center = new Point(
            //                 (touch1.clientX + touch2.clientX) / 2,
            //                 (touch1.clientY + touch2.clientY) / 2
            //             );

            //             canvas.zoomToPoint(center, zoom);
            //         }

            //         lastDistance = distance;
            //     }
            // });
        } else {
            console.error('Canvas reference is not available.');
        }

        setupZoomAndPan();
        await mount()
    });

    onBeforeUnmount(() => {
        unmount();
        canvas.dispose();
        canvas = null;
    });

    const unmount = () => {
        // Clear fabric canvas
        if (canvas) {
            canvas.clear();
        }
    }

    const mount = async () => {

        if (!props.item || !props.item.url) {
            console.warn('No item or URL provided for ImageViewer.');
            return;
        }

        try {
            const imageSrc = props.item.url

            // Fabric.js v6+ correct API
            try {
                image.value = await FabricImage.fromURL(imageSrc, {}, {
                    selectable: false,
                    hoverCursor: 'default',
                });
            } catch (error) {
                console.error('Error loading image with FabricImage.fromURL:', error);
                throw error;
            }

            image.value.on('mousedown', (event) => {
                if (props.activeChildId && event.e.altKey) {
                    event.e.preventDefault();
                    // Ctrl + click to get coordinates
                    const scenePosition = event.scenePoint;
                    const relativeX = (scenePosition.x / image.value.width);
                    const relativeY = (scenePosition.y / image.value.height);

                    console.log({ entity_id: props.activeChildId, x: relativeX, y: relativeY });

                    emit('update-active-child', { entity_id: props.activeChildId, x: relativeX, y: relativeY });
                }
            });

            resetPosition();
            // Add the image to the canvas first
            canvas.add(image.value);
            drawChildren();
            canvas.renderAll();
        } catch (error) {
            console.error('Failed to load image:', error);
        }
    };

    const resetPosition = (render = false) => {
        const { scale: targetScale, image: imageDimensions, canvas: canvasDimensions } = getDimensions();

        const viewportTransform = canvas.viewportTransform;
        viewportTransform[0] = targetScale;
        viewportTransform[3] = targetScale;
        viewportTransform[4] = canvasDimensions.width / 2;
        // viewportTransform[5] = (canvasDimensions.height - imageDimensions.height * targetScale);


        viewportTransform[5] = canvasDimensions.height / 2;

        console.log(viewportTransform);
        if (render) {
            canvas.renderAll();
        }
    }

    const getDimensions = () => {
        // Scale image to fit canvas if needed)

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        let imageWidth = 0;
        let imageHeight = 0;
        if (image.value) {
            imageWidth = image.value.width;
            imageHeight = image.value.height;
        } else {
            console.warn('Image not loaded yet, using default dimensions');
        }


        // Calculate scale to fit image in canvas
        const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);

        return {
            canvas: {
                width: canvasWidth,
                height: canvasHeight
            },
            image: {
                width: imageWidth,
                height: imageHeight
            },
            scale,
        }
    };


    const drawChildren = () => {
        if (props.childCoordinates && image.value) {

            canvas.getObjects()
                .filter(obj => obj !== image.value)
                .forEach(obj => canvas.remove(obj));


            const { image: imageDimensions, scale } = getDimensions();

            props.childCoordinates.forEach(child => {

                const childEntity = props.childEntities.find(c => c.id === child.entity_id);

                const marker = new Circle({
                    left: child.x * imageDimensions.width,
                    top: child.y * imageDimensions.height,
                    radius: 5 / scale,
                    fill: (child.entity_id === props.activeChildId) ? 'yellow' : 'white',
                    stroke: 'black',
                    strokeWidth: 1 / scale,
                    selectable: false,
                    originX: 'center',
                    originY: 'center',
                    hoverCursor: 'pointer',
                });
                canvas.add(marker);

                canvas.getZoom();

                const label = new Text(childEntity?.name || "N / A", {
                    fontFamily: 'Arial',
                    fontWeight: 'bold',
                    left: child.x * imageDimensions.width,
                    top: child.y * imageDimensions.height + (10 / scale),
                    fontSize: 14 / scale,
                    fill: (child.entity_id === props.activeChildId) ? 'yellow' : 'white',
                    shadow: 'rgba(0,0,0) 0px 0px 10px',
                    selectable: false,
                    originX: 'center',
                    originY: 'top',
                    hoverCursor: 'pointer',
                });
                canvas.add(label);

                window.canvas = canvas;

                marker.on('mousedown', (event) => {
                    emit('item-clicked', child);
                });

                activeMarkers.value.push(marker);
            });
        }
    }
</script>