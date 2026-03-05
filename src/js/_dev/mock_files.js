export const Church1 = {
    id: 1,
    name: 'Church 1',
    url: 'https://picsum.photos/id/61/3264/2448.jpg',
    category: 'image',
}

export const Bridge1 = {
    id: 2,
    name: 'Bridge 1',
    url: 'https://picsum.photos/id/43/1280/831.jpg',
    category: 'image',
}

export const Street1 = {
    id: 3,
    name: 'Street 1',
    url: 'https://picsum.photos/id/57/2448/3264.jpg',
    category: 'image',
}

export const Tower1 = {
    id: 4,
    name: 'Tower 1',
    url: 'https://picsum.photos/id/58/1280/853.jpg',
    category: 'image',
}

export const FaulaDeTomas2 = {
    id: 101,
    name: "Fauna de Tomás 2",
    category: '3d',
    url: 'assets/faula_de_tomas_2/scene.gltf',
    license:'CC BY 4.0',
    licenseLink: 'https://creativecommons.org/licenses/by/4.0/',
    originalLink: "https://sketchfab.com/3d-models/neolithic-house-skara-brae-orkney-e9fee2578f634ea1a9c710ac860844c0",
    attribution: 'Model: Lucia Ponce i Mònica Urquizu - Projecte | Text: Museus de Sitges i Joan Ibáñez'
}

export const MortillaDelAzuer = {
    id: 102,
    name: "La Motilla del Azuer",
    category: '3d',
    url: 'assets/la_motilla_del_azuer/scene.gltf',
    license:'CC BY-NC 4.0',
    licenseLink: 'https://creativecommons.org/licenses/by-nc/4.0/',
    originalLink: "https://sketchfab.com/3d-models/la-motilla-del-azuer-daimiel-spain-750c1dc950274be39705545f4a492bd9",
    attribution: 'Avatar of GlobalDigitalHeritage Global Digital Heritage and GDH-Afrik'
}



export const mockFiles = [
    Church1,
    Bridge1,
    Street1,
    Tower1,
    FaulaDeTomas2,
    MortillaDelAzuer
]

export const mockFilesMap = mockFiles.reduce((map, file) => {
    map[file.id] = file;
    return map;
}, {});