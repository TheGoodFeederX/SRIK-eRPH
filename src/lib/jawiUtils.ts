// @ts-ignore
import reshaper from 'arabic-reshaper';

/**
 * Processes Jawi/Arabic text for environments that do not support native 
 * complex text layout (like PDF engines).
 * 
 * 1. Reshapes characters to their contextual forms (initial, medial, final, isolated).
 * 
 * Note: RTL reordering is assumed to be handled by the PDF engine (e.g., pdfmake 0.3+ 
 * with direction: 'rtl').
 * 
 * @param text The raw Unicode Jawi/Arabic string.
 * @returns The processed string ready for rendering.
 */
export const processJawi = (text: string | undefined | null): string => {
    if (!text) return '';

    try {
        // Step 1: Reshape characters into contextual forms
        const reshaped = reshaper.reshape(text);
        return reshaped;
    } catch (error) {
        console.error('Error processing Jawi text:', error);
        return text || '';
    }
};

/**
 * Helper to process arrays of strings (e.g., SP or SPI descriptions).
 */
export const processJawiArray = (texts: string[] | undefined | null): string[] => {
    if (!texts) return [];
    return texts.map(processJawi);
};
