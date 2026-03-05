import { mockCoordinates } from "./mock_coordinates";
import { Church1, mockFilesMap } from "./mock_files";
import { entityMap, mockStores } from "./mock_stores";

function parseGetParams(url) {
    const [base_url, params] = url.split('?')
    let query = {};
    params.split('&').forEach(param => {
        const [key, value] = param.split('=');
        query[key] = value;
    });
    return { base_url, query };
}

export const mockRoutes = {
    http(method, url, data) {
        if (url.startsWith('file')) {
            const { base_url, query } = parseGetParams(url);
            if (base_url === 'file') {
                const filters = JSON.parse(query.filters);

                if (!filters.linked) return { data: [] };

                const data = mockStores?.entityStore?.getEntity(filters.linked)?.linkedFiles || []

                return {
                    data,
                }
            }
        }

        if (url.startsWith('multimediatree/coordinates')) {
            const entityId = url.split('/')[2];
            if (method === 'get') {

                const entity = entityMap[entityId];
                const childCoordinates = [];


                entity.children.forEach(child => {

                    let coordinates = null;
                    const storedCoordinates = localStorage.getItem(`multimediatree/coordinates/${child.id}`) // Store the coordinates for this child
                    if (storedCoordinates) {
                        coordinates = JSON.parse(storedCoordinates);
                    } else {
                        return;
                    }

                    childCoordinates.push({
                        entity_id: child.id,
                        name: child.name,
                        ...coordinates
                    });
                });


                return childCoordinates;
            }

            if (method === 'put') {
                localStorage.setItem(`multimediatree/coordinates/${entityId}`, JSON.stringify(data));
                console.log(`Stored coordinates for entity ${entityId}:`, data);
                return null;
            }
        }

        if (url.startsWith('multimediatree/journey_file')) {
            const id = url.split('/')[2];

            if (method === 'put') {
                const file_id = data?.file_id;
                if (file_id) {
                    localStorage.setItem(`multimediatree/journey_file/${id}`, file_id);

                    if (!mockFilesMap[file_id]) {
                        console.error(`File with ID ${file_id} not found in mock files.`);
                    }

                } else {
                    localStorage.removeItem(`multimediatree/journey_file/${id}`);
                }

                return mockFilesMap[file_id] || null; // Ensure there's a file for this ID
            }

            if (method === 'get') {
                const file_id = localStorage.getItem(`multimediatree/journey_file/${id}`) || null;
                return mockFilesMap[file_id] || null; // Ensure there's a file for this ID
            }
        }

        console.error(`Route ${url} not found in mock routes.`);
        return null;
    }
}