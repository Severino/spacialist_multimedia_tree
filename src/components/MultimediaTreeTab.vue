<template>

    <div class="mm-tab h-100 d-flex flex-column">
        <Alert
            v-if="!entity?.id"
            type="info"
            :message="t('prompt.select_entity_for_changes')"
        />
        <template v-else>
            <div class="d-flex">
                <FileSelection
                    class="mb-2 flex-grow-1"
                    :locked="fileLocked"
                    :files="linkedFiles"
                    :selectedId="selectedFile?.id ?? null"
                    @toggle-locked="toggleLocked"
                    @update:selected="updateSelectedFile"
                />
            </div>
            <div class="flex-grow-1 position-relative">
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
                <div
                    class="bg-white rounded m-2 p-2 position-absolute top-0 start-0"
                    style="width: 250px; max-height: 400px; overflow-y: auto;"
                >
                    <ChildSelection
                        v-model="activeChildId"
                        :children="childEntities"
                        @visit-child="setEntity"
                    />
                </div>
            </div>

            <div class="fw-bold text-danger">
                Error: {{ error }}
            </div>
        </template>
    </div>
</template>

<script setup>

    import { computed, onActivated, onMounted, ref, watch } from 'vue';
    import { Alert } from "dhc-components";
    import ChildSelection from './ChildSelection.vue';
    import FileJourney from './FileJourney.vue';
    import FileSelection from './FileSelection.vue';
    import { t } from '../utils/plugin';

    const error = ref('');
    const linkedFiles = ref([]);
    const fileLocked = ref(false);
    const childCoordinates = ref([]);
    const selectedFile = ref(null);
    const activeChildId = ref(null);

    async function getJourneyFile() {
        activeChildId.value = null;
        if (entity.value?.id) {
            const url = `multimediatree/journey_file/${entity.value.id}`;
            const response = await SpPS.api.http("get", url);
            selectedFile.value = response?.file?.id ? response.file : null;
            fileLocked.value = response?.locked ?? false;
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

        const operation = imageId === null ? "delete" : "put";

        const url = `multimediatree/journey_file/${entity.value.id}`;
        const response = await SpPS.api.http(operation, url, { file_id: imageId });
        selectedFile.value = response?.file ? response.file : null;
    };

    const updateEntityChildren = async () => {
        if (entity.value?.id) {
            await SpPS.api.store.entityStore.fetchChildren(entity.value.id);
        }
    };

    const toggleLocked = async () => {
        if (!entity.value?.id) return;

        const url = `multimediatree/journey_file/${entity.value.id}/lock`;
        const response = await SpPS.api.http("put", url, { locked: !fileLocked.value });
        fileLocked.value = response?.locked ?? fileLocked.value;
    };

    async function update() {
        await updateEntityChildren();
        await getJourneyFile();
        await getLinkedFiles();
        await getChildCoordinates();
    }

    onMounted(async () => {
        await update();
    });

    onActivated(async (to, from, next) => {
        await update();
        next();
    });

    const setEntity = (childId) => {
        const entity = SpPS.api.store.entityStore.getEntity(childId) ?? null;
        SpPS.api.store.entityStore.set(entity)
    };

    const entity = computed(() => {
        return SpPS.api.store.entityStore.selectedEntity;
    });

    /** Update the data everytime the selected entity changes. */
    watch(entity, async () => {
        await update();
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

        error.value = '';

        try {
            coordinates.parent_id = entity.value.id;
            await SpPS.api.http("put", `multimediatree/coordinates/${coordinates.entity_id}`, coordinates);

            const index = childCoordinates.value.findIndex(child => child.entity_id === coordinates.entity_id);
            if (index !== -1) {
                // Update existing child coordinates
                childCoordinates.value[index] = coordinates;

            } else {
                // Add new child coordinates
                childCoordinates.value.push(coordinates);
            }
        } catch (err) {
            let catchError = 'An unexpected error occurred while updating child coordinates.';
            if (err.response?.data?.message) {
                catchError = err.response.data.message;
            }

            error.value = 'Failed to update child coordinates: ' + catchError;
        }
    }

    const childEntities = computed(() => {
        if (!entity.value?.children) return [];
        return entity?.value.children || []
    });

</script>