<template>
    <div class="child-selection h-100 overflow-auto">
        <b>Active Child Entity</b>
        <ul class="d-flex flex-column gap-1">
            <li>
                <input
                    id="mmt-child-selection-unselected"
                    type="radio"
                    :value="null"
                    v-model="activeChild"
                />
                <label
                    for="mmt-child-selection-unselected"
                    :class="getButtonClassFor(null)"
                >None</label>
            </li>

            <li
                v-for="child in children"
                :key="child.id"
            >
                <input
                    :id="'mmt-child-selection-' + child.id"
                    type="radio"
                    :value="child.id"
                    v-model="activeChild"
                />
                <div class="btn-group w-100">
                    <label
                        :for="'mmt-child-selection-' + child.id"
                        :class="getButtonClassFor(child.id)"
                    >{{ child.name }}</label>
                    <button class="btn btn-outline-secondary flex-grow-0" @click="$emit('visit-child', child.id)">
                        ⭷
                    </button>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup>
    import { ref } from 'vue';

    const activeChild = defineModel();

    const emit = defineEmits(['visit-child']);

    defineProps({
        children: Array,
    });

    const getButtonClassFor = (id) => {
        const classes = [
            'btn',
            'user-select-none',
            'flex-grow-1',
            'text-truncate'
        ]

        if(activeChild.value === id) {
            classes.push('btn-primary');
        } else {
            classes.push('btn-outline-secondary');
        }
        return classes;
    }

</script>

<style scoped>

    ul {
        list-style: none;
        padding-left: 0;
    }

    input[type="radio"] {
        display: none;
    }

</style>