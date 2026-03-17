export const t = (key, global = false) => {
    if(!global) {
        key = `plugin.multimedia-tree.${key}`;
    }

    if(!SpPS?.data?.t) {
        console.error("Translation not mounted at SpPS.data.t");
        return key;
    }

    console.log(key);
    return SpPS.data.t(key);
}