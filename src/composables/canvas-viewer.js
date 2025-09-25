import {
    computed,
    onMounted,
    onBeforeUnmount,
    ref,
} from "vue";

export const useCanvas = ({
    resize = () => { },
} = {}) => {
    console.log("useCanvas called");
    const canvasRef = ref(null);
    const parentContainer = computed(() => {
        return canvasRef.value ? canvasRef.value.parentElement : null;
    });

    const resizeCanvas = () => {
        if (canvasRef.value && parentContainer.value) {
            const width = parentContainer.value.clientWidth;
            const height = parentContainer.value.clientHeight;
            canvasRef.value.width = width;
            canvasRef.value.height = height;
            resize(width, height);
            console.log(`Canvas resized to ${width}x${height}`);
        } else {
            console.warn("Canvas or parent container not available for resizing.");
        }
    }

    const onCanvasResize = () => {
        resizeCanvas();
    };

    onMounted(() => {
        resizeCanvas();
        window.addEventListener('resize', onCanvasResize);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('resize', onCanvasResize);
    });

    return {
        canvasRef,
    };
};
