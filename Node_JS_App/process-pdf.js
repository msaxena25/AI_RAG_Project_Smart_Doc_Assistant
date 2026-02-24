import { PDFParse } from 'pdf-parse';
import { generateChunkEmbeddings, parseEmbeddings } from "./embedding.js";
import { generatePdfId } from "./embedding-store.js";

let textChunks = [];

/**
 * Processes a PDF file by extracting text, creating text chunks, generating embeddings,
 * and parsing the embeddings for further use.
 *
 * @param {string} filePath - The file path of the PDF to be processed.
 * @returns {Promise<Object>} A promise that resolves to the parsed embeddings of the PDF.
 */
export async function processPdf(filePath) {
    const pdfId = generatePdfId(filePath);
    const texts = await pdfToText(filePath);
    const chunks = createTextChunks(texts);
    const embeddings = await generateChunkEmbeddings(chunks, filePath, pdfId);
    const parsedEmbeddings = parseEmbeddings(embeddings, pdfId);
    return parsedEmbeddings;
}

// Covert PDF to text and create chunks
 async function pdfToText(filePath) {
    const parser = new PDFParse({ url: filePath });
    const result = await parser.getText();
    return result.text;
}

/**
 * Converts text into multiple chunks without breaking words
 * @param {string} text - The text to chunk
 * @param {number} maxChunkSize - Maximum characters per chunk (default 700)
 * @returns {string[]} - Array of text chunks
 */
function createTextChunks(text, maxChunkSize = 700) {
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

