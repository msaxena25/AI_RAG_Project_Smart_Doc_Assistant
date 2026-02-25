import { generateAnswerFromLLM } from "./genai.service.js";
import { findTopSimilarChunks } from "../vector-operations/cosine-similarity-search.js";
import { getPromptEmbeddingWithCache } from "../store/prompt.cache.js";
import formatPromptForLLM from '../utils/util.js';
import { FILE_PATHS } from '../config/path.js';
import { queryDB } from '../store/sqlite.db.js';

/**
 * RAG Service - Handles Retrieval Augmented Generation pipeline
 */
class RAGService {
    /**
     * Process user prompt through complete RAG pipeline
     * @param {string} userPrompt - User's question
     * @returns {Promise<Object>} Complete RAG response with answer, chunks, etc.
     */
    static async processPrompt(userPrompt) {
        try {
            // Step 0: Check if we already have this exact prompt in database
            console.log('🔍 Checking database cache for existing answer...');
            const cachedQuery = queryDB.findQueryByPrompt(userPrompt);
            
            if (cachedQuery) {
                console.log(`✅ Found cached answer for prompt (ID: ${cachedQuery.queryId})`);
                return {
                    answer: cachedQuery.answer,
                    queryId: cachedQuery.queryId,
                    finalPrompt: null, // Not available for cached responses
                    metadata: {
                        cached: true,
                        originalCreatedAt: cachedQuery.createdAt,
                        processingTime: new Date().toISOString()
                    }
                };
            }

            console.log('💭 No cached answer found, processing new query...');
            
            // Step 1: Get embedding for user prompt (with caching)
            const promptEmbedding = await getPromptEmbeddingWithCache(userPrompt);

            // Step 2: Find top 3 most similar chunks using vector search
            const similarityResult = findTopSimilarChunks(promptEmbedding, null, FILE_PATHS.TEST_PDF);

            // Step 3: Format prompt for LLM with context
            const finalPrompt = formatPromptForLLM(userPrompt, similarityResult);

            // Step 4: Get final answer from LLM
            const llmAnswer = await generateAnswerFromLLM(finalPrompt);
            console.log('✅ LLM Response received', llmAnswer);

            // Step 5: Store query and answer in database
            const savedQuery = queryDB.insertQuery(userPrompt, llmAnswer);
            console.log(`✅ Query saved with ID: ${savedQuery.queryId}`);

            return {
                answer: llmAnswer,
                queryId: savedQuery.queryId,
                finalPrompt: finalPrompt,
                metadata: {
                    cached: false,
                    processingTime: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('❌ RAG Pipeline Error:', error);
            throw new Error(`RAG processing failed: ${error.message}`);
        }
    }

    /**
     * Get RAG pipeline statistics
     * @returns {Object} Pipeline statistics
     */
    static getRAGStats() {
        return {
            totalProcessedQueries: queryDB.getQueryStats().totalQueries,
            averageResponseTime: '~2-3 seconds', // This could be calculated from actual metrics
            pipelineSteps: [
                'Embedding Generation',
                'Vector Similarity Search',
                'Context Retrieval',
                'LLM Answer Generation',
                'Database Storage'
            ]
        };
    }
}

export default RAGService;