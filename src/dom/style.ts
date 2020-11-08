import { isBrowser } from 'neurons-utils';

export type CSSStyleSheet = CSSStyleDeclaration | { [key: string]: any };

const css3DetectDom = (isBrowser && document && typeof document.createElement === 'function') ? document.createElement('div') : null;
const vendors = ['Ms', 'O', 'Moz', 'Webkit'];
export function css3Supported(property) {
    if (!css3DetectDom || !property) return false;
    property = cssProp2Prop(property);
    if (property in css3DetectDom.style) return true;
    property = property.replace(/^[a-z]/, function (val) {
        return val.toUpperCase();
    });
    let len = vendors.length;
    while (len--) {
        const prop = vendors[len] + property;
        if (prop in css3DetectDom.style) {
            return true;
        }
    }
    return false;
};

const cssRegexp = /[A-Z]/g;
export function prop2CssProp(prop) {
    if (!prop) return prop;
    return prop.replace(cssRegexp, k => '-' + k.toLowerCase());
}
const cssPropRegexp = /-[a-z]/g;
export function cssProp2Prop(prop) {
    if (!prop) return prop;
    return prop.replace(cssPropRegexp, k => k.substr(1).toUpperCase());
}
const pixelFunc = (value) => ((typeof value === 'number') ? value + 'px' : value);
const value2css = {
    'width': pixelFunc,
    'height': pixelFunc,
    'minWidth': pixelFunc,
    'minHeight': pixelFunc,
    'maxWidth': pixelFunc,
    'maxHeight': pixelFunc,
    'fontSize': pixelFunc,
    'top': pixelFunc,
    'bottom': pixelFunc,
    'left': pixelFunc,
    'right': pixelFunc,
    'paddingLeft': pixelFunc,
    'paddingTop': pixelFunc,
    'paddingRight': pixelFunc,
    'paddingBottom': pixelFunc,
    'marginLeft': pixelFunc,
    'marginTop': pixelFunc,
    'marginRight': pixelFunc,
    'marginBottom': pixelFunc,
    'lineHeight': pixelFunc,
}
export function value2CssValue(prop, value) {
    return value2css[prop] ? value2css[prop](value) : value;
}

export function parseToStylesheet(obj) {
    obj = obj || {};
    return Object.keys(obj).reduce((p, key) => {
        return `${p}\n${parseToCss(key, obj[key])}`;
    }, '');
}
export function parseToStyleObject(styleString: string) {
    styleString = (styleString || '').trim();
    if (!styleString) return {};
    const result = {};
    styleString.split(';').forEach(str => {
        const array = str.trim().split(':');
        array[0] = (array[0] || '').trim();
        array[1] = (array[1] || '').trim();
        if (array[0] && array[1]) {
            result[cssProp2Prop(array[0])] = array[1];
        }
    });
    return result;
}
export function parseToCss(key, value): string {
    return `${prop2CssProp(key)}: ${value2CssValue(key, value)};`;
}
export function appendCSSTag(cssText, params?) {
    if (document && document.head) {
        const dom = document.createElement('style');
        dom.type = 'text/css';
        dom.innerHTML = cssText;
        params = params || {};
        Object.keys(params).forEach(key => {
            key && dom.setAttribute(key, params[key]);
        })
        document.head.appendChild(dom);
    }
}
const appended = {};
export function appendCSSTagOnce(id, cssText, params?) {
    if (appended[id]) return;
    appended[id] = true;
    appendCSSTag(cssText, params);
}

export interface IHTMLWidgetStyleSheet {
    [className: string]: CSSStyleDeclaration | { [styleName: string]: any };
}

export function replaceCSSString(styleDom, sheets: IHTMLWidgetStyleSheet[], namespace) {
    if (!styleDom || !sheets || !sheets.length) return;
    const content = (sheets || []).map(sheet => {
        return Object.keys(sheet || {}).map(className => {
            const style = sheet[className];
            if (className.indexOf('&') === 0) {
                className = className.substr(1);
                return `${namespace}${className} {\n${parseToStylesheet(style)}\n}`
            } else {
                return `${namespace} ${className} {\n${parseToStylesheet(style)}\n}`
            }
        }).join('\n');
    }).join('\n');
    styleDom.innerHTML = content;
}

