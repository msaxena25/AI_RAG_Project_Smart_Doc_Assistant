/**
 * Format message for LLM with context and question
 * @param {string} userPrompt - User's question
 * @param {string} chunksText - Formatted chunks text from similarity search
 * @returns {string} Formatted message ready for LLM
 */
export default function formatLLMMessage(userPrompt, chunksText) {
    return `You are an assistant that answers ONLY from the provided document context.
    If the answer is not present, say: "Answer not found in document."
        --- DOCUMENT CONTEXT ---:
        ${chunksText}
        --- END DOCUMENT CONTEXT ---

        Question:
        ${userPrompt}`;
}