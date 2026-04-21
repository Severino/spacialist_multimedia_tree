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
    import TileLayer from 'ol/layer/Tile';
    import XYZ from 'ol/source/XYZ';
    import VectorLayer from 'ol/layer/Vector';
    import VectorSource from 'ol/source/Vector';
    import Feature from 'ol/Feature';
    import Point from 'ol/geom/Point';
    import { Style, Fill, Stroke, Circle as StyleCircle } from 'ol/style';

    import { nextTick, onMounted, watch } from 'vue';
    import { getActiveFillColor, getFillColor, getStrokeColor, getStrokeWidth } from '../../utils/styler';

    const props = defineProps({
        activeChildId: Number,
        childEntities: Array,
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

            const fillColor = (c.entity_id === props.activeChildId) ? getActiveFillColor(c.entity_id) : getFillColor(c.entity_id);
            feat.setStyle(new Style({
                image: new StyleCircle({
                    radius: 8, fill: new Fill({ color: fillColor.rgb().string() }),
                    stroke: new Stroke({ color: getStrokeColor(c.entity_id).rgb().string(), width: getStrokeWidth() })
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
                        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                    })
                })
            ],
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

        map.on('click', function (evt) {
            if (!evt.originalEvent.ctrlKey || !props.activeChildId) return;
            const coordinate = evt.coordinate;
            const emitObject = { entity_id: props.activeChildId, x: coordinate[0], y: coordinate[1] };
            console.log('Map clicked at coordinate:', emitObject);
            // emit to parent (parent may persist and return via props)
            emit('update-active-child', emitObject);

            // also add immediate local marker for UX
            const feat = new Feature(new Point([emitObject.x, emitObject.y]));
            feat.setStyle(new Style({ image: new StyleCircle({ radius: 8, fill: new Fill({ color: 'rgba(255,0,0,0.9)' }), stroke: new Stroke({ color: '#fff', width: 1 }) }) }));
            vectorSource.addFeature(feat);
        });
    });
</script>