import { isDomLevel2 } from 'neurons-utils';

export type IRemoveListenerFunction = () => void;

function fixEventType(el, name) {
    if (name === 'mousewheel') {
        if (el.onmousewheel === undefined) {
            // 兼容firefox滚轮事件，事件类型为DOMMouseScroll且只能使用DOM2级事件绑定
            name = "DOMMouseScroll";
        }
    }
    return name;
}
function wrapEvent(name, e) {
    e = e || window.event;
    if (!('stopPropagation' in e)) {
        e.stopPropagation = function () { e.cancelBubble = true; }
    }
    if (!('stopImmediatePropagation' in e)) {
        e.stopImmediatePropagation = function () { e.cancelBubble = true; }
    }
    if (!('preventDefault' in e)) {
        e.preventDefault = function () { e.returnValue = false; e.defaultPrevented = true; }
        e.defaultPrevented = false;
    }
    if (name === 'mousewheel') {
        // firefox滚轮事件滚动方向兼容
        if (!e.wheelDelta) {
            e.wheelDelta = e.detail / -3 * 120;
        }
    }
    return e;
}
function removeEventListener(el, name, handler) {
    if (!el) return;
    if (isDomLevel2) {
        el.removeEventListener(name, handler);
    } else {
        el.detachEvent('on' + name, handler);
    }
}
export function addEventListener(el, name, handler): IRemoveListenerFunction {
    const type = fixEventType(el, name);
    const _handle = function (e) {
        e = wrapEvent(name, e);
        return handler.call(this, e);
    }
    if (isDomLevel2) {
        el.addEventListener(type, _handle);
    } else {
        el.attachEvent('on' + type, _handle);
    }
    return function () {
        removeEventListener(el, type, _handle);
    };
}