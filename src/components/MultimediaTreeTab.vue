<template>
    <div class="mm-tab h-100 d-flex flex-column">
        <button
            v-if="parent"
            @click="() => setEntity(parent.id)"
        >
            {{ parent.name }}
        </button>
        {{ entity.name }}
        <div class="d-flex">
            <ImageSelection
                class="mb-2 flex-grow-1"
                :images="linkedFiles"
                :selectedId="selectedFile?.id ?? null"
                @update:selected="updateSelectedFile"
            />
            <ChildSelection
                class="mb-2"
                v-model="activeChildId"
                :children="entity?.children || []"
                @visit-child="setEntity"
            />
        </div>
        <ImageJourney
            class="flex-grow-1"
            :activeChildId="activeChildId"
            :children="childCoordinates"
            :file="selectedFile"
            :lock="true"
            @update-active-child="updateChildCoordinates"
            @select-child="(item) => activeChildId = item.entity_id"
        />
    </div>
</template>

<script setup>

    import { computed, onMounted, ref, watch } from 'vue';
    import ChildSelection from './ChildSelection.vue';
    import ImageJourney from './ImageJourney.vue';
    import ImageSelection from './ImageSelection.vue';

    const linkedFiles = ref([]);
    const childCoordinates = ref([]);
    const selectedFile = ref(null);
    const activeChildId = ref(null);

    async function getJourneyFile() {
        if (entity.value?.id) {
            const url = `multimediatree/journey_file/${entity.value.id}`;
            const response = await SpPS.api.http("get", url);
            selectedFile.value = response?.id ? response : null;
        } else {
            selectedFile.value = null;
        }
    }

    async function getLinkedFiles() {
        if (entity.value?.id) {
            const filters = {
                linked: entity.value?.id,
                filetypes: [{ key: 'image' }, { key: '3d' }],
            };
            const url = `file?filters=${JSON.stringify(filters)}`;
            const response = await SpPS.api.http("get", url);
            linkedFiles.value = response.data;
        } else {
            linkedFiles.value = [];
        }
    }

    const updateSelectedFile = async (imageId) => {
        if (!entity.value?.id) return;

        const url = `multimediatree/journey_file/${entity.value.id}`;
        const response = await SpPS.api.http("put", url, { file_id: imageId });
        selectedFile.value = response?.id ? response : null;
    };

    onMounted(async () => {
        await getJourneyFile();
        await getLinkedFiles();
        await getChildCoordinates();
    }); 

    const setEntity = (childId) => {
        const entity = SpPS.api.store.entityStore.getEntity(childId) ?? null;
        SpPS.api.store.entityStore.set(entity)
    };

    const entity = computed(() => {
        return SpPS.api.store.entityStore.selectedEntity;
    });

    const parent = computed(() => {
        if (!entity.value?.parent) return null;
        return SpPS.api.store.entityStore.getEntity(entity.value.parent);
    });

    watch(entity, async () => {
        await getJourneyFile();
        await getLinkedFiles();
        await getChildCoordinates();
    });


    async function getChildCoordinates() {
        if (entity.value?.id) {
            const url = `multimediatree/coordinates/${entity.value.id}/children`;
            childCoordinates.value = await SpPS.api.http("get", url)
        } else {
            childCoordinates.value = [];
        }
    }

    async function updateChildCoordinates(coordinates) {
        if (!entity.value?.id || !coordinates.entity_id) return;

        const index = childCoordinates.value.findIndex(child => child.entity_id === coordinates.entity_id);

        if (index !== -1) {
            // Update existing child coordinates
            childCoordinates.value[index] = coordinates;
        } else {
            // Add new child coordinates
            childCoordinates.value.push(coordinates);
        }
    }

</script>