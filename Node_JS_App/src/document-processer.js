import { PDFParse } from 'pdf-parse';
import { generateChunkEmbeddings, parseEmbeddings } from "./vector-operations/embedding.generator.js";
import { generatePdfId } from "./store/embedding.store.js";
import { createTextChunks } from "./services/chunk.generator.js";

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