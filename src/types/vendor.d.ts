declare module 'arabic-reshaper' {
    export function reshape(text: string): string;
}

declare module 'bidi-js' {
    interface BidiOptions {
        mirror?: boolean;
    }
    interface BidiInstance {
        process(text: string, options?: BidiOptions): {
            text: string;
            levels: number[];
            getReorderedText(): string;
        };
    }
    function bidi(): BidiInstance;
    export default bidi;
}
