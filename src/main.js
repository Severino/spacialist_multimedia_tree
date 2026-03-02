/**
 * This is an example of how you add the various elements to 
 * your plugin. Just delete this and start from scratch.
 */

import ImageJourney from './components/ImageJourney.vue';

import * as en from './i18n/en.json';
import * as de from './i18n/de.json';

const id = 'multimedia-tree';
const of = id;

console.log("MultimediaTree plugin loaded");

SpPS.register({
    id,
    i18n: {
        en: { [id]: en.default },
        de: { [id]: de.default },
    }
});

SpPS.intoSlot({
    of,
    key: 'multimedia-tree',
    slot: 'tab',
    icon: 'fa-location-dot',
    label: 'multimedia-tree',
    component: ImageJourney,
    componentTag: 'MultimediaTreeTab',
    props: {
        title: 'Multimedia Tree',
    }
});