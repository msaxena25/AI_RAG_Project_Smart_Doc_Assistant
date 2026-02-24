import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize GoogleGenAI instance once
const apiKey = process.env.GEMINI_API_KEY;
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
                model: process.env.GEMINI_MODEL_EMBEDDING,
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
        const modelName = process.env.GEMINI_MODEL_FLASH_PREVIEW;
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating content:", error);
        throw error;
    }
}

/**
 * List available models
 * @returns {Promise<Array>} - List of available models
 */
async function listModels() {
    if (!genAI) {
        throw new Error("GoogleGenAI not initialized. Check GEMINI_API_KEY.");
    }

    try {
        const models = await genAI.listModels();
        return models;
    } catch (error) {
        console.error("Error listing models:", error);
        throw error;
    }
}

