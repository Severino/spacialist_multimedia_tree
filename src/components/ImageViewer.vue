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
    import { Canvas, Circle, FabricImage, Point } from 'fabric';
    import useClipboard from '../composables/clipboard';

    const emit = defineEmits(['item-clicked']);

    const props = defineProps({
        item: {
            type: Object,
            required: true
        }
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

    const { copyToClipboard } = useClipboard();

    watch(() => props.item, async () => {
        unmount();
        await mount();
    });


    function setupZoomAndPan() {
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
    }

    onMounted(async () => {
        if (canvasRef.value) {
            // Pan functionality
            canvas = new Canvas(canvasRef.value);

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
        try {
            const imageSrc = props.item.image

            console.log('Mounting image:', props.item);

            // Fabric.js v6+ correct API
            image.value = await FabricImage.fromURL(imageSrc, {}, {
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

            // Add the image to the canvas first
            canvas.add(image.value);

            resetPosition();
            const { image: imageDimensions } = getDimensions(image);

            // Add marker for children
            if (props.item.children) {
                props.item.children.forEach(child => {
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
                        emit('item-clicked', child);
                    });

                    activeMarkers.value.push(marker);
                });
            }

            canvas.renderAll();
            console.log('Image added to canvas and rendered');
        } catch (error) {
            console.error('Failed to load image:', error);
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

    const getDimensions = () => {
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
</script>