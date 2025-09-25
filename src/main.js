/**
 * This is an example of how you add the various elements to 
 * your plugin. Just delete this and start from scratch.
 */

import ImageJourney from './components/ImageJourney.vue';

import * as en from './i18n/en.json';
import * as de from './i18n/de.json';

const id = 'template';
const of = id;

SpPS.register({
    id,
    i18n: {
        en: { [id]: en.default },
        de: { [id]: de.default },
    }
});

SpPS.intoSlot({
    of,
    key: 'template',
    slot: 'tab',
    icon: 'fa-folder',
    label: 'template',
    component: ImageJourney,
    componentTag: 'tmp',
    props: {
        title: 'Template #1',
    }
});