declare module 'arabic-reshaper' {
    export function reshape(text: string): string;
}

declare module 'bidi-js' {
    export interface BidiData {
        levels: number[];
        paragraphs: Array<{
            start: number;
            end: number;
            level: number;
        }>;
    }

    export interface BidiInstance {
        getEmbeddingLevels(text: string, direction?: 'ltr' | 'rtl'): BidiData;
        getReorderedString(text: string, bidiData: BidiData): string;
    }

    function bidiFactory(): BidiInstance;
    export default bidiFactory;
}
