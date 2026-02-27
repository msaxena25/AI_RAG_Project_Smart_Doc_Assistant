
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Toggle for LLM model usage (true = call models, false = use static data)
export const USE_LLM_MODEL = false;

// Environment Configuration (loaded from .env)
export const ENV_CONFIG = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    GEMINI_MODEL_FLASH_PREVIEW: process.env.GEMINI_MODEL_FLASH_PREVIEW || 'gemini-3-flash-preview',
    GEMINI_MODEL_FLASH_LATEST: process.env.GEMINI_MODEL_FLASH_LATEST || 'gemini-1.5-flash-latest',
    GEMINI_MODEL_EMBEDDING: process.env.GEMINI_MODEL_EMBEDDING || 'gemini-embedding-001',
    PORT: parseInt(process.env.PORT) || 4100,
    NODE_ENV: process.env.NODE_ENV || 'development'
};

// Legacy support (deprecated - use ENV_CONFIG instead)
export const GEMINI_CONFIG = {
    GEMINI_API_KEY: ENV_CONFIG.GEMINI_API_KEY,
    GEMINI_MODEL_FLASH_PREVIEW: ENV_CONFIG.GEMINI_MODEL_FLASH_PREVIEW,
    GEMINI_MODEL_FLASH_LATEST: ENV_CONFIG.GEMINI_MODEL_FLASH_LATEST,
    GEMINI_MODEL_EMBEDDING: ENV_CONFIG.GEMINI_MODEL_EMBEDDING
};

// Server Configuration
export const SERVER_CONFIG = {
    DEFAULT_PORT: ENV_CONFIG.PORT,
    DEFAULT_HOST: 'localhost'
};

// Embedding Configuration
export const EMBEDDING_CONFIG = {
    DEFAULT_TOP_CHUNKS: 3,
    CHUNK_SIZE_LIMIT: 700,
    TEXT_PREVIEW_LENGTH: 50,
    FULL_TEXT_PREVIEW_LENGTH: 150
};

// Cache Configuration
export const CACHE_CONFIG = {
    PROMPT_KEY_PREFIX: 'prompt_',
    HASH_ALGORITHM: 'md5',
    HASH_ENCODING: 'hex'
};

// File Processing Configuration
export const PDF_CONFIG = {
    MAX_FILE_SIZE: '10MB',
    SUPPORTED_FORMATS: ['pdf']
};

// API Response Messages
export const API_MESSAGES = {
    SERVER_RUNNING: 'Smart Document Assistant Node server is running.\n',
    EMBEDDING_SUCCESS: 'Embeddings generated successfully',
    EMBEDDING_ERROR: 'Failed to generate embeddings',
    PROMPT_CACHE_CLEARED: 'Prompt cache cleared successfully',
    DOCUMENT_NOT_FOUND: 'Answer not found in document.',
    INVALID_PROMPT: 'Please provide a prompt parameter',
    DOCUMENT_ID_REQUIRED: 'Please provide a docId parameter'
};

// LLM Configuration
export const LLM_CONFIG = {
    SYSTEM_PROMPT: `You are an assistant that answers ONLY from the provided document context.
    If the answer is not present, say: "Answer not found in document. Please try with a different query."`,
    CONTEXT_START_MARKER: '--- DOCUMENT CONTEXT ---:',
    CONTEXT_END_MARKER: '--- END DOCUMENT CONTEXT ---',
    QUESTION_LABEL: 'Question:'
};

// Error Messages
export const ERROR_MESSAGES = {
    PORT_NOT_SET: 'PORT is not set. Set it in .env.',
    PROCESS_PROMPT_ERROR: 'Failed to process user prompt',
    PDF_CHUNK_ERROR: 'Failed to process PDF chunks',
    EMBEDDING_NOT_FOUND: 'Embedding not found',
    GET_EMBEDDING_ERROR: 'Failed to get embedding',
    LIST_EMBEDDINGS_ERROR: 'Failed to list embeddings',
    GET_TOP_CHUNKS_ERROR: 'Failed to get top chunks',
    GET_CACHED_PROMPTS_ERROR: 'Failed to get cached prompts',
    CLEAR_CACHE_ERROR: 'Failed to clear cache'
};

// Logging Configuration
export const LOGGING_CONFIG = {
    MAX_PROMPT_DISPLAY_LENGTH: 50,
    SIMILARITY_SCORE_PRECISION: 4
};

// Validation function to check if required environment variables are set
export function validateEnvironmentConfig() {
    const requiredVars = ['GEMINI_API_KEY'];
    const missing = requiredVars.filter(varName => !ENV_CONFIG[varName]);

    if (missing.length > 0) {
        console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
        console.error('Please set these in your .env file or environment variables.');
        return false;
    }

    // Check if API key is still the placeholder value
    if (ENV_CONFIG.GEMINI_API_KEY === 'YOUR_NEW_API_KEY_HERE') {
        console.error('❌ GEMINI_API_KEY is still set to placeholder value');
        console.error('Please update your .env file with your actual Gemini API key:');
        console.error('GEMINI_API_KEY=your_actual_api_key_here');
        return false;
    }

    console.log('✅ Environment configuration validated successfully');
    return true;
}