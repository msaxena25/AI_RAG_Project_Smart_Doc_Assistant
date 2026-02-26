import fs from "fs";
import path from "path";
import crypto from "crypto";
import { STORAGE_PATHS } from '../config/path.js';

// Embeddings directory path
const DATA_DIR = STORAGE_PATHS.EMBEDDINGS;

/**
 * Generate unique identifier for a PDF file based on name and size
 * @param {string} filePath - Path to the PDF file
 * @returns {string} - Unique identifier
 */
export function generateEmbeddingDocId(filePath) {
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

/**
 * Ensure data directory exists
 */
function ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log("Created data directory:", DATA_DIR);
    }
}

/**
 * Save chunks and embeddings to JSON file
 * @param {Array} chunks - Array of text chunks
 * @param {Array} embeddings - Array of embeddings
 * @param {string} embeddingDocId - PDF identifier
 * @returns {string} - Generated PDF ID
 */
export function saveEmbeddingsToFile(chunks, embeddings, embeddingDocId) {
    try {
        ensureDataDirectory();
        const fileName = `${embeddingDocId}.json`;
        const outputPath = path.join(DATA_DIR, fileName);

        // Prepare data structure
        const data = {
            embeddingDocId: embeddingDocId,
            createdAt: new Date().toISOString(),
            chunks: chunks.map((chunk, index) => ({
                text: chunk,
                embedding: embeddings[index]?.embedding || []
            }))
        };

        // Write to file
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`Embeddings saved to: ${outputPath}`);

        return id;
    } catch (error) {
        console.error("Error saving embeddings:", error);
        throw error;
    }
}


/**
 * Load existing embeddings from file if they exist
 * @param {string} filePath - Path to the original PDF file
 * @param {string} embeddingDocId - PDF identifier
 * @returns {Array|null} - Existing embeddings or null if not found
 */
export function loadExistingEmbeddings(embeddingDocId) {
    if (embeddingsExist(embeddingDocId)) {
        console.log(`Loading existing embeddings for: ${embeddingDocId}`);
        const existingData = loadEmbeddingsFromFile(embeddingDocId);

        if (existingData && existingData.chunks) {
            const loadedEmbeddings = existingData.chunks.map((chunk, index) => ({
                chunkIndex: index,
                text: chunk.text,
                embedding: chunk.embedding
            }));
            console.log(`Loaded ${loadedEmbeddings.length} existing embeddings`);
            return loadedEmbeddings;
        }
    }
    return null;
}

/**
 * Load embeddings from JSON file
 * @param {string} embeddingDocId - PDF identifier
 * @returns {Object|null} - Loaded embeddings data or null if not found
 */
export function loadEmbeddingsFromFile(embeddingDocId) {
    try {
        const fileName = `${embeddingDocId}.json`;
        const filePath = path.join(DATA_DIR, fileName);

        if (!fs.existsSync(filePath)) {
            return null;
        }

        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading embeddings:", error);
        return null;
    }
}

/**
 * Check if embeddings exist for a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {boolean} - True if embeddings exist
 */
export function embeddingsExist(embeddingDocId) {
    const fileName = `${embeddingDocId}.json`;
    const embeddingPath = path.join(DATA_DIR, fileName);
    return fs.existsSync(embeddingPath);
}

/**
 * List all stored embedding files
 * @returns {Array} - Array of PDF IDs
 */
export function listStoredEmbeddings() {
    try {
        ensureDataDirectory();
        const files = fs.readdirSync(DATA_DIR);
        return files
            .filter(file => file.endsWith('.json'))
            .map(file => path.parse(file).name);
    } catch (error) {
        console.error("Error listing embeddings:", error);
        return [];
    }
}

/**
 * Delete embedding file
 * @param {string} embeddingDocId - PDF identifier
 * @returns {boolean} - True if deleted successfully
 */
export function deleteEmbeddings(embeddingDocId) {
    try {
        const fileName = `${embeddingDocId}.json`;
        const filePath = path.join(DATA_DIR, fileName);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted embeddings: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error deleting embeddings:", error);
        return false;
    }
}

