// Application Configuration Constants

// Server Configuration
export const SERVER_CONFIG = {
    DEFAULT_PORT: 3000,
    DEFAULT_HOST: 'localhost'
};

// Embedding Configuration
export const EMBEDDING_CONFIG = {
    DEFAULT_TOP_CHUNKS: 3,
    CHUNK_SIZE_LIMIT: 1000,
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
    INVALID_PROMPT: 'Please provide a prompt parameter'
};

// LLM Configuration
export const LLM_CONFIG = {
    SYSTEM_PROMPT: `You are an assistant that answers ONLY from the provided document context.
    If the answer is not present, say: "Answer not found in document."`,
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