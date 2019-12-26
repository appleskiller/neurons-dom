import { isDefined, globalLimitedDictionary } from 'neurons-utils';
import { parseToCss } from './style';
import { setInnerText, removeMe } from './element';

const textMeasureCache = globalLimitedDictionary<{ width: number, height: number }>('text_measure_cache');
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
export function getPixel(value: number | string, size: number, defaultValue?: number | string): number {
    if (!isDefined(value) && !isDefined(defaultValue)) return NaN;
    let valueType = typeof value;
    if (value === '' || (valueType === 'number' && isNaN(value as number))) {
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
export function pt2px(value): number {
    return 72 * value / getDPI().X;
}
export function px2pt(value): number {
    return getDPI().X * value / 72;
}

// A4 (mm); A padding: 48px;
const paperSize = {
    'A4': { width: 210, height: 297 }
};

export function getPaperPixelSize(paper: string = 'A4'): { width: number; height: number; } {
    const size = paperSize[paper];
    return {
        width: parseInt(mm2px(size.width) as any),
        height: parseInt(mm2px(size.height) as any),
    }
}