import { scriptLoader, fontLoader } from './loader';

export * from './dom';
export * from './device';
export * from './loader';

export function loadScript(url: string): Promise<void> {
    return scriptLoader.load(url);
}
export function loadFonts(...names): Promise<any> {
    return Promise.all(names.map(name => fontLoader.load(name)));
}