import Color from "color";

/**
 * This is the basic "style sheet" for drawing the points in the viewers.
 * In the future this can be modified and everything is already in one place. 
 * For now, it is just a collection of constants and getter functions.
 */

const yellow = Color.rgb(248, 248, 248);
const red = Color.rgb(0, 89, 255);
const black = Color.rgb(0,0,0);
const white = Color.rgb(255,255,255);

// ======= STROKE ======
const strokeWidth = 1;
const strokeColor = black;

// ======= TEXT ======
const textColor = black;
const textStrokeColor = white;

// ======= FILL ======
const fillColor = yellow;
const activeFillColor = red;

export const getActiveFillColor = () => activeFillColor;
export const getFillColor = () => fillColor;

export const getStrokeColor = () => strokeColor;
export const getStrokeWidth = () => strokeWidth; 

export const getTextColor = () => textColor; 
export const getTextStrokeColor = () => textStrokeColor;