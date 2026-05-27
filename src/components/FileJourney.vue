<template>
    <div class="canvas-container h-100 bg-light position-relative">
        <div
            v-if="!file && !useMap"
            class="position-absolute top-50 start-50 translate-middle"
        >{{ t("error.no_file") }}</div>
        <component
            v-else-if="component"
            :is="component"
            :item="file"
            :lock="lock"
            :activeChildId="activeChildId"
            :childCoordinates="childCoordinates"
            :childEntities="childEntities"
            :childEntitiesMap="childEntitiesMap"
            @update-active-child="emit('update-active-child', $event)"
            @item-clicked="emit('select-child', $event)"
            @navigate-to-child="emit('navigate-to-child', $event)"
        />
        <!-- <MapViewer
            v-else-if="useMap"
            :activeChildId="activeChildId"
            :childCoordinates="childCoordinates"
            :childEntitiesMap="childEntitiesMap"
            @update-active-child="emit('update-active-child', $event)"
            @item-clicked="emit('select-child', $event)"
            @navigate-to-child="emit('navigate-to-child', $event)"
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
            @navigate-to-child="emit('navigate-to-child', $event)"

        />
        <ThreeDeeViewer
            v-else-if="file.category === '3d'"
            :item="file"
            :lock="lock"
            :activeChildId="activeChildId"
            :childCoordinates="childCoordinates"
            :childEntities="childEntities"
            @update-active-child="emit('update-active-child', $event)"
            @item-clicked="emit('select-child', $event)"
            @navigate-to-child="emit('navigate-to-child', $event)"
        /> -->
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

    const emit = defineEmits(['select-child', 'update-active-child', 'navigate-to-child']);


    const childEntitiesMap = computed(() => {
        return props.childEntities?.reduce((acc, c) => {
            acc[c.id] = c;
            return acc;
        }, {}) ?? {};
    });

    const modules = {
        'image': ImageViewer,
        '3d': ThreeDeeViewer,
        'map': MapViewer,
    }

    const component = computed(() => {
        if (props.useMap)  return MapViewer;
        
        if(modules[props.file?.category]) {
            return modules[props.file.category];
        }

        return null;
    });
</script>