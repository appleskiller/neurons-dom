export function transformScale(dom: HTMLElement) {
    if (!dom) return 1;
    const originTransform = dom.style.transform;
    if (originTransform) {
        const result = originTransform.match(/scale\((.*?)\)/);
        if (result && result[1]) {
            const arr: any = result[1].trim().split(',');
            arr.forEach((str, index) => { arr[index] = parseFloat(str); });
            if (arr.length) {
                return arr[0];
            }
        }
    }
    return 1;
}