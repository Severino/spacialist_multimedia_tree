<template>
    <div class="canvas-container">
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
        <div v-if="!file">No active item selected.</div>
        <ImageViewer
            v-else-if="file.category === 'image'"
            :item="file"
            :lock="false"
            :activeChildId="activeChildId"
            :children="children"
            @update-active-child="emit('update-active-child', $event)"
            @item-clicked="emit('select-child', $event)"
        />
        <ThreeDeeViewer
            v-else-if="file.category === '3d'"
            :item="file"
            :lock="lock"
            :activeChildId="activeChildId"
            :children="children"
            @item-clicked="mount"
        />
        <div v-else>No matching viewer found.</div>
    </div>
</template>

<script setup>
    import { computed, onMounted, ref, watch, } from 'vue';

    import ImageViewer from './ImageViewer.vue';
    import ThreeDeeViewer from './ThreeDeeViewer.vue';

    const path = ref('');

    const props = defineProps({
        activeChildId: Number,
        lock: Boolean,
        file: Object,
        children: Array,
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