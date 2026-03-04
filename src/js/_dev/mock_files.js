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

export const mockFiles = [
    Church1,
    Bridge1,
    Street1,
    Tower1,
]

export const mockFilesMap = mockFiles.reduce((map, file) => {
    map[file.id] = file;
    return map;
}, {});