<template>
    <div class="canvas-container h-100 bg-light position-relative">
        <div
            v-if="!file && !useMap"
            class="position-absolute top-50 start-50 translate-middle"
        >{{ t("error.no_file") }}</div>
        <MapViewer
            v-else-if="useMap"
            :activeChildId="activeChildId"
            :childCoordinates="childCoordinates"
            :childEntities="childEntities"
            @update-active-child="emit('update-active-child', $event)"
            @item-clicked="emit('select-child', $event)"
        />
        <ImageViewer
            v-else-if="file.category === 'image'"
            :item="file"
            :lock="false"
            :activeChildId="activeChildId"
            :childCoordinates="childCoordinates"
            :childEntities="childEntities"
            @update-active-child="emit('update-active-child', $event)"
            @item-clicked="emit('select-child', $event)"
        />
        <ThreeDeeViewer
            v-else-if="file.category === '3d'"
            :item="file"
            :lock="lock"
            :activeChildId="activeChildId"
            :childCoordinates="childCoordinates"
            :childEntities="childEntities"
            @update-active-child="emit('update-active-child', $event)"
            @item-clicked="mount"
        />
        <div
            class="position-absolute top-50 start-50 translate-middle"
            v-else
        >{{ t("error.invalid_viewer") }}</div>
    </div>
</template>

<script setup>
    import { computed, onMounted, ref, watch, } from 'vue';

    import ImageViewer from './Viewer/ImageViewer.vue';
    import ThreeDeeViewer from './Viewer/ThreeDeeViewer.vue';
    import MapViewer from './Viewer/MapViewer.vue';
    import { t } from '../utils/plugin';

    const path = ref('');

    const props = defineProps({
        activeChildId: Number,
        childCoordinates: Array,
        childEntities: Array,
        file: Object,
        lock: Boolean,
        useMap: Boolean,
    });

    const emit = defineEmits(['select-child', 'update-active-child']);

    // onMounted(async () => {
    //     const urlParams = new URLSearchParams(window.location.search);
    //     const activePath = urlParams.get('path')?.split(',') ?? [];

    //     let currentItem = configuration;
    //     for (const segment of activePath) {
    //         currentItem = currentItem.children.find(child => child.name === segment);
    //         if (!currentItem) {
    //             path.value = '';
    //             currentItem = configuration;
    //             break;
    //         }
    //     }

    //     path.value = activePath.join('/');
    //     activeItem.value = currentItem;

    //     updateParts();
    //     console.log("Entity on mount:", entity.value);
    // });

    // const parts = ref([]);

    // const updatePath = (item) => {
    //     console.log('Updating path with item:', item);
    //     path.value.split('/').pop();
    //     if (!item.root) {
    //         if (path.value) {
    //             path.value += '/';
    //         }
    //         path.value += item.name;
    //     }
    //     updateParts();
    //     // SET URL parameter
    //     const url = new URL(window.location);
    //     url.searchParams.set('path', path.value.split('/').join(','));
    //     window.history.pushState({}, '', url);
    // }

    // const updateParts = () => {
    //     parts.value = path.value.split('/').map((name, index, arr) => {
    //         return {
    //             name: name,
    //             path: arr.slice(0, index + 1).join('/')
    //         };
    //     });
    // }

    const mount = (item) => {
        console.log('Item clicked:', item);
    }
</script>