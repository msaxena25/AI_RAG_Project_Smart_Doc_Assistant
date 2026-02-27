import { LocalStorage } from "node-localstorage";
import { STORAGE_PATHS } from '../config/path.js';
import { CACHE_CONFIG, LOGGING_CONFIG } from '../config/app.config.js';
import crypto from "crypto";

// Initialize local storage
const localStorage = new LocalStorage(STORAGE_PATHS.CACHE);

/**
 * Generate a hash key for prompt to use as storage key
 * @param {string} prompt - User prompt text
 * @returns {string} Hashed key for the prompt
 */
function generatePromptKey(prompt) {
    return crypto.createHash(CACHE_CONFIG.HASH_ALGORITHM).update(prompt.toLowerCase().trim()).digest(CACHE_CONFIG.HASH_ENCODING);
}

/**
 * Store prompt embedding in local storage
 * @param {string} prompt - User prompt text
 * @param {Array} embedding - Embedding vector
 */
export function storePromptEmbedding(prompt, embedding) {
    try {
        const key = generatePromptKey(prompt);
        const data = {
            prompt: prompt,
            embedding: embedding,
            timestamp: new Date().toISOString(),
            embeddingLength: embedding.length
        };
        localStorage.setItem(`${CACHE_CONFIG.PROMPT_KEY_PREFIX}${key}`, JSON.stringify(data));
        console.log(`Stored prompt embedding with key: ${CACHE_CONFIG.PROMPT_KEY_PREFIX}${key}`);
    } catch (error) {
        console.error("Error storing prompt embedding:", error);
    }
}

/**
 * Retrieve prompt embedding from local storage
 * @param {string} prompt - User prompt text
 * @returns {Array|null} Embedding vector or null if not found
 */
export function getStoredPromptEmbedding(prompt) {
    try {
        const key = generatePromptKey(prompt);
        const stored = localStorage.getItem(`${CACHE_CONFIG.PROMPT_KEY_PREFIX}${key}`);

        if (stored) {
            const data = JSON.parse(stored);
            console.log(`Retrieved cached embedding for prompt: "${prompt.substring(0, LOGGING_CONFIG.MAX_PROMPT_DISPLAY_LENGTH)}..."`);
            return data.embedding;
        }

        return null;
    } catch (error) {
        console.error("Error retrieving prompt embedding:", error);
        return null;
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