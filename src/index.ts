import { scriptLoader, fontLoader, cssLoader } from './loader';

export {
    parseToClassMap,
    addClass,
    removeClass,
    hasClass,
} from './dom/class';

export {
    getClipboardData
} from './dom/clipboard';

export {
    isInDocument,
    waitingForAppendToDocument,
    createElement,
    createDocumentFragment,
    getInnerText,
    setInnerText,
    appendInnerText,
    insert,
    insertAt,
    insertBefore,
    insertAfter,
    nextChild,
    nextNode,
    findParent,
    childAt,
    childIndex,
    removeMe,
    children,
    eachChildren,
    countChildren,
    countChildNodes,
    findMetaElement,
    createSvgIcon,
    getSvgIconTemplate,
    getCursorRange,
    getCursorSelection,
    setCursorSelection,
    replaceCursorTextRange,
    replaceCursorText,
} from './dom/element';

export {
    addEventListener
} from './dom/event';

export {
    fullscreen
} from './dom/fullscreen';

export {
    getScrollbarWidth,
    getMaxHeight,
    getClientWidth,
    getClientHeight,
    getClientSize,
    getScrollSize,
    MAGIC_NUMBER,
    measureTextHeight,
    measureText,
    suggestTextSize,
    positionText,
    getPixel,
    getDPI,
    px2mm,
    mm2px,
    pt2px,
    px2pt,
    getPaperPixelSize,
} from './dom/measure';

export {
    originScrollTop,
    stopScrolling,
    scrollToDom,
    naturalScrolling,
} from './dom/scroll';

export {
    simulatedDownload,
    simulateMouseEvent,
} from './dom/simulate';

export {
    css3Supported,
    prop2CssProp,
    cssProp2Prop,
    value2CssValue,
    composeCSSFont,
    parseToStylesheet,
    parseToStyleObject,
    parseToCss,
    appendCSSTag,
    appendCSSTagOnce,
    replaceCSSString,
    getFontSize,
    composeFontString,
    composeBorderString,
    composeTextShadow,
} from './dom/style';

export {
    transformScale
} from './dom/transform';

export {
    detectDeviceInfo,
    setStatusBarColor,
} from './device';
export {
    fontLoader,
    ScriptLoader,
    scriptLoader,
    cssLoader,
} from './loader';

const escapeRegExp = /[\"\'\&\<\>]/;
const escapeChars = {
    '<': '&lt',
    '>': '&gt',
    "'": '&#39',
    '"': '&quot',
    '&': '&amp',
}
export function escape(v: string): string {
    if (typeof v !== 'string') return v;
    let str = '' + v;
    const match = escapeRegExp.exec(str)
    if (!match) {
        return str;
    }
    let escape, char, html = '', index = 0, lastIndex = 0;
    for (index = match.index; index < str.length; index++) {
        char = str.charAt(index);
        if (char in escapeChars) {
            escape = escapeChars[char]
            if (lastIndex !== index) {
                html += str.substring(lastIndex, index)
            }
            lastIndex = index + 1
            html += escape
        }
    }
    return lastIndex !== index ? html + str.substring(lastIndex, index) : html
}

export function loadScript(url: string): Promise<void> {
    return scriptLoader.load(url);
}
export function loadCSS(url: string): Promise<void> {
    return cssLoader.load(url);
}
export function loadFonts(...names): Promise<any> {
    return Promise.all(names.map(name => fontLoader.load(name)));
}