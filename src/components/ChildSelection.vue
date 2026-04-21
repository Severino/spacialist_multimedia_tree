<template>
    <div class="child-selection h-100 overflow-auto">
        <header class="d-flex justify-content-between mb-2">
            <b class="mb-1">Active Child Entity</b>
            <button
                v-if="hasParent"
                @click="emit('visit-parent')"
                class="btn btn-sm btn-outline-secondary"
            >
                ↑
            </button>
        </header>
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
                    class="w-100"
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
                    <button
                        class="btn btn-outline-secondary flex-grow-0"
                        @click="$emit('visit-child', child.id)"
                    >
                        ⭷
                    </button>
                </div>
            </li>
        </ul>
    </div>
    <footer
        class="text-muted"
        style="font-size: 0.75rem;"
    >
        <table>
            <tbody>
                <tr>
                    <td class="text-end">[ Click ]</td>
                    <td>Set element active</td>
                </tr>
                <tr>
                    <td class="text-end">[ Ctrl + Click ]</td>
                    <td>Set new position</td>
                </tr>
                <tr>
                    <td class="text-end">[ Alt + Click ]</td>
                    <td>Open entity</td>
                </tr>
            </tbody>             
        </table>
    </footer>
</template>

<script setup>
    import { ref } from 'vue';

    const activeChild = defineModel();

    const emit = defineEmits(['visit-child', 'visit-parent']);

    defineProps({
        children: Array,
        hasParent: Boolean,
    });

    const getButtonClassFor = (id) => {
        const classes = [
            'btn',
            'user-select-none',
            'flex-grow-1',
            'text-truncate'
        ]

        if (activeChild.value === id) {
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