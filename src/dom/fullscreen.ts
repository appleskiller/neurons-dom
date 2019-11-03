import { addEventListener } from './event';
import { isEmpty, isBrowser } from 'neurons-utils';

// -----------------------------------------------------------------------------
// 全屏控制
// =============================================================================
const keyboardAllowed = typeof Element !== 'undefined' && 'ALLOW_KEYBOARD_INPUT' in Element;
const api: any = {};
(function () {
    const document = isBrowser ? window.document : {};
    const apiNames = [
        [
            'requestFullscreen',
            'exitFullscreen',
            'fullscreenElement',
            'fullscreenEnabled',
            'fullscreenchange',
            'fullscreenerror'
        ],
        // New WebKit
        [
            'webkitRequestFullscreen',
            'webkitExitFullscreen',
            'webkitFullscreenElement',
            'webkitFullscreenEnabled',
            'webkitfullscreenchange',
            'webkitfullscreenerror'

        ],
        // Old WebKit (Safari 5.1)
        [
            'webkitRequestFullScreen',
            'webkitCancelFullScreen',
            'webkitCurrentFullScreenElement',
            'webkitCancelFullScreen',
            'webkitfullscreenchange',
            'webkitfullscreenerror'

        ],
        [
            'mozRequestFullScreen',
            'mozCancelFullScreen',
            'mozFullScreenElement',
            'mozFullScreenEnabled',
            'mozfullscreenchange',
            'mozfullscreenerror'
        ],
        [
            'msRequestFullscreen',
            'msExitFullscreen',
            'msFullscreenElement',
            'msFullscreenEnabled',
            'MSFullscreenChange',
            'MSFullscreenError'
        ]
    ];

    let i = 0, val;
    for (; i < apiNames.length; i++) {
        val = apiNames[i];
        if (val && val[1] in document) {
            for (i = 0; i < val.length; i++) {
                api[apiNames[0][i]] = val[i];
            }
        }
    }
})();

const eventNameMap = {
    change: api.fullscreenchange,
    error: api.fullscreenerror
};

export const fullscreen = {
    _events: {},
    isFullscreen: function () {
        return !!document[api.fullscreenElement];
    },
    element: function () {
        return document[api.fullscreenElement];
    },
    supported: function () {
        return !isEmpty(api) && !!document[api.fullscreenEnabled];
    },
    request: function (elem?) {
        return new Promise((resolve) => {
            const request = api.requestFullscreen;
            const onFullScreenEntered = () => {
                fullscreen.off('change', onFullScreenEntered);
                resolve();
            };
            elem = elem || document.documentElement;
            if (/ Version\/5\.1(?:\.\d+)? Safari\//.test(navigator.userAgent)) {
                elem[request]();
            } else {
                elem[request](keyboardAllowed ? Element['ALLOW_KEYBOARD_INPUT'] : {});
            }
            fullscreen.on('change', onFullScreenEntered);
        });
    },
    exit: function () {
        return new Promise((resolve) => {
            if (!fullscreen.isFullscreen()) {
                resolve();
                return;
            }
            var onFullScreenExit = () => {
                fullscreen.off('change', onFullScreenExit);
                resolve();
            };
            document[api.exitFullscreen]();

            fullscreen.on('change', onFullScreenExit);
        });
    },
    toggle: function (elem?) {
        return fullscreen.isFullscreen() ? fullscreen.exit() : fullscreen.request(elem);
    },
    onchange: function (callback) {
        fullscreen.on('change', callback);
    },
    onerror: function (callback) {
        fullscreen.on('error', callback);
    },
    on: function (event, callback) {
        var eventName = eventNameMap[event];
        if (eventName) {
            if (!this._events[eventName]) {
                this._events[eventName] = {
                    handlers: [],
                    removeListening: [],
                }
            }
            if (this._events[eventName].handlers.indexOf(callback) === -1) {
                this._events[eventName].handlers.push(callback);
                this._events[eventName].removeListening.push(
                    addEventListener(document, eventName, callback)
                )
            }
        }
    },
    off: function (event, callback) {
        var eventName = eventNameMap[event];
        if (eventName) {
            if (this._events[eventName]) {
                const index = this._events[eventName].handlers.indexOf(callback);
                if (index !== -1) {
                    this._events[eventName].removeListening[index]();
                    this._events[eventName].handlers.splice(index, 1);
                    this._events[eventName].removeListening.splice(index, 1);
                }
            }
        }
    }
};