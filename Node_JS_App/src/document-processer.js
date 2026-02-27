import { PDFParse } from 'pdf-parse';
import { generateChunkEmbeddings, parseEmbeddings } from "./vector-operations/embedding.generator.js";
import { createTextChunks } from "./services/chunk.generator.js";
import fs from "fs";
import crypto from "crypto";
import path from "path";

/**
 * Processes a PDF file by extracting text, creating text chunks, generating embeddings,
 * and parsing the embeddings for further use.
 *
 * @param {string} filePath - The file path of the PDF to be processed.
 * @returns {Promise<Object>} A promise that resolves to the parsed embeddings of the PDF.
 */
export async function processPdf(filePath) {
    const embeddingDocId = generateEmbeddingDocId(filePath);
    const texts = await pdfToText(filePath);
    const chunks = createTextChunks(texts);
    const embeddings = await generateChunkEmbeddings(chunks, filePath, embeddingDocId);
    const parsedEmbeddings = parseEmbeddings(embeddings, embeddingDocId);
    return parsedEmbeddings;
}

// Covert PDF to text and create chunks
async function pdfToText(filePath) {
    const parser = new PDFParse({ url: filePath });
    const result = await parser.getText();
    return result.text;
}


/**
 * Generate unique identifier for a Doc file based on name and size
 * @param {string} filePath - Path to the Doc file
 * @returns {string} - Unique identifier
 */
function generateEmbeddingDocId(filePath) {
    try {
        const fileName = path.basename(filePath);
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;

        // Create hash from filename and size for uniqueness
        const hash = crypto.createHash('md5')
            .update(`${fileName}-${fileSize}`)
            .digest('hex')
            .substring(0, 8);
        return `${path.parse(fileName).name}_${hash}`;
    } catch (error) {
        console.error("Error generating PDF ID:", error);
        return path.basename(filePath, path.extname(filePath));
    }
}