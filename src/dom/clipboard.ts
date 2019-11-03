

/**
 * 获取剪贴板中的数据
 */
export function getClipboardData(event: ClipboardEvent): Promise<any> {
    let clipboardData = event ? (event.clipboardData || (event['originalEvent'] ? event['originalEvent'].clipboardData : null)) : null;
    clipboardData = clipboardData || window['clipboardData'];
    const result = {};
    if (clipboardData && clipboardData.items) {
        const readText = (item) => {
            return new Promise((resolve, reject) => {
                item.getAsString((s) => {
                    result['text'] = s;
                    resolve();
                });
            });
        }
        const readHTML = (item) => {
            return new Promise((resolve, reject) => {
                item.getAsString((s) => {
                    result['html'] = s;
                    resolve();
                });
            });
        }
        const readImage = (item) => {
            result['image'] = item.getAsFile();
            return Promise.resolve();
        }
        const len = clipboardData.items.length;
        const promiese = [];
        for (var i = 0; i < len; i++) {
            const item = clipboardData.items[i];
            if (item && item.type) {
                if ((item.kind == 'string') && (item.type.match('^text/plain'))) {
                    promiese.push(readText(item));
                } else if ((item.kind == 'string') && (item.type.match('^text/html'))) {
                    promiese.push(readHTML(item));
                } else if ((item.kind == 'file') && (item.type.match('^image/'))) {
                    promiese.push(readImage(item));
                } else {
                    // skip
                }
            }
        }
        return Promise.all(promiese).then(() => Promise.resolve(result)).catch(() => Promise.resolve(result));
    } else {
        return Promise.resolve(result);
    }
}