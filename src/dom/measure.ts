import { isDefined, globalLimitedDictionary, globalContext, isBrowser, layout } from 'neurons-utils';
import { parseToCss } from './style';
import { setInnerText, removeMe } from './element';
import { ITextFontStyle, composeFontString, getFontSize } from './style';

const textMeasureCache = globalLimitedDictionary<{ width: number, height: number }>('text_measure_cache');
const canvasTextMeasureCache = globalLimitedDictionary<TextMetrics>('char_measure_cache');
let scrollbarWidth;
export function getScrollbarWidth() {
    if (isDefined(scrollbarWidth)) {
        return scrollbarWidth;
    }
    const oP = document.createElement('p'), styles = {
        width: '100px',
        height: '100px',
        overflowY: 'scroll',
    };
    Object.assign(oP.style, styles);
    document.body.appendChild(oP);
    scrollbarWidth = oP.offsetWidth - oP.clientWidth;
    oP.remove();
    return scrollbarWidth;
}

/**
 * @deprecated
 */
export function getMaxHeight(dom: HTMLElement) {
    if (dom.style.height) return parseInt(dom.style.height);
    const stl = document.defaultView.getComputedStyle(dom);
    let maxHeight = stl['maxHeight'];
    if (maxHeight && maxHeight.indexOf('%') !== -1) {
        return parseInt(stl['height'], 10);
    } else {
        return parseInt(maxHeight, 10);
    }
}

export function getSuggestSize(dom: HTMLElement) {
    let width, height;
    const clientSize = dom.getBoundingClientRect();
    // 检查是否设置了最大尺寸
    const stl = document.defaultView.getComputedStyle(dom);
    const stlMaxWidth = stl['maxWidth'];
    const stlMaxHeight = stl['maxHeight'];
    if (!stlMaxWidth || stlMaxWidth === 'none') {
        width = clientSize.width || NaN;
    } else if (stlMaxWidth.indexOf('%') !== -1) {
        width = clientSize.width;
    } else {
        width = clientSize.width || parseInt(stlMaxWidth, 10);
    }
    if (!stlMaxHeight || stlMaxHeight === 'none') {
        height = clientSize.height || NaN;
    } else if (stlMaxHeight.indexOf('%') !== -1) {
        height = clientSize.height;
    } else {
        height = clientSize.height || parseInt(stlMaxHeight, 10);
    }
    return {width: width, height: height};
}

export function getClientWidth(dom) {
    return dom.clientWidth;
    // const stl = document.defaultView.getComputedStyle(dom);
    // tslint:disable-next-line:no-bitwise
    // return (dom['clientWidth'] || parseInt(stl['width'], 10) || parseInt(dom.style['width'], 10)) - (parseInt(stl['paddingLeft'], 10) || 0) - (parseInt(stl['paddingRight'], 10) || 0) | 0;
}
export function getClientHeight(dom) {
    return dom.clientHeight;
    // const stl = document.defaultView.getComputedStyle(dom);
    // tslint:disable-next-line:no-bitwise
    // return (dom['clientHeight'] || parseInt(stl['height'], 10) || parseInt(dom.style['height'], 10)) - (parseInt(stl['paddingTop'], 10) || 0) - (parseInt(stl['paddingBottom'], 10) || 0) | 0;
}
export function getClientSize(dom) {
    return {
        width: dom.clientWidth,
        height: dom.clientHeight
    }
}
export function getScrollSize(dom) {
    return {
        width: dom.scrollWidth,
        height: dom.scrollHeight
    }
}

