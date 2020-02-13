import { isBrowser } from 'neurons-utils';
import { appendCSSTag, CSSStyleSheet } from './style';

export function isInDocument(node: Element): boolean {
    if (!isBrowser || !document) return true;
    if (!node) return false;
    return (node === document.body || document.body.contains(node));
}

export function waitingForAppendToDocument(dom: Element, timeout = 1000): Promise<void> {
    if (isInDocument(dom)) return Promise.resolve();
    return new Promise((resolve, reject) => {
        let timeID, startTime = (new Date()).getTime();
        const test = (delay = 0) => {
            clearTimeout(timeID);
            timeID = setTimeout(() => {
                if ((new Date()).getTime() - startTime > timeout) {
                    reject(new Error('Waiting for append to document timeout!'));
                } else {
                    if (isInDocument(dom)) {
                        resolve();
                    } else {
                        test(200);
                    }
                }
            }, delay);
        }
        test();
    });
}

export function createElement(tagName: string, className?: string, style?: CSSStyleSheet, xmlns?: string) {
    const el = xmlns ? (document.createElementNS(xmlns, tagName) as HTMLElement) : document.createElement(tagName);
    className && (el.className = className);
    style && Object.assign(el.style, style);
    return el;
}

export function createDocumentFragment(): DocumentFragment {
    return document.createDocumentFragment();
}

export function getInnerText(dom) {
    return (typeof dom.textContent == "string") ? dom.textContent : dom.innerText;
}
export function setInnerText(dom, text) {
    if (typeof dom.textContent == "string") {
        dom.textContent = text;
    } else {
        dom.innerText = text;
    }
}
export function appendInnerText(dom, text) {
    const textNode = document.createTextNode(text);
    dom.appendChild(textNode);
    return textNode;
}
export function insert(parent: HTMLElement | Node, newDom: HTMLElement | Node) {
    if (parent && newDom) {
        let first;
        const count = countChildNodes(parent);
        for (let i = 0; i < count; i++) {
            const item = parent.childNodes.item(i);
            if (item) {
                first = item;
                break;
            }
        }
        first ? parent.insertBefore(newDom, first) : parent.appendChild(newDom);
    }
}
export function insertAt(parent: HTMLElement, newDom: HTMLElement, index: number) {
    if (parent && newDom && index !== -1) {
        let first;
        const count = countChildren(parent as HTMLElement);
        for (let i = 0; i < count; i++) {
            const item = parent.childNodes.item(i);
            if (item) {
                first = item;
                break;
            }
        }
        if (!first) {
            parent.appendChild(newDom)
        } else {
            index = Math.min(count - 1, index);
            const dom = childAt(parent as HTMLElement, index);
            parent.insertBefore(newDom, dom);
        }
    }
}
export function insertBefore(newDom: HTMLElement | Node, existingDom: HTMLElement | Node) {
    if (existingDom && newDom && existingDom.parentNode !== null) {
        existingDom.parentNode.insertBefore(newDom, existingDom);
    }
}
export function insertAfter(newDom: HTMLElement | Node, existingDom: HTMLElement | Node) {
    if (existingDom && newDom && existingDom.parentNode !== null) {
        const parent = existingDom.parentNode;
        if (existingDom === parent.childNodes.item(parent.childNodes.length - 1)) {
            parent.appendChild(newDom);
        } else {
            existingDom = nextNode(existingDom);
            existingDom && parent.insertBefore(newDom, existingDom);
        }
    }
}
export function nextChild(existingDom: HTMLElement | Node): HTMLElement {
    if (existingDom && existingDom.parentNode !== null) {
        const count = countChildren(existingDom.parentNode as HTMLElement);
        for (let i = 0; i < count; i++) {
            const item = (existingDom.parentNode as HTMLElement).children.item(i);
            if (item === existingDom) {
                return (existingDom.parentNode as HTMLElement).children.item(i + 1) as HTMLElement;
            }
        }
    }
    return null;
}
export function nextNode(existingDom: HTMLElement | Node): Node {
    if (existingDom && existingDom.parentNode !== null) {
        const count = countChildNodes(existingDom.parentNode as HTMLElement);
        for (let i = 0; i < count; i++) {
            const item = (existingDom.parentNode as HTMLElement).childNodes.item(i);
            if (item === existingDom) {
                return (existingDom.parentNode as HTMLElement).childNodes.item(i + 1);
            }
        }
    }
    return null;
}
export function findParent(existingDom: HTMLElement | Node, fn: (node) => boolean): HTMLElement | Node {
    if (fn && existingDom) {
        if (fn(existingDom)) return existingDom;
        if (existingDom.parentNode) {
            return findParent(existingDom.parentNode, fn);
        }
    }
    return null;
}
export function childAt(container: HTMLElement, index): HTMLElement {
    if (container) {
        return container.children.item(index) as HTMLElement;
    }
}
export function childIndex(existingDom: Node): number {
    if (existingDom && existingDom.parentElement !== null) {
        const count = existingDom.parentElement.children.length;
        for (let i = 0; i < count; i++) {
            const item = existingDom.parentElement.children.item(i);
            if (item === existingDom) {
                return i;
            }
        }
    }
    return -1;
}
export function removeMe(dom) {
    if (!dom) return;
    if (typeof dom.remove === 'function') {
        dom.remove();
    } else {
        if (dom.parentNode !== null) dom.parentNode.removeChild(dom);
    }
}
export function children(dom: HTMLElement): HTMLElement[] {
    const count = dom ? dom.children.length : 0;
    const result = [];
    for (var i: number = 0; i < dom.children.length; i++) {
        result.push(dom.children.item(i));
    }
    return result;
}
export function eachChildren(dom: HTMLElement, fn: (el: HTMLElement, index) => void, fromIndex?: number) {
    if (dom) {
        fromIndex = fromIndex && fromIndex !== -1 ? fromIndex : 0;
        const count = dom.children.length;
        const array = [];
        for (let i = fromIndex; i < count; i++) {
            array.push(dom.children.item(i));
        }
        for (let i = 0; i < array.length; i++) {
            fn && fn(array[i] as HTMLElement, i + fromIndex);
        }
    }
}
export function countChildren(dom: HTMLElement): number {
    if (dom) {
        return dom.children.length;
    } else {
        return 0;
    }
}
export function countChildNodes(dom: HTMLElement | Node): number {
    if (dom) {
        return dom.childNodes.length;
    } else {
        return 0;
    }
}

