import Color from "color";


const fill = Color.rgb(255, 255, 0);
const activeFill = Color.rgb(255, 0, 0);
const stroke = Color.rgb(0,0,0);
const strokeWidth = 1;

export function getActiveFillColor(entity_id = null) {
    return activeFill;
}

export function getFillColor(entity_id = null) {
    return fill;
}

export function getStrokeColor(entity_id = null) {
    return stroke;
}

export function getStrokeWidth(entity_id = null) {
    return strokeWidth;
}