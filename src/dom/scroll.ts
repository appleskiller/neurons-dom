


// t: 当前时间（已经经过的时间）d: 总时长
const easeOutCubic = function (t, d, from, to) {
    if (from === to) return to;
    const b = 0, c = 1;
    const v = c * ((t = Math.min(1, t / d) - 1) * t * t + 1) + b;
    if (from > to) {
        return from - v * (from - to);
    } else {
        return from + v * (to - from);
    }
};
const quinticOut = function (t, d, from, to) {
    if (from === to) return to;
    let k = Math.min(1, t / d);
    const v = --k * k * k * k * k + 1;
    if (from > to) {
        return from - v * (from - to);
    } else {
        return from + v * (to - from);
    }
}
const globalScrollLeft = function (dom) {
    return (dom.parentNode && dom.parentNode !== document) ? dom.parentNode.scrollLeft + globalScrollLeft(dom.parentNode) : 0;
};

const globalScrollTop = function (dom) {
    return (dom.parentNode && dom.parentNode !== document) ? dom.parentNode.scrollTop + globalScrollTop(dom.parentNode) : 0;
};

const gX = function (dom) {
    return dom.offsetParent ? dom.offsetLeft + gX(dom.offsetParent) : dom.offsetLeft;
};

const gY = function (dom) {
    return dom.offsetParent ? dom.offsetTop + gY(dom.offsetParent) : dom.offsetTop;
};
/**
 * dom全局X坐标。
 **/
function globalX(dom) {
    return gX(dom) - globalScrollLeft(dom);
}
/**
 * dom全局Y坐标。
 **/
function globalY(dom) {
    return gY(dom) - globalScrollTop(dom);
}
/**
 * dom相对于target的ｘ坐标
 */
function contentX(dom, target) {
    return globalX(dom) - globalX(target);
}
/**
 * dom相对于target的ｙ坐标
 */
function contentY(dom, target) {
    return globalY(dom) - globalY(target);
}
/**
 * dom相对于container内容的ｙ位置
 */
export function originScrollTop(dom, container) {
    const scrollTop = container.scrollTop;
    const offsetTop = contentY(dom, container);
    return scrollTop + offsetTop;
}
// -----------------------------------------------------
// scrolling
// =======================================================
export function stopScrolling(scrollContainer: HTMLElement) {
    if (scrollContainer) {
        scrollContainer['__stopScrollAnimation'] && scrollContainer['__stopScrollAnimation']();
        delete scrollContainer['__stopScrollAnimation']
    }
}
export function scrollToDom(dom: HTMLElement, scrollContainer: HTMLElement, duration = 240, delay = 0) {
    stopScrolling(scrollContainer);
    if (!duration) return;
    let timer;
    const delayTime = setTimeout(() => {
        const domScrollTop = originScrollTop(dom, scrollContainer);
        const start = scrollContainer.scrollTop;
        const startTime = (new Date()).getTime();
        timer = setInterval(() => {
            const currentTime = (new Date()).getTime() - startTime;
            if (currentTime >= duration) {
                stopScrolling(scrollContainer);
                // 最后重新计算，防止滚动过程中容器内容变化产生的位置误差
                scrollContainer.scrollTop = originScrollTop(dom, scrollContainer);
            } else {
                scrollContainer.scrollTop = easeOutCubic(currentTime, duration, start, domScrollTop);
            }
        }, 42); // 24 帧 / 秒
    }, delay);
    scrollContainer['__stopScrollAnimation'] = () => {
        clearTimeout(delayTime);
        clearInterval(timer);
    }
};

function isSameSign(n1, n2) {
    if (n1 >= 0 && n2 >= 0) return true;
    if (n1 < 0 && n2 < 0) return true;
    return false;
}

export function naturalScrolling(scrollContainer: HTMLElement, velocity: number[]) {
    stopScrolling(scrollContainer);
    if (!velocity || velocity.length !== 2) return () => { };
    let v0h = velocity[0], v0v = velocity[1];
    const absh = Math.abs(v0h);
    const absv = Math.abs(v0v);
    v0h = absh <= 0.05 ? 0 : v0h;
    v0v = absv <= 0.05 ? 0 : v0v;
    if (!v0h && !v0v) {
        return () => { };
    }
    let ah = Math.max(0.005, Math.min(0.001, absh / 100));
    let av = Math.max(0.005, Math.min(0.001, absv / 100));
    let vfh = v0h = v0h * 2;
    let vfv = v0v = v0v * 2;
    let t = 0;
    let signh = v0h > 0 ? -1 : 1;
    let signv = v0v > 0 ? -1 : 1;
    let startTime = (new Date()).getTime();
    let previousScrollLeft, previousScrollTop;
    const timer = setInterval(() => {
        if (!vfh && !vfv) {
            stopScrolling(scrollContainer);
        } else {
            t = (new Date()).getTime() - startTime;
            if (scrollContainer.scrollLeft !== previousScrollLeft && vfh) {
                previousScrollLeft = scrollContainer.scrollLeft;
                vfh = v0h + signh * ah * t;
                vfh = isSameSign(vfh, v0h) ? vfh : 0;
                scrollContainer.scrollLeft -= vfh;
            } else {
                vfh = 0;
            }
            if (scrollContainer.scrollTop !== previousScrollTop && vfv) {
                previousScrollTop = scrollContainer.scrollTop;
                vfv = v0v + signv * av * t;
                vfv = isSameSign(vfv, v0v) ? vfv : 0;
                scrollContainer.scrollTop -= vfv;
            } else {
                vfv = 0;
            }
        }
    }, 0);
    scrollContainer['__stopScrollAnimation'] = () => {
        clearInterval(timer);
    }
};