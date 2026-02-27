import { generateEmbeddingFromGenAI } from "./../services/genai.service.js";
import { saveEmbeddingsToFile, listStoredEmbeddings, loadExistingEmbeddings } from "./../store/embedding.store.js";
import { EMBEDDING_CONFIG, USE_LLM_MODEL } from '../config/app.config.js';

// Global variable to store embeddings
let chunkEmbeddings = [];



/**
 * Generate embeddings for text chunks, leveraging existing embeddings if available.
 * @param {Array} chunks - Array of text chunks to generate embeddings for.
 * @param {string} filePath - Path to the file for saving/loading embeddings.
 * @param {string} embeddingDocId - Identifier for the associated PDF.
 * @returns {Promise<Array>} - Array of generated or loaded embeddings.
 */
export async function generateChunkEmbeddings(chunks, filePath, embeddingDocId) {
    try {
        // Attempt to load existing embeddings
        const existingEmbeddings = loadExistingEmbeddings(embeddingDocId);
        if (existingEmbeddings) {
            chunkEmbeddings = existingEmbeddings;
            return chunkEmbeddings;
        }

        chunkEmbeddings = []; // Reset global embeddings

        // Generate embeddings for each chunk
        for (let i = 0; i < chunks.length; i++) {
            console.log(`Generating embedding for chunk ${i + 1}/${chunks.length}`);
            let embeddingValues;
            if (USE_LLM_MODEL) {
                embeddingValues = await generateEmbeddingFromGenAI(chunks[i]);
            } else {
                embeddingValues = [{ embedding: [0.1, 0.2, 0.3] }]; // Static test data
            }
            chunkEmbeddings.push({
                chunkIndex: i,
                text: chunks[i],
                embedding: embeddingValues
            });
        }

        console.log(`Successfully generated embeddings for ${chunkEmbeddings.length} chunks`);

        // Save embeddings to file if a file path is provided
        if (filePath) {
            saveEmbeddingsToFile(chunks, chunkEmbeddings, embeddingDocId);
        }

        return chunkEmbeddings;

    } catch (error) {
        console.error("Error generating embeddings:", error);
        return [];
    }
}

/**
 * Get the global chunk embeddings
 * @returns {Array} - Array of chunk embeddings
 */
export function getChunkEmbeddings() {
    return chunkEmbeddings;
}


/**
 * Parses an array of embeddings and returns a structured response.
 *
 * @param {Array} embeddingsArray - Array of embedding objects, each containing `chunkIndex`, `text`, and `embedding`.
 * @param {string} [embeddingDocId] - Optional identifier for the associated PDF.
 * @returns {Object} Parsed embeddings data or an error message.
 */
export function parseEmbeddings(embeddingsArray, embeddingDocId) {
    try {

        return {
            message: "Embeddings generated successfully",
            totalEmbeddings: embeddingsArray.length,
            embeddingDocId: embeddingDocId || null,
            embeddings: embeddingsArray.map(item => ({
                chunkIndex: item.chunkIndex,
                textPreview: item.text.substring(0, EMBEDDING_CONFIG.TEXT_PREVIEW_LENGTH) + "...",
                embeddings: item.embedding
            }))
        };
    } catch (error) {
        console.log("🚀 ~ Embedding generation error:", error);
        return { error: "Failed to generate embeddings" };
    }
}


export async function generateEmbeddingsForUserPrompt(prompt) {
    if (USE_LLM_MODEL) {
        return await generateEmbeddingFromGenAI(prompt);
    } else {
        return [[{ values: [0.1, 0.2, 0.3] }]]; // Static test embedding
    }

}

/**
 * Load chunk embeddings from saved PDF JSON file
 * @returns {Array} Array of chunk embeddings from the most recent PDF
 */
export function loadChunkEmbeddingsFromFile(embeddingDocId) {
    try {
        // Load embeddings using embeddingDocId
        const loadedEmbeddings = loadExistingEmbeddings(embeddingDocId);
        if (loadedEmbeddings && loadedEmbeddings.length > 0) {
            return loadedEmbeddings;
        }
        console.log("No chunk data found for embeddingDocId:", embeddingDocId);
        return [];
    } catch (error) {
        console.error("Error loading chunk embeddings from file:", error);
        return [];
    }
}



