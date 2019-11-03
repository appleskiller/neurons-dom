
export * from './class';
export * from './clipboard';
export * from './element';
export * from './event';
export * from './fullscreen';
export * from './measure';
export * from './scroll';
export * from './simulate';
export * from './style';
export * from './transform';

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
