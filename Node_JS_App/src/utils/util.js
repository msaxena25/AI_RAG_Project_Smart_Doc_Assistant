import { LLM_CONFIG } from '../config/app.config.js';

/**
 * Format message for LLM with context and question
 * @param {string} userPrompt - User's question
 * @param {string} chunksText - Formatted chunks text from similarity search
 * @returns {string} Formatted message ready for LLM
 */
export default function formatLLMMessage(userPrompt, chunksText) {
    return `${LLM_CONFIG.SYSTEM_PROMPT}
        ${LLM_CONFIG.CONTEXT_START_MARKER}
        ${chunksText}
        ${LLM_CONFIG.CONTEXT_END_MARKER}

        ${LLM_CONFIG.QUESTION_LABEL}
        ${userPrompt}`;
}