import { GoogleGenAI } from "@google/genai";
import {GEMINI_CONFIG} from '../config/app.config.js'; 

// Initialize GoogleGenAI instance once
const apiKey = GEMINI_CONFIG.GEMINI_API_KEY;
let genAI = null;

if (apiKey) {
    genAI = new GoogleGenAI({ apiKey });
} else {
    console.warn("GEMINI_API_KEY not found in environment variables");
}

/**
 * Generate embeddings for a single text chunk
 * @param {string} chunk - Text to embed
 * @returns {Promise<Array>} - Embedding vector
 */
export async function generateEmbeddingFromGenAI(chunk) {
    if (!genAI) {
        throw new Error("GoogleGenAI not initialized. Check GEMINI_API_KEY.");
    }

    try {
        const result = await genAI.models.embedContent(
            {
                model: GEMINI_CONFIG.GEMINI_MODEL_EMBEDDING,
                contents: chunk
            }
        );
        return result.embeddings;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
}

/**
 * Generate content using Gemini model
 * @param {string} prompt - Input prompt
 * @returns {Promise<string>} - Generated text
 */
export async function generateAnswerFromLLM(prompt) {
    if (!genAI) {
        throw new Error("GoogleGenAI not initialized. Check GEMINI_API_KEY.");
    }

    try {
        const response = await genAI.models.generateContent(
            {
                model: GEMINI_CONFIG.GEMINI_MODEL_FLASH_PREVIEW,
                contents: prompt
            }
        );
        return response.text;
    } catch (error) {
        console.error("Error generating content:", error);
        throw error;
    }
}
