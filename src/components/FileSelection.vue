<template>
    <div
        class="w-100 border border-2 border-dark-subtle rounded p-2 pt-0"
        :class="{ 'opacity-50': locked }"
    >
        <header class="d-flex pt-1 justify-content-between align-items-center">
            <b class="text-dark-emphasis">Linked Files {{ selectedId }}</b>
            <div
                class="btn btn-sm btn-secondary-outline"
                @click="() => emit('toggle-locked', !locked)"
            >
                <FontAwesomeIcon
                    v-if="locked"
                    :icon="faLock"
                />
                <FontAwesomeIcon
                    v-else
                    :icon="faUnlock"
                />
            </div>
        </header>

        <div
            v-if="!locked"
            class="d-flex gap-2 overflow-x-auto p-2 w-100"
        >
            <input
                name="mmt-file-selection"
                id="none"
                type="radio"
                value=""
                :checked="isSelected(null)"
                @change="(event) => emit('update:selected', null)"
            >
            <label
                class="d-flex align-items-center justify-content-center file-select"
                :class="{ 'file-select-active': isSelected(null) }"
                for="none"
            >None</label>
            <template
                v-for="(file, index) in files"
                :key="index"
            >
                <input
                    name="mmt-file-selection"
                    :id="'file-' + index"
                    type="radio"
                    :value="file.id"
                    :checked="isSelected(file.id)"
                    @change="(event) => emit('update:selected', event.target.value)"
                >
                <label
                    class="d-block file-select"
                    :class="{ 'file-select-active': isSelected(file.id) }"
                    :for="'file-' + index"
                >
                    <img
                        v-if="file.category === 'image'"
                        :src="file.url"
                        alt="Image Thumbnail"
                        style="object-fit: cover;"
                    >
                    <div
                        v-else-if="file.category === '3d'"
                        class="d-flex flex-column align-items-center justify-content-center p-2 overflow-hidden"
                        style="width: 100%; height: 100%; background-color: #eee; font-weight: bold;"
                    >

                        <FontAwesomeIcon
                            :icon="faCube"
                            size="2x"
                            class="mb-2"
                        />
                        <span class="file-name-3d text-break w-100 text-center">{{ file.name ?? "N / A" }}</span>
                    </div>
                </label>
            </template>

        </div>
    </div>
</template>

<script setup>
    import { faCube, faLock, faUnlock } from '@fortawesome/free-solid-svg-icons';
    import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

    const props = defineProps({
        files: {
            type: Array,
            required: true,
        },
        locked: {
            type: Boolean,
            required: true,
        },
        selectedId: {
            type: [Number, null],
            required: true,
        },
    });

    const emit = defineEmits(['update:selected', 'toggle-locked']);

    const isSelected = function (id) {
        return props.selectedId === id;
    };

</script>

<style scoped>

    input[type="radio"] {
        display: none;
    }

    .file-name-3d {
        font-size: 0.75rem;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .file-select {
        cursor: pointer;
        user-select: none;
        border: 2px solid gray;
        border-radius: 4px;
        overflow: hidden;
        box-sizing: border-box;

        height: 128px;
        width: 128px;
        flex-shrink: 0;
        transform: scale(1);

        transition: all 0.2s ease;
    }

    .file-select img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .file-select-active {
        border-color: blue;
        transform: scale(1.05);
    }

</style>