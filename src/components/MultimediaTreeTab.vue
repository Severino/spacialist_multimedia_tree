<template>
    <div class="mm-tab h-100 d-flex flex-column">
        <header class="mb-4">
            <button
                v-if="parent"
                class="btn btn-sm btn-outline-primary"
                @click="() => setEntity(parent.id)"
                style="width: auto;"
            >
                <FontAwesomeIcon :icon="faArrowUp" />
                {{ parent.name }}
            </button>
            <span
                v-else
                class="fw-bold text-primary"
            >

                <FontAwesomeIcon
                    :icon="faArrowDown"
                    class="me-1"
                />
                TOP
            </span>
        </header>

        <div class="d-flex">
            <ChildSelection
                class="mb-2 me-5 flex-shrink-0"
                v-model="activeChildId"
                :children="childEntities"
                @visit-child="setEntity"
            />
            <FileSelection
                class="mb-2 flex-grow-1"
                :files="linkedFiles"
                :selectedId="selectedFile?.id ?? null"
                @update:selected="updateSelectedFile"
            />

        </div>
        <FileJourney
            class="flex-grow-1"
            :activeChildId="activeChildId"
            :child-coordinates="childCoordinates"
            :child-entities="childEntities"
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
    import FileJourney from './FileJourney.vue';
    import FileSelection from './FileSelection.vue';
    import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
    import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';

    const linkedFiles = ref([]);
    const childCoordinates = ref([]);
    const selectedFile = ref(null);
    const activeChildId = ref(null);

    async function getJourneyFile() {
        activeChildId.value = null;
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

        await SpPS.api.http("put", `multimediatree/coordinates/${coordinates.entity_id}`, coordinates);
    }

    const childEntities = computed(() => {
        if (!entity.value?.children) return [];
        return entity?.value.children || []
    });

</script>