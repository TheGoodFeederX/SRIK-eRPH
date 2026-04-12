import reshaper from 'arabic-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

/**
 * Processes Jawi/Arabic text for environments that do not support native 
 * complex text layout (like PDF engines).
 * 
 * 1. Reshapes characters to their contextual forms (initial, medial, final, isolated).
 * 2. Reorders the reshaped string for visual RTL display (BiDi reordering).
 * 
 * @param text The raw Unicode Jawi/Arabic string.
 * @returns The processed string ready for rendering.
 */
export const processJawi = (text: string | undefined | null): string => {
    if (!text) return '';

    try {
        // Step 1: Reshape characters into contextual forms
        const reshaped = reshaper.reshape(text);

        // Step 2: BiDi reordering for visual RTL
        // Use 'rtl' as the base direction to ensure the whole block flows RTL
        const bidiData = bidi.getEmbeddingLevels(reshaped, 'rtl');
        const reordered = bidi.getReorderedString(reshaped, bidiData);
        
        return reordered;
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
