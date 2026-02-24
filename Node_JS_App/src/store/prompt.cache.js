import { LocalStorage } from "node-localstorage";
import { generateEmbeddingsForUserPrompt } from "./../vector-operations/embedding.generator.js";
import { STORAGE_PATHS } from '../config/path.js';
import crypto from "crypto";

// Initialize local storage
const localStorage = new LocalStorage(STORAGE_PATHS.CACHE);

/**
 * Generate a hash key for prompt to use as storage key
 * @param {string} prompt - User prompt text
 * @returns {string} Hashed key for the prompt
 */
function generatePromptKey(prompt) {
    return crypto.createHash('md5').update(prompt.toLowerCase().trim()).digest('hex');
}

/**
 * Store prompt embedding in local storage
 * @param {string} prompt - User prompt text
 * @param {Array} embedding - Embedding vector
 */
function storePromptEmbedding(prompt, embedding) {
    try {
        const key = generatePromptKey(prompt);
        const data = {
            prompt: prompt,
            embedding: embedding,
            timestamp: new Date().toISOString(),
            embeddingLength: embedding.length
        };
        localStorage.setItem(`prompt_${key}`, JSON.stringify(data));
        console.log(`Stored prompt embedding with key: prompt_${key}`);
    } catch (error) {
        console.error("Error storing prompt embedding:", error);
    }
}

/**
 * Retrieve prompt embedding from local storage
 * @param {string} prompt - User prompt text
 * @returns {Array|null} Embedding vector or null if not found
 */
function getStoredPromptEmbedding(prompt) {
    try {
        const key = generatePromptKey(prompt);
        const stored = localStorage.getItem(`prompt_${key}`);
        
        if (stored) {
            const data = JSON.parse(stored);
            console.log(`Retrieved cached embedding for prompt: "${prompt.substring(0, 50)}..."`);
            return data.embedding;
        }
        
        return null;
    } catch (error) {
        console.error("Error retrieving prompt embedding:", error);
        return null;
    }
}

/**
 * Get prompt embedding with caching - checks local storage first, then generates if needed
 * @param {string} prompt - User prompt text
 * @returns {Promise<Array>} Embedding vector
 */
export async function getPromptEmbeddingWithCache(prompt) {
    try {
        // First, try to get from local storage
        const cachedEmbedding = getStoredPromptEmbedding(prompt);
        
        if (cachedEmbedding) {
            return cachedEmbedding;
        }

        // If not found, generate new embedding and store it
        console.log("Generating new embedding for prompt...");
        const newEmbedding = await generateEmbeddingsForUserPrompt(prompt);
        
        // Store for future use
        storePromptEmbedding(prompt, newEmbedding);
        
        return newEmbedding;

    } catch (error) {
        console.error("Error in getPromptEmbeddingWithCache:", error);
        throw error;
    }
}

/**
 * List all cached prompt embeddings
 * @returns {Array} List of cached prompt data
 */
export function listCachedPrompts() {
    try {
        const cachedPrompts = [];
        const length = localStorage.length;
        
        for (let i = 0; i < length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('prompt_')) {
                const data = JSON.parse(localStorage.getItem(key));
                cachedPrompts.push({
                    key: key,
                    prompt: data.prompt,
                    timestamp: data.timestamp,
                    embeddingLength: data.embeddingLength
                });
            }
        }
        
        return cachedPrompts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
        console.error("Error listing cached prompts:", error);
        return [];
    }
}

/**
 * Clear all cached prompt embeddings
 */
export function clearPromptCache() {
    try {
        const keys = [];
        const length = localStorage.length;
        
        for (let i = 0; i < length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('prompt_')) {
                keys.push(key);
            }
        }
        
        keys.forEach(key => localStorage.removeItem(key));
        console.log(`Cleared ${keys.length} cached prompt embeddings`);
        
    } catch (error) {
        console.error("Error clearing prompt cache:", error);
    }
}