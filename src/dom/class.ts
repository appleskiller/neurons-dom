export function parseToClassMap(className: string) {
    className = className || '';
    const classNames = className.match(/[^\x20\t\r\n\f]+/g);
    if (!classNames || !classNames.length) return {};
    const result = {};
    classNames.forEach(className => {
        result[className] = true;
    })
    return result;
}
export function addClass(el: HTMLElement, className: string) {
    if (!el || el.nodeType !== 1 || !className) return;
    const classNames = className.match(/[^\x20\t\r\n\f]+/g);
    if (!classNames || !classNames.length) return;
    const elClassName = el.getAttribute("class");
    if (!elClassName) {
        el.setAttribute('class', className);
    } else {
        let elClass = ' ' + elClassName + ' ';
        for (let i = 0; i < classNames.length; i++) {
            if (elClass.indexOf(' ' + classNames[i] + ' ') === -1) {
                elClass += classNames[i] + ' ';
            }
        }
        el.setAttribute('class', elClass.trim());
    }
}
export function removeClass(el: HTMLElement, className: string) {
    if (!el || el.nodeType !== 1) return;
    const elClassName = el.getAttribute("class");
    if (!elClassName) return;
    className = className || '';
    const classNames = className.match(/[^\x20\t\r\n\f]+/g);
    if (!classNames || !classNames.length) {
        el.setAttribute('class', '');
    } else {
        let elClass = ' ' + elClassName + ' ';
        for (let i = 0; i < classNames.length; i++) {
            elClass = elClass.replace(' ' + classNames[i] + ' ', ' ');
        }
        el.setAttribute('class', elClass.trim());
    }
}

export function hasClass(el: HTMLElement, className: string): boolean {
    if (!el || el.nodeType !== 1) return false;
    const elClassName = el.getAttribute("class");
    if (!elClassName) return false;
    className = className || '';
    const classNames = className.match(/[^\x20\t\r\n\f]+/g);
    if (!classNames || !classNames.length) {
        return true;
    } else {
        let elClass = ' ' + elClassName + ' ';
        return classNames.every(name => elClass.indexOf(' ' + name + ' ') !== -1);
    }
}