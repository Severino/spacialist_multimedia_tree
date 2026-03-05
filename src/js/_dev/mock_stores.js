import { reactive } from "vue"
import { Church1, FaulaDeTomas2, MortillaDelAzuer, Street1, Tower1 } from "./mock_files"

export const london = {
    id: 11,
    name: 'London',
    children: [],
    parent: 1,
    linkedFiles: []
}

export const manchester = {
    id: 12,
    name: 'Manchester',
    children: [],
    parent: 1,
    linkedFiles: [FaulaDeTomas2]
}

export const england = {
    id: 1,
    name: 'England',
    children: [london, manchester],
    parent: 10,
    linkedFiles: [FaulaDeTomas2, MortillaDelAzuer]
}

export const berlin = {
    id: 21,
    name: 'Berlin',
    children: [],
    parent: 2,
}

export const munich = {
    id: 22,
    name: 'Munich',
    children: [],
    parent: 2,
}

export const hamburg = {
    id: 23,
    name: 'Hamburg',
    children: [],
    parent: 2,
}

export const germany = {
    id: 2,
    name: 'Germany',
    children: [berlin, munich, hamburg],
    parent: 10,
    linkedFiles: [
        Street1,
        Tower1,
    ]
}

export const paris = {
    id: 31,
    name: 'Paris',
    children: [],
    parent: 3,
}

export const lyon = {
    id: 32,
    name: 'Lyon',
    children: [],
    parent: 3,
}

export const marseille = {
    id: 33,
    name: 'Marseille',
    children: [],
    parent: 3,
}

export const france = {
    id: 3,
    name: 'France',
    children: [lyon, paris, marseille],
    parent: 10,
}


export const europe = {
    id: 10,
    name: 'Europe',
    children: [
        england,
        germany,
        france,
    ],
    linkedFiles: [Church1],
}

export const entities = [
    london,
    manchester,
    england,
    berlin,
    munich,
    hamburg,
    germany,
    paris,
    lyon,
    marseille,
    france,
    europe,
]

export const entityMap = entities.reduce((map, entity) => {
    map[entity.id] = entity;
    return map;
}, {});

export const mockStores = {
    entityStore: reactive({
        selectedEntity: localStorage.getItem('selectedEntity') ? JSON.parse(localStorage.getItem('selectedEntity')) : europe,
        getEntity(id) {
            return entityMap[id] || null;
        },
        set(entity) {
            this.selectedEntity = entity;
            localStorage.setItem('selectedEntity', JSON.stringify(entity));
        }
    }),

}