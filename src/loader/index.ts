import { globalCache } from 'neurons-utils';
import { createElement, removeMe } from '../dom/element';

export type IDeferred = {
    resolve: () => void;
    reject: (error) => void;
};

export interface IScriptCatch {
    [alias: string]: boolean | IDeferred[];
}

const scriptLoaderCache: IScriptCatch = globalCache('scriptLoaderCache');
const cssLoaderCache: IScriptCatch = globalCache('cssLoaderCache');
const fontLoaderCache = globalCache('fontLoaderCache');

// ---------------------------------------------------------------------------------
//
// Font Loader
//
// =================================================================================
let checkerContainer = null;
const TEST_STRING = 'AxmTYklsjo190QW';
const SANS_SERIF_FONTS = 'sans-serif';
const SERIF_FONTS = 'serif';

const defaultOptions = {
    tolerance: 2, // px
    delay: 100,
    glyphs: '',
    timeout: 5000,
    weight: '400', // normal
    style: 'normal',
};
// See https://github.com/typekit/webfontloader/blob/master/src/core/fontruler.js#L41
const defaultStyle = [
    'display:block',
    'position:absolute',
    'top:-999px',
    'left:-999px',
    'font-size:48px',
    'width:auto',
    'height:auto',
    'line-height:normal',
    'margin:0',
    'padding:0',
    'font-variant:normal',
    'white-space:nowrap'
];
const defaultHtml = '<div style="%s" aria-hidden="true">' + TEST_STRING + '</div>';

class FontFaceChecker {
    static check(fontFamily, fontWeight?, fontStyle?): Promise<void> {
        if (!checkerContainer) {
            checkerContainer = document.createElement('div');
            checkerContainer.style.display = 'block';
            checkerContainer.style.position = 'absolute';
            checkerContainer.style.top = '-99999px';
            checkerContainer.style.left = '-99999px';
            document.body.appendChild(checkerContainer);
        }
        const startTime = new Date();
        let dimensions, appended = false;
        const sansSerifHtml = defaultHtml.replace(/\%s/, this.getStyle(SANS_SERIF_FONTS, fontWeight, fontStyle));
        const serifHtml = defaultHtml.replace(/\%s/, this.getStyle(SERIF_FONTS, fontWeight, fontStyle));
        const checkerDom = document.createElement('div');
        checkerDom.innerHTML = sansSerifHtml + serifHtml;
        const sansSerif = checkerDom.firstChild as HTMLElement;
        const serif = sansSerif.nextSibling as HTMLElement;
        return new Promise((resolve, reject) => {
            const checkDimensions = () => {
                if (!appended) {
                    checkerContainer.appendChild(checkerDom);
                    appended = true;

                    dimensions = FontFaceChecker.getMeasurements(sansSerif, serif);
                    sansSerif.style.fontFamily = fontFamily + ', ' + SANS_SERIF_FONTS;
                    serif.style.fontFamily = fontFamily + ', ' + SERIF_FONTS;
                }
                if (appended && dimensions &&
                    (FontFaceChecker.hasNewDimensions(dimensions.sansSerif, sansSerif, defaultOptions.tolerance) ||
                        FontFaceChecker.hasNewDimensions(dimensions.serif, serif, defaultOptions.tolerance))) {
                    resolve();
                } else if (FontFaceChecker.isTimeout(startTime)) {
                    removeMe(checkerDom);
                    reject(new Error('字体加载超时'));
                } else {
                    setTimeout(checkDimensions, defaultOptions.delay);
                }
            }
            checkDimensions();
        })
    }
    static getMeasurements(sansSerif: HTMLElement, serif: HTMLElement) {
        return {
            sansSerif: {
                width: sansSerif.offsetWidth,
                height: sansSerif.offsetHeight
            },
            serif: {
                width: serif.offsetWidth,
                height: serif.offsetHeight
            }
        };
    }
    static getStyle(fontFamily, fontWeight?, fontStyle?) {
        fontWeight = fontWeight || 'normal';
        fontStyle = fontStyle || 'normal';
        return defaultStyle.concat(['font-weight:' + fontWeight, 'font-style:' + fontStyle]).concat('font-family:' + fontFamily).join(';');
    }
    static isTimeout(startTime) {
        return (new Date()).getTime() - startTime.getTime() > defaultOptions.timeout;
    }
    static hasNewDimensions(dims, el, tolerance) {
        return Math.abs(dims.width - el.offsetWidth) > tolerance ||
            Math.abs(dims.height - el.offsetHeight) > tolerance;
    }
}

