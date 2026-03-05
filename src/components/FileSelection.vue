<template>
    <div>
        <b>Linked Files</b>

        <div class="d-flex gap-2">
            <input
                name="mmt-file-selection"
                id="none"
                type="radio"
                value=""
                :checked="isSelected(null)"
                @change="(event) => emit('update:selected', event.target.value)"
            >
            <label
                class="d-flex align-items-center justify-content-center file-select"
                :class="{ 'file-select-active': isSelected(null) }"
                for="none"
                style="width: 256px; height:128px;"
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
                    :class="{'file-select-active': isSelected(file.id)}"
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
                        class="d-flex align-items-center justify-content-center"
                        style="width: 100%; height: 100%; background-color: #eee; font-weight: bold;"
                    >
                    
                    <span>{{ file.name ?? "N / A" }}</span>
                    <br/>
                    <span>3D Model</span>
                    </div>
                </label>
            </template>

        </div>
    </div>
</template>

<script setup>

    const props = defineProps({
        files: {
            type: Array,
            required: true,
        },
        selectedId: {
            type: [Number, null],
            required: true,
        },
    });

    const emit = defineEmits(['update:selected']);

    const isSelected = function (id) {
        return props.selectedId === id;
    };

</script>

<style scoped>

    input[type="radio"] {
        display: none;
    }

    .file-select {
        cursor: pointer;
        user-select: none;
        border: 2px solid gray;
        border-radius: 4px;
        overflow: hidden;
        box-sizing: border-box;

        height: 128px;
        width: 256px;
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