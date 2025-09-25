<template>
    <div class="canvas-container h-100">

        <!-- <div class="breadcrumbs">
            <a href="/">HOME</a>
            <a :href="'/?path=' + value.path" v-for="value in parts">{{ value.name }}</a>

        </div>
        <div v-show="Boolean(activeItem?.model)" class="three-dee-container" ref="threeDeeContainer"
            style="height: 500px;"></div>
        <canvas  ref="canvasRef" class="border border-2 border-dark">
            Canvas is not supported in your browser.
        </canvas> -->
        <div v-if="!activeItem">No active item selected.</div>
        <ImageViewer
            v-else-if="Boolean(activeItem?.image)"
            :item="activeItem"
            @item-clicked="mount"
        />
        <ThreeDeeViewer
            v-else-if="Boolean(activeItem?.model)"
            :item="activeItem"
            @item-clicked="mount"
        />
        <div v-else>No matching viewer found.</div>
    </div>
</template>

<script setup>
    import { computed, onMounted, ref, } from 'vue';

    import ImageViewer from './ImageViewer.vue';
    import ThreeDeeViewer from './ThreeDeeViewer.vue';

    const activeItem = ref(null);
    const path = ref('');

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
    };

    onMounted(async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const activePath = urlParams.get('path')?.split(',') ?? [];

        let currentItem = configuration;
        for (const segment of activePath) {
            currentItem = currentItem.children.find(child => child.name === segment);
            if (!currentItem) {
                path.value = '';
                currentItem = configuration;
                break;
            }
        }

        path.value = activePath.slice(0, -1).join('/');
        activeItem.value = currentItem;
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

    const updatePath = (item) => {
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

    const mount = (item) => {
        console.log('Item clicked:', item);
        updatePath(item);
        activeItem.value = item;
    }
</script>