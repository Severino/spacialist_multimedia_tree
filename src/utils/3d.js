import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { Mesh, MeshStandardMaterial } from 'three/src/Three.Core.js';

// TODO:: The File Plugin does have a utility to load 3D models.
//        When it exposes said functionality we should use that instead.[SO] 
export const univeralLoader = async (url, progressRef) => {
    let loader = null
    const extension = url.split('.').pop().toLowerCase();
    switch (extension) {
        case 'fbx':
            loader = new FBXLoader();
            break;
        case 'gltf':
        case 'glb':
            loader = new GLTFLoader();
            break;
        case 'obj':
            loader = new OBJLoader();
            break;
        case 'stl':
            loader = new STLLoader();
            break;
        default:
            throw new Error('Unsupported 3D model format: ' + extension);

    }

    let model = await loader.loadAsync(
        url,
        (prog) => progressRef.value = Math.floor(prog.loaded / prog.total * 100)
    );

    console.log('Loaded model:', model);

    if (model.isBufferGeometry) {
        // STLLoader returns a geometry, we need to convert it to a mesh
        const material = new MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.5,
            metalness: 0.1
        });
        model = new Mesh(model, material);
    }

    if (extension === 'gltf' || extension === 'glb') {
        return model.scene;
    } else {
        return model;
    }
}