const resetCSS = function (dom, prop) {
    const old = {};
    for (const i in prop) {
        old[i] = dom.style[i];
        dom.style[i] = prop[i];
    }
    return old;
};
const restoreCSS = function (dom, prop) {
    for (const i in prop) {
        dom.style[i] = prop[i];
    }
};
function cssWidth(dom) {
    if (dom.style.width) { return dom.style.width; }
    if (dom.currentStyle) { return dom.currentStyle.width; }
    if (document.defaultView && document.defaultView.getComputedStyle) {
        return document.defaultView.getComputedStyle(dom, '').getPropertyValue('width');
    }
}
function cssHeight(dom) {
    if (dom.style.height) { return dom.style.height; }
    if (dom.currentStyle) { return dom.currentStyle.height; }
    if (document.defaultView && document.defaultView.getComputedStyle) {
        return document.defaultView.getComputedStyle(dom, '').getPropertyValue('height');
    }
}
function size(dom) {
    if (typeof window === 'undefined') {
        return { width: 0, height: 0 };
    }
    if (window.getComputedStyle && window.getComputedStyle(dom).display !== 'none') {
        return {
            width: dom.offsetWidth,
            height: dom.offsetHeight
        } || {
                width: cssWidth(dom),
                height: cssHeight(dom)
            };
    }
    const old = resetCSS(dom, {
        display: '',
        visibility: 'hidden',
        position: 'absolute'
    });
    const result = {
        width: dom.clientWidth,
        height: dom.clientHeight
    } || {
            width: cssWidth(dom),
            height: cssHeight(dom)
        };
    restoreCSS(dom, old);
    return result;
}

// 通过字号粗略计算字体高度的魔法数值
export const MAGIC_NUMBER = 0.24;
/**
 * Measures text height。这是一个粗略的方法，但速度会比measureText快
 * @author AK
 * @param style 
 */
export function measureTextHeight(fontFamily: string, fontSize: number | string, fontWeight: string, fontStyle: string) {
    const size = measureText('国', {
        fontFamily: fontFamily,
        fontSize: fontSize,
        fontWeight: fontWeight,
        fontStyle: fontStyle,
    });
    return size.height;
}
/**
 * 指定文字的大小。
 **/
export function measureText(str, css, className?) {
    if (!str) {
        return { width: 0, height: 0 };
    }
    css = css || '';
    if (typeof css !== 'string') {
        let prop, cssStr = '';
        for (prop in css) {
            cssStr += parseToCss(prop, css[prop]);
        }
        css = cssStr;
    }
    const key = `${str}_${css}_${className || ''}`;
    let s = textMeasureCache.get(key);
    if (s) return s;
    const spanId = 'sjg-measure-string-size';
    let span = document.getElementById(spanId);
    if (!span) {
        span = document.createElement('span');
        span.setAttribute('id', spanId);
        document.body.appendChild(span);
    }
    setInnerText(span, str);
    span.setAttribute('style', css);
    span.style.visibility = 'hidden';
    span.style.whiteSpace = 'nowrap';
    if (className) {
        span.className = className;
    }
    s = size(span);
    span.style.display = 'none';
    span.className = '';
    textMeasureCache.set(key, s);
    return s;
}

let canvasSupported = false;
try {
    globalContext.document.createElement("canvas").getContext("2d");
    canvasSupported = true;
} catch(error) {
    canvasSupported = false;
}
let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
function measureTextWidth(text, style: ITextFontStyle): number {
    if (!canvasSupported) return measureText(text, style).width;
    const font = composeFontString(style);
    if (!font) return 0;
    const key = `${text}_${font}`;
    const cache = canvasTextMeasureCache.get(key);
    if (cache) return cache.width;
    if (!canvas) {
        canvas = globalContext.document.createElement('canvas');
        context = canvas.getContext('2d')
    }
    context.font = font;
    const measure = context.measureText(text);
    canvasTextMeasureCache.set(key, measure);
    return measure.width;
}
function measureTextCanvas(text, style: ITextFontStyle): {width: number, height: number} {
    const width = measureTextWidth(text, style);
    return {width: width, height: width ? getFontSize(style) : 0};
}

