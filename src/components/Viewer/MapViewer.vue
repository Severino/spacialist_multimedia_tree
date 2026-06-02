<template>
    <div
        id="map"
        style="width: 100%; height: 100%; position: relative;"
    >
    </div>
</template>

<script setup>
    import Map from 'ol/Map';
    import View from 'ol/View';
    import { defaults as defaultInteractions } from 'ol/interaction';
    import TileLayer from 'ol/layer/Tile';
    import XYZ from 'ol/source/XYZ';
    import VectorLayer from 'ol/layer/Vector';
    import VectorSource from 'ol/source/Vector';
    import Feature from 'ol/Feature';
    import Point from 'ol/geom/Point';
    import { Style, Fill, Stroke, Circle as StyleCircle, Text } from 'ol/style';

    import { nextTick, onMounted, watch } from 'vue';
    import { getActiveFillColor, getFillColor, getStrokeColor, getStrokeWidth, getTextStrokeColor, getTextColor } from '../../utils/styler';

    const props = defineProps({
        activeChildId: Number,
        childEntitiesMap: Object,
        childCoordinates: Array,
    });

    let map = null;
    let vectorLayer = null;
    // single persistent source used by the layer
    const vectorSource = new VectorSource();

    const emit = defineEmits(['item-clicked', 'update-active-child']);

    watch(() => props.childCoordinates, () => updateMarkers(), { deep: true });
    watch(() => props.activeChildId, () => updateMarkers());

    function updateMarkers() {
        if (!map) return;
        vectorSource.clear(true);

        const coords = props.childCoordinates || [];
        coords.forEach(c => {
            if (!c) return;
            const center = Array.isArray(c) ? c : [c.x, c.y];
            const feat = new Feature(new Point(center));
            feat.set('entity_id', c.entity_id ?? null);
            feat.set('child', c);

            const fillColor = (c.entity_id === props.activeChildId) ? getActiveFillColor(c.entity_id) : getFillColor(c.entity_id);
            feat.setStyle(new Style({
                image: new StyleCircle({
                    radius: 8, fill: new Fill({ color: fillColor.rgb().string() }),
                    stroke: new Stroke({ color: getStrokeColor(c.entity_id).rgb().string(), width: getStrokeWidth() })
                }),
                text: new Text({
                    text: props.childEntitiesMap[c.entity_id]?.name ?? 'N/A',
                    offsetY: -16,
                    fill: new Fill({ color: getTextColor().rgb().string() }),
                    stroke: new Stroke({ color: getTextStrokeColor().rgb().string(), width: 3 }),
                    font: 'bold 12px sans-serif',
                })
            }));
            vectorSource.addFeature(feat);
        });
    }

    function fitViewToMarkers(instant = false) {
        if (!map) return;
        const features = vectorSource.getFeatures();
        if (features.length === 0) return;

        const extent = vectorSource.getExtent();
        map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 16, duration: instant ? 0 : 300 });
    }

    onMounted(() => {
        map = new Map({
            target: 'map',
            layers: [
                new TileLayer({
                    source: new XYZ({
                        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        attributions: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors CC-BY-SA'
                    })
                })
            ],
            interactions: defaultInteractions({
                doubleClickZoom: false,
            }),
            controls: [],
            view: new View({
                center: [0, 0],
                zoom: 2
            })
        });
        window.omap = map;

        requestAnimationFrame(() => {
            fitViewToMarkers();
        });

        // create and add a single persistent vector layer
        vectorLayer = new VectorLayer({ source: vectorSource, zIndex: 9999 });
        map.addLayer(vectorLayer);

        updateMarkers();

        map.on('click', function (event) {
            const clickedFeature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
            if (event.originalEvent.ctrlKey) {
                if (props.activeChildId) {
                    const coordinate = event.coordinate;
                    const emitObject = { entity_id: props.activeChildId, x: coordinate[0], y: coordinate[1], z: 0 };
                    emit('update-active-child', emitObject);
                }
            } else {
                if (clickedFeature) {
                    const child = clickedFeature.get('child');
                    const entityId = clickedFeature.get('entity_id');

                    if (event.originalEvent.altKey) {
                        emit('navigate-to-child', child);
                    } else {
                        emit('item-clicked', child);
                    }
                }
            }

        });
    });
</script>