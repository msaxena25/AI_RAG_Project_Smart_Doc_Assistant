import { EMBEDDING_CONFIG } from '../config/app.config.js';
let textChunks = [];

/**
 * Converts text into multiple chunks without breaking words
 * @param {string} text - The text to chunk
 * @param {number} maxChunkSize - Maximum characters per chunk (default 700)
 * @returns {string[]} - Array of text chunks
 */
export function createTextChunks(text, maxChunkSize = EMBEDDING_CONFIG.CHUNK_SIZE_LIMIT) {
    textChunks = []; // Reset the global array

    if (!text || text.trim() === '') {
        return textChunks;
    }

    // Split text by sentences first, then by words if needed
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim() !== '');

    let currentChunk = '';

    for (let sentence of sentences) {
        sentence = sentence.trim();
        if (!sentence) continue;

        // If adding this sentence would exceed chunk size
        if (currentChunk.length + sentence.length + 1 > maxChunkSize) {
            if (currentChunk) {
                textChunks.push(currentChunk.trim());
                currentChunk = '';
            }

            // If single sentence is too long, split by words
            if (sentence.length > maxChunkSize) {
                const words = sentence.split(' ');
                let wordChunk = '';

                for (let word of words) {
                    if (wordChunk.length + word.length + 1 > maxChunkSize) {
                        if (wordChunk) {
                            textChunks.push(wordChunk.trim());
                            wordChunk = word;
                        } else {
                            // Single word too long, force split
                            textChunks.push(word);
                        }
                    } else {
                        wordChunk += (wordChunk ? ' ' : '') + word;
                    }
                }
                if (wordChunk) {
                    currentChunk = wordChunk;
                }
            } else {
                currentChunk = sentence;
            }
        } else {
            currentChunk += (currentChunk ? '. ' : '') + sentence;
        }
    }

    // Add the last chunk
    if (currentChunk.trim()) {
        textChunks.push(currentChunk.trim());
    }

    return textChunks;
}

/**
 * Get the global chunks array
 * @returns {string[]} - Array of text chunks
 */
export function getTextChunks() {
    return textChunks;
}