export function composeCSSFont(fontFamily: string, fontSize: number, fontWeight: string, fontStyle: string) {
    return `${fontStyle || ''} ${fontWeight || ''} ${fontSize || 0}px ${fontFamily || ''}`;
}

export interface ITextFontStyle {
    fontFamily?: string,
    fontSize?: string,
    fontWeight?: string,
    fontStyle?: string,
    'font-family'?: string,
    'font-size'?: string,
    'font-weight'?: string,
    'font-style'?: string,
}
const fontProperties = ['Style', 'Variant', 'Weight', 'Size', 'Family'];
const fontCSSProperties = ['style', 'variant', 'weight', 'size', 'family'];
const resolution = isBrowser ? (window.devicePixelRatio || 1) : 1;
export function getFontSize(style: ITextFontStyle) {
    const size = parseFloat(style.fontSize);
    return isNaN(size) ? 12 : size;
}
export function composeFontString(style: ITextFontStyle) {
    style = style || {};
    let bits = [],
        size = 0,
        key, v;
    for (let i=0; i<fontProperties.length; ++i) {
        key = fontProperties[i];
        const pk = 'font' + key, ck = 'font-' + fontCSSProperties[i];
        v = pk in style ? style[pk] : ck in style ? style[ck] : null;
        if (v) {
            if (key === 'Size') {
                size = parseFloat(v);
                size = isNaN(size) ? 12 : size;
                v = size + 'px';
            }
            bits.push(v);
        }
    }
    if (size) {
        return bits.join(' ');
    }
    return '';
}
export interface IBorderStyle {
    borderStyle?: string,
    borderWidth?: string,
    borderColor?: string,
    'border-style'?: string,
    'border-width'?: string,
    'border-color'?: string,
}
const borderProperties = ['Style', 'Width', 'Color'];
const borderCSSProperties = ['style', 'width', 'color'];
export function composeBorderString(style: IBorderStyle) {
    style = style || {};
    let bits = [],
        width = 0,
        key, v;
    for (let i=0; i<borderProperties.length; ++i) {
        key = borderProperties[i];
        const pk = 'border' + key, ck = 'border-' + borderCSSProperties[i];
        v = pk in style ? style[pk] : ck in style ? style[ck] : null;
        if (v) {
            if (key === 'Width') {
                width = parseFloat(v);
                width = isNaN(width) ? 0 : width;
                v = width + 'px';
            }
            bits.push(v);
        }
    }
    if (width) {
        return bits.join(' ');
    }
    return '';
}

export interface ITextShadowStyle {
    textShadowColor?: string,
    textShadowOffsetX?: number,
    textShadowOffsetY?: number,
    textShadowBlur?: number,
    'text-shadow-color'?: string,
    'text-shadow-offsetX'?: number,
    'text-shadow-offsetY'?: number,
    'text-shadow-blur'?: number,
}
const textShadowProperties = ['OffsetX', 'OffsetY', 'Blur', 'Color'];
const textShadowCSSProperties = ['offsetX', 'offsetY', 'blur', 'color'];
export function composeTextShadow(style: ITextShadowStyle) {
    style = style || {};
    let bits = [], offsetX = 0, offsetY = 0, blur = 0, key, v;
    for (let i=0; i<textShadowProperties.length; ++i) {
        key = textShadowProperties[i];
        const pk = 'textShadow' + key, ck = 'text-shadow-' + textShadowCSSProperties[i];
        v = pk in style ? style[pk] : ck in style ? style[ck] : null;
        if (v) {
            if (key === 'OffsetX') {
                offsetX = parseFloat(v);
                offsetX = isNaN(offsetX) ? 0 : offsetX;
                v = offsetX + 'px';
            } else if (key === 'OffsetY') {
                offsetY = parseFloat(v);
                offsetY = isNaN(offsetY) ? 0 : offsetY;
                v = offsetY + 'px';
            } else if (key === 'Blur') {
                blur = parseFloat(v);
                blur = isNaN(blur) ? 0 : blur;
                v = blur + 'px';
            }
            bits.push(v);
        }
    }
    if (offsetX || offsetY || blur) {
        return bits.join(' ');
    }
    return '';
}