export function findMetaElement(metaName: string): HTMLMetaElement {
    if (isBrowser && window.document && window.document.head && window.document.head.getElementsByTagName) {
        // 获取meta
        const metas = window.document.head.getElementsByTagName('meta');
        if (metas && metas.length) {
            for (let i = 0; i < metas.length; i++) {
                const meta = metas.item(i);
                const name = meta.getAttribute('name');
                if (name === metaName) {
                    return meta;
                }
            }
        }
    }
    return null;
}


export interface ISVGIcon {
    prefix: string;
    iconName: string;
    icon: [
        number, // width
        number, // height
        string[], // ligatures
        string, // unicode
        string // svgPathData
    ];
}
export interface ISVGIconDefinition {
    width: number;
    height: number;
    name: string;
    path: string;
    prefix: string;
}
let svgIconAppended = false;
function validateSvgIconCss() {
    if (!svgIconAppended) {
        const cssText = `
ne-svg-icon {
    display: inline-block;
    width: 100%;
    height: 100%;
    text-align: center;
}
svg:not(:root).ne-svg-icon {
    overflow: visible;
    display: inline-block;
    vertical-align: middle;
    font-size: inherit;
    width: 1em;
    height: 1em;
}
ne-svg-icon > i {
    display: inline-block;
    vertical-align: middle;
    height: 100%;
    width: 0;
}
`;
        appendCSSTag(cssText);
        svgIconAppended = true;
    }
}
export function createSvgIcon(className, input: ISVGIcon | ISVGIconDefinition) {
    validateSvgIconCss();
    const el = createElement('ne-svg-icon', `${className}`);
    // ISVGIconDefinition
    let icon: ISVGIcon = input as ISVGIcon;
    if ('width' in icon && 'height' in icon && 'path' in icon) {
        icon = {
            iconName: (input as ISVGIconDefinition).name,
            prefix: (input as ISVGIconDefinition).prefix,
            icon: [
                (input as ISVGIconDefinition).width,
                (input as ISVGIconDefinition).height,
                [],
                '',
                (input as ISVGIconDefinition).path
            ]
        }
    }
    el.innerHTML = `
<svg aria-hidden="true" class="ne-svg-icon" data-prefix="${icon.prefix || ''}" data-icon="${icon.iconName || ''}" role="img"
    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.icon[0]} ${icon.icon[1]}">
    <path fill="currentColor" d="${icon.icon[4]}"></path>
</svg><i/>
`;
    return el;
}
export function getSvgIconTemplate() {
    validateSvgIconCss();
    return `
<ne-svg-icon>
    <svg aria-hidden="true" class="ne-svg-icon" [data-prefix]="icon.prefix || ''" [data-icon]="icon.iconName || ''" role="img"
        xmlns="http://www.w3.org/2000/svg" [viewBox]="'0 0 ' + (icon.icon[0] || 0) + ' ' + (icon.icon[1] || 0)">
        <path fill="currentColor" [d]="icon.icon[4] || ''"></path>
    </svg><i/>
</ne-svg-icon>
`;
}

export function getCursorRange(elem: HTMLInputElement): [number, number] {
    if (document['selection']) {
        //IE
        var range = document['selection'].createRange();
        const text = range.text || '';
        range.moveStart("character", -elem.value.length);
        var len = range.text.length;
        return [len, text.length];
    } else {
        return [elem.selectionStart, elem.selectionEnd];
    }
}

export function getCursorSelection(elem: HTMLInputElement) {
    if (document['selection']) {
        //IE
        var range = document['selection'].createRange();
        return range.text;
    } else {
        return elem.value.substring(elem.selectionStart, elem.selectionEnd);
    }
}

export function setCursorSelection(elem: HTMLInputElement, start, end) {
    if (document['selection']) {
        // IE
        var range = elem['createTextRange']();
        range.move("character", -elem.value.length);
        range.moveEnd("character", start);
        range.moveStart("character", end);
        range.select();
    } else {
        elem.setSelectionRange(start, end);
    }
}
export function replaceCursorTextRange(elem: HTMLInputElement, text: string, range: [number, number]) {
    text = text || '';
    const value = elem.value;
    const startIndex = range[0] || 0;
    let endIndex = range[1] || 0;
    const pre = value.substring(0, startIndex);
    const suf = value.substring(endIndex);

    elem.value = `${pre}${text}${suf}`;
    endIndex = startIndex + text.length;
    setCursorSelection(elem, startIndex, endIndex);
}
export function replaceCursorText(elem: HTMLInputElement, text: string) {
    text = text || '';
    const range = getCursorRange(elem);
    replaceCursorTextRange(elem, text, range);
}