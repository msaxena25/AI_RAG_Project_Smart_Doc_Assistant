import cosineSimilarity from "compute-cosine-similarity";
import { getChunkEmbeddings, loadChunkEmbeddingsFromFile } from "./embedding.generator.js";

// Global variable to store top 3 similar chunks for further use
let top3SimilarChunks = [];

/**
 * Validate input parameters for similarity search
 * @param {Array} promptEmbedding - User prompt embedding vector
 * @param {Array} embeddings - Array of chunk embeddings
 * @returns {boolean} True if inputs are valid
 */
function validateSimilaritySearchInputs(promptEmbedding, embeddings) {
    if (!embeddings || embeddings.length === 0) {
        console.log("No chunk embeddings available for similarity search");
        return false;
    }

    if (!promptEmbedding || promptEmbedding.length === 0) {
        console.log("Invalid prompt embedding provided");
        return false;
    }

    return true;
}

/**
 * Calculate cosine similarity scores for all chunks
 * @param {Array} promptEmbedding - User prompt embedding vector
 * @param {Array} embeddings - Array of chunk embeddings
 * @returns {Array} Array of chunks with similarity scores
 */
function calculateSimilarityScores(promptEmbedding, embeddings) {
    return embeddings.map(chunk => {
        const similarity = cosineSimilarity(promptEmbedding[0].values, chunk.embedding[0].values);
        return {
            chunkIndex: chunk.chunkIndex,
            text: chunk.text,
            //embedding: chunk.embedding,
            similarityScore: similarity
        };
    });
}

/**
 * Sort and select top N chunks by similarity score
 * @param {Array} similarities - Array of chunks with similarity scores
 * @param {number} topN - Number of top chunks to return (default: 3)
 * @returns {Array} Top N most similar chunks
 */
function selectTopSimilarChunks(similarities, topN = 3) {
    return similarities
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, topN);
}

/**
 * Format top chunks as plain text for LLM consumption
 * @param {Array} topChunks - Array of top similar chunks
 * @returns {string} Formatted text with chunk numbers and content
 */
function formatChunksForLLM(topChunks) {
    return topChunks
        .map((chunk, index) => `[${index + 1}]\n${chunk.text}`)
        .join('\n\n');
}

/**
 * Log similarity search results
 * @param {Array} topChunks - Array of top similar chunks
 */
function logSimilarityResults(topChunks) {
    console.log(`Found ${topChunks.length} similar chunks with scores:`,
        topChunks.map(chunk => ({
            chunkIndex: chunk.chunkIndex,
            score: chunk.similarityScore.toFixed(4)
        }))
    );
}

/**
 * Find top 3 most similar chunks to user prompt using cosine similarity
 * @param {Array} promptEmbedding - User prompt embedding vector
 * @param {Array} chunkEmbeddings - Array of chunk embeddings to compare against
 * @returns {Array} Top 3 most similar chunks sorted by similarity score
 */
export function findTopSimilarChunks(promptEmbedding, chunkEmbeddings = null, filePath) {
    try {
        // Use provided embeddings, or load from file, or fallback to global variable
        let embeddings = chunkEmbeddings;

        if (!embeddings || embeddings.length === 0) {
            embeddings = loadChunkEmbeddingsFromFile(filePath);
        }

        if (!embeddings || embeddings.length === 0) {
            embeddings = getChunkEmbeddings();
        }

        // Validate inputs
        if (!validateSimilaritySearchInputs(promptEmbedding, embeddings)) {
            return [];
        }

        // Calculate similarity scores

        const similarities = calculateSimilarityScores(promptEmbedding, embeddings);

        // Select top 3 chunks
        const topChunks = selectTopSimilarChunks(similarities, 3);

        // Format chunks for LLM consumption
        const formattedChunksPlainText = formatChunksForLLM(topChunks);
        
        // Store in global variable for further use
        top3SimilarChunks = topChunks;

        // Log results
        // logSimilarityResults(enrichedTopChunks);

        return formattedChunksPlainText;

    } catch (error) {
        console.error("Error finding similar chunks:", error);
        return [];
    }
}

/**
 * Get the stored top 3 similar chunks
 * @returns {Array} Top 3 similar chunks from last search
 */
export function getTop3SimilarChunks() {
    return top3SimilarChunks;
}

/**
 * Get formatted text content from top 3 similar chunks for Gemini API
 * @returns {string} Combined text content from top 3 chunks
 */
export function getTop3ChunksText() {
    if (top3SimilarChunks.length === 0) {
        return "No relevant context found.";
    }

    return top3SimilarChunks
        .map((chunk, index) => `Context ${index + 1} (Score: ${chunk.similarityScore.toFixed(4)}):\n${chunk.text}`)
        .join("\n\n---\n\n");
}