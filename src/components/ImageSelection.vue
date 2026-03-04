<template>
    <div>
        <b>Linked Images</b>
        <div class="d-flex gap-2">
            <input
                name="mmt-image-selection"
                id="none"
                type="radio"
                value=""
                :checked="isSelected(null)"
                @change="(event) => emit('update:selected', event.target.value)"
            >
            <label
                class="d-flex align-items-center justify-content-center image-select"
                :class="{ 'image-select-active': isSelected(null) }"
                for="none"
                style="width: 256px; height:128px;"
            >None</label>

            <template
                v-for="(image, index) in images"
                :key="index"
            >
                <input
                    name="mmt-image-selection"
                    :id="'image-' + index"
                    type="radio"
                    :value="image.id"
                    :checked="isSelected(image.id)"
                    @change="(event) => emit('update:selected', event.target.value)"
                >
                <label
                    class="image-select"
                    :class="{'image-select-active': isSelected(image.id)}"
                    :for="'image-' + index"
                >
                    <img
                        :src="image.url"
                        alt="Image Thumbnail"
                        style="object-fit: cover;"
                    >
                </label>
            </template>

        </div>
    </div>
</template>

<script setup>

    const props = defineProps({
        images: {
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

    .image-select {
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

    .image-select img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .image-select-active {
        border-color: blue;
        transform: scale(1.05);
    }

</style>