export class FontFaceLoader {
    loadFonts(names: string[]): Promise<any> {
        return Promise.all(names.map(name => this.load(name)));
    }
    load(name: string): Promise<void> {
        if (fontLoaderCache[name] === true) {
            return Promise.resolve();
        } else if (fontLoaderCache[name]) {
            return new Promise((resolve, reject) => {
                fontLoaderCache[name].push({ resolve: resolve, reject: reject });
            });
        } else {
            return new Promise((resolve, reject) => {
                fontLoaderCache[name] = [{ resolve: resolve, reject: reject }];
                return Promise.all([
                    FontFaceChecker.check(name, 'normal'),
                    FontFaceChecker.check(name, 'bold'),
                ]).then(() => {
                    this._loaded(name);
                    resolve();
                }).catch((error) => {
                    this._error(name, error);
                    reject(error);
                });
            })
        }
    }
    private _error(name, err) {
        // 超时
        const defers = fontLoaderCache[name];
        delete fontLoaderCache[name];
        if (defers && defers !== true) {
            for (let i = 0; i < defers.length; i++) {
                defers[i] && defers[i].reject(err);
            }
        }
    }
    private _loaded(name) {
        const defers = fontLoaderCache[name];
        fontLoaderCache[name] = true;
        if (defers && defers !== true) {
            for (let i = 0; i < defers.length; i++) {
                defers[i] && defers[i].resolve();
            }
        }
    }
}

export const fontLoader = new FontFaceLoader();

// ---------------------------------------------------------------------------------
//
// FontFace Manager
//
// =================================================================================

export class FontFaceItem {
    constructor(
        private _fontFamily: string,
        private _urls: any[] = [],
        private _fontWeight = 'normal',
    ) {
        this._fontDom = createElement('style');
        this._fontDom.setAttribute('type', 'text/css');
        document.head.appendChild(this._fontDom);
        this._updateFontFace();
    }
    get fontFamily(): string {
        return this._fontFamily;
    }
    set fontFamily(value: string) {
        if (this._fontFamily !== value) {
            this._fontFamily = value;
            this._updateFontFace();
        }
    }
    get urls(): any[] {
        return this._urls;
    }
    set urls(value: any[]) {
        this._urls = value;
        this._updateFontFace();
    }
    get fontWeight(): string {
        return this._fontWeight;
    }
    set fontWeight(value: string) {
        if (this._fontWeight !== value) {
            this._fontWeight = value;
            this._updateFontFace();
        }
    }
    destroy() {
        this._fontDom.innerHTML = '';
        removeMe(this._fontDom);
    }
    private _fontDom;
    private _updateFontFace() {
        this._fontDom.innerHTML = '';
        if (this._fontFamily && this._urls && this._urls.length) {
            this._fontDom.innerHTML = `
@font-face {
    font-family: "${this._fontFamily}";
    src: ${this._urls.map(item => {
        return `url("${item.url}")` + (item.format ? ` format("${item.format}")` : '');
    }).join(',\n         ')};
    font-weight: ${this._fontWeight || 'normal'};
}
            `;
        }
    }
}

export interface IFontFaceData {
    fontFamily: string;
    urls: {
        url: string,
        format: string,
    }[],
    fontWeight?: string;
}

export class FontFaceManager {
    private _fontFaces: FontFaceItem[] = [];
    static create(): FontFaceManager {
        return new FontFaceManager();
    }
    getFontFaces(): string[] {
        const fonts = [];
        const hash = {};
        this._fontFaces.forEach(item => {
            const fontFamily = item.fontFamily;
            if (!hash[fontFamily]) {
                hash[fontFamily] = true;
                fonts.push(fontFamily);
            }
        });
        return fonts;
    }
    loadFonts(): Promise<void> {
        const fonts = this.getFontFaces();
        return fonts.length ? fontLoader.loadFonts(fonts).catch(error => Promise.resolve()) : Promise.resolve();
    }
    reset(data: IFontFaceData[]): Promise<void> {
        this.clear();
        this._fontFaces = (data || []).map(d => new FontFaceItem(d.fontFamily, d.urls, d.fontWeight));
        return this.loadFonts();
    }
    clear() {
        this._fontFaces.forEach(item => item.destroy());
        this._fontFaces = [];
    }
    destroy() {
        this.clear();
    }
}

