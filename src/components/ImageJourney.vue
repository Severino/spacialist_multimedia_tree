<template>
    <div class="canvas-container h-100">
<!-- 
        <div class="breadcrumbs">
            <a href="/">HOME</a>
            <template
                v-for="value in parts"
                :key="value.path"
            >
                <span> > </span>
                <a :href="'/?path=' + value.path">{{ value.name }}</a>
            </template>

        </div> -->

        <div>
            Selected entity: {{ entity?.name ?? 'None' }}
        </div>
        

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
    import { computed, onMounted, ref, watch, } from 'vue';

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

        path.value = activePath.join('/');
        activeItem.value = currentItem;

        updateParts();
        console.log("Entity on mount:", entity.value);
    });

    const parts = ref([]);

    const updatePath = (item) => {
        console.log('Updating path with item:', item);
        path.value.split('/').pop();
        if (!item.root) {
            if (path.value) {
                path.value += '/';
            }
            path.value += item.name;
        }
        updateParts();
        // SET URL parameter
        const url = new URL(window.location);
        url.searchParams.set('path', path.value.split('/').join(','));
        window.history.pushState({}, '', url);
    }

    const updateParts = () => {
        parts.value = path.value.split('/').map((name, index, arr) => {
            return {
                name: name,
                path: arr.slice(0, index + 1).join('/')
            };
        });
    }

    const mount = (item) => {
        console.log('Item clicked:', item);
        updatePath(item);
        activeItem.value = item;
    }

    const entity = computed(() => {
        return SpPS.api.store.entityStore.selectedEntity;
    })
</script>