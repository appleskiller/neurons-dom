import { isBrowser, isArray } from 'neurons-utils';

export function simulatedDownload(options: { url: string, method: string, data?: any, target?: string }) {
    if (!isBrowser) {
        return;
    }
    const doc = window.document;
    const form: any = doc.createElement('form');
    form.setAttribute('method', options.method);
    form.setAttribute('action', options.url);
    // form.setAttribute('enctype' , 'multipart/form-data');
    form.style.display = 'none';
    if (options.data) {
        for (const key in options.data) {
            let value = options.data[key];
            value = (value === null || value === undefined) ? '' : value;
            if (isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    let val = value[i];
                    val = (typeof val === 'string') ? val : JSON.stringify(val);
                    const input = doc.createElement('input');
                    input.setAttribute('type', 'hidden');
                    input.setAttribute('name', `${key}`);
                    input.setAttribute('value', val);
                    form.appendChild(input);
                }
            } else {
                value = (typeof value === 'string') ? value : JSON.stringify(value);
                const input = doc.createElement('input');
                input.setAttribute('type', 'hidden');
                input.setAttribute('name', `${key}`);
                input.setAttribute('value', value);
                form.appendChild(input);
            }
        }
    }
    doc.body.appendChild(form);
    form.submit();
    doc.body.removeChild(form);
}

export function simulateMouseEvent(target: HTMLElement | Element, name: string, params?: any) {
    if (!isBrowser) {
        return;
    }
    if (!target || !name) {
        return;
    }
    params = params || {};
    // 获取浏览器版本
    let isIE: any = window.navigator && window.navigator.userAgent ? window.navigator.userAgent.match(/MSIE (\d)/i) : false, e: any;
    isIE = isIE ? isIE[1] : undefined;
    if (isIE < 9) {
        e = document['createEventObject']();
    } else {
        e = document['createEvent']('MouseEvents');
        e.initMouseEvent(name, true, true, window, 1, 0, 0, 0, 0, false, false, true, false, 0, null);
    }
    // 给事件对象添加属性
    for (const prop in params) {
        e[prop] = params[prop];
    }
    // 触发事件
    if (isIE < 9) {
        target['fireEvent']('on' + name, e);
    } else {
        target.dispatchEvent(e);
    }
}