// ---------------------------------------------------------------------------------
//
// Script Loader
//
// =================================================================================
export class ScriptLoader {
    load(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!url) {
                resolve();
            } else {
                url = this._getUrl(url);
                if (scriptLoaderCache[url] === true) {
                    resolve();
                } else if (scriptLoaderCache[url]) {
                    (<IDeferred[]>scriptLoaderCache[url]).push({
                        resolve: resolve,
                        reject: reject
                    });
                } else if (this._findByUrl(url)) {
                    scriptLoaderCache[url] = true;
                    resolve();
                } else {
                    scriptLoaderCache[url] = [{
                        resolve: resolve,
                        reject: reject
                    }];
                    const script = document.createElement('script');
                    script.onload = () => {
                        script.onload = null;
                        script.onerror = null;
                        this._loaded(url);
                    };
                    script.onerror = (err) => {
                        script.onload = null;
                        script.onerror = null;
                        if (script.parentNode) {
                            removeMe(script);
                        }
                        this._error(url, err);
                    };
                    script.setAttribute('charset', 'utf-8');
                    script.setAttribute('src', url);
                    document.head.appendChild(script);
                }
            }
        })
    }
    private _error(url, err) {
        const defers = scriptLoaderCache[url];
        delete scriptLoaderCache[url];
        if (defers && defers !== true) {
            for (let i = 0; i < defers.length; i++) {
                defers[i].reject(err);
            }
        }
    }
    private _loaded(url) {
        const defers = scriptLoaderCache[url];
        scriptLoaderCache[url] = true;
        if (defers && defers !== true) {
            for (let i = 0; i < defers.length; i++) {
                defers[i].resolve();
            }
        }
    }
    private _getUrl(url): string {
        return url;
    }
    private _findByUrl(url: string): boolean {
        return !!document.querySelector(`script[src='${url}']`);
    }
}

export const scriptLoader = new ScriptLoader();

// ---------------------------------------------------------------------------------
//
// Script Loader
//
// =================================================================================
export class CSSLoader {
    load(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!url) {
                resolve();
            } else {
                url = this._getUrl(url);
                if (cssLoaderCache[url] === true) {
                    resolve();
                } else if (cssLoaderCache[url]) {
                    (<IDeferred[]>cssLoaderCache[url]).push({
                        resolve: resolve,
                        reject: reject
                    });
                } else if (this._findByUrl(url)) {
                    cssLoaderCache[url] = true;
                    resolve();
                } else {
                    cssLoaderCache[url] = [{
                        resolve: resolve,
                        reject: reject
                    }];
                    const link = document.createElement('link');
                    link.onload = () => {
                        link.onload = null;
                        link.onerror = null;
                        this._loaded(url);
                    };
                    link.onerror = (err) => {
                        link.onload = null;
                        link.onerror = null;
                        if (link.parentNode) {
                            removeMe(link);
                        }
                        this._error(url, err);
                    };
                    link.setAttribute('rel', 'stylesheet');
                    link.setAttribute('type', 'text/css');
                    link.setAttribute('href', url);
                    document.head.appendChild(link);
                }
            }
        })
    }
    private _error(url, err) {
        const defers = cssLoaderCache[url];
        delete cssLoaderCache[url];
        if (defers && defers !== true) {
            for (let i = 0; i < defers.length; i++) {
                defers[i].reject(err);
            }
        }
    }
    private _loaded(url) {
        const defers = cssLoaderCache[url];
        cssLoaderCache[url] = true;
        if (defers && defers !== true) {
            for (let i = 0; i < defers.length; i++) {
                defers[i].resolve();
            }
        }
    }
    private _getUrl(url): string {
        return url;
    }
    private _findByUrl(url: string): boolean {
        return !!document.querySelector(`link[href='${url}']`);
    }
}

export const cssLoader = new CSSLoader();

// ---------------------------------------------------------------------------------
//
// Widget Loader
//
// =================================================================================
class QueueLoader {
    static load(urls: string[]): Promise<void> {
        const queue = new QueueLoader();
        return queue.load(urls);
    }
    load(urls: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const deferred = { resolve: resolve, reject: reject };
            urls = urls ? urls.concat() : [];
            this.next(urls, deferred);
        })
    }
    next(urls, deferred: IDeferred) {
        if (!urls.length) {
            deferred.resolve();
        } else {
            const url = urls.shift();
            if (url) {
                scriptLoader.load(url)
                    .then(() => {
                        this.next(urls, deferred);
                    }).catch((error) => {
                        deferred.reject(error);
                    });
            } else {
                this.next(urls, deferred);
            }
        }
    }
}