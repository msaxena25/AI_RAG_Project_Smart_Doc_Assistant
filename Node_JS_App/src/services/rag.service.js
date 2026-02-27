import { generateAnswerFromLLM } from "./genai.service.js";
import { USE_LLM_MODEL } from '../config/app.config.js';
import { findTopSimilarChunks } from "../vector-operations/cosine-similarity-search.js";
import { getStoredPromptEmbedding, storePromptEmbedding } from "../store/prompt.cache.js";
import { generateEmbeddingsForUserPrompt } from "../vector-operations/embedding.generator.js";
import formatPromptForLLM from '../utils/util.js';
import { FILE_PATHS } from '../config/path.js';
import { sqliteDB } from '../store/sqlite.db.js';

/**
 * RAG Service - Handles Retrieval Augmented Generation pipeline
 */
class RAGService {
    /**
     * Check for cached answer in database
     * @param {string} userPrompt - User's question
     * @returns {Object|null} Cached query result or null
     */
    static findInSqlLiteDatabase(userPrompt) {
        console.log('🔍 Checking database cache for existing answer...');
        const cachedQuery = sqliteDB.findQueryByPrompt(userPrompt);

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

        return null;
    }

    /**
     * Get or generate embedding for user prompt with caching
     * @param {string} userPrompt - User's question
     * @returns {Promise<Array>} Prompt embedding vector
     */
    static async getPromptEmbedding(userPrompt) {
        console.log('🔄 Getting prompt embedding...');
        let promptEmbedding = getStoredPromptEmbedding(userPrompt);

        if (!promptEmbedding) {
            console.log('📝 Generating new embedding for prompt...');
            //promptEmbedding = await generateEmbeddingsForUserPrompt(userPrompt);
            promptEmbedding = [[{ "values": [0.1, 0.2, 0.3] }]]; // Placeholder embedding for testing
            // Cache the new embedding for future use
            storePromptEmbedding(userPrompt, promptEmbedding);
        } else {
            console.log('✅ Using cached embedding for prompt');
        }

        return promptEmbedding;
    }

    /**
     * Perform vector similarity search to find relevant document chunks
     * @param {Array} promptEmbedding - Embedding vector for the prompt
     * @returns {Object} Similarity search results
     */
    static findRelevantChunks(promptEmbedding, embeddingDocId) {
        console.log('🔍 Finding relevant document chunks...');
        return findTopSimilarChunks(promptEmbedding, embeddingDocId);
    }

    /**
     * Generate final answer using LLM with retrieved context
     * @param {string} userPrompt - Original user question
     * @param {Object} similarityResult - Retrieved document chunks
     * @returns {Promise<Object>} LLM response with answer and metadata
     */
    static async generateContextualAnswer(userPrompt, similarityResult) {
        // Format prompt for LLM with context
        const finalPrompt = formatPromptForLLM(userPrompt, similarityResult);

        // Get final answer from LLM or use static
        let llmAnswer;
        if (USE_LLM_MODEL) {
            llmAnswer = await generateAnswerFromLLM(finalPrompt);
        } else {
            llmAnswer = "This is a mock LLM response for testing purposes.";
        }
        console.log('✅ LLM Response received', llmAnswer);
        return {
            answer: llmAnswer,
            finalPrompt: finalPrompt
        };
    }

    /**
     * Save query and answer to database
     * @param {string} userPrompt - User's question
     * @param {string} answer - Generated answer
     * @returns {Object} Saved query information
     */
    static saveQueryToDatabase(userPrompt, answer) {
        const savedQuery = sqliteDB.insertQuery(userPrompt, answer);
        console.log(`✅ Query saved with ID: ${savedQuery.queryId}`);
        return savedQuery;
    }

    /**
     * Process user prompt through complete RAG pipeline
     * @param {string} userPrompt - User's question
     * @param {string} docId - Document ID to process
     * @returns {Promise<Object>} Complete RAG response with answer, chunks, etc.
     */
    static async processPrompt(userPrompt, docId) {
        try {
            // Step 1: Check database cache first
            const cachedResult = this.findInSqlLiteDatabase(userPrompt);
            if (cachedResult) {
                return cachedResult;
            }

            console.log('💭 No cached answer found, processing new query...');

            // Step 2: Get embedding for user prompt
            const promptEmbedding = await this.getPromptEmbedding(userPrompt);

            // Step 2.5: Fetch embeddingDocId from DB
            const docRecord = sqliteDB.getDocumentById(docId);
            const embeddingDocId = docRecord ? docRecord.embeddingDocId : null;

            if (!embeddingDocId) {
                throw new Error(`No document found for this query. Please select a valid document to query against.`);
            }

            // Step 3: Find relevant document chunks
            const similarityResult = this.findRelevantChunks(promptEmbedding, embeddingDocId);

            // Step 4: Generate answer using LLM with context
            const { answer, finalPrompt } = await this.generateContextualAnswer(userPrompt, similarityResult);

            // Step 5: Save to database
            const savedQuery = this.saveQueryToDatabase(userPrompt, answer);

            return {
                answer: answer,
                queryId: savedQuery.queryId,
                finalPrompt: finalPrompt,
                metadata: {
                    cached: false,
                    processingTime: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('❌ RAG Pipeline Error:', error);
            throw new Error(error.message);
        }
    }

    /**
     * Get RAG pipeline statistics
     * @returns {Object} Pipeline statistics
     */
    static getRAGStats() {
        return {
            totalProcessedQueries: sqliteDB.getQueryStats().totalQueries,
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