export function suggestTextSize(text: string, style: any, limit?: number): {text: string, width: number, height: number} {
    const result = {text: text, width: 0, height: 0};
    if (!text || (isDefined(limit) && limit <= 0)) return result;
    const measure = measureTextCanvas(text, style);
    if (!limit || measure.width <= limit) {
        return {text: text, width: measure.width, height: measure.height};
    } else {
        // 检查截断
        const length = text.length;
        const percent = limit / measure.width;
        const dotMeasure = measureTextCanvas('.', style);
        const dotSize = dotMeasure.width * 3;
        let i = Math.ceil(length * percent);
        let t = text.substring(0, i);
        let s = measureTextWidth(t, style);
        while (t && s + dotSize > limit) {
            i -= 1;
            t = text.substring(0, i);
            s = measureTextWidth(t, style);
        }
        return {text: `${t}...`, width: s + dotSize, height: measure.height};
    }
}

export type Box = {x: number, y: number, width: number ,height: number};
export type Position = 'top' | 'left' | 'right' | 'bottom' 
    | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' 
    | 'center' | 'inside'
    | 'insideTop' | 'insideBottom' | 'insideLeft' | 'insideRight' 
    | 'insideTopLeft' | 'insideTopRight' | 'insideBottomLeft' | 'insideBottomRight';
export function positionText(text: string, style: any, box: Box, position: Position, distance?: number): {x: number, y: number, width: number, height: number} {
    const textSize = measureTextCanvas(text, style);
    const pos = layout.positionToBox(textSize, box, position as any, distance);
    return {x: pos.x, y: pos.y, width: textSize.width, height: textSize.height};
}


export function getPixel(value: number | string, size: number, defaultValue?: number | string): number {
    if (!isDefined(value) && !isDefined(defaultValue)) return NaN;
    let valueType = typeof value;
    if (!isDefined(value) && isDefined(defaultValue)) {
        value = defaultValue;
        valueType = typeof value;
    } else if (value === '' || (valueType === 'number' && isNaN(value as number))) {
        if (!isDefined(defaultValue)) return NaN;
        value = defaultValue;
        valueType = typeof value;
    }
    if (valueType === 'number') {
        return value as number;
    } else {
        if (value === '') return NaN;
        let sign = 1, str: string = value as string;
        if (str.charAt(0) === '-') {
            sign = -1;
            str = str.substr(1);
        }
        if (str.indexOf('%') !== -1) {
            return sign * size * parseFloat(str) / 100;
        } else if (str.indexOf('mm') !== -1) {
            return sign * mm2px(parseFloat(str));
        } else if (str.indexOf('pt') !== -1) {
            return sign * pt2px(parseFloat(str));
        } else {
            return sign * parseFloat(str);
        }
    }
}
let DPI = null;
export function getDPI(): { X: number, Y: number } {
    if (DPI) return DPI;
    DPI = { X: 0, Y: 0 };
    if (window.screen && window.screen['deviceXDPI']) {
        DPI.X = window.screen['deviceXDPI'];
        DPI.Y = window.screen['deviceYDPI'];
    } else {
        const tmpNode = document.createElement("DIV");
        tmpNode.style.cssText = "width:1in;height:1in;position:absolute;left:0px;top:0px;z-index:99;visibility:hidden";
        document.body.appendChild(tmpNode);
        DPI.X = tmpNode.offsetWidth;
        DPI.Y = tmpNode.offsetHeight;
        removeMe(tmpNode);
    }
    return DPI;
}
export function px2mm(value): number {
    return 25.4 * value / getDPI().X;
}

export function mm2px(value): number {
    return getDPI().X * value / 25.4;
}
export function px2pt(value): number {
    return 72 * value / getDPI().X;
}
export function pt2px(value): number {
    return getDPI().X * value / 72;
}

// A4 (mm); A padding: 48px;
const paperSize = {
    'A0': { width: 841, height: 1189 },
    'A1': { width: 594, height: 841 },
    'A2': { width: 420, height: 594 },
    'A3': { width: 297, height: 420 },
    'A4': { width: 210, height: 297 },
};

export function getPaperPixelSize(paper: string = 'A4'): { width: number; height: number; } {
    const size = paperSize[paper];
    return {
        width: parseInt(mm2px(size.width) as any),
        height: parseInt(mm2px(size.height) as any),
    }
}