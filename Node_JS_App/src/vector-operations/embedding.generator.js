import { generateEmbeddingFromGenAI } from "./../services/genai.service.js";
import { saveEmbeddingsToFile, listStoredEmbeddings, loadExistingEmbeddings } from "./../store/embedding.store.js";

// Global variable to store embeddings
let chunkEmbeddings = [];



/**
 * Generate embeddings for text chunks, leveraging existing embeddings if available.
 * @param {Array} chunks - Array of text chunks to generate embeddings for.
 * @param {string} filePath - Path to the file for saving/loading embeddings.
 * @param {string} pdfId - Identifier for the associated PDF.
 * @returns {Promise<Array>} - Array of generated or loaded embeddings.
 */
export async function generateChunkEmbeddings(chunks, filePath, pdfId) {
    try {
        // Attempt to load existing embeddings
        const existingEmbeddings = loadExistingEmbeddings(filePath, pdfId);
        if (existingEmbeddings) {
            chunkEmbeddings = existingEmbeddings;
            return chunkEmbeddings;
        }
        return [];

        chunkEmbeddings = []; // Reset global embeddings

        // Generate embeddings for each chunk
        for (let i = 0; i < chunks.length; i++) {
            console.log(`Generating embedding for chunk ${i + 1}/${chunks.length}`);
            const embeddingValues = await generateEmbeddingFromGenAI(chunks[i]);
            chunkEmbeddings.push({
                chunkIndex: i,
                text: chunks[i],
                embedding: embeddingValues
            });
        }

        console.log(`Successfully generated embeddings for ${chunkEmbeddings.length} chunks`);

        // Save embeddings to file if a file path is provided
        if (filePath) {
            saveEmbeddingsToFile(filePath, chunks, chunkEmbeddings, pdfId);
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
 * @param {string} [pdfId] - Optional identifier for the associated PDF.
 * @returns {Object} Parsed embeddings data or an error message.
 */
export function parseEmbeddings(embeddingsArray, pdfId) {
    try {

        return {
            message: "Embeddings generated successfully",
            totalEmbeddings: embeddingsArray.length,
            pdfId: pdfId || null,
            embeddings: embeddingsArray.map(item => ({
                chunkIndex: item.chunkIndex,
                textPreview: item.text.substring(0, 50) + "...",
                embeddings: item.embedding
            }))
        };
    } catch (error) {
        console.log("🚀 ~ Embedding generation error:", error);
        return { error: "Failed to generate embeddings" };
    }
}


export async function generateEmbeddingsForUserPrompt(prompt) {
    const embeddedVectors = await generateEmbeddingFromGenAI(prompt);
    return embeddedVectors;
}

/**
 * Load chunk embeddings from saved PDF JSON file
 * @returns {Array} Array of chunk embeddings from the most recent PDF
 */
export function loadChunkEmbeddingsFromFile(filePath) {
    try {
        // Get list of stored embeddings
        const storedEmbeddings = listStoredEmbeddings();

        if (storedEmbeddings.length === 0) {
            console.log("No stored embeddings found");
            return [];
        }

        // Get the most recent PDF embeddings (first in the list)
        const latestPdfId = storedEmbeddings[0];


        const loadedEmbeddings = loadExistingEmbeddings(filePath, latestPdfId);
        console.log("🚀 ~ loadedEmbeddings:", loadedEmbeddings)

        if (loadedEmbeddings && loadedEmbeddings.length > 0) {
            return loadedEmbeddings;
        }

        console.log("No chunk data found in stored embeddings");
        return [];

    } catch (error) {
        console.error("Error loading chunk embeddings from file:", error);
        return [];
    }
}



