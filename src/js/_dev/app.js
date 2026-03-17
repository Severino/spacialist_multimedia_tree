

import App from '../../App.vue';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Import Bootstrap JS

import '../../main.css';

import { createApp } from 'vue';
import { createPluginPolyfill } from './plugin-polyfill';
import { createPinia } from 'pinia';
import router from './router';
import { createI18n } from 'vue-i18n';
const i18n = createI18n({
    locale: 'en',
    messages: {
        en: {},
        de: {},
    }
})
window.i18n = i18n;


setTimeout(() => {
    import('../../main.js').then((module) => {
        console.log('SpPS Plugin loaded successfully!');
    }, 1000);
});

createPluginPolyfill();
const app = createApp(App);

app.use(createPinia());



app.use(i18n);

app.use(router);

app.mount('#app');
